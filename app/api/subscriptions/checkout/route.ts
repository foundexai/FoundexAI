import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * POST /api/subscriptions/checkout
 * ────────────────────────────────
 * PLACEHOLDER — Initiates a checkout session with your chosen payment provider.
 *
 * This endpoint is ready to be wired to any payment gateway:
 *   - Stripe: Create a checkout session via stripe.checkout.sessions.create()
 *   - Paystack: Initialize transaction via paystack.transaction.initialize()
 *   - Flutterwave: Create payment link
 *   - LemonSqueezy: Create checkout
 *
 * Expected request body:
 *   {
 *     plan: "founder" | "pro" | "license",
 *     billing_cycle: "monthly" | "yearly",
 *     success_url?: string,
 *     cancel_url?: string,
 *   }
 *
 * Expected response (once wired):
 *   {
 *     checkout_url: "https://provider.com/checkout/xxx",
 *     session_id: "xxx",
 *   }
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

    const body = await req.json();
    const { plan, billing_cycle } = body;

    if (!plan || !["founder", "pro", "license"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be one of: founder, pro, license" },
        { status: 400 }
      );
    }

    if (billing_cycle && !["monthly", "yearly"].includes(billing_cycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be monthly or yearly" },
        { status: 400 }
      );
    }

    const userId = (decoded.user as any)._id || (decoded.user as any).id;
    const userEmail = (decoded.user as any).email;

    // ══════════════════════════════════════════════════════════════
    // TODO: Wire your payment provider here
    //
    // Example (Stripe):
    // ─────────────────
    // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: userEmail,
    //   mode: "subscription",
    //   line_items: [{ price: PRICE_IDS[plan][billing_cycle], quantity: 1 }],
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing`,
    //   metadata: { user_id: userId, plan },
    // });
    // return NextResponse.json({ checkout_url: session.url, session_id: session.id });
    //
    // Example (Paystack):
    // ────────────────────
    // const response = await fetch("https://api.paystack.co/transaction/initialize", {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    //   body: JSON.stringify({
    //     email: userEmail,
    //     amount: PLAN_PRICES[plan][billing_cycle] * 100,
    //     metadata: { user_id: userId, plan, billing_cycle },
    //   }),
    // });
    // const data = await response.json();
    // return NextResponse.json({ checkout_url: data.data.authorization_url });
    // ══════════════════════════════════════════════════════════════

    return NextResponse.json(
      {
        message: "Checkout endpoint ready — wire your payment provider",
        placeholder: true,
        requested_plan: plan,
        requested_cycle: billing_cycle || "monthly",
        user_id: userId,
        user_email: userEmail,
        instructions: "See the TODO comments in this route file to wire Stripe, Paystack, or any payment provider.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
