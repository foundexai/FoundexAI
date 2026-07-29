"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CaretLeft,
  Plus,
  CircleNotch,
  Calendar,
  TrendUp,
  TrendDown,
  Handshake,
  Coins,
  Hourglass,
  Eye,
  Trash,
  FloppyDiskBack,
  Paperclip,
  CheckCircle,
  Pencil,
  PlusCircle,
  Info,
} from "@phosphor-icons/react";
import Link from "next/link";

interface InvestorUpdateType {
  _id: string;
  month: string;
  title: string;
  metrics: {
    mrr: number;
    cash_in_bank: number;
    runway_months: number;
  };
  kpis: {
    highlights: string;
    lowlights: string;
    help_needed: string;
  };
  body: string;
  attachments: string[];
  created_at: string;
}

interface Document {
  name: string;
  url: string;
  type: string;
}

export default function InvestorUpdatesPage() {
  const { token, activeStartupId } = useAuth();
  const [updates, setUpdates] = useState<InvestorUpdateType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "compose">("history");
  
  // Composer Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [title, setTitle] = useState("");
  const [mrr, setMrr] = useState<number>(0);
  const [cashInBank, setCashInBank] = useState<number>(0);
  const [runwayMonths, setRunwayMonths] = useState<number>(12);
  const [highlights, setHighlights] = useState("");
  const [lowlights, setLowlights] = useState("");
  const [helpNeeded, setHelpNeeded] = useState("");
  const [body, setBody] = useState("");
  const [selectedDocLink, setSelectedDocLink] = useState("");
  const [customLinkUrl, setCustomLinkUrl] = useState("");
  const [customLinkText, setCustomLinkText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Modal / Preview state
  const [previewUpdate, setPreviewUpdate] = useState<InvestorUpdateType | null>(null);

  useEffect(() => {
    if (token) {
      fetchUpdates();
      fetchDocs();
    }
  }, [token, activeStartupId]);

  const fetchUpdates = async () => {
    if (!activeStartupId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/updates?startup_id=${activeStartupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load investor updates");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/startups", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (data.startups && data.startups.length > 0) {
        const activeId = activeStartupId || localStorage.getItem("activeStartupId");
        const currentStartup = data.startups.find((s: any) => s._id === activeId) || data.startups[0];
        setDocuments(currentStartup.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch docs", error);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setMonth(format(new Date(), "yyyy-MM"));
    setTitle("");
    setMrr(0);
    setCashInBank(0);
    setRunwayMonths(12);
    setHighlights("");
    setLowlights("");
    setHelpNeeded("");
    setBody("");
    setAttachments([]);
    setSelectedDocLink("");
    setCustomLinkUrl("");
    setCustomLinkText("");
  };

  const handleEdit = (update: InvestorUpdateType) => {
    setSelectedId(update._id);
    setMonth(update.month);
    setTitle(update.title);
    setMrr(update.metrics?.mrr || 0);
    setCashInBank(update.metrics?.cash_in_bank || 0);
    setRunwayMonths(update.metrics?.runway_months || 12);
    setHighlights(update.kpis?.highlights || "");
    setLowlights(update.kpis?.lowlights || "");
    setHelpNeeded(update.kpis?.help_needed || "");
    setBody(update.body || "");
    setAttachments(update.attachments || []);
    setActiveTab("compose");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investor update?")) return;
    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Investor update deleted");
        fetchUpdates();
      } else {
        toast.error("Failed to delete update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting update");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the update.");
      return;
    }

    setSaving(true);
    const payload = {
      startup_id: activeStartupId,
      month,
      title,
      metrics: { mrr, cash_in_bank: cashInBank, runway_months: runwayMonths },
      kpis: { highlights, lowlights, help_needed: helpNeeded },
      body,
      attachments,
    };

    try {
      const url = selectedId ? `/api/updates/${selectedId}` : "/api/updates";
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(selectedId ? "Investor update updated!" : "Investor update published!");
        resetForm();
        fetchUpdates();
        setActiveTab("history");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save investor update");
    } finally {
      setSaving(false);
    }
  };

  // Helper formatting injection for Body composer
  const injectText = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("body-composer") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = prefix + (selected || "text") + suffix;

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "text").length);
    }, 50);
  };

  const handleInsertDocumentLink = () => {
    if (!selectedDocLink) return;
    const doc = documents.find(d => d.url === selectedDocLink);
    if (!doc) return;
    injectText(`[📎 ${doc.name}](${doc.url})`);
  };

  const handleInsertCustomLink = () => {
    if (!customLinkUrl) return;
    const text = customLinkText || "Link";
    injectText(`[${text}](${customLinkUrl})`);
    setCustomLinkUrl("");
    setCustomLinkText("");
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black flex flex-col">
      {/* Toast popup managed globally */}
      
      {/* Header Banner */}
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
              Monthly Investor Updates
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Share structured progress reports, KPIs, and performance updates with your board and investors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === "history" ? (
            <button
              onClick={() => { resetForm(); setActiveTab("compose"); }}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Compose Update
            </button>
          ) : (
            <button
              onClick={() => { resetForm(); setActiveTab("history"); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Back to History
            </button>
          )}
        </div>
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {activeTab === "history" ? (
          <div className="space-y-6 flex-1 flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
              </div>
            ) : updates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {updates.map((update) => (
                  <div
                    key={update._id}
                    className="group bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-yellow-600 dark:text-yellow-400 uppercase bg-yellow-500/10 px-2 py-0.5 rounded">
                            {update.month}
                          </span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {format(new Date(update.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base text-gray-900 dark:text-white mt-2 line-clamp-1">
                          {update.title}
                        </h3>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(update)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(update._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pre-defined KPI metrics preview (refined border-y dividers layout) */}
                    <div className="grid grid-cols-3 gap-2 border-y border-gray-100 dark:border-zinc-900 py-3.5 mb-4 text-xs font-mono">
                      <div className="space-y-0.5 text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 block leading-none">MRR</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200 mt-1 block">
                          ${(update.metrics?.mrr || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-center border-x border-gray-100 dark:border-zinc-900">
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 block leading-none">Cash</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200 mt-1 block">
                          ${(update.metrics?.cash_in_bank || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 block leading-none">Runway</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200 mt-1 block">
                          {update.metrics?.runway_months || 0} mos
                        </span>
                      </div>
                    </div>

                    {/* Brief KPI bullet previews */}
                    <div className="space-y-2.5 text-xs text-gray-600 dark:text-zinc-400 line-clamp-3 flex-1 mb-5">
                      {update.kpis?.highlights && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-emerald-500 shrink-0">🚀</span>
                          <span className="leading-relaxed"><strong className="text-gray-900 dark:text-white font-semibold">Highlight:</strong> {update.kpis.highlights.substring(0, 95)}...</span>
                        </div>
                      )}
                      {update.kpis?.help_needed && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-yellow-500 shrink-0">🤝</span>
                          <span className="leading-relaxed"><strong className="text-gray-900 dark:text-white font-semibold">Help Needed:</strong> {update.kpis.help_needed.substring(0, 95)}...</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setPreviewUpdate(update)}
                      className="w-full py-2 px-3 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-[10px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all mt-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Full Update
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-zinc-950 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 max-w-xl mx-auto w-full my-auto shadow-xs">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">No updates published yet</h3>
                <p className="text-gray-500 text-xs mb-4">Compose your first monthly progress report for investors.</p>
                <button
                  onClick={() => setActiveTab("compose")}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Create Monthly Update
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 items-start w-full animate-fade-in">
            {/* Left Workspace Column: Document & Editor */}
            <div className="flex-1 w-full space-y-6">
              {/* Paper Document Wrapper */}
              <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-gray-150/80 dark:border-zinc-900 shadow-2xs space-y-6">
                
                {/* Meta Inputs on the Paper */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-yellow-600 dark:text-yellow-400 uppercase bg-yellow-500/10 px-2.5 py-1 rounded">
                      Month Update
                    </span>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="bg-transparent text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 border-none outline-none p-0 focus:ring-0 w-32 cursor-pointer hover:text-zinc-800 dark:hover:text-white"
                      required
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Enter Update Title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white border-none p-0 outline-none focus:ring-0 placeholder-gray-300 dark:placeholder-zinc-800"
                    required
                  />
                  <div className="h-[1px] bg-gray-100 dark:bg-zinc-900 w-full" />
                </div>

                {/* Narrative Workspace text editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-905 p-1.5 rounded-xl border border-gray-150 dark:border-zinc-850">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-2">Narrative</span>
                    
                    {/* Quick Editor Helpers */}
                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        onClick={() => injectText("**", "**")}
                        className="px-2.5 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-800 text-[10px] font-bold rounded font-mono cursor-pointer transition-colors"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => injectText("*", "*")}
                        className="px-2.5 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-800 text-[10px] italic rounded font-mono cursor-pointer transition-colors"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => injectText("### ")}
                        className="px-2.5 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-800 text-[10px] rounded font-mono cursor-pointer transition-colors"
                        title="Header"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => injectText("- ")}
                        className="px-2.5 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-800 text-[10px] rounded font-mono cursor-pointer transition-colors"
                        title="List"
                      >
                        • List
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="body-composer"
                    rows={14}
                    placeholder="Share your detailed monthly updates here... markdown is supported."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm dark:text-white outline-none focus:ring-0 font-sans resize-none leading-relaxed min-h-[300px] placeholder-zinc-400 dark:placeholder-zinc-700"
                  />
                </div>
              </div>

              {/* KPI Summary inputs - Styled nicely below the main document narrative */}
              <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-gray-150/80 dark:border-zinc-900 shadow-2xs space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-150 dark:border-zinc-900 pb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
                    Key Performance Indicators
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Highlights Card */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/5/30 border border-emerald-500/10 dark:border-emerald-500/10 p-4.5 rounded-2xl transition-all duration-300 focus-within:border-emerald-500/30 dark:focus-within:border-emerald-500/40">
                    <div className="flex items-center gap-2 border-b border-emerald-500/10 dark:border-emerald-500/20 pb-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-mono font-bold text-emerald-850 dark:text-emerald-400 uppercase tracking-widest block">
                        🚀 Highlights & Wins
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Key milestones hit, contracts closed, hiring updates, product releases..."
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:ring-0 leading-relaxed resize-none placeholder-zinc-400 dark:placeholder-zinc-650"
                    />
                  </div>

                  {/* Roadblocks Card */}
                  <div className="bg-rose-500/5 dark:bg-rose-500/5/30 border border-rose-500/10 dark:border-rose-500/10 p-4.5 rounded-2xl transition-all duration-300 focus-within:border-rose-500/30 dark:focus-within:border-rose-500/40">
                    <div className="flex items-center gap-2 border-b border-rose-500/10 dark:border-rose-500/20 pb-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[9px] font-mono font-bold text-rose-850 dark:text-rose-400 uppercase tracking-widest block">
                        📉 Roadblocks & Wins
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Bottlenecks, churn metrics, target misses, operational issues..."
                      value={lowlights}
                      onChange={(e) => setLowlights(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:ring-0 leading-relaxed resize-none placeholder-zinc-400 dark:placeholder-zinc-650"
                    />
                  </div>

                  {/* Help Needed Card */}
                  <div className="bg-yellow-500/5 dark:bg-yellow-500/5/30 border border-yellow-500/10 dark:border-yellow-500/10 p-4.5 rounded-2xl transition-all duration-300 focus-within:border-yellow-500/30 dark:focus-within:border-yellow-500/40">
                    <div className="flex items-center gap-2 border-b border-yellow-500/10 dark:border-yellow-500/20 pb-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span className="text-[9px] font-mono font-bold text-yellow-850 dark:text-yellow-450 uppercase tracking-widest block">
                        🤝 Help Needed
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Specific requests for investor help (intros, pilot partners, talent search)..."
                      value={helpNeeded}
                      onChange={(e) => setHelpNeeded(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:ring-0 leading-relaxed resize-none placeholder-zinc-400 dark:placeholder-zinc-650"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Key Metrics & Report Attachments & Form Actions */}
            <div className="w-full lg:w-80 lg:sticky lg:top-24 space-y-6 shrink-0">
              
              {/* Financial Metrics Box */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-gray-150/80 dark:border-zinc-900 shadow-2xs space-y-5">
                <h4 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Key Metrics
                </h4>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Monthly Revenue (MRR)
                    </label>
                    <div className="flex items-center bg-zinc-50/50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-450 dark:focus-within:border-zinc-700 transition-colors">
                      <span className="text-xs font-semibold text-zinc-400 font-mono select-none">$</span>
                      <input
                        type="number"
                        value={mrr}
                        onChange={(e) => setMrr(Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 ml-1 text-xs font-bold font-mono dark:text-white focus:outline-none focus:ring-0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Cash in Bank
                    </label>
                    <div className="flex items-center bg-zinc-50/50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-450 dark:focus-within:border-zinc-700 transition-colors">
                      <span className="text-xs font-semibold text-zinc-400 font-mono select-none">$</span>
                      <input
                        type="number"
                        value={cashInBank}
                        onChange={(e) => setCashInBank(Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 ml-1 text-xs font-bold font-mono dark:text-white focus:outline-none focus:ring-0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Runway (Months)
                    </label>
                    <div className="flex items-center bg-zinc-50/50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-450 dark:focus-within:border-zinc-700 transition-colors">
                      <input
                        type="number"
                        value={runwayMonths}
                        onChange={(e) => setRunwayMonths(Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 text-xs font-bold font-mono dark:text-white focus:outline-none focus:ring-0"
                        placeholder="12"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments & Integrations */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-gray-150/80 dark:border-zinc-900 shadow-2xs space-y-4">
                <h4 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                  Integrations
                </h4>

                <div className="space-y-4">
                  {/* Insert existing PDF report link */}
                  <div className="space-y-1 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-gray-200 dark:border-zinc-900">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-550 uppercase block">Foundex Docs</label>
                    <div className="space-y-2 mt-1.5">
                      <select
                        value={selectedDocLink}
                        onChange={(e) => setSelectedDocLink(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono outline-none text-gray-800 dark:text-white focus:border-zinc-400"
                      >
                        <option value="">-- Select doc --</option>
                        {documents.map((d, i) => (
                          <option key={i} value={d.url}>
                            {d.name} ({d.type})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleInsertDocumentLink}
                        disabled={!selectedDocLink}
                        className="w-full py-1.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white font-mono font-bold text-[10px] rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Insert Doc Reference
                      </button>
                    </div>
                  </div>

                  {/* Custom link */}
                  <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-gray-200 dark:border-zinc-900">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-550 uppercase block">Custom Hyperlink</label>
                    <div className="space-y-2 mt-1.5">
                      <input
                        type="text"
                        placeholder="Link Text"
                        value={customLinkText}
                        onChange={(e) => setCustomLinkText(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono outline-none text-gray-800 dark:text-white focus:border-zinc-400"
                      />
                      <input
                        type="text"
                        placeholder="https://..."
                        value={customLinkUrl}
                        onChange={(e) => setCustomLinkUrl(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono outline-none text-gray-800 dark:text-white focus:border-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={handleInsertCustomLink}
                        disabled={!customLinkUrl}
                        className="w-full py-1.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white font-mono font-bold text-[10px] rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Insert Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-gray-150/80 dark:border-zinc-900 shadow-2xs space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-yellow-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                  ) : (
                    <FloppyDiskBack className="w-4 h-4" />
                  )}
                  {selectedId ? "Save Changes" : "Publish Update"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab("history"); }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* FULL UPDATE PREVIEW MODAL */}
      {previewUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 border border-gray-250/60 dark:border-zinc-850 rounded-3xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden text-left">
            <div className="p-6 border-b border-gray-150 dark:border-zinc-900 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-yellow-600 dark:text-yellow-400 uppercase bg-yellow-500/10 px-2 py-0.5 rounded">
                  {previewUpdate.month}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Report Date: {format(new Date(previewUpdate.created_at), "MMMM d, yyyy")}
                </span>
              </div>
              <button
                onClick={() => setPreviewUpdate(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {previewUpdate.title}
                </h2>
                <div className="w-12 h-1 bg-yellow-500 rounded-full mt-3" />
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-3 gap-4 border-y border-gray-100 dark:border-zinc-900 py-5">
                <div>
                  <span className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Revenue (MRR)
                  </span>
                  <span className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1 block">
                    ${(previewUpdate.metrics?.mrr || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Cash Balance
                  </span>
                  <span className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1 block">
                    ${(previewUpdate.metrics?.cash_in_bank || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Est. Runway
                  </span>
                  <span className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1 block">
                    {previewUpdate.metrics?.runway_months || 0} Months
                  </span>
                </div>
              </div>

              {/* Structured Highlight / Lowlight / Help section */}
              <div className="space-y-4">
                {previewUpdate.kpis?.highlights && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-1.5 uppercase font-mono tracking-wider">
                      🚀 Highlights & Wins
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {previewUpdate.kpis.highlights}
                    </p>
                  </div>
                )}

                {previewUpdate.kpis?.lowlights && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-1.5 uppercase font-mono tracking-wider">
                      📉 Roadblocks & Lowlights
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {previewUpdate.kpis.lowlights}
                    </p>
                  </div>
                )}

                {previewUpdate.kpis?.help_needed && (
                  <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-1.5 uppercase font-mono tracking-wider">
                      🤝 Help Needed
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {previewUpdate.kpis.help_needed}
                    </p>
                  </div>
                )}
              </div>

              {/* Narrative markdown body */}
              {previewUpdate.body && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Detailed Narrative & Updates
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed font-sans bg-gray-50/50 dark:bg-zinc-900/10 p-5 rounded-2xl border border-gray-150/40 dark:border-zinc-900/60">
                    {previewUpdate.body}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-150 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-950/40 shrink-0 text-center text-xs text-gray-400 font-mono">
              Sent via Foundex Investor Updates CRM
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
