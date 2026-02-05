"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, LayoutGrid, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StartupSwitcher() {
  const { startups, activeStartupId, setActiveStartupId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeStartup = startups.find((s) => s._id === activeStartupId) || startups[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeStartup) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-white/40 border border-white/50 backdrop-blur-md hover:bg-white/60 hover:shadow-lg transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 group"
      >
        <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
          {activeStartup.company_name.charAt(0)}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider dark:text-yellow-500">
            Active Profile
          </p>
          <h3 className="text-sm font-black text-gray-900 truncate max-w-[120px] dark:text-white">
            {activeStartup.company_name}
          </h3>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 glass-card border border-white/50 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 dark:bg-zinc-900/95 dark:border-zinc-800">
          <div className="px-4 py-2 border-b border-gray-100 mb-2 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              My Startups
            </p>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
            {startups.map((startup) => (
              <button
                key={startup._id}
                onClick={() => {
                  setActiveStartupId(startup._id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center w-full gap-3 p-3 rounded-xl transition-all duration-200 group text-left",
                  activeStartupId === startup._id 
                    ? "bg-yellow-50 dark:bg-yellow-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm",
                  activeStartupId === startup._id ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400"
                )}>
                  {startup.company_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold truncate",
                    activeStartupId === startup._id ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {startup.company_name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {startup.sector || "General"}
                  </p>
                </div>
                {activeStartupId === startup._id && (
                  <Check className="w-4 h-4 text-yellow-500" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 px-2">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all dark:text-gray-400 dark:hover:bg-white/5"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">Manage Profiles</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
