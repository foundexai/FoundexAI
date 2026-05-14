import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { comparePassword, signToken, isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json(
        { error: "No user found with this email." },
        { status: 401 }
      );
    const ok = await comparePassword(password, user.password_hash);
    if (!ok)
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    const token = signToken({ 
      id: user._id.toString(), 
      email, 
      full_name: user.full_name, 
      is_admin: isAdmin(email) || user.is_admin 
    });
    const res = NextResponse.json({
      user: { id: user._id, full_name: user.full_name, email, isAdmin: isAdmin(email) || user.is_admin },
      token,
    });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Our authentication servers are currently unreachable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
