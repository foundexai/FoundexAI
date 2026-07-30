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
  SquaresFour,
  Table,
  FileText,
  Copy,
  Download,
  X,
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // AI Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<MatchedGrant | null>(null);
  const [draftContent, setDraftContent] = useState<string>("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const currentStartup = startups.find((s) => s._id === activeStartupId) || startups[0];

  useEffect(() => {
    if (token && activeStartupId) {
      fetchMatches();
    }
  }, [token, activeStartupId]);

  // Loading steps animation simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (draftLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [draftLoading]);

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

  const openDraftDrawer = async (grant: MatchedGrant) => {
    setSelectedGrant(grant);
    setDrawerOpen(true);
    setDraftContent("");
    setDraftLoading(true);
    setIsEditingDraft(false);

    try {
      // Check for existing draft
      const res = await fetch(`/api/grants/draft?startup_id=${activeStartupId}&grant_id=${grant._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setDraftContent(data.draft.content);
        }
      }
    } catch (err) {
      console.error("Failed to fetch existing draft:", err);
    } finally {
      setDraftLoading(false);
    }
  };

  const saveEdits = async () => {
    if (!selectedGrant || !activeStartupId) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/grants/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startup_id: activeStartupId,
          grant_id: selectedGrant._id,
          content: draftContent,
        }),
      });

      if (res.ok) {
        toast.success("Draft edits saved successfully!");
        setIsEditingDraft(false);
      } else {
        toast.error("Failed to save draft edits");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving draft edits");
    } finally {
      setSaveLoading(false);
    }
  };

  const generateDraft = async (regenerate = false) => {
    if (!selectedGrant || !activeStartupId) return;
    setDraftLoading(true);
    setDraftContent("");

    try {
      const res = await fetch("/api/grants/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startup_id: activeStartupId,
          grant_id: selectedGrant._id,
          regenerate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setDraftContent(data.draft.content);
          toast.success(regenerate ? "Draft regenerated!" : "Application draft written!");
        } else {
          toast.error("Failed to generate draft content");
        }
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error("An error occurred during generation");
    } finally {
      setDraftLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draftContent) return;
    navigator.clipboard.writeText(draftContent);
    toast.success("Draft copied to clipboard!");
  };

  const handleDownload = () => {
    if (!draftContent || !selectedGrant) return;
    const element = document.createElement("a");
    const file = new Blob([draftContent], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedGrant.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_proposal.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadingSteps = [
    "Analyzing grant objectives & requirements...",
    "Correlating startup profile & technological innovation...",
    "Drafting executive summary & commercialization plan...",
    "Finalizing proposal structures and styling markdown...",
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800/80 gap-4">
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
              Get matched to non-dilutive federal and global grants matching your stage, sector, and location.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {/* Grid / Table Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-gray-200/50 dark:border-zinc-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-2xs"
                  : "text-gray-450 dark:text-zinc-500 hover:text-gray-900"
              }`}
              title="Grid View"
            >
              <SquaresFour className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-2xs"
                  : "text-gray-450 dark:text-zinc-500 hover:text-gray-900"
              }`}
              title="Table List View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {activeStartupId && currentStartup && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-yellow-700 dark:text-yellow-400">
                MATCHING: {currentStartup.company_name.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch className="w-8 h-8 text-gray-450 animate-spin" weight="bold" />
          </div>
        ) : grants.length > 0 ? (
          <div className="space-y-6 flex-1">
            {viewMode === "grid" ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {grants.map((grant) => {
                  const isExcellentMatch = grant.matchScore >= 80;
                  return (
                    <div
                      key={grant._id}
                      className="group bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col h-full hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {grant.agency}
                          </span>
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white mt-1 leading-snug">
                            {grant.title}
                          </h3>
                        </div>

                        {/* Match Score Badge */}
                        <div className={`px-2.5 py-1 rounded-xl text-center border shrink-0 ${
                          isExcellentMatch
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : grant.matchScore >= 55
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                            : "bg-gray-100 border-gray-200 text-gray-500 dark:bg-zinc-900 dark:border-zinc-800"
                        }`}>
                          <span className="text-xs font-mono font-bold block">{grant.matchScore}%</span>
                          <span className="text-[7px] font-mono uppercase tracking-wider block">Match</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-650 dark:text-zinc-400 leading-relaxed mb-5 line-clamp-3">
                        {grant.description}
                      </p>

                      {/* Meta Stats bar */}
                      <div className="grid grid-cols-2 gap-4 border-y border-gray-100 dark:border-zinc-900 py-3.5 mb-5 text-xs font-mono">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-0.5">Grant Value</span>
                          <span className="font-bold text-gray-800 dark:text-zinc-200 text-sm">
                            {grant.currency === "EUR" ? "€" : grant.currency === "USD" ? "$" : `${grant.currency} `}
                            {grant.amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-0.5">Deadline</span>
                          <span className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {grant.deadline ? new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Open"}
                          </span>
                        </div>
                      </div>

                      {/* Match reasoning list */}
                      <div className="space-y-1.5 mb-6 flex-1">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                          Matching Criteria Analysis
                        </span>
                        <div className="space-y-1 text-xs">
                          {grant.reasons.slice(0, 3).map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-1.5 text-gray-650 dark:text-zinc-400 leading-normal">
                              <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => openDraftDrawer(grant)}
                          className="flex-1 py-2 px-3 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-[10px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          AI Draft Writer
                        </button>
                        {grant.url && (
                          <a
                            href={grant.url}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-4 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white text-[10px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            Apply
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table Layout */
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        <th className="py-3 px-4 sm:px-6">Agency / Title</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Match Score</th>
                        <th className="py-3 px-4">Deadline</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-900 text-xs">
                      {grants.map((grant) => {
                        const isExcellentMatch = grant.matchScore >= 80;
                        return (
                          <tr key={grant._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="py-4 px-4 sm:px-6 max-w-sm">
                              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase leading-none block">
                                {grant.agency}
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white mt-1 block">
                                {grant.title}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-medium text-gray-800 dark:text-zinc-200">
                              {grant.currency === "EUR" ? "€" : grant.currency === "USD" ? "$" : `${grant.currency} `}
                              {grant.amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${
                                      isExcellentMatch
                                        ? "bg-emerald-500"
                                        : grant.matchScore >= 55
                                        ? "bg-yellow-500"
                                        : "bg-gray-400"
                                    }`}
                                    style={{ width: `${grant.matchScore}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-[11px] text-gray-800 dark:text-zinc-350">
                                  {grant.matchScore}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-500 font-mono">
                              {grant.deadline ? new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Open"}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openDraftDrawer(grant)}
                                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-850 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
                                  title="AI Draft Writer"
                                >
                                  <FileText className="w-4 h-4 text-zinc-500" />
                                </button>
                                {grant.url && (
                                  <a
                                    href={grant.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white rounded-xl transition-all inline-block"
                                    title="Apply"
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-950 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 max-w-xl mx-auto w-full">
            <Warning className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">No matches found</h3>
            <p className="text-gray-500 text-xs">Please make sure your startup sector, location, and stage are configured.</p>
          </div>
        )}
      </div>

      {/* AI ASSISTANT DRAWER PANEL */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 flex justify-end ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      >
        <div
          className={`h-full w-full max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl border-l border-gray-150 dark:border-zinc-900 flex flex-col transition-transform duration-300 transform ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550 leading-none">
                  AI Draft Assistant
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono block mt-1 line-clamp-1 max-w-[400px]">
                  {selectedGrant?.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {draftLoading ? (
              /* Writing Loading State */
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
                <CircleNotch className="w-10 h-10 text-yellow-500 animate-spin" weight="bold" />
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                  Writing Application Proposal...
                </h4>
                <p className="text-xs text-gray-400 font-mono animate-pulse min-h-[20px]">
                  {loadingSteps[loadingStep]}
                </p>
              </div>
            ) : draftContent ? (
              /* Loaded Markdown Preview or Editor */
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-900 pb-3 shrink-0">
                  <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Proposal Workspace {isEditingDraft ? "(Editing)" : "(Preview)"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsEditingDraft(!isEditingDraft)}
                      className={`px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isEditingDraft ? "bg-zinc-100 dark:bg-zinc-800 text-yellow-600 dark:text-yellow-450 border-yellow-500/20" : ""
                      }`}
                    >
                      {isEditingDraft ? "Preview" : "Edit"}
                    </button>
                    {!isEditingDraft && (
                      <>
                        <button
                          onClick={handleCopy}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider"
                          title="Download Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditingDraft ? (
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={16}
                    className="w-full p-5 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl border border-gray-150/40 dark:border-zinc-900/60 font-sans text-xs text-gray-700 dark:text-zinc-350 leading-relaxed outline-none focus:border-zinc-400 dark:focus:border-zinc-700 focus:ring-0 resize-y min-h-[350px]"
                    placeholder="Customize proposal content..."
                  />
                ) : (
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/10 p-5 rounded-2xl border border-gray-150/40 dark:border-zinc-900/60 font-sans text-xs text-gray-700 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap space-y-4 overflow-y-auto">
                    {draftContent}
                  </div>
                )}
              </div>
            ) : (
              /* Empty Draft State */
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    No Draft Generated Yet
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Instantly compose a highly customized, professional application proposal tailored to your startup's profile.
                  </p>
                </div>
                <button
                  onClick={() => generateDraft(false)}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-yellow-500/10"
                >
                  <FileText className="w-4 h-4" />
                  Generate AI Proposal Draft
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {draftContent && !draftLoading && (
            <div className="p-5 border-t border-gray-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0 flex items-center justify-between">
              {isEditingDraft ? (
                <>
                  <button
                    onClick={() => setIsEditingDraft(false)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-800 dark:text-zinc-350 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdits}
                    disabled={saveLoading}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-yellow-500/10"
                  >
                    {saveLoading ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Edits
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => generateDraft(true)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-800 dark:text-zinc-350 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    Regenerate Draft
                  </button>

                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="px-5 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Close Drawer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
