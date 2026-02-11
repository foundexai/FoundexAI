import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken, isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    await Investor.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
