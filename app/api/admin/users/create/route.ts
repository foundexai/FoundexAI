import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword, verifyToken, isAdmin, isSuperAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded || (!isAdmin(decoded.user.email) && !(decoded.user as any).is_admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { full_name, email, password, user_type, is_admin } = await req.json();

    if (is_admin) {
      const isRequesterSuperAdmin = isSuperAdmin(decoded.user.email) || !!(decoded.user as any).isSuperAdmin;
      if (!isRequesterSuperAdmin) {
        return NextResponse.json({ error: "Only super admins can create admin users" }, { status: 403 });
      }
    }

    if (!full_name || !email || !password || !user_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      full_name,
      email,
      password_hash: hashedPassword,
      user_type,
      is_admin: !!is_admin,
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        full_name: newUser.full_name,
        email: newUser.email,
        user_type: newUser.user_type,
        is_admin: newUser.is_admin,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
