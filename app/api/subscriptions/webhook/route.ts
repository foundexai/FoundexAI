import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";

/**
 * POST /api/subscriptions/webhook
 * ───────────────────────────────
 * PLACEHOLDER — Receives webhook events from your payment provider.
 *
 * This is the CRITICAL endpoint that activates/updates subscriptions.
 * Every payment provider sends events here after successful payment.
 *
 * Webhook Flow:
 *   1. Payment provider sends event (e.g., checkout.session.completed)
 *   2. Verify webhook signature (IMPORTANT for production!)
 *   3. Extract user_id, plan, and subscription details
 *   4. Create/update Subscription document
 *   5. Update User.plan_type for fast lookups
 *
 * Supported event types (generic — map to your provider):
 *   - subscription.created    → Create new subscription
 *   - subscription.updated    → Update plan/status
 *   - subscription.canceled   → Mark as canceled
 *   - payment.succeeded       → Extend period
 *   - payment.failed          → Mark as past_due
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    // ══════════════════════════════════════════════════════════════
    // TODO: Verify webhook signature from your payment provider
    //
    // Stripe:
    //   const sig = req.headers.get("stripe-signature");
    //   const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    //
    // Paystack:
    //   const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    //     .update(JSON.stringify(body)).digest("hex");
    //   if (hash !== req.headers.get("x-paystack-signature")) return 401;
    // ══════════════════════════════════════════════════════════════

    const body = await req.json();

    // Generic webhook payload structure (adapt to your provider)
    const {
      event_type,     // e.g., "subscription.created", "payment.succeeded"
      user_id,        // From metadata
      plan,           // "founder", "pro", "license"
      billing_cycle,  // "monthly", "yearly"
      provider_name,  // "stripe", "paystack", etc.
      provider_customer_id,
      provider_subscription_id,
      provider_price_id,
      period_start,
      period_end,
      metadata,
    } = body;

    if (!event_type || !user_id || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: event_type, user_id, plan" },
        { status: 400 }
      );
    }

    switch (event_type) {
      case "subscription.created":
      case "subscription.activated":
      case "payment.succeeded": {
        // Upsert the subscription
        const subscription = await Subscription.findOneAndUpdate(
          { user_id, provider_subscription_id: provider_subscription_id || undefined },
          {
            $set: {
              user_id,
              plan,
              status: "active",
              billing_cycle: billing_cycle || "monthly",
              current_period_start: period_start ? new Date(period_start) : new Date(),
              current_period_end: period_end ? new Date(period_end) : getDefaultPeriodEnd(billing_cycle),
              provider_name: provider_name || "unknown",
              provider_customer_id,
              provider_subscription_id,
              provider_price_id,
              provider_metadata: metadata || {},
              cancel_at_period_end: false,
              canceled_at: null,
            },
          },
          { upsert: true, new: true }
        );

        // Also update User.plan_type for fast lookups
        await User.findByIdAndUpdate(user_id, { plan_type: plan });

        console.log(`[Webhook] Subscription activated: ${user_id} → ${plan}`);
        return NextResponse.json({ received: true, subscription_id: subscription._id });
      }

      case "subscription.updated": {
        await Subscription.findOneAndUpdate(
          { user_id, provider_subscription_id },
          {
            $set: {
              plan,
              billing_cycle,
              current_period_start: period_start ? new Date(period_start) : undefined,
              current_period_end: period_end ? new Date(period_end) : undefined,
              provider_metadata: metadata || {},
            },
          }
        );
        await User.findByIdAndUpdate(user_id, { plan_type: plan });

        console.log(`[Webhook] Subscription updated: ${user_id} → ${plan}`);
        return NextResponse.json({ received: true });
      }

      case "subscription.canceled": {
        await Subscription.findOneAndUpdate(
          { user_id, provider_subscription_id },
          {
            $set: {
              status: "canceled",
              cancel_at_period_end: true,
              canceled_at: new Date(),
            },
          }
        );

        console.log(`[Webhook] Subscription canceled: ${user_id}`);
        return NextResponse.json({ received: true });
      }

      case "payment.failed": {
        await Subscription.findOneAndUpdate(
          { user_id, provider_subscription_id },
          { $set: { status: "past_due" } }
        );
        await User.findByIdAndUpdate(user_id, { plan_type: "starter" });

        console.log(`[Webhook] Payment failed: ${user_id}`);
        return NextResponse.json({ received: true });
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event_type}`);
        return NextResponse.json({ received: true, unhandled: true });
    }
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function getDefaultPeriodEnd(cycle?: string): Date {
  const now = new Date();
  if (cycle === "yearly") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return new Date(now.setMonth(now.getMonth() + 1));
}
