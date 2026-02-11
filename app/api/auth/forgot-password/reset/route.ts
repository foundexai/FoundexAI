import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const code = body.code;
    const newPassword = body.newPassword;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email, reset_code: code });

    if (!user) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (new Date() > user.reset_code_expires) {
      return NextResponse.json({ error: "Code has expired" }, { status: 400 });
    }

    // Update password
    user.password_hash = await hashPassword(newPassword);
    
    // Clear code
    user.reset_code = undefined;
    user.reset_code_expires = undefined;
    
    await user.save();

    return NextResponse.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
