import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import WebhookEndpoint from "@/lib/models/WebhookEndpoint";
import { dispatchWebhookEvent } from "@/lib/webhookService";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const rawToken = authHeader?.split(" ")[1];
    if (!rawToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(rawToken, true);
    if (!decoded || !decoded.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const { endpointId, event = "pipeline.deal_created" } = body;

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    if (endpointId) {
      const endpoint = await WebhookEndpoint.findOne({ _id: endpointId, user_id: userId });
      if (!endpoint) {
        return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
      }
    }

    const mockPayload = {
      test: true,
      deal_id: "deal_sample_789",
      investor_name: "Apex Horizon Ventures",
      amount_usd: 500000,
      stage: "term_sheet",
      timestamp: new Date().toISOString(),
      note: "Synthetically triggered developer test event from Foundex Developer Portal.",
    };

    const result = await dispatchWebhookEvent({
      event: event as any,
      userId,
      data: mockPayload,
    });

    return NextResponse.json({
      success: true,
      message: `Dispatched test event '${event}' to ${result.dispatchedCount} endpoint(s)`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/developer/webhooks/test error:", error);
    return NextResponse.json({ error: "Failed to dispatch test webhook" }, { status: 500 });
  }
}
