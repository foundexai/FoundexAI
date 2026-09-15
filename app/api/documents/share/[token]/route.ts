import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SecureLink from "@/lib/models/SecureLink";
import { extractClientIp, extractClientCountry, isIpAllowed, isCountryAllowed } from "@/lib/networkSecurity";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const shareToken = resolvedParams.token;

    if (!shareToken) {
      return NextResponse.json({ error: "Missing link token" }, { status: 400 });
    }

    const link = await SecureLink.findOne({ share_token: shareToken });
    if (!link) {
      return NextResponse.json({ error: "Link not found or invalid" }, { status: 404 });
    }

    const clientIp = extractClientIp(req);
    const clientCountry = extractClientCountry(req);

    // 1. IP Whitelisting Check
    if (link.ip_restriction_enabled && link.allowed_ips && link.allowed_ips.length > 0) {
      if (!isIpAllowed(clientIp, link.allowed_ips)) {
        return NextResponse.json({
          status: "ip_blocked",
          error: `Access denied. Your IP address (${clientIp}) is not authorized to access this document.`,
          docName: link.doc_name
        }, { status: 403 });
      }
    }

    // 2. Geo-Fencing Check
    if (link.geofencing_enabled && link.allowed_countries && link.allowed_countries.length > 0) {
      if (!isCountryAllowed(clientCountry, link.allowed_countries)) {
        return NextResponse.json({
          status: "geo_blocked",
          error: `Access denied. Document access is restricted in your location (${clientCountry}).`,
          docName: link.doc_name
        }, { status: 403 });
      }
    }

    // 3. Check Revocation Status
    if (link.is_revoked) {
      return NextResponse.json({
        status: "revoked",
        error: "This secure link has been revoked by the owner.",
        docName: link.doc_name
      }, { status: 403 });
    }

    // Check Expiration Date
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({
        status: "expired",
        error: "This secure link has expired.",
        docName: link.doc_name,
        expiresAt: link.expires_at
      }, { status: 410 });
    }

    // Check View Count Limits
    if (link.max_views && link.view_count >= link.max_views) {
      return NextResponse.json({
        status: "limit_reached",
        error: "Maximum view limit reached for this secure link.",
        docName: link.doc_name,
        maxViews: link.max_views
      }, { status: 429 });
    }

    // If access_type is 'public', we return doc_url immediately.
    // If access_type is 'passcode', 'email_otp', or 'domain_restricted', viewer must complete verification step first!
    const requiresGate = link.access_type !== "public";

    return NextResponse.json({
      status: "active",
      token: link.share_token,
      docName: link.doc_name,
      docType: link.doc_type,
      accessType: link.access_type,
      requiresGate,
      allowedDomains: link.allowed_domains || [],
      allowDownload: link.allow_download,
      watermarkEnabled: link.watermark_enabled,
      watermarkText: link.watermark_text,
      watermarkOpacity: link.watermark_opacity,
      watermarkStyle: link.watermark_style,
      docUrl: requiresGate ? null : link.doc_url
    });
  } catch (err) {
    console.error("Error checking link status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
