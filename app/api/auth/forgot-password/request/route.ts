import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();
    
    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        $set: { 
          reset_code: resetCode, 
          reset_code_expires: expiry 
        } 
      },
      { new: true }
    );

    console.log(`[Request Debug] Email: ${email}, Code Generated: ${resetCode}, Stored: ${updatedUser?.reset_code}`);

    if (!updatedUser) {
      // For security reasons, don't reveal if user exists or not
      return NextResponse.json({ success: true, message: "If an account exists, a code has been sent." });
    }

    // Send Email
    await sendEmail({
      to: email,
      subject: "Your Foundex Password Reset Code",
      body: `Your password reset code is: <b>${resetCode}</b>. This code will expire in 10 minutes.`,
    });

    return NextResponse.json({ success: true, message: "Reset code sent to your email." });
  } catch (error) {
    console.error("Forgot password request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
