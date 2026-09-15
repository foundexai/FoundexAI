import { NextResponse } from "next/server";
import { verifyApiKeyRequest } from "@/lib/apiKeyAuth";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rateLimiter";
import Startup from "@/lib/models/Startup";
import ExternalIntegration from "@/lib/models/ExternalIntegration";
import { dispatchWebhookEvent } from "@/lib/webhookService";

export async function POST(req: Request) {
  const auth = await verifyApiKeyRequest(req, "write:integrations");
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const rateLimit = await checkRateLimit(auth.apiKey._id.toString(), auth.apiKey.rate_limit_per_min);
  const headers = createRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests: Rate limit exceeded." },
      { status: 429, headers }
    );
  }

  try {
    const body = await req.json();
    const { mrr, arr, activeCustomers = 0, stripeAccountId } = body;

    let targetStartup = null;
    if (auth.apiKey.startup_id) {
      targetStartup = await Startup.findOne({ _id: auth.apiKey.startup_id, user_id: auth.user._id });
    } else {
      targetStartup = await Startup.findOne({ user_id: auth.user._id }).sort({ created_at: 1 });
    }

    if (!targetStartup) {
      return NextResponse.json({ error: "Forbidden: No authorized startup found for this account" }, { status: 403, headers });
    }
    const targetStartupId = targetStartup._id;

    const calculatedArr = typeof arr === "number" ? arr : (typeof mrr === "number" ? mrr * 12 : undefined);

    const updateFields: any = { updated_at: new Date() };
    if (typeof mrr === "number") updateFields.mrr = mrr;
    if (typeof calculatedArr === "number") updateFields.arr = calculatedArr;

    const startup = await Startup.findOneAndUpdate(
      { _id: targetStartupId, user_id: auth.user._id },
      { $set: updateFields },
      { new: true }
    );

    const integration = await ExternalIntegration.findOneAndUpdate(
      { startup_id: targetStartupId, provider: "stripe" },
      {
        $set: {
          user_id: auth.user._id,
          status: "connected",
          external_account_id: stripeAccountId,
          last_sync_at: new Date(),
          last_sync_status: "success",
          last_sync_message: `Stripe metrics synced: MRR $${mrr || 0}, Active Customers ${activeCustomers}.`,
          "sync_stats.mrr_usd": mrr || 0,
          "sync_stats.arr_usd": calculatedArr || 0,
        },
      },
      { upsert: true, new: true }
    );

    // Trigger webhook event
    await dispatchWebhookEvent({
      event: "integration.synced",
      userId: auth.user._id.toString(),
      startupId: targetStartupId.toString(),
      data: {
        provider: "stripe",
        mrr,
        arr: calculatedArr,
        active_customers: activeCustomers,
        synced_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        provider: "stripe",
        mrr: startup?.mrr,
        arr: startup?.arr,
        active_customers: activeCustomers,
        integration,
      },
      { headers }
    );
  } catch (error: any) {
    console.error("POST /api/v1/external/stripe/sync error:", error);
    return NextResponse.json(
      { error: "Failed to process Stripe sync payload", details: error.message },
      { status: 500, headers }
    );
  }
}
