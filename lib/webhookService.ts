import crypto from "crypto";
import { connectDB } from "@/lib/db";
import WebhookEndpoint, { WebhookEvent } from "@/lib/models/WebhookEndpoint";
import WebhookLog from "@/lib/models/WebhookLog";
import { validateWebhookUrl } from "@/lib/ssrfValidator";

export function generateWebhookSignature(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signaturePayload = `${ts}.${payload}`;
  const hmac = crypto.createHmac("sha256", secret).update(signaturePayload).digest("hex");
  return `t=${ts},v1=${hmac}`;
}

export async function dispatchWebhookEvent({
  event,
  userId,
  startupId,
  data,
}: {
  event: WebhookEvent;
  userId: string;
  startupId?: string;
  data: Record<string, any>;
}): Promise<{ dispatchedCount: number; logs: any[] }> {
  try {
    await connectDB();

    const query: any = {
      user_id: userId,
      status: "active",
      events: event,
    };
    if (startupId) {
      query.$or = [{ startup_id: startupId }, { startup_id: { $exists: false } }, { startup_id: null }];
    }

    const endpoints = await WebhookEndpoint.find(query);
    if (!endpoints || endpoints.length === 0) {
      return { dispatchedCount: 0, logs: [] };
    }

    const deliveryTimestamp = new Date().toISOString();
    const eventId = `evt_${crypto.randomBytes(12).toString("hex")}`;
    const payloadObject = {
      id: eventId,
      object: "event",
      event,
      created_at: deliveryTimestamp,
      data,
    };
    const payloadString = JSON.stringify(payloadObject);
    const nowSeconds = Math.floor(Date.now() / 1000);

    // Concurrently dispatch to all subscribed endpoints with SSRF guards & manual redirects
    const dispatchPromises = endpoints.map(async (endpoint) => {
      // 1. Pre-flight SSRF Validation
      const urlCheck = await validateWebhookUrl(endpoint.url);
      if (!urlCheck.isValid) {
        const logDoc = await WebhookLog.create({
          endpoint_id: endpoint._id,
          user_id: userId,
          event,
          payload: payloadObject,
          url: endpoint.url,
          http_status: 403,
          response_body: "", // Zero persistence of sensitive internal responses
          error_message: `Blocked by SSRF Protection: ${urlCheck.error}`,
          duration_ms: 0,
          attempt: 1,
          delivered_at: new Date(),
        });
        return logDoc;
      }

      const signatureHeader = generateWebhookSignature(payloadString, endpoint.secret, nowSeconds);
      let httpStatus = 0;
      let errorMessage = "";
      let attempt = 1;
      const maxAttempts = 2; // Immediate single retry for transient drops
      let durationMs = 0;

      for (attempt = 1; attempt <= maxAttempts; attempt++) {
        const startTime = performance.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

          const response = await fetch(urlCheck.sanitizedUrl || endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Foundex-Webhook-Dispatcher/1.0",
              "X-Foundex-Event": event,
              "X-Foundex-Delivery": eventId,
              "X-Foundex-Signature": signatureHeader,
              "X-Foundex-Timestamp": String(nowSeconds),
            },
            body: payloadString,
            signal: controller.signal,
            redirect: "manual", // Prevent open redirects to internal infrastructure
          });

          clearTimeout(timeoutId);
          durationMs = Math.round(performance.now() - startTime);
          httpStatus = response.status;

          // If manual redirect detected (301, 302, 307, 308), refuse to follow
          if (response.status >= 300 && response.status < 400) {
            httpStatus = 400;
            errorMessage = "Rejected: Webhook endpoint issued HTTP redirect. Redirects are prohibited.";
            break;
          }

          if (httpStatus >= 200 && httpStatus < 300) {
            errorMessage = "";
            break; // Success, exit retry loop
          } else if (attempt < maxAttempts) {
            // Short backoff before 1 retry
            await new Promise((r) => setTimeout(r, 500));
          }
        } catch (err: any) {
          durationMs = Math.round(performance.now() - startTime);
          errorMessage = err.name === "AbortError" ? "Delivery timed out (6s exceeded)" : (err.message || "Network delivery failed");
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }

      const isSuccess = httpStatus >= 200 && httpStatus < 300;

      // Update endpoint metrics
      await WebhookEndpoint.findByIdAndUpdate(endpoint._id, {
        last_delivery_at: new Date(),
        last_delivery_status: httpStatus,
        consecutive_failures: isSuccess ? 0 : (endpoint.consecutive_failures || 0) + 1,
      });

      // Persist delivery audit log WITHOUT storing remote server response body
      const logDoc = await WebhookLog.create({
        endpoint_id: endpoint._id,
        user_id: userId,
        event,
        payload: payloadObject,
        url: endpoint.url,
        http_status: httpStatus || 0,
        response_body: "", // Zero persistence of remote response body
        error_message: errorMessage || undefined,
        duration_ms: durationMs,
        attempt,
        delivered_at: new Date(),
      });

      return logDoc;
    });

    const results = await Promise.allSettled(dispatchPromises);
    const successfulLogs = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    return { dispatchedCount: endpoints.length, logs: successfulLogs };
  } catch (err) {
    console.error("Webhook Dispatcher Exception:", err);
    return { dispatchedCount: 0, logs: [] };
  }
}
