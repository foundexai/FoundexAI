import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken, isAdmin } from "@/lib/auth";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";

/**
 * GET /api/admin/subscriptions
 * ─────────────────────────────
 * Admin-only endpoint to list all global subscriptions with user details.
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const adminEmail = (decoded.user as any).email;
    if (!isAdmin(adminEmail)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();

    // Fetch all subscriptions and populate user details
    const subscriptions = await Subscription.find()
      .populate({
        path: 'user_id',
        model: 'User',
        select: 'full_name email profile_image_url'
      })
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[Admin Subscriptions API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
