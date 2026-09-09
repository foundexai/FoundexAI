import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import WebhookEndpoint from "@/lib/models/WebhookEndpoint";

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

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    const endpoints = await WebhookEndpoint.find({ user_id: userId })
      .select("-__v")
      .sort({ created_at: -1 });

    return NextResponse.json({ endpoints });
  } catch (error: any) {
    console.error("GET /api/developer/webhooks error:", error);
    return NextResponse.json({ error: "Failed to fetch webhook endpoints" }, { status: 500 });
  }
}

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
    const { url, description, events, startupId } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Valid HTTP/HTTPS URL is required" }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "At least one webhook event must be selected" }, { status: 400 });
    }

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    const endpoint = await WebhookEndpoint.create({
      user_id: userId,
      startup_id: startupId,
      url: url.trim(),
      description: description?.trim(),
      secret,
      events,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      endpoint,
    });
  } catch (error: any) {
    console.error("POST /api/developer/webhooks error:", error);
    return NextResponse.json({ error: "Failed to register webhook endpoint" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
    const endpointId = url.searchParams.get("id");
    if (!endpointId) {
      return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    const deleted = await WebhookEndpoint.findOneAndDelete({
      _id: endpointId,
      user_id: userId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Webhook endpoint removed" });
  } catch (error: any) {
    console.error("DELETE /api/developer/webhooks error:", error);
    return NextResponse.json({ error: "Failed to delete webhook endpoint" }, { status: 500 });
  }
}
