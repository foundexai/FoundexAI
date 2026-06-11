"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CircleNotch,
  CaretDown,
  CheckCircle,
  EnvelopeSimple,
  ChatCircleDots,
  Handshake,
  MagnifyingGlass,
  Funnel,
  ChartBar,
  ChartPie,
  TrendUp,
  X,
  PaperPlaneTilt,
  Sparkle,
  Paperclip,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PipelineInvestor {
  id: string;
  name: string;
  website: string;
  type: string;
  location: string;
  status: "Not Contacted" | "Emailed" | "In Conversation" | "Due Diligence";
}

const STATUS_OPTIONS = [
  {
    label: "Not Contacted",
    value: "Not Contacted",
    color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400",
    icon: CheckCircle,
  },
  {
    label: "Emailed",
    value: "Emailed",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: EnvelopeSimple,
  },
  {
    label: "In Conversation",
    value: "In Conversation",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: ChatCircleDots,
  },
  {
    label: "Due Diligence",
    value: "Due Diligence",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Handshake,
  },
];

export default function PipelinePage() {
  const { user, token } = useAuth();
  const [investors, setInvestors] = useState<PipelineInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Chat Sidebar States
  const [activeChatInvestor, setActiveChatInvestor] =
    useState<PipelineInvestor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedDocUrl, setAttachedDocUrl] = useState("");
  const [attachedDocName, setAttachedDocName] = useState("");
  const [startupDocs, setStartupDocs] = useState<any[]>([]);
  const [aiFormatting, setAiFormatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch startup documents for sharing in chat
  useEffect(() => {
    async function fetchDocs() {
      if (!token) return;
      try {
        const res = await fetch("/api/startups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.startups && data.startups[0]) {
            setStartupDocs(data.startups[0].documents || []);
          }
        }
      } catch (err) {
        console.error("Failed to load documents for pipeline sharing", err);
      }
    }
    fetchDocs();
  }, [token]);

  // Load chat messages when active investor changes
  useEffect(() => {
    if (!activeChatInvestor) return;
    const investor = activeChatInvestor;
    async function loadChat() {
      try {
        const res = await fetch(`/api/pipeline/chat?investorId=${investor.id}`);
        if (res.ok) {
          const data = await res.json();
          // Map database key fields (created_at) to match original format (date)
          const formatted = (data.messages || []).map((m: any) => ({
            sender: m.sender,
            text: m.text,
            date: m.created_at,
            sharedDoc: m.sharedDoc,
          }));

          if (formatted.length > 0) {
            setChatMessages(formatted);
          } else {
            // Seed defaults if no messages exist yet
            const initial = [
              {
                sender: "founder",
                text: `Hi ${investor.name} team, we are excited to share our progress and business model details with you. Let us know if you have any questions about our sector fit.`,
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
              },
            ];

            if (
              investor.status === "In Conversation" ||
              investor.status === "Due Diligence"
            ) {
              initial.push({
                sender: "investor",
                text: `Thanks for the intro! Your company profile looks interesting and aligns with our sub-Saharan tech focus. Could you please share your latest pitch deck and financials deck here?`,
                date: new Date(Date.now() - 86400000).toISOString(),
              });
            }
            setChatMessages(initial);
          }
        }
      } catch (err) {
        console.error("Failed to load pipeline chat logs from API", err);
      }
    }
    loadChat();
  }, [activeChatInvestor]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  const cleanTextLocal = () => {
    if (!inputText) return;
    const cleaned = inputText.replace(/[\*#_`~]/g, "").trim();
    setInputText(cleaned);
    toast.success("Text formatted: stripped markdown symbols");
  };

  const handleAIPolish = async () => {
    if (!inputText.trim()) return;
    setAiFormatting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const polished = `Dear ${activeChatInvestor?.name || "Investor"} Team,

I hope this message finds you well. 

I would like to share the following details regarding our startup model for your consideration:

${inputText.replace(/[\*#_`~]/g, "").trim()}

Please let me know if you are open to scheduling a brief introductory call.

Best regards,
${user?.full_name || "Founder"}`;
      setInputText(polished);
      toast.success("AI Polish completed");
    } catch (e) {
      toast.error("AI formatter error");
    } finally {
      setAiFormatting(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!inputText.trim() && !attachedDocUrl) return;
    if (!activeChatInvestor) return;

    try {
      const res = await fetch("/api/pipeline/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          investorId: activeChatInvestor.id,
          text: inputText,
          sender: user?.user_type === "investor" ? "investor" : "founder",
          ...(attachedDocUrl && {
            sharedDoc: {
              name: attachedDocName,
              url: attachedDocUrl,
            },
          }),
        }),
      });

      if (!res.ok) throw new Error("Failed to send chat message via API");

      // Reload chat instantly after sending to fetch the updated message list
      const reloadRes = await fetch(
        `/api/pipeline/chat?investorId=${activeChatInvestor.id}`,
      );
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        const formatted = (reloadData.messages || []).map((m: any) => ({
          sender: m.sender,
          text: m.text,
          date: m.created_at,
          sharedDoc: m.sharedDoc,
        }));
        setChatMessages(formatted);
      }

      setInputText("");
      setAttachedDocUrl("");
      setAttachedDocName("");

      // Simulate standard investor response alert
      setTimeout(() => {
        toast.info(`New message from ${activeChatInvestor.name}`);
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    async function fetchSaved() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch("/api/investors/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInvestors(data.investors || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [user, token]);

  const updateStatus = async (investorId: string, newStatus: string) => {
    setUpdatingId(investorId);
    try {
      const res = await fetch("/api/investors/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId, status: newStatus }),
      });

      if (res.ok) {
        setInvestors((prev) =>
          prev.map((inv) =>
            inv.id === investorId ? { ...inv, status: newStatus as any } : inv,
          ),
        );
        toast.success(`Updated to ${newStatus}`);
      } else {
        throw new Error("Failed to update");
      }
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInvestors = investors.filter((inv) =>
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-2 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft weight="bold" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight dark:text-white">
            Deal <span className="text-yellow-500">Pipeline</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {user?.user_type === "investor"
              ? "Review and respond to founder outreach and deal requests."
              : "Manage and track your outreach to shortlisted investors."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pipeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all w-full md:w-64 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
            />
          </div>
          <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-400">
            <Funnel className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {!loading && investors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Funnel Statistics */}
          <div className="lg:col-span-3 glass-card p-8 rounded-[2.5rem] border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <ChartBar className="w-6 h-6 text-white" weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    Stage Distribution
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                    Pipeline Health
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-2">
                <TrendUp className="w-4 h-4 text-green-500" weight="bold" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                  Active Outreach
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-end h-48 px-4">
              {STATUS_OPTIONS.map((opt) => {
                const count = investors.filter(
                  (i) => (i.status || "Not Contacted") === opt.value,
                ).length;
                const maxCount = Math.max(
                  ...STATUS_OPTIONS.map(
                    (o) =>
                      investors.filter(
                        (i) => (i.status || "Not Contacted") === o.value,
                      ).length,
                  ),
                  1,
                );
                const heightPercent = (count / maxCount) * 100;

                return (
                  <div
                    key={opt.value}
                    className="flex flex-col items-center gap-4 group"
                  >
                    <div className="relative w-full h-full flex flex-col justify-end">
                      {/* Bar Background */}
                      <div className="absolute inset-0 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-100 dark:border-white/5"></div>

                      {/* Bar Fill */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          "relative rounded-2xl transition-all duration-1000 ease-out group-hover:opacity-80 shadow-lg",
                          opt.color
                            .split(" ")[0]
                            .replace(
                              "bg-gray-100",
                              "bg-zinc-300 dark:bg-zinc-700",
                            ),
                        )}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {count} Investors
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[80px]">
                        {opt.label.split(" ")[0]}
                      </p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">
                        {count}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Efficiency Metric */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800 flex flex-col justify-center items-center text-center space-y-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-gray-100 dark:text-white/5"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
                <circle
                  className="text-yellow-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={364}
                  strokeDashoffset={
                    364 -
                    364 *
                      (investors.filter(
                        (i) => i.status && i.status !== "Not Contacted",
                      ).length /
                        (investors.length || 1))
                  }
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round(
                    (investors.filter(
                      (i) => i.status && i.status !== "Not Contacted",
                    ).length /
                      (investors.length || 1)) *
                      100,
                  )}
                  %
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                  Engaged
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white tracking-tight">
                Outreach Index
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[140px] mt-1">
                Ratio of contacted investors vs. total shortlisted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="glass-card rounded-[2.5rem] border border-white/50 overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800 shadow-2xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-black/20 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100 dark:border-zinc-800">
                <th className="py-6 pl-8">
                  {user?.user_type === "investor" ? "Startup" : "Investor"}
                </th>
                <th className="py-6">Outreach Status</th>
                <th className="py-6">Type</th>
                <th className="py-6">Location</th>
                <th className="py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {filteredInvestors.map((inv) => (
                <tr
                  key={inv.id}
                  className="group hover:bg-gray-50/30 transition-colors dark:hover:bg-white/5"
                >
                  <td className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-yellow-500/20">
                        {inv.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 dark:text-white tracking-tight">
                          {inv.name}
                        </p>
                        <a
                          href={inv.website}
                          target="_blank"
                          className="text-[11px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="relative inline-block text-left group/dropdown">
                      <select
                        disabled={updatingId === inv.id}
                        value={inv.status || "Not Contacted"}
                        onChange={(e) => updateStatus(inv.id, e.target.value)}
                        className={cn(
                          "appearance-none pl-4 pr-10 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-transparent transition-all cursor-pointer focus:ring-4 outline-none",
                          STATUS_OPTIONS.find(
                            (s) => s.value === (inv.status || "Not Contacted"),
                          )?.color,
                          updatingId === inv.id &&
                            "opacity-50 pointer-events-none",
                        )}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                        {updatingId === inv.id ? (
                          <CircleNotch
                            className="w-3 h-3 animate-spin"
                            weight="bold"
                          />
                        ) : (
                          <CaretDown className="w-3 h-3" weight="bold" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400 px-3 py-1 rounded-lg">
                      {inv.type}
                    </span>
                  </td>
                  <td className="py-6 text-sm font-bold text-gray-600 dark:text-gray-400 italic">
                    {inv.location}
                  </td>
                  <td className="py-6 pr-8 text-right">
                    <button
                      onClick={() => {
                        setActiveChatInvestor(inv);
                        setIsChatOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-yellow-500 hover:text-white transition-all dark:bg-black/40 dark:hover:bg-yellow-500 cursor-pointer"
                      title="Outreach Requests & Messaging"
                    >
                      <ChatCircleDots
                        className="w-5 h-5 text-yellow-500"
                        weight="bold"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" />
              <p className="font-bold text-gray-400 animate-pulse">
                Summoning your pipeline...
              </p>
            </div>
          )}

          {!loading && filteredInvestors.length === 0 && (
            <div className="text-center py-20 px-8">
              <div className="w-20 h-20 bg-gray-50 dark:bg-black/40 rounded-4xl flex items-center justify-center mx-auto mb-6">
                <Handshake className="w-10 h-10 text-gray-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.user_type === "investor"
                  ? "No startups in pipeline"
                  : "No investors in your pipeline"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                {user?.user_type === "investor"
                  ? "Once founders share a request with you, their profiles and message will appear here."
                  : "Add investors from the database to your shortlist to start tracking your deals."}
              </p>
              {user?.user_type !== "investor" && (
                <Link
                  href="/dashboard/investors"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 text-white rounded-xl font-black text-sm hover:bg-yellow-600 shadow-xl shadow-yellow-500/20 transition-all"
                >
                  Browse Database
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label:
              user?.user_type === "investor" ? "Total Startups" : "Total Saved",
            value: investors.length,
            icon: CheckCircle,
            color: "text-blue-500",
          },
          {
            label: "Active Conversations",
            value: investors.filter((i) => i.status === "In Conversation")
              .length,
            icon: ChatCircleDots,
            color: "text-purple-500",
          },
          {
            label: "Deep Due Diligence",
            value: investors.filter((i) => i.status === "Due Diligence").length,
            icon: Handshake,
            color: "text-amber-500",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="glass-card p-6 rounded-3xl border border-white/50 flex items-center gap-4 dark:bg-zinc-900/60 dark:border-zinc-800"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center dark:bg-zinc-800",
                  stat.color,
                )}
              >
                <Icon className="w-6 h-6" weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outreach Requests & Chat Drawer */}
      {isChatOpen && activeChatInvestor && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-zinc-950 border-l border-zinc-900 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-400 text-black font-black text-sm">
                {activeChatInvestor?.name?.charAt(0) || ""}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white leading-tight">
                  {activeChatInvestor?.name}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {activeChatInvestor?.type}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsChatOpen(false);
                setActiveChatInvestor(null);
              }}
              className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-900/10">
            {chatMessages.map((msg, idx) => {
              const isMyMessage =
                msg.sender ===
                (user?.user_type === "investor" ? "investor" : "founder");
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-1",
                    isMyMessage ? "ml-auto items-end" : "mr-auto items-start",
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed wrap-break-word shadow-sm border",
                      isMyMessage
                        ? "bg-zinc-800 border-zinc-700 text-white rounded-br-none"
                        : "bg-zinc-950 border-zinc-850 text-zinc-300 rounded-bl-none",
                    )}
                  >
                    {msg.text && (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {msg.sharedDoc && (
                      <div className="mt-2 p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-[10px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle
                            className="w-3.5 h-3.5 text-yellow-500 shrink-0"
                            weight="bold"
                          />
                          <span className="font-bold text-white truncate max-w-[120px]">
                            {msg.sharedDoc.name}
                          </span>
                        </div>
                        <a
                          href={msg.sharedDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded font-black text-[9px] uppercase tracking-wider shrink-0 transition-colors"
                        >
                          Open
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-zinc-500 font-medium px-1">
                    {msg.date ? format(new Date(msg.date), "h:mm a") : "Sent"}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0 pb-[safe-area-inset-bottom] space-y-3">
            {/* Attachment Bar */}
            {user?.user_type !== "investor" && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
                  Attach Document:
                </span>
                {startupDocs.length === 0 ? (
                  <span className="text-[9px] text-zinc-650 italic">
                    No startup documents found.
                  </span>
                ) : (
                  <select
                    value={attachedDocUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      const doc = startupDocs.find((d) => d.url === url);
                      setAttachedDocUrl(url);
                      setAttachedDocName(doc ? doc.name : "");
                      if (url) {
                        toast.success(
                          `Attached document: ${doc ? doc.name : "Pitch Deck"}`,
                        );
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold text-zinc-300 py-1 px-2 focus:outline-none max-w-[180px] truncate"
                  >
                    <option value="">-- Attach Memo/Deck --</option>
                    {startupDocs.map((doc, idx) => (
                      <option key={idx} value={doc.url}>
                        {doc.name} ({doc.type})
                      </option>
                    ))}
                  </select>
                )}
                {attachedDocUrl && (
                  <button
                    onClick={() => {
                      setAttachedDocUrl("");
                      setAttachedDocName("");
                    }}
                    className="text-red-500 hover:text-red-400 text-[9px] font-black uppercase tracking-wider"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Input Box */}
            <div className="relative border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-900/20 focus-within:border-yellow-500/50 transition-colors">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your outreach request memo..."
                className="w-full bg-transparent text-xs p-3.5 pb-12 outline-none h-20 resize-none text-white leading-relaxed placeholder:text-zinc-600"
              />

              {/* Formatter Helpers Row */}
              <div className="absolute left-3 bottom-3 flex items-center gap-1.5">
                <button
                  onClick={cleanTextLocal}
                  disabled={!inputText}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-45 cursor-pointer"
                  title="Format: Clean markdown markup"
                >
                  <ArrowSquareOut className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  onClick={handleAIPolish}
                  disabled={!inputText || aiFormatting}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-45 cursor-pointer"
                  title="AI Polish"
                >
                  {aiFormatting ? (
                    <CircleNotch className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                  ) : (
                    <Sparkle
                      className="w-3.5 h-3.5 text-yellow-500"
                      weight="fill"
                    />
                  )}
                  <span className="text-[9px] font-bold text-zinc-400 hidden sm:inline">
                    AI Format
                  </span>
                </button>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendChatMessage}
                disabled={!inputText.trim() && !attachedDocUrl}
                className="absolute right-3 bottom-3 p-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 text-black disabled:text-zinc-600 rounded-lg transition-colors cursor-pointer"
                title="Send Message"
              >
                <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
