import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

/**
 * GET /api/subscriptions/status
 * ─────────────────────────────
 * Returns the current user's subscription status.
 * Called by the frontend SubscriptionProvider on mount.
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

    const userId = (decoded.user as any)._id || (decoded.user as any).id;
    const userEmail = (decoded.user as any).email || (decoded as any).email;

    console.log(`[API /subscriptions/status] Request from userId: ${userId}, email: ${userEmail}`);
    const status = await getSubscriptionStatus(userId, userEmail);
    console.log(`[API /subscriptions/status] Returning status for ${userId}`);

    return NextResponse.json({ subscription: status });
  } catch (error) {
    console.error("[Subscription Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
