import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const code = body.code;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || user.reset_code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (new Date() > user.reset_code_expires) {
      return NextResponse.json({ error: "Code has expired" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Code verified successfully." });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
