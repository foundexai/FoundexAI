"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlass, FadersHorizontal, Trash, ChatCircleDots, X, PaperPlaneTilt, CircleNotch, ArrowRight, RocketLaunch } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SavedInvestor {
  id: string;
  name: string;
  website: string;
  type: string;
  location: string;
  investmentRange: string;
  // New Fields
  last_investment?: string;
  actively_deploying?: boolean;
  match_count?: number;
  status?: "Not Contacted" | "Emailed" | "In Conversation" | "Due Diligence";
}

export default function SelectedInvestors() {
  const { user, token, refreshUser } = useAuth();
  const [investors, setInvestors] = useState<SavedInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatInvestor, setSelectedChatInvestor] = useState<SavedInvestor | null>(null);

  useEffect(() => {
    async function fetchSaved() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch("/api/investors/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInvestors(data.investors || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [user, token]);

  const handleRemove = async (id: string) => {
    // Optimistic
    setInvestors((prev) => prev.filter((inv) => inv.id !== id));

    try {
      await fetch("/api/investors/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId: id }),
      });
      toast.success("Removed investor");
      if (refreshUser) refreshUser(); // Update context
    } catch (e) {
      toast.error("Failed to remove");
    }
  };

  if (!loading && investors.length === 0) return null; 

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/50 mt-8 dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight dark:text-white">
            Selected Investors
          </h2>
          <p className="text-gray-500 text-sm font-medium dark:text-gray-400">
            Manage your shortlist and track outreach progress.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search shortlist..."
                    className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 outline-none transition-all w-full md:w-64 dark:bg-white/5 dark:border-zinc-800 dark:text-gray-300"
                />
            </div>
            <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 hover:shadow-sm transition-all dark:bg-white/5 dark:border-zinc-800 dark:text-gray-400 dark:hover:text-white">
                <FadersHorizontal className="w-5 h-5" weight="bold" />
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px] md:min-w-0">
          <thead>
            <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
              <th className="pb-4 pl-4 min-w-[200px]">Investor's Name</th>
              <th className="pb-4 min-w-[140px]">Activity</th>
              <th className="pb-4 min-w-[180px]">Portfolio Insight</th>
              <th className="pb-4 min-w-[100px]">Category</th>
              <th className="pb-4 min-w-[120px]">Location</th>
              <th className="pb-4 pr-4 text-right min-w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
            {investors.map((inv) => (
              <tr
                key={inv.id}
                className="group hover:bg-gray-50/50 transition-colors dark:hover:bg-white/5"
              >
                <td className="py-4 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-400 shadow-md shadow-yellow-500/20 shrink-0 text-white font-black text-xs">
                        {inv.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-200 block whitespace-nowrap">
                        {inv.name}
                      </span>
                      <a
                        href={inv.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-xs font-medium block truncate max-w-[120px]"
                      >
                        {inv.website
                          ? inv.website
                              .replace("https://", "")
                              .replace("www.", "")
                              .split("/")[0]
                          : "N/A"}
                      </a>
                    </div>
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inv.actively_deploying ? "bg-green-400" : "bg-gray-400"}`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${inv.actively_deploying ? "bg-green-500" : "bg-gray-500"}`}
                        ></span>
                      </span>
                      {inv.actively_deploying ? "Active" : "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Last inv. 3mo ago
                    </span>
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50"
                    title="Based on sector and stage match"
                  >
                    <span className="text-xs font-bold">
                      Resembles {inv.match_count} portfolio cos
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 max-w-[160px] truncate">
                    Fintech focus • Africa 1st
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                    {inv.type}
                  </span>
                </td>
                <td className="py-4 text-gray-500 text-sm dark:text-gray-400 whitespace-nowrap">
                  {inv.location}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRemove(inv.id)}
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedChatInvestor(inv)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 p-2 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20 cursor-pointer"
                      title="Chat with Investor"
                    >
                      <ChatCircleDots weight="bold" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 p-4 rounded-3xl bg-gray-50/50 border border-gray-100 dark:bg-black/20 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center dark:bg-zinc-800">
                    <RocketLaunch className="w-6 h-6 text-yellow-500" weight="bold" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Track your Deal Flow</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage outreach status and move deals across the pipeline.</p>
                </div>
            </div>
            <Link 
                href="/dashboard/pipeline"
                className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 dark:hover:bg-gray-400 hover:bg-gray-100 hover:text-black dark:hover:text-black transition-all shadow-xl dark:bg-white dark:text-black"
            >
                Manage Deal Pipeline
                <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-400">
            <CircleNotch className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading saved investors...
          </div>
        )}

        {!loading && investors.length === 0 && (
          <div className="text-center py-10 text-gray-400 italic">
            No investors selected yet. Go to Database to add some.
          </div>
        )}
      </div>

      {/* Premium Chat Overlay */}
        {selectedChatInvestor && (
            <div className="fixed inset-0 z-50 flex items-center justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" 
                    onClick={() => setSelectedChatInvestor(null)}
                />
                
                {/* Chat Panel */}
                <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-900 shadow-2xl animate-in slide-in-from-right duration-500 border-l border-white/20 dark:border-zinc-800 flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-white font-black shadow-lg shadow-yellow-500/20">
                                {selectedChatInvestor.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white tracking-tight">
                                    {selectedChatInvestor.name}
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    Investor Communication
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedChatInvestor(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400"
                        >
                            <X className="w-6 h-6" weight="bold" />
                        </button>
                    </div>

                    {/* Chat Body - Coming Soon */}
                    <div className="grow flex flex-col items-center justify-center p-12 text-center space-y-8">
                        {/* Premium Infographic */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse group-hover:bg-yellow-400/30 transition-all duration-700" />
                            <div className="relative w-32 h-32 bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-gray-100 dark:border-white/5 transform group-hover:scale-110 transition-transform duration-500">
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black animate-bounce shadow-xl">
                                    <PaperPlaneTilt weight="bold" className="w-4 h-4" />
                                </div>
                                <ChatCircleDots className="w-16 h-16 text-yellow-500" weight="fill" />
                            </div>
                            
                            {/* Decorative elements */}
                            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500/10 rounded-2xl blur-xl" />
                            <div className="absolute top-1/2 -right-8 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl" />
                        </div>

                        <div className="space-y-4 relative">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                One-Click <br />
                                <span className="text-yellow-600 dark:text-yellow-500">Investor Outreach</span>
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium leading-relaxed max-w-xs mx-auto">
                                We are building a high-fidelity communication bridge between startups and investors.
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-bold uppercase tracking-widest shadow-sm">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            Coming Soon
                        </div>
                    </div>

                    {/* Footer - Disabled Input */}
                    <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-black/10">
                        <div className="relative opacity-50">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 animate-pulse [animation-delay:-0.2s]" />
                            </div>
                            <input 
                                disabled
                                type="text" 
                                placeholder="Messaging disabled for early access..."
                                className="w-full pl-28 pr-4 py-4 bg-white dark:bg-zinc-800 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

