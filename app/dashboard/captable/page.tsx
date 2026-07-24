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
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";

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
  const { user, loading, token } = useAuth();
  const router = useRouter();

  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      loadCapTable();
    }
  }, [user, loading, router]);

  async function loadCapTable() {
    setIsLoading(true);
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const res = await fetch("/api/captable", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShareholders(data.shareholders || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load cap table", err);
      toast.error("Failed to load cap table data.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shareholderName || !form.shareCount) {
      toast.error("Shareholder name and share count are required");
      return;
    }

    setIsSubmitting(true);
    const authToken = token || localStorage.getItem("token");

    try {
      const res = await fetch("/api/captable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add shareholder");

      toast.success("Equity Grant Added!", {
        description: `Successfully registered ${Number(form.shareCount).toLocaleString()} shares to ${form.shareholderName}.`,
      });

      setIsAddModalOpen(false);
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
      toast.error(err.message || "Failed to issue equity.");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ChartPie className="w-7 h-7 text-yellow-500" weight="bold" />
              Cap Table & Equity Ledger
            </h1>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Shareholders Ledger
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {shareholders.length} Registered Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <th className="pb-3">Shareholder</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Share Class</th>
                  <th className="pb-3">Shares</th>
                  <th className="pb-3">Ownership %</th>
                  <th className="pb-3">Investment</th>
                  <th className="pb-3">Vesting Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-medium text-gray-700 dark:text-gray-300">
                {shareholders.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-gray-900 dark:text-white">
                      <div>
                        <p>{s.shareholder_name}</p>
                        {s.email && <p className="text-[10px] font-normal text-gray-400">{s.email}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${getRoleBadgeStyle(s.shareholder_type)}`}>
                        {s.shareholder_type}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-bold">{s.share_class}</td>
                    <td className="py-3.5 pr-3 font-mono font-bold">{s.share_count.toLocaleString()}</td>
                    <td className="py-3.5 pr-3 font-mono font-bold text-yellow-600 dark:text-yellow-400">
                      {s.ownership_pct}%
                    </td>
                    <td className="py-3.5 pr-3 font-mono">
                      {s.investment_amount > 0 ? `$${s.investment_amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 pr-3">
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
                      <button
                        onClick={() => setDeleteId(s._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                        title="Delete Shareholder"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {shareholders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                      No equity grants or shareholders recorded yet. Click <strong>Issue Equity</strong> above to populate your Cap Table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  Issue Equity / Add Shareholder
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Record new share issuances, investor holdings, or ESOP options.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShareholder} className="space-y-4 text-xs">
              
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
                    onChange={(e) => setForm({ ...form, shareClass: e.target.value })}
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
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
                  onClick={() => setIsAddModalOpen(false)}
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
                  Confirm Grant
                </button>
              </div>
            </form>
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
