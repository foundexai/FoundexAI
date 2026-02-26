import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { investorId, status } = await req.json();

    if (!investorId || !status) {
      return NextResponse.json(
        { error: "Investor ID and status are required." },
        { status: 400 },
      );
    }

    // Use atomic update for Map efficiency
    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded.user._id },
      { $set: { [`investor_statuses.${investorId}`]: status } },
      { new: true, lean: true }
    );

    if (!updatedUser) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error("Error updating investor status:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
