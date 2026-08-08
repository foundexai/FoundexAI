"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleNotch,
  CheckCircle,
  ChatCircleDots,
  PaperPlaneTilt,
  Sparkle,
  Calendar,
  CurrencyDollar,
  Note,
  Trash,
  Plus,
  X,
  FileText,
  TrendUp
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";
import OutreachCopilotModal from "@/components/dashboard/OutreachCopilotModal";

interface EnrichedDeal {
  id: string;
  startupId: string;
  investorId: string;
  investorName: string;
  stage: string;
  dealAmount: number;
  notes: string;
  nextFollowup: string | null;
  activityLog: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  reminders: Array<{
    id: string;
    description: string;
    due_date: string;
    is_completed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  investor: {
    id: string;
    name: string;
    type: string;
    focus: string[];
    location: string;
    logoInitial: string;
    logoColor: string;
    description: string;
    investmentRange: string;
    website: string;
  };
  fitScore: number;
  fitBreakdown: any;
}

const STAGES = [
  { id: "shortlisted", label: "Shortlisted", color: "border-gray-200 dark:border-zinc-800" },
  { id: "outreach_sent", label: "Outreach Sent", color: "border-blue-200 dark:border-blue-900/30" },
  { id: "intro_meeting", label: "Intro Meeting", color: "border-purple-200 dark:border-purple-900/30" },
  { id: "due_diligence", label: "Due Diligence", color: "border-amber-200 dark:border-amber-900/30" },
  { id: "term_sheet", label: "Term Sheet", color: "border-pink-200 dark:border-pink-900/30" },
  { id: "closed_won", label: "Closed Won", color: "border-green-200 dark:border-green-900/30" },
  { id: "closed_lost", label: "Closed Lost", color: "border-red-200 dark:border-red-900/30" },
];

export default function PipelinePage() {
  const { user, token, activeStartupId, setActiveStartupId, startups: authStartups } = useAuth();
  const [deals, setDeals] = useState<EnrichedDeal[]>([]);
  const [userStartups, setUserStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMobileStage, setActiveMobileStage] = useState("shortlisted");

  // Drawer / Side Panel states
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newLogText, setNewLogText] = useState("");
  const [newReminderText, setNewReminderText] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [dealAmountInput, setDealAmountInput] = useState("");

  // Outreach Modal states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeCopilotDeal, setActiveCopilotDeal] = useState<EnrichedDeal | null>(null);

  useEffect(() => {
    if (token) {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : undefined;
      const activeId = activeStartupId || storedId || undefined;
      fetchPipeline(true, activeId);
    }
  }, [token, activeStartupId]);

