import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import WebhookLog from "@/lib/models/WebhookLog";

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const endpointId = url.searchParams.get("endpoint_id");
    const event = url.searchParams.get("event");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 200);

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    const query: any = { user_id: userId };
    if (endpointId) query.endpoint_id = endpointId;
    if (event) query.event = event;

    const logs = await WebhookLog.find(query)
      .sort({ delivered_at: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("GET /api/developer/webhooks/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch webhook logs" }, { status: 500 });
  }
}
