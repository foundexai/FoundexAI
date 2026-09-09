import { NextResponse } from "next/server";
import { verifyApiKeyRequest } from "@/lib/apiKeyAuth";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rateLimiter";
import Startup from "@/lib/models/Startup";
import PipelineDeal from "@/lib/models/PipelineDeal";
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
    const { contacts = [], deals = [], externalAccountId } = body;

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

    let syncedDealsCount = 0;
    let syncedContactsCount = contacts.length;

    // Process incoming deals into PipelineDeals
    for (const deal of deals) {
      if (!deal.name) continue;

      const stageMap: Record<string, string> = {
        appointmentscheduled: "intro_meeting",
        qualifiedtobuy: "due_diligence",
        presentationscheduled: "due_diligence",
        decisionmakerboughtin: "term_sheet",
        closedwon: "closed_won",
        closedlost: "closed_lost",
      };

      const normalizedStage = stageMap[deal.stage?.toLowerCase()] || "shortlisted";
      const investorId = deal.id ? `hubspot_${deal.id}` : `hubspot_gen_${Date.now()}_${Math.random()}`;

      await PipelineDeal.findOneAndUpdate(
        { user_id: auth.user._id, investor_id: investorId },
        {
          $set: {
            startup_id: targetStartupId,
            investor_name: deal.name,
            stage: normalizedStage,
            deal_amount: Number(deal.amount || 0),
            notes: `Synced from HubSpot: ${deal.pipeline || "Standard Pipeline"}`,
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      syncedDealsCount++;
    }

    // Update integration metadata
    const integration = await ExternalIntegration.findOneAndUpdate(
      { startup_id: targetStartupId, provider: "hubspot" },
      {
        $set: {
          user_id: auth.user._id,
          status: "connected",
          external_account_id: externalAccountId,
          last_sync_at: new Date(),
          last_sync_status: "success",
          last_sync_message: `Successfully synchronized ${syncedContactsCount} contacts and ${syncedDealsCount} deals.`,
        },
        $inc: {
          "sync_stats.contacts_synced": syncedContactsCount,
          "sync_stats.deals_synced": syncedDealsCount,
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
        provider: "hubspot",
        contacts_synced: syncedContactsCount,
        deals_synced: syncedDealsCount,
        synced_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        provider: "hubspot",
        synced_contacts: syncedContactsCount,
        synced_deals: syncedDealsCount,
        integration,
      },
      { headers }
    );
  } catch (error: any) {
    console.error("POST /api/v1/external/hubspot/sync error:", error);
    return NextResponse.json(
      { error: "Failed to process HubSpot sync payload", details: error.message },
      { status: 500, headers }
    );
  }
}
