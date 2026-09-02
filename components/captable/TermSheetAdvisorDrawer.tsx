"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Sparkle,
  CircleNotch,
  Copy,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  CurrencyDollar,
  Percent,
  Scales,
  Lightbulb,
  FileText,
  Sliders,
  ArrowRight,
  Handshake,
  TrendUp,
  Fire,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClauseRisk {
  clause: string;
  status: "safe" | "warning" | "danger";
  riskExplanation: string;
  recommendedFix: string;
}

interface CounterProposal {
  issue: string;
  currentTerm: string;
  proposedCounterTerm: string;
  rationaleScript: string;
}

interface EvaluationResult {
  dealScore: number;
  valuationSanityScore: number;
  verdict: string;
  effectivePreMoney: number;
  dilutionBreakdown: {
    investorOwnershipPct: number;
    founderOwnershipPct: number;
    optionPoolPct: number;
    effectiveValuationDropPct: number;
  };
  clauseRisks: ClauseRisk[];
  counterProposalStrategy: CounterProposal[];
  executiveSummary: string;
  leverageAssessment: string;
}

const PRESETS = [
  {
    name: "Standard YC SAFE",
    securityType: "Post-Money SAFE",
    preMoneyValuation: 6000000,
    investmentAmount: 500000,
    liquidationPreference: "1x Non-Participating",
    antiDilution: "None (Standard SAFE)",
    optionPoolUnallocatedPct: 0,
    optionPoolTiming: "Post-Money (Shared Dilution)",
    founderVestingReset: false,
  },
  {
    name: "Tier-1 Seed Round",
    securityType: "Series Seed Preferred",
    preMoneyValuation: 8000000,
    investmentAmount: 2000000,
    liquidationPreference: "1x Non-Participating",
    antiDilution: "Broad-Based Weighted Average",
    optionPoolUnallocatedPct: 10,
    optionPoolTiming: "Pre-Money (Founder Dilution)",
    founderVestingReset: false,
  },
  {
    name: "Predatory VC Term Sheet",
    securityType: "Series A Preferred",
    preMoneyValuation: 4000000,
    investmentAmount: 2000000,
    liquidationPreference: "2x Participating Preferred",
    antiDilution: "Full Ratchet Anti-Dilution",
    optionPoolUnallocatedPct: 15,
    optionPoolTiming: "Pre-Money (Founder Dilution)",
    founderVestingReset: true,
  },
];

