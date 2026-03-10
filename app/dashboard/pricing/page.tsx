"use client";

import { useState } from "react";
import { Check, Lightning, Rocket, Crown, ArrowLeft, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const PLANS = [
  {
    name: "Starter",
    id: "starter",
    target: "Explorers",
    price: { monthly: 0, yearly: 0 },
    description: "Browse the ecosystem and discover fundamental market opportunities.",
    features: [
      "Limited Investor Profiles",
      "Limited Startup Profiles",
      "Basic Search & Filters",
      "Save 3 Profiles",
      "No Connect Access",
    ],
    cta: "Current Plan",
    icon: Rocket,
    highlight: false,
    connectType: "locked"
  },
  {
    name: "Founder",
    id: "founder",
    target: "Early-stage founders",
    price: { monthly: 20, yearly: 16 },
    description: "Essential tools for active fundraising and relationship building.",
    features: [
      "Everything in Starter",
      "Expanded Investor Deep-dives",
      "Expanded Startup Data",
      "5–10 Connect Requests /mo",
      "Save & Track Unlimited Profiles",
    ],
    cta: "Upgrade to Founder",
    icon: Lightning,
    highlight: false,
    connectType: "limited"
  },
  {
    name: "Pro",
    id: "pro",
    target: "Active fundraisers",
    price: { monthly: 80, yearly: 64 },
    description: "Unrestricted access to the global investor network and advanced tools.",
    features: [
      "Everything in Founder",
      "Unlimited Investor Profiles",
      "Unlimited Startup Profiles",
      "Unlimited Connect Requests",
      "Advanced Search & Filters",
    ],
    cta: "Go Pro",
    icon: Sparkle,
    highlight: true,
    connectType: "unlimited"
  },
  {
    name: "License",
    id: "license",
    target: "Funds · Corporates · DFIs",
    price: { monthly: 1100, yearly: 880 },
    description: "Institutional intelligence and predictive market analytics.",
    features: [
      "Full Institutional Platform access",
      "Sector Intelligence Reports",
      "Predictive Analytics Dashboard",
      "Regional Heat Maps",
      "Deal Flow & Trend Analysis",
    ],
    cta: "Get License",
    icon: Crown,
    highlight: false,
    connectType: "unlimited"
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
        <Link 
            href="/dashboard/settings"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
        >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" weight="bold" />
        </Link>
        <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Choose Your Plan
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                Elevate your fundraising with precision AI matching.
            </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-16">
        <div className="bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl flex items-center shadow-inner border border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
              billingCycle === "monthly"
                ? "bg-white text-black shadow-lg dark:bg-zinc-800 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
              billingCycle === "yearly"
                ? "bg-white text-black shadow-lg dark:bg-zinc-800 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Yearly
            <span className="bg-yellow-400 text-[10px] text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan_type === plan.id || (!user?.plan_type && plan.id === "starter");
          
          return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col p-6 rounded-3xl transition-all duration-300 border",
              plan.highlight
                ? "bg-zinc-950 text-white dark:bg-zinc-900 border-yellow-400/50 shadow-2xl z-10 scale-[1.02]"
                : "bg-white text-gray-900 dark:bg-black dark:text-white border-gray-100 dark:border-zinc-800 hover:border-yellow-400 dark:hover:border-yellow-400/50 shadow-sm"
            )}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-4 block">
                {plan.target}
              </span>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                plan.highlight ? "bg-yellow-400/10" : "bg-gray-100 dark:bg-white/5"
              )}>
                <plan.icon className={cn("w-6 h-6", plan.highlight ? "text-yellow-400" : "text-gray-400")} weight="bold" />
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight">{plan.name}</h3>
              <p className={cn(
                "text-sm font-medium leading-relaxed",
                plan.highlight ? "text-zinc-400" : "text-gray-500 dark:text-gray-400"
              )}>
                {plan.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-4xl font-black",
                  plan.highlight && "text-yellow-400"
                )}>
                  {typeof plan.price[billingCycle] === "number" ? `$${plan.price[billingCycle]}` : plan.price[billingCycle]}
                </span>
                {typeof plan.price[billingCycle] === "number" && (
                  <span className={cn(
                    "text-xs font-bold",
                    plan.highlight ? "text-zinc-500" : "text-gray-400"
                  )}>
                    /mo
                  </span>
                )}
              </div>
              {billingCycle === "yearly" && typeof plan.price.monthly === "number" && (
                <p className="text-[10px] text-yellow-600 font-bold mt-1">Billed annually</p>
              )}
            </div>

            <div className="divider h-px bg-gray-100 dark:bg-white/10 mb-8"></div>

            <ul className="space-y-4 mb-10 grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 shrink-0",
                    plan.highlight ? "text-yellow-400" : "text-gray-900 dark:text-gray-500"
                  )}>
                    <Check className="w-3.5 h-3.5" weight="bold" />
                  </div>
                  <span className={cn(
                    "text-[12px] font-medium leading-tight",
                    plan.highlight ? "text-zinc-300" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-4">
               {/* Connect Badge */}
               <div className={cn(
                 "py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-center border",
                 plan.connectType === "locked" ? "border-gray-100 text-gray-300 dark:border-white/5 dark:text-zinc-800" :
                 plan.connectType === "limited" ? "border-yellow-400/30 text-yellow-600" :
                 "bg-yellow-400/10 border-yellow-400/50 text-yellow-500"
               )}>
                 {plan.connectType === "locked" && "⊘ Connect Locked"}
                 {plan.connectType === "limited" && "◈ Connect — Limited"}
                 {plan.connectType === "unlimited" && "◈ Connect — Unlimited"}
               </div>

                <button className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer shadow-lg",
                  plan.highlight
                    ? "bg-yellow-400 text-black hover:bg-yellow-500 hover:-translate-y-1 shadow-yellow-400/20"
                    : isCurrentPlan
                    ? "bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-zinc-600 shadow-none cursor-default"
                    : "bg-black text-white dark:bg-white dark:text-black hover:-translate-y-1 shadow-black/10 dark:shadow-white/5"
                )}>
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                </button>
            </div>
          </div>
        )})}
      </div>

      <p className="text-center mt-12 text-sm text-gray-400 dark:text-zinc-600 font-medium italic">
          Prices are in USD. Secure payment via Stripe. Use our platform responsibly.
      </p>
    </div>
  );
}
