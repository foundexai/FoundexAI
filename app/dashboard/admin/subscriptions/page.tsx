"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { 
  MagnifyingGlass, 
  Funnel, 
  ArrowClockwise,
  UserCircle,
  Circle
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface SubscriptionRecord {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  plan: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  provider_name: string;
}

export default function AdminSubscriptionsPage() {
  const { token } = useAuth();
  const { is_admin, loading: subLoading } = useSubscription();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (token && is_admin) {
      fetchSubscriptions();
    }
  }, [token, is_admin]);

  async function fetchSubscriptions() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.user_id?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_id?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (subLoading || (isLoading && subscriptions.length === 0)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500 font-medium mt-1">
            Manage and monitor active organization plans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSubscriptions}
            className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-400"
          >
            <ArrowClockwise className={cn("w-5 h-5", isLoading && "animate-spin")} weight="bold" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" weight="bold" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-1 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <Funnel className="w-4 h-4 text-gray-400" weight="bold" />
          <select 
            className="bg-transparent border-none text-sm font-bold text-gray-600 dark:text-zinc-400 outline-none pr-4 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Subscription Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User / Organization</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Billing</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-900">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                        <UserCircle className="w-6 h-6 text-gray-400" weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {sub.user_id?.full_name || "Unknown User"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium truncate">
                          {sub.user_id?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                      sub.plan === "pro" ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-600" :
                      sub.plan === "founder" ? "bg-blue-400/10 border-blue-400/20 text-blue-600" :
                      "bg-gray-100 dark:bg-white/5 border-transparent text-gray-500"
                    )}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Circle className={cn(
                        "w-2 h-2 shrink-0",
                        sub.status === "active" ? "text-green-500" :
                        sub.status === "past_due" ? "text-red-500" : "text-gray-400"
                      )} weight="fill" />
                      <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 capitalize">
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700 dark:text-white capitalize">{sub.billing_cycle}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-tighter">{sub.provider_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "N/A"}
                    </p>
                  </td>
                </tr>
              ))}
              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 dark:text-zinc-600 italic">
                    No subscriptions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
