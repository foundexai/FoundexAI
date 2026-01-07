import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
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
  const token = signToken({ id: user._id.toString(), email });
  const res = NextResponse.json({
    user: { id: user._id, full_name: user.full_name, email },
    token,
  });
  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax",
  });
  return res;
}
