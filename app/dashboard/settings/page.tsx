"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Lock,
  Bell,
  Shield,
  SignOut,
  ArrowUpRight,
  CircleNotch,
  RocketLaunch,
} from "@phosphor-icons/react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, token, logout, refreshUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [dealFlowAlerts, setDealFlowAlerts] = useState(
    user?.preferences?.dealFlowAlerts !== false,
  );
  const [profileVisibility, setProfileVisibility] = useState(
    user?.preferences?.profileVisibility !== false,
  );
  const isInvestor = user?.user_type === "investor";

  const handleToggle = async (key: string, value: boolean) => {
    if (key === "dealFlowAlerts") setDealFlowAlerts(value);
    if (key === "profileVisibility") setProfileVisibility(value);
    try {
      await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences: { [key]: value } }),
      });
      if (refreshUser) refreshUser();
    } catch (e) {
      console.error("Failed to save preference:", e);
    }
  };

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
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Change Password
            </span>
            <span className="text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200">
              Update
            </span>
          </button>
        </div>

        {/* Role-specific Section */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <RocketLaunch className="w-5 h-5 text-gray-400" weight="bold" />
            {isInvestor ? "Investor Preferences" : "Founder Preferences"}
          </h2>
          <div className="space-y-6">
            <div
              className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl dark:bg-white/5 cursor-pointer"
              onClick={() => handleToggle("dealFlowAlerts", !dealFlowAlerts)}
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {isInvestor ? "Deal Flow Alerts" : "Investor Match Alerts"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isInvestor
                    ? "Get notified when new startups match your criteria"
                    : "Get notified when new investors match your sector"}
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  dealFlowAlerts ? "bg-yellow-500" : "bg-gray-300 dark:bg-zinc-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                    dealFlowAlerts ? "right-0.5" : "left-0.5"
                  }`}
                />
              </div>
            </div>
            <div
              className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl dark:bg-white/5 cursor-pointer"
              onClick={() => handleToggle("profileVisibility", !profileVisibility)}
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {isInvestor ? "Profile Visibility" : "Public Startup Profile"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isInvestor
                    ? "Show your investor profile to founders"
                    : "Allow your startup to appear in the founder directory"}
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  profileVisibility ? "bg-yellow-500" : "bg-gray-300 dark:bg-zinc-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                    profileVisibility ? "right-0.5" : "left-0.5"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" weight="bold" />
            Notifications
          </h2>
          <div className="flex items-center justify-between p-4">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Email Updates
            </span>
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
              {
                name: "Starter",
                price: "$0",
                features: isInvestor
                  ? ["Basic Matching", "Curated Deals"]
                  : ["Basic Matching", "3 Startups"],
              },
              {
                name: "Pro",
                price: "$49",
                features: isInvestor
                  ? ["AI Matchmaker", "Unlimited Access", "Priority Alerts"]
                  : ["AI Matchmaker", "Unlimited Startups"],
              },
              {
                name: "Enterprise",
                price: "Custom",
                features: isInvestor
                  ? ["Dedicated Support", "Custom Integrations"]
                  : ["Deep Diligence", "Priority Support"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="p-6 rounded-2xl border border-gray-100 bg-white shadow-xs dark:bg-white/5 dark:border-white/5 flex flex-col"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                  {plan.price}
                </p>
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/pricing" className="w-full">
                  <button
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${plan.name === "Pro" ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400"}`}
                  >
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
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Privacy Policy
                </span>
                <ArrowUpRight
                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                  weight="bold"
                />
              </button>
            </Link>
            <Link href="/dashboard/privacy">
              <button className="text-left w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Data Terms & Usage
                </span>
                <ArrowUpRight
                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                  weight="bold"
                />
              </button>
            </Link>
          </div>
        </div>

        <div className="pt-6">
          <button
            onClick={async () => {
              setLoggingOut(true);
              try {
                await logout();
              } catch (e) {
                console.error(e);
              }
              window.location.href = "/";
            }}
            disabled={loggingOut}
            className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {loggingOut ? (
              <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
            ) : (
              <SignOut className="w-5 h-5" weight="bold" />
            )}
            <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
