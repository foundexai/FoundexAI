import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import ApiKey from "@/lib/models/ApiKey";
import Startup from "@/lib/models/Startup";
import { generateNewApiKey } from "@/lib/apiKeyAuth";

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

    const keys = await ApiKey.find({ user_id: userId })
      .select("-hashed_secret -__v")
      .sort({ created_at: -1 });

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error("GET /api/developer/keys error:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
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
    const { name, startupId, scopes, rateLimitPerMin, expiresInDays } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "API Key name is required" }, { status: 400 });
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: "At least one scope must be selected" }, { status: 400 });
    }

    const userId = decoded.user._id || decoded.user.id;

    if (startupId) {
      await connectDB();
      const ownedStartup = await Startup.findOne({ _id: startupId, user_id: userId }).lean();
      if (!ownedStartup) {
        return NextResponse.json(
          { error: "Forbidden: You do not own or administer the specified startup." },
          { status: 403 }
        );
      }
    }

    const { rawKey, keyRecord } = await generateNewApiKey({
      name: name.trim(),
      userId,
      startupId,
      scopes,
      rateLimitPerMin: rateLimitPerMin ? Math.min(Math.max(Number(rateLimitPerMin), 10), 1000) : 120,
      expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        _id: keyRecord._id,
        name: keyRecord.name,
        key_prefix: keyRecord.key_prefix,
        scopes: keyRecord.scopes,
        rate_limit_per_min: keyRecord.rate_limit_per_min,
        status: keyRecord.status,
        expires_at: keyRecord.expires_at,
        created_at: keyRecord.created_at,
        rawKey, // Returned ONCE to client
      },
    });
  } catch (error: any) {
    console.error("POST /api/developer/keys error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || "Failed to generate API key" }, { status });
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
    const keyId = url.searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    const updated = await ApiKey.findOneAndUpdate(
      { _id: keyId, user_id: userId },
      { $set: { status: "revoked", updated_at: new Date() } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "API key not found or not owned by user" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "API key revoked successfully" });
  } catch (error: any) {
    console.error("DELETE /api/developer/keys error:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
