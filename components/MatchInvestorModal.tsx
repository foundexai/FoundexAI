"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  const handleMatch = async () => {
    setStep("matching");

    // Simulate AI delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple matching logic
    const matched = investors.filter((inv) => {
      // 1. Match Sector (Check if investor focus includes the sector)
      const sectorMatch = inv.focus.some(
        (f) => f.toLowerCase() === formData.sector.toLowerCase(),
      );

      // 2. Match Stage (Check if investor type/stage aligns - simple heuristic)
      // For MVP, we assume VCs do Seed/Series A, Angels do Pre-seed.
      // But let's rely on description search if stage is unknown or just sector match for now.
      // Let's also check description for keywords.

      const keywordMatch =
        inv.description.toLowerCase().includes(formData.sector.toLowerCase()) ||
        inv.description.toLowerCase().includes(formData.stage.toLowerCase());

      return sectorMatch || keywordMatch;
    });

    setMatches(matched);
    setStep("results");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-3xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              AI Matchmaker
            </h2>
          </div>
          <p className="text-blue-100 font-medium">
            Find your perfect investor match instantly.
          </p>
        </div>

        {/* Body */}
        <div className="p-8 grow overflow-y-auto">
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
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    value={formData.sector}
                    onChange={(e) =>
                      setFormData({ ...formData, sector: e.target.value })
                    }
                  >
                    {[
                      "Fintech",
                      "Healthtech",
                      "SaaS",
                      "E-commerce",
                      "Edtech",
                      "Cleantech",
                      "AI/ML",
                      "Blockchain",
                      "Logistics",
                      "Agritech",
                      "Proptech",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Stage
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
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
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-lg hover:-translate-y-1"
                disabled={!formData.name || !formData.description}
              >
                <Sparkles className="w-5 h-5" />
                Find My Match
              </button>
            </div>
          )}

          {step === "matching" && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
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
                  <CheckCircle2 className="w-4 h-4" />
                  Found {matches.length} Matches
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Best Matches for {formData.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Based on your sector and stage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                {matches.length > 0 ? (
                  matches.map((inv) => (
                    <InvestorCard
                      key={inv.id}
                      investor={inv}
                      isSaved={false}
                      onToggleSave={() => {}}
                    />
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
      </DialogContent>
    </Dialog>
  );
}
