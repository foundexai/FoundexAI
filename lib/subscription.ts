import { connectDB } from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import { isAdmin } from "@/lib/auth";
import { getCache, setCache } from "@/lib/redis";

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
  // Trial info
  is_trial_active: boolean;
  trial_days_remaining: number;
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
  const cacheKey = `sub:status:${userId}`;
  try {
    const cached = await getCache<SubscriptionStatus>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.error(`[getSubscriptionStatus] Cache read error for userId ${userId}:`, err);
  }

  console.log(`[getSubscriptionStatus] Checking status for userId: ${userId}`);
  
  await connectDB();
  const user = await User.findById(userId).lean();
  console.log(`[getSubscriptionStatus] User found: ${!!user}`);

  // Calculate Trial Status
  let trialStart = user?.trial_start_date;
  
  // If no trial start date yet, activate it now (on first login/check)
  // This satisfies the requirement: "starting from the very day he signs in / starting from today"
  if (!trialStart && user) {
    console.log(`[getSubscriptionStatus] Activating trial for user: ${userId}`);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { trial_start_date: new Date() },
      { new: true }
    ).lean();
    trialStart = updatedUser?.trial_start_date;
  }

  let isTrialActive = false;
  let trialDaysRemaining = 0;
  
  if (trialStart) {
    const start = new Date(trialStart);
    const trialEnd = new Date(start);
    trialEnd.setDate(trialEnd.getDate() + 30);
    const now = new Date();
    
    if (now < trialEnd) {
      isTrialActive = true;
      trialDaysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  console.log(`[getSubscriptionStatus] Trial: active=${isTrialActive}, days=${trialDaysRemaining}`);

  const adminUser = userEmail ? isAdmin(userEmail) : false;

  // Admins always have full access
  if (adminUser) {
    console.log(`[getSubscriptionStatus] User is admin`);
    const result = {
      is_subscribed: true,
      plan: "license",
      status: "active",
      plan_level: PLAN_HIERARCHY.license,
      is_admin: true,
      current_period_end: null,
      cancel_at_period_end: false,
      connect_requests_used: 0,
      connect_requests_limit: -1,
      is_trial_active: isTrialActive, // Now includes trial info for admins
      trial_days_remaining: trialDaysRemaining,
    };
    setCache(cacheKey, result, 120).catch(() => {});
    return result;
  }

  // Find the most recent active subscription for this user
  const subscription = await Subscription.findOne({
    user_id: userId,
    status: { $in: ["active", "trialing"] },
  })
    .sort({ created_at: -1 })
    .lean();

  console.log(`[getSubscriptionStatus] Subscription found: ${!!subscription}`);

  if (!subscription) {
    const plan = isTrialActive ? "founder" : "starter";
    const result = {
      is_subscribed: isTrialActive,
      plan: plan,
      status: isTrialActive ? "trialing" : "none",
      plan_level: PLAN_HIERARCHY[plan],
      is_admin: false,
      current_period_end: null,
      cancel_at_period_end: false,
      connect_requests_used: 0,
      connect_requests_limit: PLAN_LIMITS[plan].connect_requests,
      is_trial_active: isTrialActive,
      trial_days_remaining: trialDaysRemaining,
    };
    console.log(`[getSubscriptionStatus] Returning trial/starter status:`, result);
    setCache(cacheKey, result, 120).catch(() => {});
    return result;
  }

  // Check if period has expired
  const isExpired =
    subscription.current_period_end &&
    new Date() > new Date(subscription.current_period_end);

  if (isExpired) {
    // Even if subscription expired, check if user is still within their 30-day initial trial
    if (isTrialActive) {
      const result = {
        is_subscribed: true,
        plan: "founder",
        status: "trialing",
        plan_level: PLAN_HIERARCHY.founder,
        is_admin: false,
        current_period_end: null,
        cancel_at_period_end: false,
        connect_requests_used: 0,
        connect_requests_limit: PLAN_LIMITS.founder.connect_requests,
        is_trial_active: true,
        trial_days_remaining: trialDaysRemaining,
      };
      setCache(cacheKey, result, 120).catch(() => {});
      return result;
    }

    const result = {
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
      is_trial_active: false,
      trial_days_remaining: 0,
    };
    setCache(cacheKey, result, 120).catch(() => {});
    return result;
  }

  const plan = subscription.plan || "starter";
  const isPaid = PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY.founder;

  const result = {
    is_subscribed: isPaid || isTrialActive,
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
    is_trial_active: isTrialActive,
    trial_days_remaining: trialDaysRemaining,
  };
  setCache(cacheKey, result, 120).catch(() => {});
  return result;
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
