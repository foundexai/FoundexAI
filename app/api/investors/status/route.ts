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

    const user = await User.findById(decoded.user._id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Ensure investor_statuses exists and is a Map
    if (!user.investor_statuses) {
      user.investor_statuses = new Map();
    }

    // Using .set() for Mongoose Map
    if (user.investor_statuses instanceof Map) {
      user.investor_statuses.set(investorId, status);
    } else {
      // Fallback for plain objects if necessary
      user.investor_statuses[investorId] = status;
    }

    // Mark as modified if it's a map
    user.markModified('investor_statuses');
    
    await user.save();

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
