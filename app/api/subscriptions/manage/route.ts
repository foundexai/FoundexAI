import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken, isAdmin } from "@/lib/auth";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";

/**
 * POST /api/subscriptions/manage
 * ──────────────────────────────
 * Admin-only endpoint to manually grant/revoke/update subscriptions.
 * Useful for testing, customer support, and manual overrides.
 *
 * Actions: "grant", "revoke", "update"
 */
export async function POST(req: Request) {
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

    const body = await req.json();
    const { action, target_user_id, plan, billing_cycle, duration_days } = body;

    if (!action || !target_user_id) {
      return NextResponse.json(
        { error: "Missing required fields: action, target_user_id" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await User.findById(target_user_id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "grant": {
        if (!plan || !["founder", "pro", "license"].includes(plan)) {
          return NextResponse.json(
            { error: "Invalid plan. Must be founder, pro, or license" },
            { status: 400 }
          );
        }

        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + (duration_days || 30));

        const subscription = await Subscription.findOneAndUpdate(
          { user_id: target_user_id },
          {
            $set: {
              plan,
              status: "active",
              billing_cycle: billing_cycle || "monthly",
              current_period_start: new Date(),
              current_period_end: periodEnd,
              provider_name: "admin_grant",
              provider_customer_id: null,
              provider_subscription_id: null,
              cancel_at_period_end: false,
              canceled_at: null,
            },
          },
          { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(target_user_id, { plan_type: plan });

        return NextResponse.json({
          message: `Subscription granted: ${plan} for ${duration_days || 30} days`,
          subscription,
        });
      }

      case "revoke": {
        await Subscription.findOneAndUpdate(
          { user_id: target_user_id },
          {
            $set: {
              status: "canceled",
              canceled_at: new Date(),
              cancel_at_period_end: false,
            },
          }
        );

        await User.findByIdAndUpdate(target_user_id, { plan_type: "starter" });

        return NextResponse.json({ message: "Subscription revoked" });
      }

      case "update": {
        if (!plan) {
          return NextResponse.json({ error: "Plan is required for update" }, { status: 400 });
        }

        const updateFields: any = { plan };
        if (billing_cycle) updateFields.billing_cycle = billing_cycle;
        if (duration_days) {
          const newEnd = new Date();
          newEnd.setDate(newEnd.getDate() + duration_days);
          updateFields.current_period_end = newEnd;
        }

        await Subscription.findOneAndUpdate(
          { user_id: target_user_id },
          { $set: updateFields }
        );

        await User.findByIdAndUpdate(target_user_id, { plan_type: plan });

        return NextResponse.json({ message: `Subscription updated to ${plan}` });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be grant, revoke, or update" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Manage Subscription] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
