"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = () => {
    setNotified(true);
    toast.success("Sophia will notify you when the Intelligence Hub goes live!");
  };

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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight sm:text-5xl">
          Reports
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          Explore industry reports and live market data across emerging ecosystems.
        </p>
      </div>

      {/* Main Feature Section */}
      <div className="glass-card relative overflow-hidden rounded-[2.5rem] border border-white/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-yellow-500/5 group">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Content side */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Intelligence Hub
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                Data-Driven Insights for the New Century
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-xl">
                Access downloadable PDF reports and an interactive data dashboard covering industries, companies, and recent deals. Track funding rounds, investors, sector trends, and market activity in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-yellow-600 dark:text-yellow-500 group-hover/item:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a12,12,0,1,1-12,12A12,12,0,0,1,176,88Zm-96,64a12,12,0,1,1,12-12A12,12,0,0,1,80,152Z"></path></svg>
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-300">Live Market Data</span>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-yellow-600 dark:text-yellow-500 group-hover/item:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Zm-16,160V48H48V208H208Zm-48-88H96V104h64Zm0,32H96v16h64ZM96,72h64V88H96Z"></path></svg>
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-300">PDF Industry Reports</span>
              </div>
            </div>
          </div>

          {/* Visual Side */}
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="relative w-full max-w-[340px] aspect-square">
              {/* Graphic Placeholder Style */}
              <div className="absolute inset-0 bg-linear-to-br from-yellow-400/20 to-orange-500/20 rounded-[3rem] rotate-6 scale-95" />
              <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-[3rem] shadow-2xl flex flex-col p-8 overflow-hidden group-hover:rotate-0 transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H128V80a8,8,0,0,1,16,0v48h16A8,8,0,0,1,176,128Z"></path></svg>
                  </div>
                  <div className="flex gap-1 overflow-hidden">
                    <div className="w-2 h-8 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <div className="w-2 h-12 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
                    <div className="w-2 h-6 bg-yellow-300 rounded-full animate-bounce [animation-delay:-0.1s]" />
                  </div>
                </div>
                <div className="space-y-3 mt-auto">
                  <div className="h-2 w-3/4 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="h-2 w-1/2 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 bg-gray-50/50 dark:bg-white/5 border-t border-white/50 dark:border-zinc-800/50 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 italic">
            * Complete Intelligent Suite coming to your dashboard soon
          </p>
          <button 
            onClick={handleNotifyMe}
            disabled={notified}
            className={`px-6 py-2.5 font-bold rounded-xl transition-all shadow-xl active:scale-95 ${
              notified 
                ? "bg-green-500 text-white dark:bg-green-600 cursor-default" 
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 shadow-gray-900/10 dark:shadow-white/5 cursor-pointer"
            }`}
          >
            {notified ? "You're on the list" : "Notify Me"}
          </button>
        </div>
      </div>
    </div>
  );
}
