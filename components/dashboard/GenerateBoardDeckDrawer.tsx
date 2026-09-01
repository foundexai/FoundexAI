"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Sparkle,
  CircleNotch,
  Copy,
  Download,
  Presentation,
  CheckCircle,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  TrendUp,
  FileText,
  ArrowsOutLineHorizontal,
  Coins,
  Hourglass,
  Lightbulb,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Slide {
  slideNumber: number;
  title: string;
  category: string;
  keyPoints: string[];
  metrics: Array<{ label: string; value: string }>;
  speakerNotes: string;
  resolutionsOrDecisions?: string;
}

interface BoardDeck {
  deckTitle: string;
  quarter: string;
  executiveSummary: string;
  financialSnapshot: {
    arr: string;
    mrr: string;
    cashOnHand: string;
    monthlyBurn: string;
    runwayMonths: string;
  };
  slides: Slide[];
}

export default function GenerateBoardDeckDrawer({
  isOpen,
  onClose,
  activeStartupId,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeStartupId?: string;
}) {
  const { token } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [deck, setDeck] = useState<BoardDeck | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [focusArea, setFocusArea] = useState("Quarterly Review & Governance");
  const [quarter, setQuarter] = useState("Q4 2026");

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen && !deck) {
      handleGenerateDeck();
    }
  }, [isOpen]);

  const handleGenerateDeck = async () => {
    if (!token) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/board-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeStartupId || "",
        },
        body: JSON.stringify({
          startupId: activeStartupId,
          focus: focusArea,
          quarter,
        }),
      });

      if (!res.ok) throw new Error("Failed to synthesize board deck");
      const data = await res.json();
      setDeck(data.deck);
      setActiveSlideIndex(0);
      toast.success("10-Slide Board Deck Synthesized!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate board deck");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCurrentSlide = () => {
    if (!deck || !deck.slides[activeSlideIndex]) return;
    const slide = deck.slides[activeSlideIndex];
    const text = `# Slide ${slide.slideNumber}: ${slide.title}\nCategory: ${slide.category}\n\n## Key Points\n${slide.keyPoints.map((p) => `- ${p}`).join("\n")}\n\n## Key Metrics\n${slide.metrics.map((m) => `- ${m.label}: ${m.value}`).join("\n")}\n\n## Speaker Notes\n${slide.speakerNotes}\n\n${slide.resolutionsOrDecisions ? `## Board Decision\n${slide.resolutionsOrDecisions}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success(`Slide ${slide.slideNumber} copied to clipboard!`);
  };

  const downloadFullDeck = () => {
    if (!deck) return;
    let md = `# ${deck.deckTitle}\n**Quarter:** ${deck.quarter}\n\n## Executive Summary\n${deck.executiveSummary}\n\n---\n\n`;
    deck.slides.forEach((slide) => {
      md += `### Slide ${slide.slideNumber}: ${slide.title}\n*Category: ${slide.category}*\n\n**Key Points:**\n${slide.keyPoints.map((p) => `- ${p}`).join("\n")}\n\n**Metrics:**\n${slide.metrics.map((m) => `- **${m.label}**: ${m.value}`).join("\n")}\n\n**Speaker Script:**\n> "${slide.speakerNotes}"\n\n`;
      if (slide.resolutionsOrDecisions) {
        md += `**Board Action / Resolution:** ${slide.resolutionsOrDecisions}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Board Deck exported as Markdown!");
  };

  if (!isOpen) return null;

  const currentSlide = deck?.slides[activeSlideIndex];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0E0E11] w-full max-w-4xl h-full flex flex-col border-l border-gray-200 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black">
              <Presentation className="w-6 h-6" weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                AI Board Deck Synthesizer
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-md">
                  Institutional
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aggregates live financials, cap table equity, and milestone OKRs into a 10-slide director presentation.
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

        {/* Filter Controls Bar */}
        <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/40 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Focus:
            </span>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white cursor-pointer"
            >
              <option value="Quarterly Review & Governance">Quarterly Review & Governance</option>
              <option value="Fundraising & Valuation Acceleration">Fundraising & Valuation</option>
              <option value="Product Delivery & GTM Roadmap">Product & GTM Acceleration</option>
              <option value="Cost Optimization & Runway Extension">Cost & Runway Extension</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDeck}
              disabled={isGenerating}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <CircleNotch className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkle className="w-3.5 h-3.5" weight="fill" />
              )}
              <span>{deck ? "Re-Synthesize Deck" : "Synthesize Deck"}</span>
            </button>

            {deck && (
              <button
                onClick={downloadFullDeck}
                className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" weight="bold" />
                <span>Export (.md)</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 thin-scrollbar">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
              <CircleNotch className="w-10 h-10 text-yellow-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  Synthesizing Board of Directors Presentation...
                </p>
                <p className="text-xs text-gray-400">
                  Compiling Cap Table allocations, cash burn runway, and milestone metrics.
                </p>
              </div>
            </div>
          ) : deck ? (
            <div className="space-y-6">
              {/* Financial Snapshot Summary Bar */}
              {deck.financialSnapshot && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Runway</span>
                    <p className="text-sm font-black text-green-500 mt-0.5">{deck.financialSnapshot.runwayMonths}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Cash on Hand</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{deck.financialSnapshot.cashOnHand}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Monthly Burn</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{deck.financialSnapshot.monthlyBurn}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">ARR</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{deck.financialSnapshot.arr}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">MRR</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{deck.financialSnapshot.mrr}</p>
                  </div>
                </div>
              )}

              {/* Slide Navigation Carousel Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 thin-scrollbar">
                {deck.slides.map((s, idx) => (
                  <button
                    key={s.slideNumber}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0",
                      activeSlideIndex === idx
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                    )}
                  >
                    Slide {s.slideNumber}: {s.title.slice(0, 18)}...
                  </button>
                ))}
              </div>

              {/* Active Slide Presentation Preview Card */}
              {currentSlide && (
                <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  {/* Top Slide Meta */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-1 rounded-lg border border-yellow-200/60 dark:border-yellow-900/40">
                        Slide {currentSlide.slideNumber} of 10 • {currentSlide.category}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
                        {currentSlide.title}
                      </h3>
                    </div>

                    <button
                      onClick={copyCurrentSlide}
                      className="p-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-gray-200 dark:border-zinc-700 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Slide</span>
                    </button>
                  </div>

                  {/* Slide Key Metrics Badges */}
                  {currentSlide.metrics && currentSlide.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {currentSlide.metrics.map((metric, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200/60 dark:border-yellow-900/40 rounded-2xl"
                        >
                          <span className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-400">
                            {metric.label}
                          </span>
                          <p className="text-base font-black text-gray-900 dark:text-white">
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Slide Bullet Points */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Core Strategic Takeaways:
                    </h4>
                    <ul className="space-y-2">
                      {currentSlide.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-start gap-2.5 leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Board Resolution (if applicable) */}
                  {currentSlide.resolutionsOrDecisions && (
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                        Formal Board Resolution / Vote
                      </span>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {currentSlide.resolutionsOrDecisions}
                      </p>
                    </div>
                  )}

                  {/* Speaker Notes Script */}
                  <div className="p-5 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-700/60 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500" weight="fill" />
                      CEO Presenter Speaker Notes:
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{currentSlide.speakerNotes}"
                    </p>
                  </div>

                  {/* Slide Stepper Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                      disabled={activeSlideIndex === 0}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CaretLeft className="w-3.5 h-3.5" />
                      Previous Slide
                    </button>

                    <span className="text-xs font-mono font-bold text-gray-400">
                      {activeSlideIndex + 1} / 10
                    </span>

                    <button
                      onClick={() => setActiveSlideIndex(Math.min(deck.slides.length - 1, activeSlideIndex + 1))}
                      disabled={activeSlideIndex === deck.slides.length - 1}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Next Slide
                      <CaretRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400">No board deck generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
