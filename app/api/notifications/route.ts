import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Notification from "@/lib/models/Notification";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const notifications = await Notification.find({ recipient_id: decoded.user._id })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { id, markAll } = await req.json();

    if (markAll) {
      await Notification.updateMany(
        { recipient_id: decoded.user._id, is_read: false },
        { is_read: true }
      );
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient_id: decoded.user._id },
      { is_read: true },
      { new: true }
    );

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
