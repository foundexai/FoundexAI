"use client";

import { useAuth } from "@/context/AuthContext";
import { User, Lock, Bell, Shield, SignOut, ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" weight="bold" />
            Account Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                Email Address
              </label>
              <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                User Type
              </label>
              <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium capitalize">
                {user?.user_type}
              </div>
            </div>
          </div>
        </div>

        {/* Security Section (Placeholder) */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" weight="bold" />
            Security
          </h2>
          <button className="text-left w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
            <span className="font-medium text-gray-700 dark:text-gray-300">Change Password</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200">Update</span>
          </button>
        </div>

        {/* Notifications (Placeholder) */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" weight="bold" />
            Notifications
          </h2>
           <div className="flex items-center justify-between p-4">
            <span className="font-medium text-gray-700 dark:text-gray-300">Email Updates</span>
            <div className="w-11 h-6 bg-blue-600 rounded-full dark:bg-blue-500 relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 right-0.5"></div>
            </div>
           </div>
        </div>

        {/* Billing Section */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" weight="bold" />
            Plans & Billing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { name: "Starter", price: "$0", features: ["Basic Matching", "3 Startups"] },
              { name: "Pro", price: "$49", features: ["AI Matchmaker", "Unlimited Startups"] },
              { name: "Enterprise", price: "Custom", features: ["Deep Diligence", "Priority Support"] },
            ].map((plan) => (
              <div key={plan.name} className="p-6 rounded-2xl border border-gray-100 bg-white shadow-xs dark:bg-white/5 dark:border-white/5 flex flex-col">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                       <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                       {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/pricing" className="w-full">
                  <button className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${plan.name === "Pro" ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400"}`}>
                    {plan.name === "Pro" ? "Current Plan" : "Upgrade"}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" weight="bold" />
            Privacy & Data Policy
          </h2>
          <div className="space-y-4">
             <Link href="/dashboard/privacy">
                <button className="text-left w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
                <span className="font-medium text-gray-700 dark:text-gray-300">Privacy Policy</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" weight="bold" />
                </button>
             </Link>
             <Link href="/dashboard/privacy">
                <button className="text-left w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
                <span className="font-medium text-gray-700 dark:text-gray-300">Data Terms & Usage</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" weight="bold" />
                </button>
             </Link>
          </div>
        </div>
        
        <div className="pt-6">
            <button 
                onClick={logout}
                className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                <SignOut className="w-5 h-5" weight="bold" />
                Sign Out
            </button>
        </div>
      </div>
    </div>
  );
}
