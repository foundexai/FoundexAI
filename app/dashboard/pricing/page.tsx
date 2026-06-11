"use client";

import { useState } from "react";
import { Check, Lightning, Rocket, Crown, ArrowLeft, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Starter",
    id: "starter",
    target: "Explorers",
    priceText: "$0",
    billingText: "Free forever",
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
    connectType: "locked",
    roles: ["founder"]
  },
  {
    name: "Founder",
    id: "founder",
    target: "Early-stage founders",
    priceText: "$20",
    billingText: "/mo (Billed annually)",
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
    connectType: "limited",
    roles: ["founder", "institution"]
  },
  {
    name: "Pro",
    id: "pro",
    target: "Active fundraisers",
    priceText: "$80",
    billingText: "/mo (Billed annually)",
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
    connectType: "unlimited",
    roles: ["founder", "institution"]
  },
  {
    name: "License",
    id: "license",
    target: "Funds · Corporates · DFIs",
    priceText: "$1,100",
    billingText: "/yr (Billed annually)",
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
    connectType: "unlimited",
    roles: ["institution"]
  },
];

export default function PricingPage() {
  const { user, token } = useAuth();
  const [userRole, setUserRole] = useState<"founder" | "institution">("founder");

  const filteredPlans = PLANS.filter(plan => plan.roles.includes(userRole));

  const handleSelectPlan = async (planId: string) => {
    if (planId === "starter") return;
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId,
          billing_cycle: "yearly"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else if (data.placeholder) {
          toast.success(`Checkout simulation for ${planId} plan (Yearly cycle) initiated!`);
        }
      } else {
        toast.error("Checkout failed to initiate.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed to initiate.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div className="flex items-center gap-3 md:gap-4">
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

        {/* Role Toggle Pill */}
        <div className="bg-gray-100 dark:bg-zinc-900 p-1.5 rounded-2xl flex items-center shadow-inner border border-gray-200 dark:border-zinc-800 self-start md:self-center">
          <button
            onClick={() => setUserRole("founder")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              userRole === "founder"
                ? "bg-white text-black shadow-lg dark:bg-zinc-800 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-zinc-350"
            )}
          >
            Founder
          </button>
          <button
            onClick={() => setUserRole("institution")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              userRole === "institution"
                ? "bg-white text-black shadow-lg dark:bg-zinc-800 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-zinc-350"
            )}
          >
            Institution
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {filteredPlans.map((plan) => {
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
                    {plan.priceText}
                  </span>
                  <span className={cn(
                    "text-xs font-bold",
                    plan.highlight ? "text-zinc-500" : "text-gray-400"
                  )}>
                    {plan.billingText}
                  </span>
                </div>
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

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer shadow-lg",
                      plan.highlight
                        ? "bg-yellow-400 text-black hover:bg-yellow-500 hover:-translate-y-1 shadow-yellow-400/20"
                        : isCurrentPlan
                        ? "bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-zinc-600 shadow-none cursor-default"
                        : "bg-black text-white dark:bg-white dark:text-black hover:-translate-y-1 shadow-black/10 dark:shadow-white/5"
                    )}
                  >
                    {isCurrentPlan ? "Current Plan" : plan.cta}
                  </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-12 text-sm text-gray-400 dark:text-zinc-600 font-medium italic">
          Prices are in USD. Secure payment via Stripe. Use our platform responsibly.
      </p>
    </div>
  );
}
