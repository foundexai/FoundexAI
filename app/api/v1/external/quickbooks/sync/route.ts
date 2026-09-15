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
    const {
      cashOnHand,
      monthlyBurn,
      monthlyRevenue,
      annualRevenue,
      invoicesCount = 0,
      realmId,
    } = body;

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

    // Update Startup financial parameters
    const updateFields: any = { updated_at: new Date() };
    if (typeof cashOnHand === "number") updateFields.cash_on_hand = cashOnHand;
    if (typeof monthlyBurn === "number") updateFields.monthly_burn = monthlyBurn;
    if (typeof monthlyRevenue === "number") updateFields.mrr = monthlyRevenue;
    if (typeof annualRevenue === "number") updateFields.arr = annualRevenue;

    const startup = await Startup.findOneAndUpdate(
      { _id: targetStartupId, user_id: auth.user._id },
      { $set: updateFields },
      { new: true }
    );

    // Update QuickBooks integration record
    const integration = await ExternalIntegration.findOneAndUpdate(
      { startup_id: targetStartupId, provider: "quickbooks" },
      {
        $set: {
          user_id: auth.user._id,
          status: "connected",
          external_account_id: realmId,
          last_sync_at: new Date(),
          last_sync_status: "success",
          last_sync_message: `Financials synced. Cash: $${cashOnHand || 0}, MRR: $${monthlyRevenue || 0}.`,
          "sync_stats.invoices_synced": invoicesCount,
          "sync_stats.revenue_synced_usd": annualRevenue || (monthlyRevenue ? monthlyRevenue * 12 : 0),
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
        provider: "quickbooks",
        cash_on_hand: cashOnHand,
        mrr: monthlyRevenue,
        arr: annualRevenue,
        synced_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        provider: "quickbooks",
        updated_financials: {
          cash_on_hand: startup?.cash_on_hand,
          monthly_burn: startup?.monthly_burn,
          mrr: startup?.mrr,
          arr: startup?.arr,
        },
        integration,
      },
      { headers }
    );
  } catch (error: any) {
    console.error("POST /api/v1/external/quickbooks/sync error:", error);
    return NextResponse.json(
      { error: "Failed to process QuickBooks sync payload", details: error.message },
      { status: 500, headers }
    );
  }
}
