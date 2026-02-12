"use client";

import { useState } from "react";
import { X, Sparkle, CircleNotch, CheckCircle, CaretDown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { MOCK_INVESTORS, Investor } from "@/lib/data";
import { InvestorCard } from "./InvestorCard";
import { cn } from "@/lib/utils";

interface MatchInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investors: Investor[]; // Passed from parent to include real data
}

export function MatchInvestorModal({
  isOpen,
  onClose,
  investors,
}: MatchInvestorModalProps) {
  const [step, setStep] = useState<"input" | "matching" | "results">("input");
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
    setFormData({
      name: "",
      sector: "Fintech",
      stage: "Pre-seed",
      description: "",
    });
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
        <div className="bg-yellow-400 p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              AI Matchmaker
            </h2>
          </div>
          <p className="text-blue-100 font-medium">
            Find your perfect investor match instantly.
          </p>
        </div>

        {/* Body */}
        <div className="p-8 grow overflow-y-auto custom-scrollbar">
          {step === "input" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    placeholder="Type your startup name..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sector
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                      value={formData.sector}
                      onChange={(e) =>
                        setFormData({ ...formData, sector: e.target.value })
                      }
                    >
                      {[
                        "Adtech",
                        "Agriculture",
                        "Agritech",
                        "AI/ML",
                        "Automotive",
                        "Aviation",
                        "Biotech",
                        "Blockchain",
                        "Circular Economy",
                        "Cleantech",
                        "Construction",
                        "Consumer Electronics",
                        "Cybersecurity",
                        "Data & Analytics",
                        "Deeptech",
                        "Defense",
                        "Design",
                        "Direct-to-Consumer (DTC)",
                        "E-commerce",
                        "Edtech",
                        "Energy",
                        "Enterprise",
                        "Entertainment",
                        "Environment",
                        "Events",
                        "Fashion",
                        "Fintech",
                        "Foodtech",
                        "Gaming",
                        "Govtech",
                        "Hardware",
                        "Healthtech",
                        "HRtech",
                        "IoT",
                        "Insurtech",
                        "Legaltech",
                        "Logistics",
                        "Manufacturing",
                        "Marine",
                        "Marketplace",
                        "Marketing",
                        "Media",
                        "Mining",
                        "Mobility",
                        "Nanotechnology",
                        "Network Security",
                        "Non-profit",
                        "Other",
                        "Proptech",
                        "Real Estate",
                        "Retail",
                        "Robotics",
                        "SaaS",
                        "Security",
                        "Smart City",
                        "Smart Home",
                        "Social Media",
                        "Social Impact",
                        "Software",
                        "Space",
                        "Sports",
                        "Supply Chain",
                        "Sustainability",
                        "Technology",
                        "Telecommunications",
                        "Transportation",
                        "Travel",
                        "Virtual Reality (VR)",
                        "Wearables",
                        "Wellness",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <CaretDown className="w-4 h-4" weight="bold" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Stage
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData({ ...formData, stage: e.target.value })
                      }
                    >
                      {[
                        "Pre-seed",
                        "Seed",
                        "Series A",
                        "Series B+",
                        "Growth",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <CaretDown className="w-4 h-4" weight="bold" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Short Description
                </label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                  placeholder="Describe what you do in a few sentences..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <button
                onClick={handleMatch}
                className="w-full py-4 bg-yellow-400 text-white font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 text-lg hover:-translate-y-1"
                disabled={!formData.name || !formData.description}
              >
                Find My Match
              </button>
            </div>
          )}

          {step === "matching" && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkle className="w-8 h-8 text-blue-600 animate-pulse" weight="bold" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Analyzing your startup...
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Scanning our database for the best fit.
                </p>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm mb-4 dark:bg-green-500/20 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" weight="bold" />
                  Found {matches.length} Matches
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Best Matches for <span className="text-yellow-500">{formData.name}</span>
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Based on your sector and stage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                {matches.length > 0 ? (
                  matches.map((inv) => (
                    <div key={inv.id} className="relative group">
                      <InvestorCard
                        investor={inv}
                        isSaved={false}
                        onToggleSave={() => {}}
                      />
                      {matchReasons[inv.id] && (
                        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 leading-relaxed shadow-sm">
                          <div className="flex gap-2 mb-1">
                            <Sparkle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" weight="bold" />
                            <span className="font-bold">AI Analysis:</span>
                          </div>
                          {matchReasons[inv.id]}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl dark:border-zinc-800">
                    No exact matches found. Try broadening your description.
                  </div>
                )}
              </div>

              <button
                onClick={reset}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Search Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
