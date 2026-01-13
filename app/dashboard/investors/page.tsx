"use client";

import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { InvestorCard, Investor } from "@/components/InvestorCard";

import { MOCK_INVESTORS } from "@/lib/data";

export default function InvestorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredInvestors = MOCK_INVESTORS.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? inv.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 dark:text-white">
            Investor Database
          </h1>
          <p className="text-gray-500 max-w-xl text-lg dark:text-gray-400">
            Connect with the leading VCs, Angels, and Accelerators powering the
            next generation of African startups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1 rounded-xl shadow-sm flex dark:bg-white/5 dark:border-white/10">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                !selectedType
                  ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType("VC")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedType === "VC"
                  ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              VCs
            </button>
            <button
              onClick={() => setSelectedType("Angel")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedType === "Angel"
                  ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Angels
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-20 z-30">
        <div className="glass-card p-2 rounded-2xl border border-white/60 shadow-lg flex items-center bg-white/70 backdrop-blur-xl dark:bg-black/40 dark:border-white/10">
          <div className="pl-4 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search investors by name, focus, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium h-12 dark:text-white"
          />
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-colors mr-1 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <button className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Search
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInvestors.map((investor) => (
          <InvestorCard key={investor.id} investor={investor} />
        ))}
      </div>

      {/* Empty State */}
      {filteredInvestors.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:bg-white/5 dark:text-gray-500">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            No investors found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}
    </div>
  );
}
