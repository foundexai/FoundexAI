import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SecureLink from "@/lib/models/SecureLink";
import { sendEmail } from "@/lib/email";

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

    const viewerEmail = email.trim().toLowerCase();

    // Check pre-authorized viewer email list for Email OTP Gate
    if (link.access_type === "email_otp") {
      const allowedList = link.allowed_emails || [];
      if (allowedList.length > 0) {
        const isEmailAllowed = allowedList.some((e: string) => e.trim().toLowerCase() === viewerEmail);
        if (!isEmailAllowed) {
          return NextResponse.json({
            error: "Access denied. Your email is not authorized to view this document."
          }, { status: 403 });
        }
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

    // Send the verification code via Plunk Email service
    try {
      await sendEmail({
        to: viewerEmail,
        subject: `Verification Code for "${link.doc_name}"`,
        body: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; color: #111;">
            <h2 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px;">Foundex Secure Access</h2>
            <p style="font-size: 14px; line-height: 1.5; color: #333;">You requested access to view the protected document <strong>${link.doc_name}</strong>.</p>
            <p style="font-size: 14px; line-height: 1.5; color: #333;">Please use the following 6-digit verification code to unlock the document:</p>
            <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px; padding: 16px; background-color: #f4f4f5; text-align: center; border-radius: 12px; margin: 24px 0; color: #000; font-family: monospace;">${otpCode}</div>
            <p style="font-size: 11px; color: #666; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">This code was sent to ${viewerEmail} and will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
    }

    // Log email dispatch to server console for backup/dev visibility
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