export default function TermSheetAdvisorDrawer({
  isOpen,
  onClose,
  activeStartupId,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeStartupId?: string;
}) {
  const { token } = useAuth();
  const [preMoneyValuation, setPreMoneyValuation] = useState(6000000);
  const [investmentAmount, setInvestmentAmount] = useState(1500000);
  const [securityType, setSecurityType] = useState("Series Seed Preferred");
  const [liquidationPreference, setLiquidationPreference] = useState("1x Non-Participating");
  const [antiDilution, setAntiDilution] = useState("Broad-Based Weighted Average");
  const [optionPoolUnallocatedPct, setOptionPoolUnallocatedPct] = useState(10);
  const [optionPoolTiming, setOptionPoolTiming] = useState("Pre-Money (Founder Dilution)");
  const [founderVestingReset, setFounderVestingReset] = useState(false);
  const [notes, setNotes] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setPreMoneyValuation(preset.preMoneyValuation);
    setInvestmentAmount(preset.investmentAmount);
    setSecurityType(preset.securityType);
    setLiquidationPreference(preset.liquidationPreference);
    setAntiDilution(preset.antiDilution);
    setOptionPoolUnallocatedPct(preset.optionPoolUnallocatedPct);
    setOptionPoolTiming(preset.optionPoolTiming);
    setFounderVestingReset(preset.founderVestingReset);
    toast.info(`Applied template: ${preset.name}`);
  };

  const handleAnalyze = async () => {
    if (!token) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/term-sheet-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeStartupId || "",
        },
        body: JSON.stringify({
          startupId: activeStartupId,
          preMoneyValuation,
          investmentAmount,
          securityType,
          liquidationPreference,
          antiDilution,
          optionPoolUnallocatedPct,
          optionPoolTiming,
          founderVestingReset,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setResult(data.evaluation);
      toast.success("Term Sheet analysis completed!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze term sheet");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0E0E11] w-full max-w-4xl h-full flex flex-col border-l border-gray-200 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black">
              <Scales className="w-6 h-6" weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                AI Term Sheet Negotiation Advisor
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-md">
                  Venture Legal AI
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Stress-test valuations, detect predatory clauses, and calculate the Option Pool Shuffle impact.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 thin-scrollbar">
          {/* Preset Chips */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Quick Load Benchmark Templates:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
                >
                  ⚡ {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-200/60 dark:border-zinc-800">
            {/* Pre-Money Valuation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Stated Pre-Money Valuation ($)
              </label>
              <input
                type="number"
                value={preMoneyValuation}
                onChange={(e) => setPreMoneyValuation(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>

            {/* Investment Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Investment Amount ($)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>

            {/* Security Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Security Structure
              </label>
              <select
                value={securityType}
                onChange={(e) => setSecurityType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="Post-Money SAFE">Post-Money SAFE (Standard)</option>
                <option value="Convertible Note">Convertible Promissory Note</option>
                <option value="Series Seed Preferred">Series Seed Preferred Equity</option>
                <option value="Series A Preferred">Series A Preferred Equity</option>
              </select>
            </div>

            {/* Liquidation Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Liquidation Preference
              </label>
              <select
                value={liquidationPreference}
                onChange={(e) => setLiquidationPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="1x Non-Participating">1x Non-Participating (Standard / Fair)</option>
                <option value="1x Participating">1x Participating ("Double Dip" - High Risk)</option>
                <option value="2x Participating">2x Participating Preferred (Predatory)</option>
                <option value="1x Non-Participating with Cap">1x Participating with 2x Cap</option>
              </select>
            </div>

            {/* Anti-Dilution Clause */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Anti-Dilution Protection
              </label>
              <select
                value={antiDilution}
                onChange={(e) => setAntiDilution(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="Broad-Based Weighted Average">Broad-Based Weighted Average (Market Standard)</option>
                <option value="Narrow-Based Weighted Average">Narrow-Based Weighted Average</option>
                <option value="Full Ratchet Anti-Dilution">Full Ratchet (Toxic / Founder Hazard)</option>
                <option value="None (Standard SAFE)">None / Standard SAFE</option>
              </select>
            </div>

            {/* Option Pool Shuffle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Unallocated ESOP Pool Timing & Size ({optionPoolUnallocatedPct}%)
              </label>
              <select
                value={optionPoolTiming}
                onChange={(e) => setOptionPoolTiming(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="Pre-Money (Founder Dilution)">Pre-Money (Stealth Founder Dilution)</option>
                <option value="Post-Money (Shared Dilution)">Post-Money (Shared Dilution)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <CircleNotch className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkle className="w-4 h-4" weight="fill" />
              )}
              <span>Analyze Term Sheet & Redlines</span>
            </button>
          </div>

          {/* Evaluation Results */}
          {result && (
            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in duration-500">
              {/* Top Score Summary Banner */}
              <div className="p-6 bg-yellow-50/50 dark:bg-zinc-900 rounded-3xl border border-yellow-200/80 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                    Deal Evaluation Verdict
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                    {result.verdict}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
                    {result.executiveSummary}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center p-3 bg-white dark:bg-zinc-800/90 rounded-2xl border border-gray-200/60 dark:border-zinc-700">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Deal Score</span>
                    <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 mt-0.5">
                      {result.dealScore}/100
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-zinc-800/90 rounded-2xl border border-gray-200/60 dark:border-zinc-700">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Valuation Sanity</span>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {result.valuationSanityScore}/100
                    </p>
                  </div>
                </div>
              </div>

              {/* True Dilution / Option Pool Shuffle Card */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-yellow-500" weight="bold" />
                  The "Option Pool Shuffle" Dilution Breakdown
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/40 dark:border-zinc-700/40">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Stated Pre-Money</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                      ${preMoneyValuation.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Effective Pre-Money</span>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-400 mt-1">
                      ${result.effectivePreMoney.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/40 dark:border-zinc-700/40">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Investor Ownership</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                      {result.dilutionBreakdown.investorOwnershipPct}%
                    </p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Effective Founder Stake</span>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {result.dilutionBreakdown.founderOwnershipPct}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Clause Risk Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Term Sheet Clause Risk Matrix:
                </h4>
                <div className="space-y-2.5">
                  {result.clauseRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all",
                        risk.status === "danger"
                          ? "bg-red-50/50 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/50"
                          : risk.status === "warning"
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50"
                          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {risk.status === "danger" ? (
                            <WarningCircle className="w-4 h-4 text-red-500" weight="fill" />
                          ) : risk.status === "warning" ? (
                            <WarningCircle className="w-4 h-4 text-amber-500" weight="fill" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                          )}
                          <span className="text-xs font-black text-gray-900 dark:text-white">
                            {risk.clause}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                          {risk.riskExplanation}
                        </p>
                      </div>

                      <div className="sm:max-w-xs p-2.5 bg-white dark:bg-zinc-800/90 rounded-xl border border-gray-200/60 dark:border-zinc-700/60 text-[11px] font-semibold text-gray-800 dark:text-gray-200 shrink-0">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold block mb-0.5">Recommended Redline:</span>
                        {risk.recommendedFix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter-Proposal Battle Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Founder Counter-Proposal Redline Scripts:
                </h4>
                <div className="space-y-3">
                  {result.counterProposalStrategy.map((cp, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          Term: {cp.issue}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cp.rationaleScript);
                            toast.success("Negotiation script copied!");
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Script
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200/40 dark:border-red-900/40">
                          <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 block">Investor Ask:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{cp.currentTerm}</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/40 dark:border-emerald-900/40">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Proposed Redline:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{cp.proposedCounterTerm}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">
                        "{cp.rationaleScript}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
