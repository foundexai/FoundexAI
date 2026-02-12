"use client";

import { useState } from "react";
import { Check, Lightning, Rocket, Crown, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    id: "starter",
    price: { monthly: 0, yearly: 0 },
    description: "Essential tools for early-stage founders just getting started.",
    features: [
      "Up to 3 Startup Profiles",
      "Basic Investor Matching",
      "Community Support",
      "Public Directory Listing",
    ],
    cta: "Current Plan",
    icon: Rocket,
    highlight: false,
  },
  {
    name: "Foundex Pro",
    id: "pro",
    price: { monthly: 29, yearly: 290 },
    description: "Advanced AI matching and insights to accelerate your fundraising.",
    features: [
      "Unlimited Startup Profiles",
      "AI-Powered Matchmaker",
      "Deep Investor Insights",
      "Personalized Matching Rationales",
      "Advanced Search Filters",
      "Priority Email Support",
    ],
    cta: "Upgrade to Pro",
    icon: Lightning,
    highlight: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: { monthly: "Custom", yearly: "Custom" },
    description: "Full deal support and white-glove service for serious scaling.",
    features: [
      "Everything in Pro",
      "White-Glove Deal Support",
      "Custom Investor Research",
      "Dedicated Relationship Manager",
      "Platform Branding",
      "SLA & Custom Terms",
    ],
    cta: "Contact Sales",
    icon: Crown,
    highlight: false,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-12">
        <Link 
            href="/dashboard/settings"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
            <ArrowLeft className="w-6 h-6" weight="bold" />
        </Link>
        <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Choose Your Plan
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col p-8 rounded-3xl transition-all duration-300 border",
              plan.highlight
                ? "bg-black text-white dark:bg-zinc-900 border-white/10 shadow-2xl scale-105 z-10"
                : "bg-white text-gray-900 dark:bg-black dark:text-white border-gray-200 dark:border-zinc-800 hover:border-yellow-400 dark:hover:border-yellow-400/50 shadow-sm"
            )}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                plan.highlight ? "bg-white/10" : "bg-gray-100 dark:bg-white/5"
              )}>
                <plan.icon className={cn("w-6 h-6", plan.highlight ? "text-yellow-400" : "text-gray-400")} weight="bold" />
              </div>
              <h3 className="text-xl font-black mb-2">{plan.name}</h3>
              <p className={cn(
                "text-sm font-medium leading-relaxed",
                plan.highlight ? "text-zinc-400" : "text-gray-500 dark:text-gray-400"
              )}>
                {plan.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">
                  {typeof plan.price[billingCycle] === "number" ? `$${plan.price[billingCycle]}` : plan.price[billingCycle]}
                </span>
                {typeof plan.price[billingCycle] === "number" && (
                  <span className={cn(
                    "text-sm font-bold",
                    plan.highlight ? "text-zinc-500" : "text-gray-400"
                  )}>
                    /mo
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-4 mb-10 grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 rounded-full p-0.5 shrink-0",
                    plan.highlight ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                  )}>
                    <Check className="w-3 h-3" weight="bold" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    plan.highlight ? "text-zinc-300" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button className={cn(
              "w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer shadow-lg",
              plan.highlight
                ? "bg-yellow-400 text-black hover:bg-yellow-500 hover:-translate-y-1 shadow-yellow-400/20"
                : plan.cta === "Current Plan"
                ? "bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-zinc-600 shadow-none cursor-default"
                : "bg-black text-white dark:bg-white dark:text-black hover:-translate-y-1 shadow-black/10 dark:shadow-white/5"
            )}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center mt-12 text-sm text-gray-400 dark:text-zinc-600 font-medium italic">
          Prices are in USD. Secure payment via Stripe. Use our platform responsibly.
      </p>
    </div>
  );
}
