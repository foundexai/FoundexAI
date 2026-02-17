"use client";

import { useState } from "react";
import { X, Sparkle, CircleNotch, CheckCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Investor } from "@/lib/data";
import { InvestorCard } from "./InvestorCard";
import { cn } from "@/lib/utils";

interface AIFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIFilterModal({
  isOpen,
  onClose,
}: AIFilterModalProps) {
  const [step, setStep] = useState<"input" | "searching" | "results">("input");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Investor[]>([]);
  const [matchReasons, setMatchReasons] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter what you're looking for");
      return;
    }

    setStep("searching");

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      
      const reasons: Record<string, string> = {};
      const matchedInvestors: Investor[] = [];

      (data.matches || []).forEach((m: any) => {
        if (m.investor) {
          matchedInvestors.push(m.investor);
          reasons[m.investor.id] = m.reason;
        }
      });

      setMatchReasons(reasons);
      setMatches(matchedInvestors);
      setStep("results");
    } catch (error) {
      console.error(error);
      toast.error("AI Search failed. Try again.");
      setStep("input");
    }
  };

  const reset = () => {
    setStep("input");
    setQuery("");
    setMatches([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-4xl bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20 dark:border-white/10">
        {/* Header */}
        {/* Header */}
        <div className="bg-white p-6 relative shrink-0 border-b border-gray-100 dark:bg-black dark:border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              AI Power Search
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Describe your ideal investor in natural language.
          </p>
        </div>

        {/* Body */}
        <div className="p-8 grow overflow-y-auto custom-scrollbar">
          {step === "input" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  What are you looking for?
                </label>
                <div className="relative">
                    <textarea
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none min-h-[150px] dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-lg placeholder:text-gray-400"
                        placeholder="e.g. Find me investors in Lagos who focus on early-stage fintech and have a check size between $50k and $200k..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-zinc-900/20 flex items-center justify-center gap-2 text-lg hover:-translate-y-1 active:scale-[0.98]"
                disabled={!query.trim()}
              >
                <MagnifyingGlass className="w-5 h-5" weight="bold" />
                Search with AI
              </button>
              
              <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest w-full mb-1">Try searching for:</span>
                  {["Fintech in Nigeria", "Healthtech Series A", "Angel investors for SaaS", "Logistics focus in East Africa"].map(suggestion => (
                      <button 
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                          {suggestion}
                      </button>
                  ))}
              </div>
            </div>
          )}

          {step === "searching" && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-100 border-t-zinc-900 animate-spin dark:border-zinc-800 dark:border-t-white"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkle className="w-8 h-8 text-zinc-900 dark:text-white animate-pulse" weight="bold" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Searching the database...
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Finding the most relevant investors for your query.
                </p>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                        Search Results
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Showing top 3 matches for your query.
                    </p>
                </div>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 text-sm"
                >
                    New Search
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto p-1 custom-scrollbar">
                {matches.length > 0 ? (
                  matches.map((inv) => (
                    <div key={inv.id} className="flex flex-col gap-3">
                      <InvestorCard
                        investor={inv}
                        isSaved={false}
                        onToggleSave={() => {}}
                      />
                      {matchReasons[inv.id] && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-sm text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2 leading-relaxed shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkle className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" weight="fill" />
                            <span className="font-black uppercase tracking-wider text-[10px]">AI Match Rationale</span>
                          </div>
                          {matchReasons[inv.id]}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl dark:border-zinc-800">
                    No matches found for this query. Try being less specific.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
