"use client";

import { useEffect, useState } from "react";
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
  TrendUp
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PipelineInvestor {
  id: string;
  name: string;
  website: string;
  type: string;
  location: string;
  status: "Not Contacted" | "Emailed" | "In Conversation" | "Due Diligence";
}

const STATUS_OPTIONS = [
  { label: "Not Contacted", value: "Not Contacted", color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400", icon: CheckCircle },
  { label: "Emailed", value: "Emailed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: EnvelopeSimple },
  { label: "In Conversation", value: "In Conversation", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: ChatCircleDots },
  { label: "Due Diligence", value: "Due Diligence", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Handshake },
];

export default function PipelinePage() {
  const { user, token } = useAuth();
  const [investors, setInvestors] = useState<PipelineInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        setInvestors(prev => prev.map(inv => 
          inv.id === investorId ? { ...inv, status: newStatus as any } : inv
        ));
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

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            Manage and track your outreach to shortlisted investors.
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
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Stage Distribution</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Pipeline Health</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-2">
                <TrendUp className="w-4 h-4 text-green-500" weight="bold" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-300">Active Outreach</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-end h-48 px-4">
              {STATUS_OPTIONS.map((opt) => {
                const count = investors.filter(i => (i.status || "Not Contacted") === opt.value).length;
                const maxCount = Math.max(...STATUS_OPTIONS.map(o => investors.filter(i => (i.status || "Not Contacted") === o.value).length), 1);
                const heightPercent = (count / maxCount) * 100;
                
                return (
                  <div key={opt.value} className="flex flex-col items-center gap-4 group">
                    <div className="relative w-full h-full flex flex-col justify-end">
                      {/* Bar Background */}
                      <div className="absolute inset-0 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-100 dark:border-white/5"></div>
                      
                      {/* Bar Fill */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          "relative rounded-2xl transition-all duration-1000 ease-out group-hover:opacity-80 shadow-lg",
                          opt.color.split(" ")[0].replace("bg-gray-100", "bg-zinc-300 dark:bg-zinc-700")
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
                      <p className="text-sm font-black text-gray-900 dark:text-white">{count}</p>
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
                    strokeDashoffset={364 - (364 * (investors.filter(i => i.status && i.status !== "Not Contacted").length / (investors.length || 1)))}
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {Math.round((investors.filter(i => i.status && i.status !== "Not Contacted").length / (investors.length || 1)) * 100)}%
                  </span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Engaged</span>
                </div>
             </div>
             <div>
                <h4 className="font-black text-gray-900 dark:text-white tracking-tight">Outreach Index</h4>
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
                <th className="py-6 pl-8">Investor</th>
                <th className="py-6">Outreach Status</th>
                <th className="py-6">Type</th>
                <th className="py-6">Location</th>
                <th className="py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {filteredInvestors.map((inv) => (
                <tr key={inv.id} className="group hover:bg-gray-50/30 transition-colors dark:hover:bg-white/5">
                  <td className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-yellow-500/20">
                        {inv.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 dark:text-white tracking-tight">{inv.name}</p>
                        <a href={inv.website} target="_blank" className="text-[11px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors">
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
                          STATUS_OPTIONS.find(s => s.value === (inv.status || "Not Contacted"))?.color,
                          updatingId === inv.id && "opacity-50 pointer-events-none"
                        )}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                         {updatingId === inv.id ? (
                           <CircleNotch className="w-3 h-3 animate-spin" weight="bold" />
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
                    <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-yellow-500 hover:text-white transition-all dark:bg-black/40 dark:hover:bg-yellow-500">
                      <ChatCircleDots className="w-5 h-5" weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" />
              <p className="font-bold text-gray-400 animate-pulse">Summoning your pipeline...</p>
            </div>
          )}

          {!loading && filteredInvestors.length === 0 && (
            <div className="text-center py-20 px-8">
               <div className="w-20 h-20 bg-gray-50 dark:bg-black/40 rounded-4xl flex items-center justify-center mx-auto mb-6">
                  <Handshake className="w-10 h-10 text-gray-300 dark:text-zinc-700" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No investors in your pipeline</h3>
               <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                 Add investors from the database to your shortlist to start tracking your deals.
               </p>
               <Link href="/dashboard/investors" className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 text-white rounded-xl font-black text-sm hover:bg-yellow-600 shadow-xl shadow-yellow-500/20 transition-all">
                  Browse Database
               </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Saved", value: investors.length, icon: CheckCircle, color: "text-blue-500" },
            { label: "Active Conversations", value: investors.filter(i => i.status === "In Conversation").length, icon: ChatCircleDots, color: "text-purple-500" },
            { label: "Deep Due Diligence", value: investors.filter(i => i.status === "Due Diligence").length, icon: Handshake, color: "text-amber-500" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="glass-card p-6 rounded-3xl border border-white/50 flex items-center gap-4 dark:bg-zinc-900/60 dark:border-zinc-800">
                <div className={cn("w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center dark:bg-zinc-800", stat.color)}>
                  <Icon className="w-6 h-6" weight="bold" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
