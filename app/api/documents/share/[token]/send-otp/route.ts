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
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const link = await SecureLink.findOne({ share_token: shareToken });
    if (!link || link.is_revoked) {
      return NextResponse.json({ error: "Invalid or revoked link" }, { status: 404 });
    }

    // Check domain restrictions if configured
    if (link.access_type === "domain_restricted" && link.allowed_domains?.length > 0) {
      const viewerDomain = email.split("@")[1]?.toLowerCase();
      const isDomainAllowed = link.allowed_domains.some((d: string) => d.toLowerCase() === viewerDomain);
      if (!isDomainAllowed) {
        return NextResponse.json({
          error: `Access denied. Email domain @${viewerDomain} is not authorized to view this document.`
        }, { status: 403 });
      }
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    // Save in OTP requests array
    if (!link.otp_requests) link.otp_requests = [];
    link.otp_requests.push({
      email: email.trim().toLowerCase(),
      code: otpCode,
      expires_at: expiresAt,
      verified: false
    });

    await link.save();

    // Log email dispatch (in production send via SMTP / SendGrid / AWS SES)
    console.log(`[SECURE LINK OTP] Dispatched 6-digit OTP ${otpCode} to ${email} for doc "${link.doc_name}"`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}.`,
      simulationCode: process.env.NODE_ENV === "development" ? otpCode : undefined
    });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
