import { NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import SecureLink from "@/lib/models/SecureLink";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;

    // Fetch links created by this founder
    const links = await SecureLink.find({ founder_id: user._id }).sort({ created_at: -1 });

    const formattedLinks = links.map((link: any) => ({
      id: link._id.toString(),
      token: link.share_token,
      url: `/share/${link.share_token}`,
      docName: link.doc_name,
      docUrl: link.doc_url,
      docType: link.doc_type,
      accessType: link.access_type,
      passcode: link.passcode || "",
      allowedDomains: link.allowed_domains || [],
      expiresAt: link.expires_at,
      maxViews: link.max_views,
      viewCount: link.view_count || 0,
      allowDownload: link.allow_download,
      watermarkEnabled: link.watermark_enabled,
      watermarkText: link.watermark_text,
      watermarkOpacity: link.watermark_opacity,
      watermarkStyle: link.watermark_style,
      isRevoked: link.is_revoked,
      accessLogs: (link.access_logs || []).map((log: any) => ({
        email: log.viewer_email,
        ip: log.viewer_ip,
        userAgent: log.user_agent,
        viewedAt: log.viewed_at,
        durationSeconds: log.duration_seconds
      })),
      createdAt: link.created_at
    }));

    return NextResponse.json({ links: formattedLinks });
  } catch (err) {
    console.error("Error fetching secure links:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const body = await req.json();

    const {
      docName,
      docUrl,
      docType,
      accessType,
      passcode,
      allowedDomains,
      expiresAt,
      maxViews,
      allowDownload,
      watermarkEnabled,
      watermarkText,
      watermarkOpacity,
      watermarkStyle,
      startupId
    } = body;

    if (!docName || !docUrl) {
      return NextResponse.json({ error: "Document name and URL are required" }, { status: 400 });
    }

    // Resolve startup ID
    let finalStartupId = startupId;
    if (!finalStartupId) {
      const Startup = mongoose.models.Startup || (await import("@/lib/models/Startup")).default;
      const startup = await Startup.findOne({ user_id: user._id });
      if (startup) {
        finalStartupId = startup._id;
      }
    }

    // Generate crypto token (8 chars hex / urlsafe string)
    const shareToken = crypto.randomBytes(6).toString("hex");

    const newLink = await SecureLink.create({
      share_token: shareToken,
      founder_id: user._id,
      startup_id: finalStartupId ? new mongoose.Types.ObjectId(finalStartupId) : undefined,
      doc_name: docName,
      doc_url: docUrl,
      doc_type: docType || "deck",
      access_type: accessType || "public",
      passcode: passcode || "",
      allowed_domains: Array.isArray(allowedDomains) ? allowedDomains : [],
      expires_at: expiresAt ? new Date(expiresAt) : undefined,
      max_views: maxViews ? Number(maxViews) : undefined,
      allow_download: Boolean(allowDownload),
      watermark_enabled: watermarkEnabled !== undefined ? Boolean(watermarkEnabled) : true,
      watermark_text: watermarkText || "CONFIDENTIAL • {email} • {date}",
      watermark_opacity: watermarkOpacity !== undefined ? Number(watermarkOpacity) : 0.18,
      watermark_style: watermarkStyle || "diagonal",
    });

    return NextResponse.json({
      success: true,
      link: {
        id: newLink._id.toString(),
        token: newLink.share_token,
        shareUrl: `/share/${newLink.share_token}`,
        docName: newLink.doc_name,
        docUrl: newLink.doc_url,
        accessType: newLink.access_type,
        watermarkText: newLink.watermark_text,
        createdAt: newLink.created_at
      }
    });
  } catch (err) {
    console.error("Error creating secure link:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const url = new URL(req.url);
    const linkId = url.searchParams.get("id");

    if (!linkId) {
      return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
    }

    const link = await SecureLink.findOne({ _id: linkId, founder_id: user._id });
    if (!link) {
      return NextResponse.json({ error: "Secure link not found" }, { status: 404 });
    }

    // Toggle revoked status
    link.is_revoked = true;
    await link.save();

    return NextResponse.json({ success: true, message: "Secure link revoked successfully" });
  } catch (err) {
    console.error("Error revoking secure link:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
