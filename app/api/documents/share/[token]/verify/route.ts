import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SecureLink from "@/lib/models/SecureLink";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const shareToken = resolvedParams.token;
    const body = await req.json();
    const { passcode, email, otpCode } = body;

    const link = await SecureLink.findOne({ share_token: shareToken });
    if (!link) {
      return NextResponse.json({ error: "Link not found or invalid" }, { status: 404 });
    }

    if (link.is_revoked) {
      return NextResponse.json({ error: "This secure link has been revoked." }, { status: 403 });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "This secure link has expired." }, { status: 410 });
    }

    if (link.max_views && link.view_count >= link.max_views) {
      return NextResponse.json({ error: "Maximum view limit reached." }, { status: 429 });
    }

    // 1. Check Passcode Verification
    if (link.access_type === "passcode") {
      if (!passcode || passcode.trim() !== link.passcode?.trim()) {
        return NextResponse.json({ error: "Incorrect passcode. Please try again." }, { status: 401 });
      }
    }

    // 2. Check Email OTP Verification
    let authenticatedEmail = email ? email.trim().toLowerCase() : "Viewer";
    if (link.access_type === "email_otp") {
      if (!email || !otpCode) {
        return NextResponse.json({ error: "Email address and 6-digit verification code are required" }, { status: 400 });
      }

      const allowedList = link.allowed_emails || [];
      if (allowedList.length > 0) {
        const isEmailAllowed = allowedList.some((e: string) => e.trim().toLowerCase() === authenticatedEmail);
        if (!isEmailAllowed) {
          return NextResponse.json({ error: "Access denied. Your email is not authorized to view this document." }, { status: 403 });
        }
      }

      const match = (link.otp_requests || []).find(
        (reqItem: any) =>
          reqItem.email === authenticatedEmail &&
          reqItem.code === otpCode.trim() &&
          new Date(reqItem.expires_at) > new Date()
      );

      if (!match) {
        return NextResponse.json({ error: "Invalid or expired 6-digit code. Please request a new code." }, { status: 401 });
      }

      // Mark code as verified
      match.verified = true;
    }

    // Extract client IP and user agent
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    // Increment view count and log access
    link.view_count = (link.view_count || 0) + 1;
    if (!link.access_logs) link.access_logs = [];
    link.access_logs.push({
      viewer_email: authenticatedEmail,
      viewer_ip: clientIp,
      user_agent: userAgent,
      viewed_at: new Date(),
      duration_seconds: 0
    });

    await link.save();

    // Prepare dynamic watermark string replacements
    const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const formattedTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    let finalWatermarkText = link.watermark_text || "CONFIDENTIAL • {email} • {date}";
    finalWatermarkText = finalWatermarkText
      .replace(/\{email\}/gi, authenticatedEmail)
      .replace(/\{date\}/gi, `${formattedDate} ${formattedTime}`)
      .replace(/\{token\}/gi, link.share_token);

    return NextResponse.json({
      success: true,
      docUrl: link.doc_url,
      docName: link.doc_name,
      docType: link.doc_type,
      allowDownload: link.allow_download,
      watermarkEnabled: link.watermark_enabled,
      watermarkText: finalWatermarkText,
      watermarkOpacity: link.watermark_opacity,
      watermarkStyle: link.watermark_style,
      viewerEmail: authenticatedEmail,
      viewerIp: clientIp
    });
  } catch (err) {
    console.error("Error verifying link access:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
