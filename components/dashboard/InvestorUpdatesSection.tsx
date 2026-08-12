"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  CircleNotch,
  Calendar,
  TrendUp,
  TrendDown,
  Coins,
  Hourglass,
  Eye,
  Trash,
  FloppyDiskBack,
  Pencil,
  PlusCircle,
  Info,
  CheckCircle,
} from "@phosphor-icons/react";

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

export default function InvestorUpdatesSection() {
  const { token, activeStartupId, setActiveStartupId, startups: authStartups } = useAuth();
  const [updates, setUpdates] = useState<InvestorUpdateType[]>([]);
  const [userStartups, setUserStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>("");
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
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : undefined;
      const activeId = activeStartupId || storedId || undefined;
      fetchUpdates(activeId);
      fetchDocs();
    }
  }, [token, activeStartupId]);

  const fetchUpdates = async (targetStartupId?: string) => {
    setLoading(true);
    const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
    const activeId = targetStartupId || activeStartupId || selectedStartupId || storedId || "";
    try {
      const url = activeId ? `/api/updates?startup_id=${activeId}` : "/api/updates";
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
        if (data.userStartups && data.userStartups.length > 0) {
          setUserStartups(data.userStartups.map((s: any) => ({ ...s, _id: String(s._id) })));
        }
        if (data.currentStartup?._id) {
          setSelectedStartupId(String(data.currentStartup._id));
        }
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
        const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : null;
        const activeId = activeStartupId || storedId;
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
    if (!title) {
      toast.error("Please provide an update title.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        month,
        title,
        metrics: {
          mrr: Number(mrr),
          cash_in_bank: Number(cashInBank),
          runway_months: Number(runwayMonths),
        },
        kpis: {
          highlights,
          lowlights,
          help_needed: helpNeeded,
        },
        body,
        attachments,
        startup_id: selectedStartupId || activeStartupId,
      };

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
        toast.success(selectedId ? "Update saved!" : "Update published!");
        resetForm();
        setActiveTab("history");
        fetchUpdates();
      } else {
        toast.error("Failed to save update.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const injectText = (textToInject: string) => {
    setBody((prev) => prev + (prev ? "\n\n" : "") + textToInject);
    toast.info("Markdown injected into narrative.");
  };

  const handleInsertDocumentLink = () => {
    if (!selectedDocLink) return;
    const doc = documents.find((d) => d.url === selectedDocLink);
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
    <div className="space-y-6">
      {/* Top Actions Bar inside Documents */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Monthly Investor Updates
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Share structured progress reports, financial metrics, and company updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "history" ? (
            <button
              onClick={() => {
                resetForm();
                setActiveTab("compose");
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Compose Update
            </button>
          ) : (
            <button
              onClick={() => {
                resetForm();
                setActiveTab("history");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
            >
              View Update History
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === "history" ? (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
            </div>
          ) : updates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {updates.map((up) => (
                <div
                  key={up._id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-bold tracking-widest bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 uppercase">
                        {up.month}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {up.created_at ? format(new Date(up.created_at), "MMM d, yyyy") : "Recent"}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-4 line-clamp-1">
                      {up.title}
                    </h3>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl mb-4 border border-gray-100 dark:border-zinc-800">
                      <div>
                        <p className="text-[9px] font-mono uppercase text-gray-400">MRR</p>
                        <p className="text-xs font-black text-gray-900 dark:text-white">
                          ${(up.metrics?.mrr || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono uppercase text-gray-400">CASH</p>
                        <p className="text-xs font-black text-gray-900 dark:text-white">
                          ${(up.metrics?.cash_in_bank || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono uppercase text-gray-400">RUNWAY</p>
                        <p className="text-xs font-black text-yellow-600 dark:text-yellow-400">
                          {up.metrics?.runway_months || 0} mo
                        </p>
                      </div>
                    </div>

                    {up.kpis?.highlights && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 italic">
                        "{up.kpis.highlights}"
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewUpdate(up)}
                      className="px-3.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#E5C158] border border-yellow-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Update
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(up)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Edit Update"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(up._id)}
                        className="p-2 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Delete Update"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
              <Info className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                No investor updates published yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Compose your first monthly progress report to keep your investors and board aligned.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab("compose");
                }}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Compose First Update
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Compose Form */
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 md:p-8 space-y-8 shadow-xs">
          <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {selectedId ? "Edit Investor Update" : "Compose New Monthly Update"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fill in your performance metrics, wins, roadblocks, and detailed narrative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Target Month & Year
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Update Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Growth Acceleration & Enterprise Traction"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                required
              />
            </div>
          </div>

          {/* Financial KPIs */}
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4">
              Financial KPIs Cards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60 rounded-2xl">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Monthly Recurring Revenue ($)
                </label>
                <input
                  type="number"
                  value={mrr}
                  onChange={(e) => setMrr(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-black dark:text-white"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60 rounded-2xl">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Cash in Bank ($)
                </label>
                <input
                  type="number"
                  value={cashInBank}
                  onChange={(e) => setCashInBank(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-black dark:text-white"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60 rounded-2xl">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Runway (Months)
                </label>
                <input
                  type="number"
                  value={runwayMonths}
                  onChange={(e) => setRunwayMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-black dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Structured Text Cards */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-1.5 uppercase tracking-wider">
                🚀 Key Highlights & Wins
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                rows={2}
                placeholder="Major contracts closed, team milestones, revenue records..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-green-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-red-700 dark:text-red-400 mb-1.5 uppercase tracking-wider">
                ⚠️ Lowlights & Roadblocks
              </label>
              <textarea
                value={lowlights}
                onChange={(e) => setLowlights(e.target.value)}
                rows={2}
                placeholder="Product delays, churn spikes, hiring bottlenecks..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1.5 uppercase tracking-wider">
                🤝 Help Needed from Board / Investors
              </label>
              <textarea
                value={helpNeeded}
                onChange={(e) => setHelpNeeded(e.target.value)}
                rows={2}
                placeholder="Introductions to enterprise leads, VP Sales candidates..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-yellow-500 dark:text-white"
              />
            </div>
          </div>

          {/* Narrative Body & Document Link Injection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Detailed Founder Narrative (Markdown Supported)
              </label>

              {documents.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDocLink}
                    onChange={(e) => setSelectedDocLink(e.target.value)}
                    className="px-2.5 py-1 text-[11px] bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
                  >
                    <option value="">Insert Pitch Deck Link...</option>
                    {documents.map((d, idx) => (
                      <option key={idx} value={d.url}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleInsertDocumentLink}
                    className="px-2.5 py-1 bg-yellow-500/10 text-[#E5C158] border border-yellow-500/30 text-[10px] font-bold rounded-lg hover:bg-yellow-500/20 transition-all cursor-pointer"
                  >
                    Insert Link
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your comprehensive founder letter detailing product roadmap, unit economics, and team updates..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black dark:text-white"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab("history");
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <CircleNotch className="w-4 h-4 animate-spin" />
              ) : (
                <FloppyDiskBack className="w-4 h-4" />
              )}
              {selectedId ? "Save Changes" : "Publish Update"}
            </button>
          </div>
        </form>
      )}

      {/* Read Preview Modal */}
      {previewUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 uppercase">
                  {previewUpdate.month} Update
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {previewUpdate.title}
                </h2>
              </div>

              <button
                onClick={() => setPreviewUpdate(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center">
              <div>
                <p className="text-[10px] font-mono uppercase text-gray-400">MRR</p>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  ${(previewUpdate.metrics?.mrr || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-gray-400">CASH IN BANK</p>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  ${(previewUpdate.metrics?.cash_in_bank || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-gray-400">RUNWAY</p>
                <p className="text-base font-black text-yellow-600 dark:text-yellow-400">
                  {previewUpdate.metrics?.runway_months || 0} Months
                </p>
              </div>
            </div>

            {/* Body */}
            {previewUpdate.body && (
              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-medium text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/60">
                {previewUpdate.body}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
