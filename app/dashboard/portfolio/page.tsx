"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  RocketLaunch,
  CurrencyDollar,
  Hourglass,
  TrendDown,
  CircleNotch,
  ArrowUpRight,
  ChartPieSlice,
  Funnel,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterSector, setFilterSector] = useState("all");

  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/portfolio/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        toast.error("Failed to load portfolio stats.");
      }
    } catch (err) {
      console.error("Failed to fetch portfolio analytics:", err);
      toast.error("Network error loading portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortfolio();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500 mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider">Analyzing portfolio intelligence...</p>
      </div>
    );
  }

  const startupsList = data?.startups || [];
  
  // Unique sectors for filter dropdown
  const sectors = ["all", ...Array.from(new Set(startupsList.map((s: any) => s.sector)))];

  // Filtered startups
  const filteredStartups = startupsList.filter(
    (s: any) => filterSector === "all" || s.sector === filterSector
  );

  // Recalculate summary metrics if filtered
  const totalMRR = filteredStartups.reduce((sum: number, s: any) => sum + s.mrr, 0);
  const totalARR = filteredStartups.reduce((sum: number, s: any) => sum + s.arr, 0);
  const totalCash = filteredStartups.reduce((sum: number, s: any) => sum + s.cash_on_hand, 0);
  const totalFunding = filteredStartups.reduce((sum: number, s: any) => sum + s.funding_amount, 0);
  const combinedBurn = filteredStartups.reduce((sum: number, s: any) => sum + s.monthly_burn, 0);
  const combinedRunway = combinedBurn > 0 ? parseFloat((totalCash / combinedBurn).toFixed(1)) : 999;

  // Formatting helpers
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  // Color mapping based on cash runway health
  const getRunwayColor = (months: number) => {
    if (months >= 18) return "text-green-500 dark:text-green-400";
    if (months >= 12) return "text-yellow-600 dark:text-yellow-450";
    if (months >= 6) return "text-orange-500";
    return "text-red-500 font-bold animate-pulse";
  };

  const getRunwayBg = (months: number) => {
    if (months >= 18) return "bg-green-500/10 border-green-500/20";
    if (months >= 12) return "bg-yellow-500/10 border-yellow-500/20";
    if (months >= 6) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto selection:bg-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight dark:text-white flex items-center gap-2">
            <ChartPieSlice className="w-7 h-7 text-yellow-500" />
            Portfolio Intelligence
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Consolidated overview and cross-company financial benchmarking for your holdings.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl shadow-xs">
            <Funnel className="w-4 h-4 text-zinc-400" />
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none outline-none dark:text-zinc-350 cursor-pointer"
            >
              {sectors.map((sec: any) => (
                <option key={sec} value={sec} className="dark:bg-zinc-950">
                  {sec === "all" ? "All Sectors" : sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Executive Key Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Portfolio ARR */}
        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-450 flex items-center justify-center shrink-0">
            <CurrencyDollar className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Portfolio ARR</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(totalARR)}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">MRR: {formatCurrency(totalMRR)}</span>
          </div>
        </div>

        {/* Card 2: Consolidated Cash Balance */}
        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CurrencyDollar className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Combined Cash</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(totalCash)}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Raised: {formatCurrency(totalFunding)}</span>
          </div>
        </div>

        {/* Card 3: Combined net burn */}
        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-550 flex items-center justify-center shrink-0">
            <TrendDown className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Monthly Net Burn</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(combinedBurn)}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Across portfolio startups</span>
          </div>
        </div>

        {/* Card 4: Combined Runway */}
        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <Hourglass className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Combined Runway</span>
            <span className={cn("text-xl font-black block", getRunwayColor(combinedRunway))}>
              {combinedRunway === 999 ? "∞ Infinite" : `${combinedRunway} Mos`}
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Weighted average rate</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      {filteredStartups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: MRR Comparison */}
          <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-450 block">Monthly Revenue (MRR) Benchmark</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredStartups} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "1rem" }}
                    itemStyle={{ color: "#fff", fontSize: "11px" }}
                    labelStyle={{ color: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                  />
                  <Bar dataKey="mrr" fill="#E5C158" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cash Runway Comparison */}
          <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-455 block">Net Cash Runway (Months)</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredStartups} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "1rem" }}
                    itemStyle={{ color: "#fff", fontSize: "11px" }}
                    labelStyle={{ color: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                  />
                  <ReferenceLine y={12} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "12M Target", fill: "#f59e0b", fontSize: 9, position: "top" }} />
                  <Bar dataKey="runway" radius={[8, 8, 0, 0]} barSize={32}>
                    {filteredStartups.map((entry: any, index: number) => {
                      let color = "#10b981"; // green
                      if (entry.runway < 6) color = "#ef4444"; // red
                      else if (entry.runway < 12) color = "#f97316"; // orange
                      else if (entry.runway < 18) color = "#eab308"; // yellow
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {/* Startups detailed list grid / table */}
      <div className="glass-card rounded-3xl border border-white/60 bg-white/40 dark:bg-zinc-900/60 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-150 dark:border-zinc-800 flex justify-between items-center bg-white/20 dark:bg-zinc-950/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-450">Holding Startups Ledger</span>
          <span className="text-xs text-zinc-500 font-mono">Count: {filteredStartups.length}</span>
        </div>

        {filteredStartups.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto dark:bg-white/5 text-gray-400">
              <RocketLaunch className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">No holding startups found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Add holding startups, or complete investor cap table allocations, to track their runway health metrics here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150/60 dark:border-zinc-800/80 text-[10px] uppercase tracking-wider text-zinc-400 font-black">
                  <th className="py-4 px-6">Startup</th>
                  <th className="py-4 px-6">Sector & Stage</th>
                  <th className="py-4 px-6 text-right">ARR (MRR)</th>
                  <th className="py-4 px-6 text-right">Cash Balance</th>
                  <th className="py-4 px-6 text-right">Net Burn</th>
                  <th className="py-4 px-6 text-center">Runway Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/40 dark:divide-zinc-800/40 text-xs">
                {filteredStartups.map((startup: any) => (
                  <tr
                    key={startup.id}
                    className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/startups/${startup.id}`)}
                  >
                    {/* Name & Logo */}
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 overflow-hidden", startup.logoColor)}>
                        <BrandLogo name={startup.name} logo_url={startup.logo_url} initial={startup.logoInitial} />
                      </div>
                      <div className="font-bold text-gray-900 group-hover:text-black dark:text-white dark:group-hover:text-white transition-colors">
                        <span className="flex items-center gap-1">
                          {startup.name}
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[10px] text-gray-400 block font-normal">{startup.location}</span>
                      </div>
                    </td>

                    {/* Sector & Stage */}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-700 dark:text-zinc-300 block">{startup.sector}</span>
                      <span className="text-[10px] text-gray-400 block">{startup.stage}</span>
                    </td>

                    {/* ARR / MRR */}
                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {formatCurrency(startup.arr)}
                      <span className="text-[9px] text-zinc-400 block font-normal">({formatCurrency(startup.mrr)}/mo)</span>
                    </td>

                    {/* Cash Balance */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(startup.cash_on_hand)}
                      <span className="text-[9px] text-zinc-400 block font-normal">Raised: {formatCurrency(startup.funding_amount)}</span>
                    </td>

                    {/* Net Burn */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-orange-600 dark:text-orange-500">
                      {formatCurrency(startup.monthly_burn)}
                      <span className="text-[9px] text-zinc-400 block font-normal">/ month</span>
                    </td>

                    {/* Runway */}
                    <td className="py-4 px-6 text-center">
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", getRunwayBg(startup.runway))}>
                        {startup.runway === 999 ? "∞ Runway" : `${startup.runway} Months`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
