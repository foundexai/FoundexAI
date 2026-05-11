"use client";

import React from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { Sparkle, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TrialBanner: React.FC = () => {
  const { is_trial_active, trial_days_remaining } = useSubscription();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !is_trial_active) return null;

  return (
    <div className="w-full bg-linear-to-r from-yellow-400 via-yellow-500 to-yellow-400 py-1.5 px-4 relative z-[60] shadow-sm flex items-center justify-center gap-4 overflow-hidden">
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine pointer-events-none" />
      
      <div className="flex items-center gap-2 relative z-10">
        <Sparkle className="w-4 h-4 text-black animate-pulse" weight="fill" />
        <p className="text-[10px] sm:text-xs font-black text-black uppercase tracking-widest flex items-center gap-1.5">
          <span className="opacity-70">Free Trial Active:</span>
          <span>{trial_days_remaining} Days Remaining</span>
        </p>
      </div>

      <Link 
        href="/dashboard/pricing" 
        className="relative z-10 hidden sm:flex items-center gap-1.5 bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
      >
        Upgrade Now
        <ArrowRight weight="bold" className="w-3 h-3" />
      </Link>

      <style jsx>{`
        @keyframes shine {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shine {
          animation: shine 3s infinite linear;
        }
      `}</style>
    </div>
  );
};
