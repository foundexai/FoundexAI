"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UsersThree,
  ChartPie,
  Plus,
  Trash,
  CircleNotch,
  Percent,
  Coins,
  ShieldCheck,
  Briefcase,
  X,
  CheckCircle,
  TrendUp,
  CurrencyDollar,
  Sliders,
  CaretDown,
  CaretUp,
  NotePencil,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  FileText,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import { runWaterfallSimulation, WaterfallSimulationOutput } from "@/lib/waterfall";

interface Shareholder {
  _id: string;
  shareholder_name: string;
  shareholder_type: "founder" | "investor" | "employee" | "advisor";
  email?: string;
  share_class: string;
  share_count: number;
  ownership_pct: number;
  investment_amount: number;
  price_per_share: number;
  grant_date: string;
  esop_vesting?: {
    is_vesting: boolean;
    total_months: number;
    cliff_months: number;
    calculated_vested_shares: number;
    unvested_shares: number;
  };
  notes?: string;
}

interface SummaryData {
  totalIssuedShares: number;
  totalCapitalRaised: number;
  totalEsopPool: number;
  totalVestedEsop: number;
  totalUnvestedEsop: number;
  classTotals: Record<string, { shares: number; capital: number }>;
}

export default function CapTablePage() {
  const { user, loading, token, activeStartupId, setActiveStartupId, startups: authStartups } = useAuth();
  const router = useRouter();

  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [userStartups, setUserStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>("");

  // Search & Pagination States
  const [shareholderSearchQuery, setShareholderSearchQuery] = useState("");
  const [shareholderCurrentPage, setShareholderCurrentPage] = useState(1);
  const shareholdersPerPage = 5;

  // Waterfall & Dilution Simulation States
  const [exitValuation, setExitValuation] = useState<number>(15000000); // Default $15M exit
  const [liquidationMultiple, setLiquidationMultiple] = useState<number>(1.0);
  const [showDilutionControls, setShowDilutionControls] = useState<boolean>(false);
  const [newInvestment, setNewInvestment] = useState<number>(0);
  const [preMoneyValuation, setPreMoneyValuation] = useState<number>(0);
  const [newOptionPoolPct, setNewOptionPoolPct] = useState<number>(0);

  const [waterfallResult, setWaterfallResult] = useState<WaterfallSimulationOutput | null>(null);

  // Modal Form State
  const [form, setForm] = useState({
    shareholderName: "",
    shareholderType: "investor",
    email: "",
    shareClass: "Common",
    shareCount: "",
    investmentAmount: "",
    pricePerShare: "",
    grantDate: new Date().toISOString().split("T")[0],
    isVesting: false,
    totalMonths: "48",
    cliffMonths: "12",
    notes: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : undefined;
      const activeId = activeStartupId || storedId || undefined;
      loadCapTable(activeId);
    }
  }, [user, loading, router, activeStartupId]);

  async function loadCapTable(targetStartupId?: string) {
    setIsLoading(true);
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!authToken) return;

    try {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
      const activeId = targetStartupId || activeStartupId || selectedStartupId || storedId || "";
      const url = activeId ? `/api/captable?startup_id=${activeId}` : "/api/captable";
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "x-startup-id": activeId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setShareholders(data.shareholders || []);
        setSummary(data.summary || null);
        setAuditLogs(data.auditLogs || []);
        if (data.userStartups && data.userStartups.length > 0) {
          setUserStartups(data.userStartups.map((s: any) => ({ ...s, _id: String(s._id) })));
        }
        if (data.currentStartup?._id) {
          setSelectedStartupId(String(data.currentStartup._id));
        }
      }
    } catch (err) {
      console.error("Failed to load cap table", err);
      toast.error("Failed to load cap table data.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartupSwitch = (newStartupId: string) => {
    setSelectedStartupId(newStartupId);
    if (setActiveStartupId) {
      setActiveStartupId(newStartupId);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("activeStartupId", newStartupId);
    }
    loadCapTable(newStartupId);
  };

  // Recalculate Waterfall Simulation whenever inputs or shareholders change
  useEffect(() => {
    if (shareholders.length === 0) {
      setWaterfallResult(null);
      return;
    }

    const formattedEntries = shareholders.map((s) => ({
      _id: s._id,
      shareholder_name: s.shareholder_name,
      shareholder_type: s.shareholder_type,
      share_class: s.share_class,
      share_count: s.share_count || 0,
      investment_amount: s.investment_amount || 0,
    }));

    const result = runWaterfallSimulation(formattedEntries, {
      exitValuation,
      liquidationMultiple,
      newInvestment,
      preMoneyValuation,
      newOptionPoolPct,
    });

    setWaterfallResult(result);
  }, [shareholders, exitValuation, liquidationMultiple, newInvestment, preMoneyValuation, newOptionPoolPct]);

  const handleCreateShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shareholderName || !form.shareCount) {
      toast.error("Shareholder name and share count are required");
      return;
    }

    setIsSubmitting(true);
    const authToken = token || localStorage.getItem("token");

    try {
      const url = "/api/captable";
      const method = editingShareholder ? "PUT" : "POST";
      const bodyPayload = editingShareholder 
        ? { id: editingShareholder._id, startupId: selectedStartupId, ...form }
        : { startupId: selectedStartupId, ...form };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${editingShareholder ? "update" : "add"} shareholder`);

      toast.success(editingShareholder ? "Equity Grant Updated!" : "Equity Grant Added!", {
        description: editingShareholder
          ? `Successfully updated equity grant for ${form.shareholderName}.`
          : `Successfully registered ${Number(form.shareCount).toLocaleString()} shares to ${form.shareholderName}.`,
      });

      setIsAddModalOpen(false);
      setEditingShareholder(null);
      setForm({
        shareholderName: "",
        shareholderType: "investor",
        email: "",
        shareClass: "Common",
        shareCount: "",
        investmentAmount: "",
        pricePerShare: "",
        grantDate: new Date().toISOString().split("T")[0],
        isVesting: false,
        totalMonths: "48",
        cliffMonths: "12",
        notes: "",
      });

      loadCapTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to process equity request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShareholder = async () => {
    if (!deleteId) return;
    const authToken = token || localStorage.getItem("token");

    try {
      const res = await fetch(`/api/captable?id=${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        toast.success("Shareholder entry deleted");
        loadCapTable();
      }
    } catch (err) {
      toast.error("Failed to delete entry");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditClick = (s: Shareholder) => {
    setEditingShareholder(s);
    setForm({
      shareholderName: s.shareholder_name,
      shareholderType: s.shareholder_type,
      email: s.email || "",
      shareClass: s.share_class,
      shareCount: s.share_count.toString(),
      investmentAmount: (s.investment_amount || 0).toString(),
      pricePerShare: (s.price_per_share || 0).toString(),
      grantDate: s.grant_date ? new Date(s.grant_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      isVesting: s.esop_vesting?.is_vesting || false,
      totalMonths: (s.esop_vesting?.total_months || 48).toString(),
      cliffMonths: (s.esop_vesting?.cliff_months || 12).toString(),
      notes: s.notes || "",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingShareholder(null);
    setForm({
      shareholderName: "",
      shareholderType: "investor",
      email: "",
      shareClass: "Common",
      shareCount: "",
      investmentAmount: "",
      pricePerShare: "",
      grantDate: new Date().toISOString().split("T")[0],
      isVesting: false,
      totalMonths: "48",
      cliffMonths: "12",
      notes: "",
    });
  };

  const filteredShareholders = shareholders.filter(s =>
    s.shareholder_name.toLowerCase().includes(shareholderSearchQuery.toLowerCase()) ||
    s.share_class.toLowerCase().includes(shareholderSearchQuery.toLowerCase()) ||
    s.shareholder_type.toLowerCase().includes(shareholderSearchQuery.toLowerCase())
  );

  const totalShareholdersPages = Math.ceil(filteredShareholders.length / shareholdersPerPage);
  const startIndex = (shareholderCurrentPage - 1) * shareholdersPerPage;
  const paginatedShareholders = filteredShareholders.slice(startIndex, startIndex + shareholdersPerPage);

  const getRoleBadgeStyle = (type: string) => {
    switch (type) {
      case "founder":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "investor":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
      case "employee":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  if (loading || isLoading) {
    return (
      <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </main>
    );
  }

  const totalShares = summary?.totalIssuedShares || 0;

  return (
    <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        {(() => {
          const displayStartups = (authStartups && authStartups.length > 0) ? authStartups : userStartups;
          const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
          const currentActiveId = activeStartupId || selectedStartupId || storedId || (displayStartups[0] ? String(displayStartups[0]._id) : "");

          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <ChartPie className="w-7 h-7 text-yellow-500" weight="bold" />
                    Cap Table & Equity Ledger
                  </h1>
                  {displayStartups.length > 1 ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-2xs">
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
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-extrabold text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {displayStartups[0]?.company_name || displayStartups[0]?.name}
                    </div>
                  ) : null}
                </div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage shareholders, equity classes, SAFEs, and ESOP vesting schedules.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Issue Equity / Add Shareholder
              </button>
            </div>
          );
        })()}

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total Issued Shares
              </span>
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {totalShares.toLocaleString()}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">Fully Diluted Equity Pool</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Capital Raised
              </span>
              <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold">
                <TrendUp className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                ${(summary?.totalCapitalRaised || 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">Total Paid-in Capital</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                ESOP Pool Reserved
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {(summary?.totalEsopPool || 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Vested: {(summary?.totalVestedEsop || 0).toLocaleString()} shares
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Shareholders
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <UsersThree className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {shareholders.length}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">Founders, Investors & Team</p>
            </div>
          </div>

        </div>

        {/* Ownership Class Breakdown Progress Bar */}
        {totalShares > 0 && summary && (
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Equity Class Distribution
              </h3>
              <span className="text-[10px] font-mono font-bold text-gray-400">
                100% Fully Diluted
              </span>
            </div>

            {/* Progress Segment */}
            <div className="w-full h-3.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {Object.entries(summary.classTotals).map(([className, data], idx) => {
                if (data.shares === 0) return null;
                const pct = (data.shares / totalShares) * 100;
                const colors = [
                  "bg-yellow-500",
                  "bg-purple-500",
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-pink-500",
                ];
                return (
                  <div
                    key={className}
                    style={{ width: `${pct}%` }}
                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`}
                    title={`${className}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs pt-1">
              {Object.entries(summary.classTotals).map(([className, data], idx) => {
                if (data.shares === 0) return null;
                const pct = ((data.shares / totalShares) * 100).toFixed(1);
                const dotColors = [
                  "bg-yellow-500",
                  "bg-purple-500",
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-pink-500",
                ];
                return (
                  <div key={className} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                    <span className="font-bold text-gray-700 dark:text-gray-300">{className}:</span>
                    <span className="font-mono text-gray-500 dark:text-gray-400">{pct}% ({data.shares.toLocaleString()} sh)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shareholders Ledger Table */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Shareholders Ledger
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {filteredShareholders.length} Registered Entries
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 px-3.5 py-2 rounded-xl text-xs max-w-sm w-full md:w-72 shrink-0">
              <MagnifyingGlass className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shareholders..."
                value={shareholderSearchQuery}
                onChange={(e) => {
                  setShareholderSearchQuery(e.target.value);
                  setShareholderCurrentPage(1);
                }}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-white w-full font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  <th className="pb-3 px-1">Shareholder</th>
                  <th className="pb-3 px-2 hidden sm:table-cell">Role</th>
                  <th className="pb-3 px-2 hidden md:table-cell">Share Class</th>
                  <th className="pb-3 px-2">Shares</th>
                  <th className="pb-3 px-2 hidden sm:table-cell">Ownership %</th>
                  <th className="pb-3 px-2 hidden lg:table-cell">Investment</th>
                  <th className="pb-3 px-2 hidden sm:table-cell">Vesting Status</th>
                  <th className="pb-3 px-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-medium text-gray-700 dark:text-gray-300">
                {paginatedShareholders.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-gray-900 dark:text-white">
                      <div>
                        <p className="text-xs sm:text-sm">{s.shareholder_name}</p>
                        {s.email && <p className="text-[10px] font-normal text-gray-400">{s.email}</p>}
                        
                        {/* Mobile Details Block */}
                        <div className="mt-1 flex flex-wrap gap-1.5 items-center sm:hidden">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold capitalize border ${getRoleBadgeStyle(s.shareholder_type)}`}>
                            {s.shareholder_type}
                          </span>
                          <span className="text-[9px] bg-gray-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded-md font-mono text-gray-500 dark:text-gray-400">
                            {s.share_class}
                          </span>
                          {s.investment_amount > 0 && (
                            <span className="text-[9px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md font-mono">
                              ${s.investment_amount.toLocaleString()}
                            </span>
                          )}
                          {s.esop_vesting?.is_vesting && (
                            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-mono">
                              Vesting
                            </span>
                          )}
                        </div>
                        
                        {/* Tablet Details Block for Share Class and Investment */}
                        <div className="mt-1 hidden sm:flex md:hidden flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] bg-gray-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded-md font-mono text-gray-500 dark:text-gray-400">
                            {s.share_class}
                          </span>
                          {s.investment_amount > 0 && (
                            <span className="text-[9px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md font-mono">
                              ${s.investment_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${getRoleBadgeStyle(s.shareholder_type)}`}>
                        {s.shareholder_type}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-bold hidden md:table-cell">{s.share_class}</td>
                    <td className="py-3.5 pr-3 font-mono font-bold">
                      <div>
                        <p>{s.share_count.toLocaleString()}</p>
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 sm:hidden font-mono mt-0.5">{s.ownership_pct}%</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 font-mono font-bold text-yellow-600 dark:text-yellow-400 hidden sm:table-cell">
                      {s.ownership_pct}%
                    </td>
                    <td className="py-3.5 pr-3 font-mono hidden lg:table-cell">
                      {s.investment_amount > 0 ? `$${s.investment_amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 pr-3 hidden sm:table-cell">
                      {s.esop_vesting?.is_vesting ? (
                        <div className="text-[10px]">
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Vested: {s.esop_vesting.calculated_vested_shares.toLocaleString()} / {s.share_count.toLocaleString()}
                          </span>
                          <p className="text-gray-400">{s.esop_vesting.total_months}m schedule ({s.esop_vesting.cliff_months}m cliff)</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal">Fully Granted</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors cursor-pointer"
                          title="Edit Shareholder"
                        >
                          <NotePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(s._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                          title="Delete Shareholder"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredShareholders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500 font-bold">
                      {shareholderSearchQuery 
                        ? "No shareholders matched your search criteria." 
                        : "No equity grants or shareholders recorded yet. Click Add Shareholder above to populate your Cap Table."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalShareholdersPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4 text-xs font-semibold">
              <span className="text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + shareholdersPerPage, filteredShareholders.length)} of {filteredShareholders.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShareholderCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={shareholderCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CaretLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-600 dark:text-gray-300 font-bold px-2">
                  Page {shareholderCurrentPage} of {totalShareholdersPages}
                </span>
                <button
                  onClick={() => setShareholderCurrentPage(prev => Math.min(prev + 1, totalShareholdersPages))}
                  disabled={shareholderCurrentPage === totalShareholdersPages}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CaretRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exit Waterfall & Dilution Simulator Section */}
        {shareholders.length > 0 && (
          <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold shrink-0">
                  <ChartPie className="w-5 h-5" weight="bold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Exit Waterfall & Dilution Simulator
                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-md">
                      Scenario Modeling
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Model liquidation preference payouts, Common stock pro-rata distributions, and future funding round dilution.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDilutionControls(!showDilutionControls)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sliders className="w-4 h-4" />
                {showDilutionControls ? "Hide Round Dilution Controls" : "Model Future Round Dilution"}
                {showDilutionControls ? <CaretUp className="w-3.5 h-3.5" /> : <CaretDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-gray-200/60 dark:border-zinc-800">
              
              {/* Exit Valuation Slider & Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <CurrencyDollar className="w-4 h-4 text-green-500" weight="bold" />
                    Simulated Exit Sale Price ($)
                  </label>
                  <span className="text-sm font-mono font-black text-yellow-600 dark:text-yellow-400">
                    ${exitValuation.toLocaleString()}
                  </span>
                </div>

                <input
                  type="range"
                  min={1000000}
                  max={100000000}
                  step={1000000}
                  value={exitValuation}
                  onChange={(e) => setExitValuation(Number(e.target.value))}
                  className="w-full accent-yellow-500 cursor-pointer"
                />

                {/* Quick Presets */}
                <div className="flex gap-2 flex-wrap">
                  {[5000000, 10000000, 25000000, 50000000, 100000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExitValuation(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        exitValuation === preset
                          ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                          : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100"
                      }`}
                    >
                      ${preset / 1000000}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Liquidation Preference Multiple Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Preferred Liquidation Multiple
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mult: 1.0, label: "1.0x (Standard)" },
                    { mult: 1.5, label: "1.5x Preference" },
                    { mult: 2.0, label: "2.0x Preference" },
                  ].map((item) => (
                    <button
                      key={item.mult}
                      type="button"
                      onClick={() => setLiquidationMultiple(item.mult)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        liquidationMultiple === item.mult
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold"
                          : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">
                  Preferred shareholders are paid their liquidation preference claims before Common stock receives distributions.
                </p>
              </div>

            </div>

            {/* Optional Future Round Dilution Controls */}
            {showDilutionControls && (
              <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Percent className="w-4 h-4" /> Model Next Funding Round Dilution
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      New Round Capital Raised ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000000"
                      value={newInvestment || ""}
                      onChange={(e) => setNewInvestment(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      Pre-Money Valuation ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 8000000"
                      value={preMoneyValuation || ""}
                      onChange={(e) => setPreMoneyValuation(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      Option Pool Expansion (%)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={newOptionPoolPct || ""}
                      onChange={(e) => setNewOptionPoolPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Waterfall Scenario Summary Bar */}
            {waterfallResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900 text-white p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                    Preferred Preference Paid
                  </span>
                  <span className="text-sm font-extrabold text-yellow-400">
                    ${waterfallResult.totalPreferredPreferencePaid.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                    Common Pool Distributed
                  </span>
                  <span className="text-sm font-extrabold text-green-400">
                    ${waterfallResult.totalCommonProceedsPaid.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                    Total Founder Payout
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    ${waterfallResult.founderTotalPayout.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                    Investor Avg Return (MOIC)
                  </span>
                  <span className="text-sm font-extrabold text-purple-400">
                    {waterfallResult.investorAverageMoic}x
                  </span>
                </div>
              </div>
            )}

            {/* Waterfall Shareholder Payout Table */}
            {waterfallResult && (
              <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800/80 rounded-2xl bg-gray-50/30 dark:bg-zinc-900/30 -mx-2 px-2 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      <th className="py-3 px-3">Shareholder</th>
                      <th className="py-3 px-3">Share Class</th>
                      <th className="py-3 px-3">Initial %</th>
                      <th className="py-3 px-3">Diluted %</th>
                      <th className="py-3 px-3">Pref Payout</th>
                      <th className="py-3 px-3">Common Payout</th>
                      <th className="py-3 px-3">Total Exit Payout</th>
                      <th className="py-3 px-3 text-right">Return MOIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {waterfallResult.shareholders.map((res, idx) => (
                      <tr key={res._id || idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white">
                          {res.shareholder_name}
                        </td>
                        <td className="py-3.5 px-3 font-bold">{res.share_class}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-500">{res.initial_ownership_pct}%</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                          {res.effective_ownership_pct}%
                        </td>
                        <td className="py-3.5 px-3 font-mono text-gray-500">
                          {res.preference_payout > 0 ? `$${res.preference_payout.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-gray-500">
                          {res.common_payout > 0 ? `$${res.common_payout.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-extrabold text-green-600 dark:text-green-400">
                          ${res.total_exit_payout.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-yellow-600 dark:text-yellow-400">
                          {res.moic > 0 ? `${res.moic}x` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Dedicated Activity History & Audit Log Navigation Banner */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5C158]/10 text-[#E5C158] flex items-center justify-center font-bold shrink-0">
              <ClockCounterClockwise className="w-5 h-5" weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Cap Table Security Audit Log
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-mono font-bold rounded-md uppercase">
                  System Active
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                View complete immutable history of equity issuances, modifications, and shareholder updates.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/audit-logs")}
            className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs"
          >
            <ClockCounterClockwise className="w-4 h-4" weight="bold" />
            View Complete Activity History
          </button>
        </div>

      </div>

      {/* Add Shareholder Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left my-8">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChartPie className="w-5 h-5 text-yellow-500" weight="bold" />
                  {editingShareholder ? "Edit Shareholder / Equity Grant" : "Issue Equity / Add Shareholder"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingShareholder 
                    ? "Modify existing share allocations, class types, or vesting profiles." 
                    : "Record new share issuances, investor holdings, or ESOP options."}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShareholder} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Shareholder Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mustapha Shuaibu or Sequoia Capital"
                    value={form.shareholderName}
                    onChange={(e) => setForm({ ...form, shareholderName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Shareholder Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. partner@sequoiacap.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Role / Category
                  </label>
                  <select
                    value={form.shareholderType}
                    onChange={(e) => setForm({ ...form, shareholderType: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold dark:text-white"
                  >
                    <option value="founder">Founder</option>
                    <option value="investor">Investor</option>
                    <option value="employee">Employee</option>
                    <option value="advisor">Advisor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Share Class
                  </label>
                  <select
                    value={form.shareClass}
                    onChange={(e) => {
                      const newClass = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        shareClass: newClass,
                        isVesting: newClass === "Options / ESOP" ? true : prev.isVesting,
                      }));
                    }}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold dark:text-white"
                  >
                    <option value="Common">Common Stock</option>
                    <option value="Preferred Series Seed">Preferred Series Seed</option>
                    <option value="Preferred Series A">Preferred Series A</option>
                    <option value="Options / ESOP">Options / ESOP</option>
                    <option value="SAFE / Convertible">SAFE / Convertible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Number of Shares *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={form.shareCount}
                    onChange={(e) => setForm({ ...form, shareCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono font-bold focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250000"
                    value={form.investmentAmount}
                    onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* ESOP Vesting Checkbox */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200">
                    Enable ESOP Vesting Schedule
                  </label>
                  <input
                    type="checkbox"
                    checked={form.isVesting}
                    onChange={(e) => setForm({ ...form, isVesting: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>

                {form.isVesting && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 mb-1">
                        Total Vesting Duration (Months)
                      </span>
                      <input
                        type="number"
                        value={form.totalMonths}
                        onChange={(e) => setForm({ ...form, totalMonths: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 mb-1">
                        Cliff Period (Months)
                      </span>
                      <input
                        type="number"
                        value={form.cliffMonths}
                        onChange={(e) => setForm({ ...form, cliffMonths: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {editingShareholder ? "Save Changes" : "Confirm Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cap Table Security Audit Log Section */}
      {auditLogs.length > 0 && (
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-md sm:text-lg font-bold text-gray-900 dark:text-white">
                Cap Table Security Audit Log
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-gray-500 font-bold uppercase tracking-wider w-fit">
              System Active
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-xs">
            {auditLogs.map((log) => {
              const date = new Date(log.created_at).toLocaleString();
              const userName = log.user_id?.name || log.user_id?.email || "Founder";
              
              let actionText = "";
              let actionColor = "";
              switch (log.action) {
                case "create":
                  actionText = "Issued Equity Grant";
                  actionColor = "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
                  break;
                case "update":
                  actionText = "Updated Equity Grant";
                  actionColor = "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
                  break;
                case "delete":
                  actionText = "Deleted Equity Grant";
                  actionColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
                  break;
                default:
                  actionText = log.action;
                  actionColor = "text-gray-600 bg-gray-50";
              }

              return (
                <div key={log._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${actionColor}`}>
                      {actionText}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        {log.details?.shareholder_name || log.details?.current?.shareholder_name || "Shareholder"} (
                        {log.details?.share_class || log.details?.current?.share_class || "Common"} Class)
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Action by {userName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 self-start sm:self-center">
                    {date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteShareholder}
        title="Remove Shareholder Entry?"
        message="Are you sure you want to delete this shareholder grant from the Cap Table?"
        confirmLabel="Delete"
        isDestructive
      />
    </main>
  );
}
