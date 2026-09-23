"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Buildings,
  UsersThree,
  GraduationCap,
  TrendUp,
  Briefcase,
  Calendar,
  CurrencyDollar,
  Hourglass,
  Plus,
  DownloadSimple,
  CircleNotch,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  X,
  CaretDown,
  RocketLaunch,
  ChartPie,
  ChatCircleDots,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CrossCohortAnalytics } from "@/lib/acceleratorService";

export default function AcceleratorDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<CrossCohortAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCohortId, setSelectedCohortId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  // Modals
  const [isCreateCohortOpen, setIsCreateCohortOpen] = useState(false);
  const [isAddStartupOpen, setIsAddStartupOpen] = useState(false);
  const [cohortForStartup, setCohortForStartup] = useState<string>("");

  // Create Cohort Form State
  const [cohortForm, setCohortForm] = useState({
    organization_name: "Foundex Accelerator",
    organization_type: "accelerator",
    cohort_name: "",
    year: new Date().getFullYear(),
    season: "Summer",
    status: "active",
    target_startups_count: 15,
    start_date: new Date().toISOString().split("T")[0],
    demo_day_date: "",
    notes: "",
  });
  const [isSubmittingCohort, setIsSubmittingCohort] = useState(false);

  // Add Startup Form State
  const [startupForm, setStartupForm] = useState({
    company_name: "",
    sector: "Fintech",
    stage: "Seed",
    funding_received: 125000,
    equity_percentage: 7.0,
    current_arr: 120000,
    monthly_burn: 15000,
    cash_runway_months: 14,
    follow_on_raised: 0,
    mentor_assigned: "",
  });
  const [isSubmittingStartup, setIsSubmittingStartup] = useState(false);

  const fetchCohortData = useCallback(async () => {
    setIsLoading(true);
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!authToken) return;

    try {
      const res = await fetch("/api/enterprise/cohorts", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to load accelerator cohorts");
      }
    } catch (error) {
      console.error("Fetch cohorts error:", error);
      toast.error("Network error loading accelerator dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/dashboard");
      return;
    }
    if (user) {
      fetchCohortData();
    }
  }, [user, loading, router, fetchCohortData]);

  // CSV Export trigger
  const handleExportCsv = async () => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    try {
      const res = await fetch("/api/enterprise/cohorts?export=csv", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `accelerator_cross_cohort_ledger_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("LP Cohort Ledger successfully exported");
      }
    } catch (e) {
      toast.error("Failed to export CSV report");
    }
  };

  // Create Cohort handler
  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortForm.cohort_name) {
      toast.error("Please enter a cohort name");
      return;
    }

    setIsSubmittingCohort(true);
    const authToken = token || localStorage.getItem("token");
    try {
      const res = await fetch("/api/enterprise/cohorts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(cohortForm),
      });

      if (res.ok) {
        toast.success("Cohort batch launched successfully");
        setIsCreateCohortOpen(false);
        setCohortForm({
          organization_name: "Foundex Accelerator",
          organization_type: "accelerator",
          cohort_name: "",
          year: new Date().getFullYear(),
          season: "Summer",
          status: "active",
          target_startups_count: 15,
          start_date: new Date().toISOString().split("T")[0],
          demo_day_date: "",
          notes: "",
        });
        await fetchCohortData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create cohort");
      }
    } catch (error) {
      toast.error("Network error creating cohort");
    } finally {
      setIsSubmittingCohort(false);
    }
  };

  // Add Startup handler
  const handleAddStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortForStartup) {
      toast.error("No cohort selected");
      return;
    }
    if (!startupForm.company_name) {
      toast.error("Please enter the startup company name");
      return;
    }

    setIsSubmittingStartup(true);
    const authToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`/api/enterprise/cohorts/${cohortForStartup}/startups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(startupForm),
      });

      if (res.ok) {
        toast.success("Startup enrolled into cohort");
        setIsAddStartupOpen(false);
        setStartupForm({
          company_name: "",
          sector: "Fintech",
          stage: "Seed",
          funding_received: 125000,
          equity_percentage: 7.0,
          current_arr: 120000,
          monthly_burn: 15000,
          cash_runway_months: 14,
          follow_on_raised: 0,
          mentor_assigned: "",
        });
        await fetchCohortData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to enroll startup");
      }
    } catch (error) {
      toast.error("Network error enrolling startup");
    } finally {
      setIsSubmittingStartup(false);
    }
  };

  // Remove Startup from cohort
  const handleRemoveStartup = async (cohortId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to remove ${companyName} from this cohort?`)) return;
    const authToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(
        `/api/enterprise/cohorts/${cohortId}/startups?company_name=${encodeURIComponent(companyName)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (res.ok) {
        toast.success(`${companyName} removed from cohort`);
        await fetchCohortData();
      }
    } catch (e) {
      toast.error("Failed to remove startup");
    }
  };

  // Filter cohorts list
  const filteredCohorts = (analytics?.cohorts_summary || []).filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  // Filter startups ledger
  const filteredStartups = (analytics?.all_startups_ledger || []).filter((s) => {
    if (selectedCohortId !== "all" && s.cohort_id !== selectedCohortId) return false;
    if (statusFilter !== "all" && s.cohort_status !== statusFilter) return false;
    if (sectorFilter !== "all" && s.sector !== sectorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.company_name.toLowerCase().includes(q);
      const matchSector = s.sector.toLowerCase().includes(q);
      const matchMentor = s.mentor_assigned?.toLowerCase().includes(q);
      if (!matchName && !matchSector && !matchMentor) return false;
    }
    return true;
  });

  // Unique sectors for filter
  const sectorsList = Array.from(
    new Set((analytics?.all_startups_ledger || []).map((s) => s.sector || "Other"))
  );

  if (isLoading && !analytics) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Loading Enterprise Accelerator Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 sm:px-6 lg:px-10 pb-16">
      {/* Top Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200/60 dark:border-zinc-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono font-black uppercase tracking-widest">
              Enterprise Hierarchy
            </span>
            <span className="text-xs text-gray-400 font-medium">Multi-Cohort Portfolio Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Buildings className="w-8 h-8 text-yellow-500 shrink-0" weight="bold" />
            <span>Accelerator Partner Master Dashboard</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Manage multi-cohort incubator programs, cross-venture financial rollups, cash runway distributions, and LP performance audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            <span>Export LP Ledger (CSV)</span>
          </button>

          <button
            onClick={() => setIsCreateCohortOpen(true)}
            className="flex-1 md:flex-initial px-5 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span>Launch New Cohort</span>
          </button>
        </div>
      </div>

      {/* Master Executive Metrics Bar (Cross-Cohort Rollup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Startups */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total Ventures Managed
            </span>
            <div className="w-9 h-9 rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold shrink-0">
              <RocketLaunch className="w-5 h-5" weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                {analytics?.total_startups_managed || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium">startups</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <span>{analytics?.active_cohorts_count || 0} Active Batches</span>
              <span className="text-gray-300 dark:text-zinc-700">•</span>
              <span>{analytics?.graduated_cohorts_count || 0} Alumni</span>
            </p>
          </div>
        </div>

        {/* Card 2: Combined Portfolio ARR */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Combined Portfolio ARR
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <TrendUp className="w-5 h-5" weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                ${((analytics?.combined_portfolio_arr || 0) / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                +19.2% MoM
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Annual recurring revenue aggregate
            </p>
          </div>
        </div>

        {/* Card 3: Total Follow-On Funding Raised */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Follow-On Capital Raised
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <CurrencyDollar className="w-5 h-5" weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                ${((analytics?.combined_follow_on_funding || 0) / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs text-gray-400 font-medium">syndicated</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Institutional seed & Series A follow-on
            </p>
          </div>
        </div>

        {/* Card 4: Cash Runway Health Distribution */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Average Runway Health
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <Hourglass className="w-5 h-5" weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                {analytics?.average_portfolio_runway || 12}
              </span>
              <span className="text-xs text-gray-400 font-medium">months avg</span>
            </div>
            {/* Runway Health Distribution Badges */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Safe ({analytics?.overall_runway_distribution?.safe || 0})
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Caution ({analytics?.overall_runway_distribution?.warning || 0})
              </span>
              {analytics?.overall_runway_distribution?.critical ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Critical ({analytics.overall_runway_distribution.critical})
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Switcher & Status Filter Bar (Apple Segmented Style) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-yellow-500" weight="bold" />
              <span>Incubator & Accelerator Batches</span>
            </h2>
            <span className="text-xs font-mono font-bold text-gray-400">
              ({filteredCohorts.length} {filteredCohorts.length === 1 ? "Cohort" : "Cohorts"})
            </span>
          </div>

          {/* Segmented Filter Pills */}
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
            <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl border border-black/5 dark:border-white/5 gap-1 shrink-0">
              {[
                { label: "All Batches", val: "all" },
                { label: "Active Cohorts", val: "active" },
                { label: "Alumni / Graduated", val: "graduated" },
                { label: "Upcoming", val: "upcoming" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setStatusFilter(tab.val)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.val
                      ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cohort Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCohorts.map((cohort) => {
            const isSelected = selectedCohortId === cohort.id;
            return (
              <div
                key={cohort.id}
                onClick={() => setSelectedCohortId(isSelected ? "all" : cohort.id)}
                className={cn(
                  "p-6 rounded-3xl border transition-all cursor-pointer relative group flex flex-col justify-between space-y-4",
                  isSelected
                    ? "bg-white dark:bg-zinc-900 border-yellow-500 dark:border-yellow-500 shadow-md ring-2 ring-yellow-500/20"
                    : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-xs"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                      {cohort.organization_name} • {cohort.season} {cohort.year}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        cohort.status === "active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                          : cohort.status === "graduated"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border-gray-200 dark:border-zinc-700"
                      )}
                    >
                      {cohort.status === "active" ? "● Active Batch" : cohort.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                    {cohort.cohort_name}
                  </h3>

                  {cohort.demo_day_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-yellow-500" weight="bold" />
                      <span>Demo Day: {new Date(cohort.demo_day_date).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </p>
                  )}
                </div>

                {/* Progress bar of cohort intake */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    <span>Enrolled Startups</span>
                    <span className="font-mono text-gray-900 dark:text-white">
                      {cohort.startups_count} / {cohort.target_startups_count} Capacity
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (cohort.startups_count / cohort.target_startups_count) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Cohort Key Stats Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Batch ARR</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      ${(cohort.total_arr / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Follow-on</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${(cohort.total_follow_on / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Avg Runway</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {cohort.average_runway}m
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCohortForStartup(cohort.id);
                      setIsAddStartupOpen(true);
                    }}
                    className="p-1.5 bg-gray-100 hover:bg-yellow-400 dark:bg-zinc-800 dark:hover:bg-yellow-500 text-gray-700 dark:text-gray-300 hover:text-black rounded-lg transition-all active:scale-[0.95] cursor-pointer shrink-0"
                    title="Enroll Startup into this Cohort"
                  >
                    <Plus className="w-4 h-4" weight="bold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Cohort Venture Ledger Section */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <UsersThree className="w-5 h-5 text-yellow-500" weight="bold" />
              <span>Portfolio Ventures Directory</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Unified ledger of all enrolled startups with cap tables, ARR growth, and assigned mentors.
            </p>
          </div>

          {/* Filter Bar for Ledger */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search venture or mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:text-white"
              />
            </div>

            {/* Sector Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
              <Funnel className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Sectors</option>
                {sectorsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs min-w-[850px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-zinc-900/50 whitespace-nowrap">
                <th className="py-3.5 px-4">Startup Company</th>
                <th className="py-3.5 px-3">Batch & Status</th>
                <th className="py-3.5 px-3">Cheque / Equity</th>
                <th className="py-3.5 px-3">Current ARR</th>
                <th className="py-3.5 px-3">Runway Health</th>
                <th className="py-3.5 px-3">Follow-On Raised</th>
                <th className="py-3.5 px-3">Assigned Mentor</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-medium text-gray-700 dark:text-gray-300">
              {filteredStartups.map((startup, idx) => (
                <tr
                  key={`${startup.cohort_id}-${startup.company_name}-${idx}`}
                  className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Company */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block text-sm">
                        {startup.company_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        {startup.sector} • {startup.stage}
                      </span>
                    </div>
                  </td>

                  {/* Batch */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="font-bold text-gray-900 dark:text-white block">
                      {startup.cohort_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                      {startup.status}
                    </span>
                  </td>

                  {/* Cheque / Equity */}
                  <td className="py-4 px-3 whitespace-nowrap font-mono text-xs">
                    <span className="font-bold text-gray-900 dark:text-white">
                      ${startup.funding_received.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      {startup.equity_percentage}% Equity
                    </span>
                  </td>

                  {/* ARR */}
                  <td className="py-4 px-3 whitespace-nowrap font-mono text-xs font-bold text-gray-900 dark:text-white">
                    ${startup.current_arr.toLocaleString()}
                    <span className="text-[10px] text-gray-400 block font-normal">
                      Burn: ${startup.monthly_burn.toLocaleString()}/mo
                    </span>
                  </td>

                  {/* Runway Health */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          startup.cash_runway_months >= 12
                            ? "bg-green-500"
                            : startup.cash_runway_months >= 6
                            ? "bg-amber-500"
                            : "bg-red-500 animate-pulse"
                        )}
                      />
                      <span className="font-bold font-mono text-xs">
                        {startup.cash_runway_months} Mos
                      </span>
                    </div>
                  </td>

                  {/* Follow-on Raised */}
                  <td className="py-4 px-3 whitespace-nowrap font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ${startup.follow_on_raised.toLocaleString()}
                  </td>

                  {/* Mentor */}
                  <td className="py-4 px-3 text-xs max-w-xs truncate text-gray-600 dark:text-gray-400">
                    {startup.mentor_assigned || "Unassigned"}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => router.push("/dashboard/captable")}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all active:scale-[0.95] cursor-pointer"
                        title="View Cap Table"
                      >
                        <ChartPie className="w-4 h-4" weight="bold" />
                      </button>

                      <button
                        onClick={() => handleRemoveStartup(startup.cohort_id, startup.company_name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-[0.95] cursor-pointer"
                        title="Remove from Cohort"
                      >
                        <Trash className="w-4 h-4" weight="bold" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStartups.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-gray-500 font-bold">
                    No startups enrolled matching your current filter. Click &ldquo;Launch New Cohort&rdquo; or enroll a venture above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COHORT MODAL */}
      {isCreateCohortOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateCohortOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-yellow-500" weight="bold" />
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    Launch New Cohort Batch
                  </h2>
                </div>
                <button
                  onClick={() => setIsCreateCohortOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>

              <form onSubmit={handleCreateCohort} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Organization / Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cohortForm.organization_name}
                    onChange={(e) => setCohortForm({ ...cohortForm, organization_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Cohort Name / Batch Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cohort 10 - DeepTech & Climate"
                    value={cohortForm.cohort_name}
                    onChange={(e) => setCohortForm({ ...cohortForm, cohort_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Season
                    </label>
                    <select
                      value={cohortForm.season}
                      onChange={(e) => setCohortForm({ ...cohortForm, season: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white cursor-pointer"
                    >
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                      <option value="Winter">Winter</option>
                      <option value="Year-Round">Year-Round</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Year
                    </label>
                    <input
                      type="number"
                      value={cohortForm.year}
                      onChange={(e) => setCohortForm({ ...cohortForm, year: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Batch Capacity
                    </label>
                    <input
                      type="number"
                      value={cohortForm.target_startups_count}
                      onChange={(e) => setCohortForm({ ...cohortForm, target_startups_count: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Demo Day Date
                    </label>
                    <input
                      type="date"
                      value={cohortForm.demo_day_date}
                      onChange={(e) => setCohortForm({ ...cohortForm, demo_day_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCohort}
                  className="w-full mt-4 py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingCohort && <CircleNotch className="w-4 h-4 animate-spin" />}
                  <span>Launch Batch</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL STARTUP MODAL */}
      {isAddStartupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddStartupOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <RocketLaunch className="w-6 h-6 text-yellow-500" weight="bold" />
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    Enroll Venture into Batch
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddStartupOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>

              <form onSubmit={handleAddStartup} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TerraWatt Storage Inc."
                    value={startupForm.company_name}
                    onChange={(e) => setStartupForm({ ...startupForm, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Sector
                    </label>
                    <select
                      value={startupForm.sector}
                      onChange={(e) => setStartupForm({ ...startupForm, sector: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white cursor-pointer"
                    >
                      <option value="Fintech">Fintech</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Agritech">Agritech</option>
                      <option value="Healthtech">Healthtech</option>
                      <option value="Cleantech">Cleantech</option>
                      <option value="Logistics">Logistics</option>
                      <option value="SaaS">SaaS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Stage
                    </label>
                    <select
                      value={startupForm.stage}
                      onChange={(e) => setStartupForm({ ...startupForm, stage: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white cursor-pointer"
                    >
                      <option value="Pre-Seed">Pre-Seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Accelerator Cheque ($)
                    </label>
                    <input
                      type="number"
                      value={startupForm.funding_received}
                      onChange={(e) => setStartupForm({ ...startupForm, funding_received: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Equity Taken (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={startupForm.equity_percentage}
                      onChange={(e) => setStartupForm({ ...startupForm, equity_percentage: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Current ARR ($)
                    </label>
                    <input
                      type="number"
                      value={startupForm.current_arr}
                      onChange={(e) => setStartupForm({ ...startupForm, current_arr: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Cash Runway (Months)
                    </label>
                    <input
                      type="number"
                      value={startupForm.cash_runway_months}
                      onChange={(e) => setStartupForm({ ...startupForm, cash_runway_months: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Assigned Mentor (Partner / EIR)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins (Managing Director)"
                    value={startupForm.mentor_assigned}
                    onChange={(e) => setStartupForm({ ...startupForm, mentor_assigned: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingStartup}
                  className="w-full mt-4 py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingStartup && <CircleNotch className="w-4 h-4 animate-spin" />}
                  <span>Enroll in Batch</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
