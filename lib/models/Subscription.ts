import mongoose from "mongoose";

/**
 * Subscription Model
 * ------------------
 * Payment-provider agnostic. The `provider_*` fields are placeholders
 * that can be seeded/indexed by any payment method (Stripe, Paystack,
 * Flutterwave, Lemon Squeezy, manual admin grants, etc.)
 *
 * Lifecycle:
 *   1. User selects plan on /dashboard/pricing
 *   2. Frontend sends checkout request to /api/subscriptions/checkout
 *   3. Payment provider processes → webhook hits /api/subscriptions/webhook
 *   4. Webhook handler creates/updates this Subscription document
 *   5. Guards (API + client) check this document for access control
 */
const SubscriptionSchema = new mongoose.Schema({
  // ── Core Ownership ──────────────────────────────────────────────
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // ── Plan Details ────────────────────────────────────────────────
  plan: {
    type: String,
    enum: ["starter", "founder", "pro", "license"],
    required: true,
    default: "starter",
  },
  status: {
    type: String,
    enum: ["active", "past_due", "canceled", "expired", "trialing", "paused"],
    required: true,
    default: "active",
  },

  // ── Billing Cycle ───────────────────────────────────────────────
  billing_cycle: {
    type: String,
    enum: ["monthly", "yearly", "lifetime"],
    default: "monthly",
  },
  current_period_start: { type: Date },
  current_period_end: { type: Date },

  // ── Payment Provider Placeholders ───────────────────────────────
  // These fields are intentionally generic so ANY payment provider can seed them.
  //
  // Examples:
  //   Stripe:      provider_name="stripe",      provider_customer_id="cus_xxx",  provider_subscription_id="sub_xxx"
  //   Paystack:    provider_name="paystack",     provider_customer_id="CUS_xxx",  provider_subscription_id="SUB_xxx"
  //   Flutterwave: provider_name="flutterwave",  provider_customer_id="...",       provider_subscription_id="..."
  //   Manual:      provider_name="admin_grant",  provider_customer_id=null,        provider_subscription_id=null
  //
  provider_name: {
    type: String,
    default: null, // e.g., "stripe", "paystack", "flutterwave", "admin_grant"
  },
  provider_customer_id: {
    type: String,
    default: null, // The customer ID from the payment provider
  },
  provider_subscription_id: {
    type: String,
    default: null, // The subscription ID from the payment provider
  },
  provider_price_id: {
    type: String,
    default: null, // The price/plan ID from the payment provider
  },
  provider_metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}, // Any additional provider-specific data
  },

  // ── Usage / Limits ──────────────────────────────────────────────
  connect_requests_used: { type: Number, default: 0 },
  connect_requests_limit: { type: Number, default: 0 }, // 0 = use plan default
  
  // ── Trial ───────────────────────────────────────────────────────
  trial_start: { type: Date, default: null },
  trial_end: { type: Date, default: null },

  // ── Cancellation ────────────────────────────────────────────────
  cancel_at_period_end: { type: Boolean, default: false },
  canceled_at: { type: Date, default: null },

  // ── Timestamps ──────────────────────────────────────────────────
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Auto-update `updated_at` on save
SubscriptionSchema.pre("save", function () {
  this.updated_at = new Date();
});

// Compound index for fast lookups
SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ provider_subscription_id: 1 });

// Virtual: is the subscription currently valid?
SubscriptionSchema.virtual("is_valid").get(function () {
  const validStatuses = ["active", "trialing"];
  if (!validStatuses.includes(this.status)) return false;
  if (this.current_period_end && new Date() > this.current_period_end) return false;
  return true;
});

// Ensure virtuals are included in JSON/Object output
SubscriptionSchema.set("toJSON", { virtuals: true });
SubscriptionSchema.set("toObject", { virtuals: true });

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
