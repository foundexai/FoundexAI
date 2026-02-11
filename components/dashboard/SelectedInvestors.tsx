"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlass, FadersHorizontal, Trash, ChatCircleDots } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SavedInvestor {
  id: string;
  name: string;
  website: string;
  type: string;
  location: string;
  investmentRange: string;
  // New Fields
  last_investment?: string;
  actively_deploying?: boolean;
  match_count?: number;
}

export default function SelectedInvestors() {
  const { user, token, refreshUser } = useAuth();
  const [investors, setInvestors] = useState<SavedInvestor[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRemove = async (id: string) => {
    // Optimistic
    setInvestors((prev) => prev.filter((inv) => inv.id !== id));

    try {
      await fetch("/api/investors/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId: id }),
      });
      toast.success("Removed investor");
      if (refreshUser) refreshUser(); // Update context
    } catch (e) {
      toast.error("Failed to remove");
    }
  };

  if (!loading && investors.length === 0) return null; // Don't show if empty? Or show empty state.

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/50 mt-8 dark:bg-zinc-900/60 dark:border-zinc-800">
      {/* ... Header ... */}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px] md:min-w-0">
          <thead>
            <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
              <th className="pb-4 pl-4 min-w-[200px]">Investor's Name</th>
              <th className="pb-4 min-w-[140px]">Activity</th>
              <th className="pb-4 min-w-[180px]">Portfolio Insight</th>
              <th className="pb-4 min-w-[100px]">Category</th>
              <th className="pb-4 min-w-[120px]">Location</th>
              <th className="pb-4 pr-4 text-right min-w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
            {investors.map((inv) => (
              <tr
                key={inv.id}
                className="group hover:bg-gray-50/50 transition-colors dark:hover:bg-white/5"
              >
                <td className="py-4 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-400 shadow-md shadow-yellow-500/20 shrink-0">
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-200 block whitespace-nowrap">
                        {inv.name}
                      </span>
                      <a
                        href={inv.website}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-600 text-xs font-medium block truncate max-w-[120px]"
                      >
                        {inv.website
                          ? inv.website
                              .replace("https://", "")
                              .replace("www.", "")
                              .split("/")[0]
                          : "N/A"}
                      </a>
                    </div>
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inv.actively_deploying ? "bg-green-400" : "bg-gray-400"}`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${inv.actively_deploying ? "bg-green-500" : "bg-gray-500"}`}
                        ></span>
                      </span>
                      {inv.actively_deploying ? "Active" : "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Last inv. 3mo ago
                    </span>
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50"
                    title="Based on sector and stage match"
                  >
                    <span className="text-xs font-bold">
                      Resembles {inv.match_count} portfolio cos
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 max-w-[160px] truncate">
                    Fintech focus • Africa 1st
                  </div>
                </td>

                <td className="py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                    {inv.type}
                  </span>
                </td>
                <td className="py-4 text-gray-500 text-sm dark:text-gray-400 whitespace-nowrap">
                  {inv.location}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRemove(inv.id)}
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 p-2 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                      title="View Analysis"
                    >
                      <ChatCircleDots weight="bold" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="text-center py-10 text-gray-400">
            Loading saved investors...
          </div>
        )}

        {!loading && investors.length === 0 && (
          <div className="text-center py-10 text-gray-400 italic">
            No investors selected yet. Go to Database to add some.
          </div>
        )}
      </div>
    </div>
  );
}
