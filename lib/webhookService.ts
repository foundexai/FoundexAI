import crypto from "crypto";
import { connectDB } from "@/lib/db";
import WebhookEndpoint, { WebhookEvent } from "@/lib/models/WebhookEndpoint";
import WebhookLog from "@/lib/models/WebhookLog";

export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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

    const logs: any[] = [];

    // Dispatch to each subscribed webhook endpoint asynchronously
    for (const endpoint of endpoints) {
      const signature = generateWebhookSignature(payloadString, endpoint.secret);
      const startTime = performance.now();
      let httpStatus = 0;
      let responseBody = "";
      let errorMessage = "";

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Foundex-Webhook-Dispatcher/1.0",
            "X-Foundex-Event": event,
            "X-Foundex-Delivery": eventId,
            "X-Foundex-Signature": signature,
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        httpStatus = response.status;
        responseBody = (await response.text()).substring(0, 1000); // truncate response snippet
      } catch (err: any) {
        errorMessage = err.message || "Network delivery failed";
      }

      const durationMs = Math.round(performance.now() - startTime);
      const isSuccess = httpStatus >= 200 && httpStatus < 300;

      // Update endpoint health
      await WebhookEndpoint.findByIdAndUpdate(endpoint._id, {
        last_delivery_at: new Date(),
        last_delivery_status: httpStatus,
        consecutive_failures: isSuccess ? 0 : (endpoint.consecutive_failures || 0) + 1,
      });

      // Record immutable delivery audit log
      const logDoc = await WebhookLog.create({
        endpoint_id: endpoint._id,
        user_id: userId,
        event,
        payload: payloadObject,
        url: endpoint.url,
        http_status: httpStatus || 0,
        response_body: responseBody,
        error_message: errorMessage,
        duration_ms: durationMs,
        attempt: 1,
        delivered_at: new Date(),
      });

      logs.push(logDoc);
    }

    return { dispatchedCount: endpoints.length, logs };
  } catch (err) {
    console.error("Webhook Dispatcher Exception:", err);
    return { dispatchedCount: 0, logs: [] };
  }
}
