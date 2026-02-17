"use client";

import { useAuth } from "@/context/AuthContext";
import { CircleNotch } from "@phosphor-icons/react";

export default function ReportsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <CircleNotch className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!user) {
     return null; 
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Reports
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View analytics and insights about your startup ecosystem.
        </p>
      </div>

      <div className="glass-card p-12 rounded-3xl border border-white/50 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="currentColor"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96V128H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h48V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Coming Soon
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          We are building powerful reporting tools to help you track performance and growth. Check back later!
        </p>
      </div>
    </div>
  );
}
