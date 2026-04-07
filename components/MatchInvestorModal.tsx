"use client";

import { useState } from "react";
import { X, Sparkle, CircleNotch, CheckCircle, CaretDown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { MOCK_INVESTORS, Investor } from "@/lib/data";
import { InvestorCard } from "./InvestorCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface MatchInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* 
   * Passed from parent to include real data 
   */
  investors: Investor[]; 
}

export function MatchInvestorModal({
  isOpen,
  onClose,
  investors,
}: MatchInvestorModalProps) {
  const { startups } = useAuth();
  const [step, setStep] = useState<"input" | "matching" | "results">("input");
  const [selectedStartupId, setSelectedStartupId] = useState<string>("manual");
  const [formData, setFormData] = useState({
    name: "",
    sector: "Fintech",
    stage: "Pre-seed",
    description: "",
  });
  const [matches, setMatches] = useState<Investor[]>([]);
  const [matchReasons, setMatchReasons] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleMatch = async () => {
    setStep("matching");

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to fetch matches");

      const data = await res.json();
      // data.matches = [{ investor, reason }]

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
      toast.error("AI Matching failed. Try again.");
      setStep("input");
    }
  };

  const reset = () => {
    setStep("input");
    setSelectedStartupId("manual");
    setFormData({
      name: "",
      sector: "Fintech",
      stage: "Pre-seed",
      description: "",
    });
    setMatches([]);
  };

  const handleStartupSelect = (startupId: string) => {
    setSelectedStartupId(startupId);
    if (startupId === "manual") {
       setFormData({
         name: "",
         sector: "Fintech",
         stage: "Pre-seed",
         description: "",
       });
       return;
    }

    const startup = startups.find(s => s._id === startupId);
    if (startup) {
      setFormData({
        name: startup.company_name,
        sector: startup.sector || "Fintech",
        stage: "Pre-seed", // Default as stage is not on startup object yet
        description: startup.business_description || "",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-4xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/40 dark:border-white/5">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-yellow-500">
                {/* <Sparkle weight="fill" className="w-5 h-5" /> */}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Foundex Intelligence</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
              AI Matchmaker
            </h2>
            <p className="text-gray-500 font-medium text-sm dark:text-gray-400">
              Find your perfect investor match based on our global ecosystem.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-8 grow overflow-y-auto custom-scrollbar">
          {step === "input" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-4">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Select Profile */}
                <div className="lg:col-span-12">
                   {startups.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Select Existing Profile
                      </label>
                      <div className="relative group">
                        <select
                          className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 focus:outline-none dark:bg-black/40 dark:border-zinc-800 dark:text-white transition-all cursor-pointer"
                          value={selectedStartupId}
                          onChange={(e) => handleStartupSelect(e.target.value)}
                        >
                          <option value="manual">Enter Manually</option>
                          {startups.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.company_name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-yellow-500 transition-colors">
                          <CaretDown className="w-4 h-4" weight="bold" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Form Fields */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Startup Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 focus:outline-none dark:bg-black/50 dark:border-zinc-800 dark:text-white transition-all text-sm"
                      placeholder="e.g. Acme FinTech"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Sector
                      </label>
                      <div className="relative group">
                        <select
                          className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 focus:outline-none dark:bg-black/50 dark:border-zinc-800 dark:text-white transition-all text-sm cursor-pointer"
                          value={formData.sector}
                          onChange={(e) =>
                            setFormData({ ...formData, sector: e.target.value })
                          }
                        >
                          {[
                            "Adtech", "Agriculture", "AI/ML", "Biotech", "Blockchain", "Cleantech", "Cybersecurity", "E-commerce", "Edtech", "Energy", "Entertainment", "Fintech", "Foodtech", "Gaming", "Healthtech", "IoT", "Logistics", "Marketplace", "Proptech", "SaaS", "Social Impact", "Sustainability", "Travel"
                          ].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-yellow-500 transition-colors">
                          <CaretDown className="w-3.5 h-3.5" weight="bold" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Funding Stage
                      </label>
                      <div className="relative group">
                        <select
                          className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 focus:outline-none dark:bg-black/50 dark:border-zinc-800 dark:text-white transition-all text-sm cursor-pointer"
                          value={formData.stage}
                          onChange={(e) =>
                            setFormData({ ...formData, stage: e.target.value })
                          }
                        >
                          {["Pre-seed", "Seed", "Series A", "Series B+", "Growth"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-yellow-500 transition-colors">
                          <CaretDown className="w-3.5 h-3.5" weight="bold" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Description */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Value Proposition
                  </label>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 font-medium focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 focus:outline-none min-h-[170px] lg:h-[135px] dark:bg-black/50 dark:border-zinc-800 dark:text-white transition-all text-sm leading-relaxed resize-none"
                    placeholder="Describe your solution and the problem you are solving..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end">
                <button
                    onClick={handleMatch}
                    className="group px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 text-base dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
                    disabled={!formData.name || !formData.description}
                >
                    <span>Analyze & Match</span>
                    <Sparkle className="w-5 h-5 group-hover:rotate-12 transition-transform text-yellow-500" weight="fill" />
                </button>
              </div>
            </div>
          )}

          {step === "matching" && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 rounded-4xl bg-yellow-400/10 flex items-center justify-center relative border border-yellow-400/20">
                    <Sparkle className="w-10 h-10 text-yellow-500 animate-pulse" weight="fill" />
                    <div className="absolute inset-0 rounded-4xl border-t-2 border-yellow-400 animate-spin"></div>
                </div>
              </div>
              <div className="max-w-xs">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  Consulting Sophia...
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Our intelligence engine is analyzing your profile against 5,000+ global investment thesis patterns.
                </p>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full font-black text-[10px] uppercase tracking-wider mb-3 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20">
                    <CheckCircle className="w-3 h-3" weight="bold" />
                    Analysis Complete
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                    Optimal <span className="text-yellow-500">Matches</span>
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Found {matches.length} investors whose thesis aligns with your roadmap.
                  </p>
                </div>
                
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all font-bold rounded-2xl text-xs uppercase tracking-widest dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 border border-transparent hover:border-gray-300 dark:hover:border-zinc-700"
                >
                  New Search
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto px-1 py-1 custom-scrollbar">
                {matches.length > 0 ? (
                  matches.map((inv) => (
                    <div key={inv.id} className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-gray-50/50 dark:bg-black/40 rounded-[2.5rem] p-3 border border-gray-100 dark:border-white/5 transition-all hover:border-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/5 group h-full flex flex-col">
                        <div className="shrink-0">
                          <InvestorCard
                            investor={inv}
                            isSaved={false}
                            onToggleSave={() => {}}
                            variant="mini"
                          />
                        </div>
                        
                        {matchReasons[inv.id] && (
                          <div className="px-3 pb-3 pt-1 mt-auto">
                             <div className="relative p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden group-hover:border-yellow-500/20 transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/20 group-hover:bg-yellow-500 transition-colors"></div>
                                <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                  <Sparkle className="w-3 h-3" weight="fill" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Match Analysis</span>
                                </div>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                  {matchReasons[inv.id]}
                                </p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20 bg-gray-50/50 dark:bg-black/20 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-zinc-800">
                       <Sparkle className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No exact matches</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
                      Sophia couldn't find a direct match. Try expanding your value proposition description.
                    </p>
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
