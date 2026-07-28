"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  CaretLeft,
  CircleNotch,
  Calendar,
  CurrencyDollar,
  Handshake,
  Compass,
  ArrowUpRight,
  Sliders,
  CheckCircle,
  Clock,
  Warning,
} from "@phosphor-icons/react";
import Link from "next/link";

interface MatchedGrant {
  _id: string;
  title: string;
  agency: string;
  description: string;
  amount: number;
  currency: string;
  deadline: string;
  url: string;
  matchScore: number;
  reasons: string[];
}

export default function SmartGrantsPage() {
  const { token, activeStartupId, startups } = useAuth();
  const [grants, setGrants] = useState<MatchedGrant[]>([]);
  const [loading, setLoading] = useState(true);

  const currentStartup = startups.find((s) => s._id === activeStartupId) || startups[0];

  useEffect(() => {
    if (token && activeStartupId) {
      fetchMatches();
    }
  }, [token, activeStartupId]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/match/grant?startup_id=${activeStartupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrants(data.matches || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch matched grants");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-zinc-800"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Smart Grant Matching
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Get matched to non-dilutive government and global federal grants matching your startup's sector, location, and stage.
            </p>
          </div>
        </div>

        {activeStartupId && currentStartup && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-yellow-700 dark:text-yellow-400">
              MATCHING FOR: {currentStartup.company_name.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
          </div>
        ) : grants.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grants.map((grant) => {
                const isExcellentMatch = grant.matchScore >= 80;
                return (
                  <div
                    key={grant._id}
                    className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col h-full hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          {grant.agency}
                        </span>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mt-1 leading-snug">
                          {grant.title}
                        </h3>
                      </div>

                      {/* Match Score Badge */}
                      <div className={`px-2.5 py-1 rounded-xl text-center border shrink-0 ${
                        isExcellentMatch
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : grant.matchScore >= 50
                          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : "bg-gray-100 border-gray-200 text-gray-500 dark:bg-zinc-900 dark:border-zinc-800"
                      }`}>
                        <span className="text-xs font-mono font-bold block">{grant.matchScore}%</span>
                        <span className="text-[8px] font-mono uppercase tracking-wider block">Match</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-zinc-450 leading-relaxed mb-5">
                      {grant.description}
                    </p>

                    {/* Meta Stats bar */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-xl text-xs mb-5 font-mono">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Grant Value</span>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {grant.currency === "EUR" ? "€" : grant.currency === "USD" ? "$" : `${grant.currency} `}
                          {grant.amount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Deadline</span>
                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {grant.deadline ? new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Open"}
                        </span>
                      </div>
                    </div>

                    {/* Match reasoning list */}
                    <div className="space-y-1.5 mb-6">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                        Matching Criteria Analysis
                      </span>
                      <div className="space-y-1 text-xs">
                        {grant.reasons.map((reason, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5 text-gray-600 dark:text-zinc-400 leading-normal">
                            <span className="text-emerald-500 shrink-0">✓</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {grant.url && (
                      <a
                        href={grant.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white text-[11px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all mt-auto"
                      >
                        Apply on Agency Site
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 max-w-xl mx-auto w-full">
            <Warning className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">No matches found</h3>
            <p className="text-gray-500 text-xs">Please make sure your startup sector, location, and stage are configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}
