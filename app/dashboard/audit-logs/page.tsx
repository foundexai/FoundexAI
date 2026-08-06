"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  CaretLeft,
  CaretRight,
  CircleNotch,
  ArrowClockwise,
  ChartPie,
  FileText,
  UserCheck,
  CheckCircle,
  Warning,
  Trash,
  NotePencil,
  Plus,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

interface AuditLogEntry {
  _id: string;
  startup_id: string;
  user_id?: {
    _id: string;
    email: string;
    name?: string;
  };
  action: "create" | "update" | "delete" | string;
  entity: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const {
    user,
    loading,
    token,
    activeStartupId,
    setActiveStartupId,
    startups: authStartups,
  } = useAuth();
  const router = useRouter();

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [userStartups, setUserStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 12;

  const fetchAuditLogs = useCallback(
    async (targetStartupId?: string, pageNum = 1) => {
      setIsLoading(true);
      const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      if (!authToken) return;

      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
      const activeId = targetStartupId || activeStartupId || selectedStartupId || storedId || "";

      try {
        const params = new URLSearchParams();
        if (activeId) params.set("startup_id", activeId);
        if (entityFilter !== "all") params.set("entity", entityFilter);
        if (actionFilter !== "all") params.set("action", actionFilter);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("page", String(pageNum));
        params.set("limit", String(limit));

        const res = await fetch(`/api/audit-logs?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-startup-id": activeId,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.auditLogs || []);
          setTotalLogs(data.totalLogs || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.currentPage || 1);

          if (data.userStartups && data.userStartups.length > 0) {
            setUserStartups(data.userStartups);
          }
          if (data.currentStartup?._id) {
            setSelectedStartupId(String(data.currentStartup._id));
          }
        } else {
          toast.error("Failed to fetch activity history.");
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
        toast.error("Network error while loading audit logs.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      token,
      activeStartupId,
      selectedStartupId,
      entityFilter,
      actionFilter,
      searchQuery,
    ],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : undefined;
      const activeId = activeStartupId || storedId || undefined;
      fetchAuditLogs(activeId, 1);
    }
  }, [user, loading, router, activeStartupId, entityFilter, actionFilter]);

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        fetchAuditLogs(undefined, 1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartupSwitch = (newId: string) => {
    setSelectedStartupId(newId);
    if (setActiveStartupId) {
      setActiveStartupId(newId);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("activeStartupId", newId);
    }
    fetchAuditLogs(newId, 1);
  };

  const displayStartups =
    authStartups && authStartups.length > 0 ? authStartups : userStartups;
  const storedId = typeof window !== "undefined" ? localStorage.getItem("activeStartupId") : "";
  const currentActiveId =
    activeStartupId ||
    selectedStartupId ||
    storedId ||
    (displayStartups[0] ? String(displayStartups[0]._id) : "");

  const getActionBadgeStyle = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/60";
      case "update":
        return "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/60";
      case "delete":
        return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60";
      default:
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return <Plus className="w-3.5 h-3.5" weight="bold" />;
      case "update":
        return <NotePencil className="w-3.5 h-3.5" weight="bold" />;
      case "delete":
        return <Trash className="w-3.5 h-3.5" weight="bold" />;
      default:
        return <ClockCounterClockwise className="w-3.5 h-3.5" weight="bold" />;
    }
  };

  if (loading || (isLoading && auditLogs.length === 0)) {
    return (
      <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-16 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-28 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
            <Skeleton className="h-28 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
            <Skeleton className="h-28 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
          </div>
          <Skeleton className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <ClockCounterClockwise
                  className="w-7 h-7 text-[#E5C158]"
                  weight="bold"
                />
                Audit Logs
              </h1>

              {displayStartups.length > 1 ? (
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Company:
                  </span>
                  <select
                    value={currentActiveId}
                    onChange={(e) => handleStartupSwitch(e.target.value)}
                    className="bg-transparent text-xs font-black text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {displayStartups.map((s: any) => (
                      <option
                        key={String(s._id)}
                        value={String(s._id)}
                        className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-bold"
                      >
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
              Immutable security audit history tracking Cap Table adjustments,
              user actions, and system events.
            </p>
          </div>

          <button
            onClick={() => fetchAuditLogs(undefined, currentPage)}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <ArrowClockwise
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              weight="bold"
            />
            Refresh Log
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total Audit Events
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#E5C158]/10 text-[#E5C158] flex items-center justify-center font-bold">
                <ClockCounterClockwise className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {totalLogs.toLocaleString()}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Recorded Immutable Events
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Security Audit Status
              </span>
              <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-lg font-black text-green-600 dark:text-green-400 tracking-wide uppercase">
                System Active
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Latest Event Timestamp
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" weight="bold" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm font-extrabold text-gray-900 dark:text-white block font-mono">
                {auditLogs[0]
                  ? new Date(auditLogs[0].created_at).toLocaleString()
                  : "No Activity Yet"}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Most Recent Audit Trail Record
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, entity, or shareholder name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E5C158] dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Entity Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 px-3 py-2 rounded-xl">
                <Funnel className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Entity:
                </span>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Entities</option>
                  <option value="CapTable">Cap Table</option>
                  <option value="Document">Documents</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Action:
                </span>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  <option value="create">Created (POST)</option>
                  <option value="update">Updated (PUT)</option>
                  <option value="delete">Deleted (DELETE)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Feed Table */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap bg-gray-50/50 dark:bg-zinc-900/50">
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-3">Entity</th>
                  <th className="py-3.5 px-4">Log Details</th>
                  <th className="py-3.5 px-4">Performed By</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-medium text-gray-700 dark:text-gray-300">
                {auditLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Action Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${getActionBadgeStyle(
                          log.action,
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 font-mono">
                        {log.entity}
                      </span>
                    </td>

                    {/* Log Details */}
                    <td className="py-4 px-4 text-xs font-semibold text-gray-900 dark:text-white">
                      {log.details ? (
                        <div>
                          {log.details.shareholder_name && (
                            <p className="font-bold text-gray-900 dark:text-white">
                              {log.details.shareholder_name}{" "}
                              {log.details.share_class && (
                                <span className="text-gray-400 font-normal">
                                  ({log.details.share_class})
                                </span>
                              )}
                            </p>
                          )}

                          {log.details.share_count && (
                            <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                              Shares:{" "}
                              {Number(log.details.share_count).toLocaleString()}
                            </p>
                          )}

                          {log.details.previous && log.details.current && (
                            <div className="mt-1 text-[10px] font-mono bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-md max-w-md">
                              Updated details for{" "}
                              {log.details.current.shareholder_name ||
                                "shareholder"}
                            </div>
                          )}

                          {!log.details.shareholder_name && (
                            <span className="font-mono text-[11px] text-gray-500">
                              {JSON.stringify(log.details)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-[11px]">
                          No extra parameters recorded
                        </span>
                      )}
                    </td>

                    {/* Performed By */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {log.user_id?.name ||
                            log.user_id?.email ||
                            "System Admin"}
                        </p>
                        {log.user_id?.email && log.user_id.name && (
                          <p className="text-[10px] font-normal text-gray-400">
                            {log.user_id.email}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-[11px] text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {auditLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-gray-400 dark:text-gray-500 font-bold"
                    >
                      No security audit events recorded for this company
                      matching your current search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 p-4 text-xs font-semibold bg-gray-50/50 dark:bg-zinc-900/30">
              <span className="text-gray-400">
                Page {currentPage} of {totalPages} ({totalLogs} total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    fetchAuditLogs(undefined, Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                >
                  <CaretLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() =>
                    fetchAuditLogs(
                      undefined,
                      Math.min(totalPages, currentPage + 1),
                    )
                  }
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                >
                  Next <CaretRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
