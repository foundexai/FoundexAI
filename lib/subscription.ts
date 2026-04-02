import { connectDB } from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import { isAdmin } from "@/lib/auth";

/**
 * Plan Hierarchy & Access Levels
 * ──────────────────────────────
 * starter  → Free tier, limited access (gated features)
 * founder  → Paid, expanded access
 * pro      → Paid, full access
 * license  → Institutional, full access + extras
 */
export const PLAN_HIERARCHY: Record<string, number> = {
  starter: 0,
  founder: 1,
  pro: 2,
  license: 3,
};

export const PLAN_LIMITS: Record<string, { connect_requests: number; saved_profiles: number }> = {
  starter: { connect_requests: 0, saved_profiles: 3 },
  founder: { connect_requests: 10, saved_profiles: -1 }, // -1 = unlimited
  pro: { connect_requests: -1, saved_profiles: -1 },
  license: { connect_requests: -1, saved_profiles: -1 },
};

/**
 * FREE_ROUTES — Routes that don't require a paid subscription.
 * Auth is still required, but even "starter" (free) users can access these.
 */
export const FREE_ROUTES = [
  "/api/auth",
  "/api/subscriptions",
];

/**
 * FREE_PAGES — Frontend pages accessible without paid subscription.
 */
export const FREE_PAGES = [
  "/dashboard/pricing",
  "/dashboard/settings",
  "/dashboard/profile",
];

export interface SubscriptionStatus {
  is_subscribed: boolean;
  plan: string;
  status: string;
  plan_level: number;
  is_admin: boolean;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  connect_requests_used: number;
  connect_requests_limit: number;
}

/**
 * getSubscriptionStatus
 * ─────────────────────
 * Core utility to check a user's subscription.
 * Returns full status object with plan details.
 */
export async function getSubscriptionStatus(
  userId: string,
  userEmail?: string
): Promise<SubscriptionStatus> {
  const adminUser = userEmail ? isAdmin(userEmail) : false;

  // Admins always have full access
  if (adminUser) {
    return {
      is_subscribed: true,
      plan: "license",
      status: "active",
      plan_level: PLAN_HIERARCHY.license,
      is_admin: true,
      current_period_end: null,
      cancel_at_period_end: false,
      connect_requests_used: 0,
      connect_requests_limit: -1,
    };
  }

  await connectDB();

  // Find the most recent active subscription for this user
  const subscription = await Subscription.findOne({
    user_id: userId,
    status: { $in: ["active", "trialing"] },
  })
    .sort({ created_at: -1 })
    .lean();

  if (!subscription) {
    return {
      is_subscribed: false,
      plan: "starter",
      status: "none",
      plan_level: PLAN_HIERARCHY.starter,
      is_admin: false,
      current_period_end: null,
      cancel_at_period_end: false,
      connect_requests_used: 0,
      connect_requests_limit: PLAN_LIMITS.starter.connect_requests,
    };
  }

  // Check if period has expired
  const isExpired =
    subscription.current_period_end &&
    new Date() > new Date(subscription.current_period_end);

  if (isExpired) {
    return {
      is_subscribed: false,
      plan: subscription.plan || "starter",
      status: "expired",
      plan_level: PLAN_HIERARCHY.starter,
      is_admin: false,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      connect_requests_used: subscription.connect_requests_used || 0,
      connect_requests_limit:
        PLAN_LIMITS[subscription.plan]?.connect_requests || 0,
    };
  }

  const plan = subscription.plan || "starter";
  const isPaid = PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY.founder;

  return {
    is_subscribed: isPaid,
    plan,
    status: subscription.status,
    plan_level: PLAN_HIERARCHY[plan] || 0,
    is_admin: false,
    current_period_end: subscription.current_period_end || null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    connect_requests_used: subscription.connect_requests_used || 0,
    connect_requests_limit:
      subscription.connect_requests_limit ||
      PLAN_LIMITS[plan]?.connect_requests ||
      0,
  };
}

/**
 * requireSubscription
 * ───────────────────
 * Server-side API guard. Call this at the top of any protected API route.
 *
 * Usage:
 *   const guard = await requireSubscription(userId, userEmail);
 *   if (guard.blocked) return guard.response;
 *
 * @param userId      - The authenticated user's ID
 * @param userEmail   - The authenticated user's email (for admin check)
 * @param minimumPlan - Minimum plan required (default: "founder")
 */
export async function requireSubscription(
  userId: string,
  userEmail: string,
  minimumPlan: string = "founder"
): Promise<{ blocked: boolean; response?: Response; subscription: SubscriptionStatus }> {
  const subscription = await getSubscriptionStatus(userId, userEmail);

  // Admins always pass
  if (subscription.is_admin) {
    return { blocked: false, subscription };
  }

  const requiredLevel = PLAN_HIERARCHY[minimumPlan] || PLAN_HIERARCHY.founder;

  if (subscription.plan_level < requiredLevel) {
    const { NextResponse } = await import("next/server");
    return {
      blocked: true,
      response: NextResponse.json(
        {
          error: "Subscription required",
          code: "SUBSCRIPTION_REQUIRED",
          required_plan: minimumPlan,
          current_plan: subscription.plan,
          upgrade_url: "/dashboard/pricing",
        },
        { status: 403 }
      ) as unknown as Response,
      subscription,
    };
  }

  return { blocked: false, subscription };
}

/**
 * requirePlan
 * ───────────
 * Stricter variant — checks for a specific minimum plan.
 *
 * Usage:
 *   const guard = await requirePlan(userId, userEmail, "pro");
 *   if (guard.blocked) return guard.response;
 */
export const requirePlan = requireSubscription;
