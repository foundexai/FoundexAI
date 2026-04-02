"use client";

import React from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Lightning,
  ShieldCheck,
  Sparkle,
  ArrowRight,
  Lock,
  Crown,
  Rocket,
  CheckCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Pages that are always accessible (even for free/starter users)
const ALWAYS_ACCESSIBLE = [
  "/dashboard/pricing",
  "/dashboard/settings",
  "/dashboard/profile",
];

interface SubscriptionGuardProps {
  children: React.ReactNode;
  minimumPlan?: string;
  featureLabel?: string;
}

/**
 * SubscriptionGuard
 * ─────────────────
 * Wraps dashboard content and shows a premium paywall if the user
 * doesn't have the required subscription. Admins always bypass.
 *
 * Usage:
 *   <SubscriptionGuard>
 *     <YourProtectedContent />
 *   </SubscriptionGuard>
 *
 *   <SubscriptionGuard minimumPlan="pro" featureLabel="Advanced Analytics">
 *     <ProOnlyContent />
 *   </SubscriptionGuard>
 */
export default function SubscriptionGuard({
  children,
  minimumPlan = "founder",
  featureLabel,
}: SubscriptionGuardProps) {
  const { is_subscribed, is_admin, plan, plan_level, loading } =
    useSubscription();
  const pathname = usePathname();

  // Always accessible pages bypass the guard
  if (ALWAYS_ACCESSIBLE.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // Loading state — skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400 font-medium animate-pulse">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Admin bypass
  if (is_admin) {
    return <>{children}</>;
  }

  // Check access
  const PLAN_HIERARCHY: Record<string, number> = {
    starter: 0,
    founder: 1,
    pro: 2,
    license: 3,
  };
  const requiredLevel = PLAN_HIERARCHY[minimumPlan] || 1;

  if (plan_level >= requiredLevel) {
    return <>{children}</>;
  }

  // ── PAYWALL ─────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800/50 shadow-2xl">
          {/* Glow Effects */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-yellow-400/3 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-10">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-yellow-400/10 to-yellow-400/5 flex items-center justify-center border border-yellow-400/20">
                  <Lock
                    className="w-9 h-9 text-yellow-400"
                    weight="bold"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                  <Crown className="w-3.5 h-3.5 text-black" weight="fill" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                {featureLabel
                  ? `Unlock ${featureLabel}`
                  : "Upgrade to Continue"}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                This feature requires a{" "}
                <span className="text-yellow-400 font-bold capitalize">
                  {minimumPlan}
                </span>{" "}
                plan or higher. Upgrade now to unlock full access to FoundexAI.
              </p>
            </div>

            {/* Current vs Required */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Rocket className="w-4 h-4 text-zinc-500" weight="bold" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {plan}
                </span>
              </div>
              <ArrowRight
                className="w-4 h-4 text-zinc-600"
                weight="bold"
              />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                <Sparkle className="w-4 h-4 text-yellow-400" weight="bold" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  {minimumPlan}
                </span>
              </div>
            </div>

            {/* Benefits Preview */}
            <div className="bg-zinc-800/30 rounded-2xl p-5 mb-8 border border-zinc-800/50">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-4">
                What you'll unlock
              </p>
              <ul className="space-y-3">
                {getUpgradeFeatures(minimumPlan).map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle
                      className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0"
                      weight="fill"
                    />
                    <span className="text-xs text-zinc-300 font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Link href="/dashboard/pricing" className="block">
              <button className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black text-sm hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 cursor-pointer flex items-center justify-center gap-2 group">
                <Lightning className="w-4 h-4" weight="bold" />
                View Plans & Upgrade
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  weight="bold"
                />
              </button>
            </Link>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <ShieldCheck
                className="w-3.5 h-3.5 text-zinc-600"
                weight="fill"
              />
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wide">
                Secure & encrypted payment
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Tag */}
        <p className="text-center mt-6 text-[11px] text-zinc-600 font-medium">
          Questions? Reach out at{" "}
          <a
            href="mailto:support@foundex.ai"
            className="text-yellow-600 hover:text-yellow-500 transition-colors"
          >
            support@foundex.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function getUpgradeFeatures(plan: string): string[] {
  switch (plan) {
    case "founder":
      return [
        "Expanded Investor & Startup deep-dives",
        "5–10 Connect Requests per month",
        "Save & track unlimited profiles",
        "Priority search & advanced filters",
      ];
    case "pro":
      return [
        "Unlimited Investor & Startup profiles",
        "Unlimited Connect Requests",
        "Advanced AI-powered search & filters",
        "Full data export capabilities",
      ];
    case "license":
      return [
        "Full Institutional Platform access",
        "Sector Intelligence Reports",
        "Predictive Analytics Dashboard",
        "Regional Heat Maps & Deal Flow",
      ];
    default:
      return [
        "Expanded access to the platform",
        "Connect with investors directly",
        "Advanced search capabilities",
        "Priority support",
      ];
  }
}