  // 1. Fetch Pipeline Deals
  const fetchPipeline = async (showLoading = false, targetStartupId?: string) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
    const activeId = targetStartupId || activeStartupId || selectedStartupId || storedId || "";
    try {
      const url = activeId ? `/api/pipeline?startup_id=${activeId}` : "/api/pipeline";
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
        if (data.userStartups && data.userStartups.length > 0) {
          setUserStartups(data.userStartups.map((s: any) => ({ ...s, _id: String(s._id) })));
        }
        if (data.currentStartup?._id) {
          setSelectedStartupId(String(data.currentStartup._id));
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pipeline deals");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleStartupSwitch = (newStartupId: string) => {
    setSelectedStartupId(newStartupId);
    if (setActiveStartupId) {
      setActiveStartupId(newStartupId);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("activeStartupId", newStartupId);
    }
    fetchPipeline(true, newStartupId);
  };

  // 2. Real-Time Sync with Pusher Client
  useEffect(() => {
    if (!token || !user) return;
    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(`private-esign-${user.id}`);
    
    channel.bind("pipeline-updated", () => {
      // Reload pipeline on external update
      fetchPipeline(false);
    });

    channel.bind("pipeline-deleted", () => {
      fetchPipeline(false);
    });

    return () => {
      client.unsubscribe(`private-esign-${user.id}`);
    };
  }, [token, user]);

  // Update selected deal state if the main deals list updates
  useEffect(() => {
    if (selectedDeal) {
      const updated = deals.find(d => d.id === selectedDeal.id);
      if (updated) {
        setSelectedDeal(updated);
        setDealAmountInput(updated.dealAmount.toString());
      }
    }
  }, [deals]);

  // 3. Drag and Drop Actions
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    const previousDeals = [...deals];

    // Optimistic Update
    setDeals(prev => 
      prev.map(d => d.id === dealId ? { ...d, stage: targetStage } : d)
    );

    try {
      const res = await fetch(`/api/pipeline/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (res.ok) {
        toast.success(`Moved ${deal.investorName} to ${targetStage.replace("_", " ")}`);
        fetchPipeline(false);
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Failed to move deal. Reverting.");
      setDeals(previousDeals);
    }
  };

  // 4. Update Deal Value
  const handleSaveAmount = async () => {
    if (!selectedDeal) return;
    const val = parseFloat(dealAmountInput);
    if (isNaN(val)) return;

    try {
      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dealAmount: val }),
      });

      if (res.ok) {
        toast.success("Deal size updated!");
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to update size");
    }
  };

  // 5. Add Custom Note/Log
  const handleAddLog = async () => {
    if (!selectedDeal || !newLogText.trim()) return;

    try {
      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity: {
            type: "note",
            description: newLogText.trim(),
          }
        }),
      });

      if (res.ok) {
        setNewLogText("");
        toast.success("Activity log added!");
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to add note");
    }
  };

  // 6. Manage Inline Reminders
  const handleAddReminder = async () => {
    if (!selectedDeal || !newReminderText.trim() || !newReminderDate) return;

    try {
      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderAction: "add",
          reminder: {
            description: newReminderText.trim(),
            dueDate: newReminderDate,
          }
        }),
      });

      if (res.ok) {
        setNewReminderText("");
        setNewReminderDate("");
        toast.success("Reminder scheduled!");
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to schedule reminder");
    }
  };

  const handleToggleReminder = async (reminderId: string) => {
    if (!selectedDeal) return;

    try {
      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderAction: "toggle",
          reminder: { id: reminderId }
        }),
      });

      if (res.ok) {
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to complete reminder");
    }
  };

  const handleRemoveReminder = async (reminderId: string) => {
    if (!selectedDeal) return;

    try {
      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderAction: "remove",
          reminder: { id: reminderId }
        }),
      });

      if (res.ok) {
        toast.info("Reminder removed");
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to remove reminder");
    }
  };

  // 7. Delete Deal from Pipeline
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to remove this investor from your pipeline?")) return;

    try {
      const res = await fetch(`/api/pipeline/${dealId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Investor removed from pipeline");
        setIsDrawerOpen(false);
        setSelectedDeal(null);
        fetchPipeline(false);
      }
    } catch (e) {
      toast.error("Failed to delete deal");
    }
  };

  const filteredDeals = deals.filter(deal => 
    deal.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.investor.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.investor.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      {(() => {
        const displayStartups = (authStartups && authStartups.length > 0) ? authStartups : userStartups;
        const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
        const currentActiveId = activeStartupId || selectedStartupId || storedId || (displayStartups[0] ? String(displayStartups[0]._id) : "");

        return (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-2 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft weight="bold" />
                Back to Dashboard
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight dark:text-white">
                  Venture <span className="text-yellow-500">Pipeline</span>
                </h1>
                {displayStartups.length > 1 ? (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company:</span>
                    <select
                      value={currentActiveId}
                      onChange={(e) => handleStartupSwitch(e.target.value)}
                      className="bg-transparent text-xs font-black text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      {displayStartups.map((s: any) => (
                        <option key={String(s._id)} value={String(s._id)} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-bold">
                          {s.company_name || s.name || "Startup"}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : displayStartups.length === 1 ? (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-extrabold text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {displayStartups[0]?.company_name || displayStartups[0]?.name}
                  </div>
                ) : null}
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Manage your shortlist and track outreach progress using the Kanban board.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all w-full md:w-64 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white shadow-sm"
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Kanban Board View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" weight="bold" />
          <p className="font-bold text-gray-400 animate-pulse">Summoning your pipeline...</p>
        </div>
      ) : (
        /* Horizontal scrollable Kanban board (enabled on all screen sizes, including mobile) */
        <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[60vh] items-start w-full custom-scrollbar">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const totalStageAmount = stageDeals.reduce((sum, d) => sum + (d.dealAmount || 0), 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex flex-col bg-gray-50/50 dark:bg-zinc-900/40 rounded-3xl p-3.5 border border-gray-100 dark:border-zinc-800/80 shrink-0 w-[280px] md:w-[320px] min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1.5 pt-1.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                      ${(totalStageAmount / 1000).toFixed(0)}k • {stageDeals.length}
                    </span>
                  </div>
                  <span className="w-5 h-5 bg-gray-200/50 dark:bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Column Card Slot */}
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => {
                        setSelectedDeal(deal);
                        setDealAmountInput(deal.dealAmount.toString());
                        setIsDrawerOpen(true);
                      }}
                      className="bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 hover:border-yellow-500/50 dark:hover:border-yellow-500/40 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3 relative group"
                    >
                      {/* Fit Score Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[130px]">
                          {deal.investorName}
                        </span>
                        {deal.fitScore !== null && (
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                            deal.fitScore >= 75
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
                              : deal.fitScore >= 50
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                          )}>
                            {deal.fitScore}% Fit
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-col space-y-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md w-max">
                          {deal.investor.type}
                        </span>
                        <span className="truncate italic">
                          {deal.investor.location}
                        </span>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-zinc-800/80 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                        <span>${(deal.dealAmount / 1000).toFixed(0)}k</span>
                        <div className="flex items-center gap-1.5">
                          {deal.reminders.filter(r => !r.is_completed).length > 0 && (
                            <Calendar className="w-3.5 h-3.5 text-yellow-500" weight="fill" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCopilotDeal(deal);
                              setIsCopilotOpen(true);
                            }}
                            className="p-1 bg-yellow-500/10 hover:bg-yellow-500 hover:text-white rounded-md text-yellow-600 dark:text-yellow-400 transition-colors cursor-pointer"
                            title="Outreach Copilot"
                          >
                            <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 dark:border-zinc-800/80 rounded-2xl text-[10px] font-bold text-gray-400 dark:text-gray-600 tracking-wider">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Details Drawer */}
      {isDrawerOpen && selectedDeal && (
        <div className="fixed inset-0 z-40 overflow-hidden animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                  {selectedDeal.investorName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-md font-black text-gray-900 dark:text-white leading-tight">
                    {selectedDeal.investorName}
                  </h3>
                  <Link
                    href={`/dashboard/investors/${selectedDeal.investorId}`}
                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline mt-0.5 block"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Deal Size Setting */}
              <div className="space-y-2 bg-gray-50/50 dark:bg-black/10 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <CurrencyDollar className="w-4 h-4 text-yellow-500" />
                  Target Deal Value
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={dealAmountInput}
                    onChange={(e) => setDealAmountInput(e.target.value)}
                    className="flex-1 p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500/20 outline-none dark:text-white"
                  />
                  <button
                    onClick={handleSaveAmount}
                    className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Pipeline Stage Select dropdown */}
              <div className="space-y-2 bg-gray-50/50 dark:bg-black/10 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <TrendUp className="w-4 h-4 text-yellow-500" />
                  Pipeline Stage
                </label>
                <select
                  value={selectedDeal.stage}
                  onChange={async (e) => {
                    const nextStage = e.target.value;
                    try {
                      const res = await fetch(`/api/pipeline/${selectedDeal.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ stage: nextStage }),
                      });
                      if (res.ok) {
                        toast.success("Deal stage updated!");
                        fetchPipeline(false);
                      }
                    } catch (e) {
                      toast.error("Failed to update stage");
                    }
                  }}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500/20 outline-none dark:text-white"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Advanced Fit Score breakdown details */}
              {selectedDeal.fitBreakdown && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Sophia Compatibility Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-400 font-bold block">Sector Match</span>
                      <span className="text-lg font-black text-gray-800 dark:text-white">{selectedDeal.fitBreakdown.sector}%</span>
                    </div>
                    <div className="p-3 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-400 font-bold block">Stage Match</span>
                      <span className="text-lg font-black text-gray-800 dark:text-white">{selectedDeal.fitBreakdown.stage}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {selectedDeal.fitBreakdown.reasons.slice(0, 2).map((r: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders / Tasks Scheduler */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Tasks & Follow-Ups
                </h4>
                
                {/* Add Reminder Form */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Task details (e.g. Share pitch deck)..."
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-xl text-xs outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                    />
                    <button
                      onClick={handleAddReminder}
                      className="px-4 bg-yellow-500 text-white rounded-xl text-xs font-bold hover:bg-yellow-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" weight="bold" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Reminders List */}
                <div className="space-y-2">
                  {selectedDeal.reminders.map(rem => (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between p-3 border border-gray-100 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={rem.is_completed}
                          onChange={() => handleToggleReminder(rem.id)}
                          className="w-4 h-4 rounded text-yellow-500 border-gray-300 focus:ring-yellow-500"
                        />
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-xs font-medium dark:text-white",
                            rem.is_completed && "line-through text-gray-400 dark:text-gray-600"
                          )}>
                            {rem.description}
                          </span>
                          <span className="text-[9px] text-gray-400 mt-0.5">
                            Due: {new Date(rem.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveReminder(rem.id)}
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed Log */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Activity Feed & Comments
                </h4>

                {/* Add Comment Input */}
                <div className="flex gap-2">
                  <textarea
                    placeholder="Log a call, meeting or write notes..."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    rows={2}
                    className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                  />
                  <button
                    onClick={handleAddLog}
                    className="px-4 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:bg-black self-end py-3 cursor-pointer"
                  >
                    Log
                  </button>
                </div>

                {/* Activity Feed List */}
                <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-gray-100 dark:before:bg-zinc-800/80">
                  {selectedDeal.activityLog.map((log, idx) => (
                    <div key={idx} className="flex gap-3 relative z-10">
                      <div className="w-6.5 h-6.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        {log.type === "stage_change" ? (
                          <TrendUp className="w-3.5 h-3.5 text-yellow-500" />
                        ) : log.type === "reminder" ? (
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Note className="w-3.5 h-3.5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {log.description}
                        </span>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          {new Date(log.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-150 dark:border-zinc-800 flex justify-between shrink-0 z-10">
              <button
                onClick={() => handleDeleteDeal(selectedDeal.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
              >
                <Trash className="w-4 h-4" />
                Remove Deal
              </button>
              <button
                onClick={() => {
                  setActiveCopilotDeal(selectedDeal);
                  setIsCopilotOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-yellow-500 text-white rounded-xl text-xs font-bold hover:bg-yellow-600 transition-all cursor-pointer"
              >
                Outreach Copilot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outreach Copilot Modal */}
      {isCopilotOpen && (activeCopilotDeal || selectedDeal) && (
        <OutreachCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => {
            setIsCopilotOpen(false);
            setActiveCopilotDeal(null);
          }}
          startupId={(activeCopilotDeal || selectedDeal)!.startupId}
          investorId={(activeCopilotDeal || selectedDeal)!.investorId}
          investorName={(activeCopilotDeal || selectedDeal)!.investorName}
        />
      )}
    </div>
  );
}

// Simple Icon fallback wrappers as Phosphor icons might have minor variations
function MagnifyingGlassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
