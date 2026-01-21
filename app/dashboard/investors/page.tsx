"use client";

import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, Loader2, Plus } from "lucide-react";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import AddInvestorModal from "@/components/AddInvestorModal";

import { MOCK_INVESTORS } from "@/lib/data";

export default function InvestorsPage() {
  const { token, user, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedInvestorIds, setSavedInvestorIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Saved Investors
      if (user && user.saved_investors) {
        setSavedInvestorIds(user.saved_investors || []);
      }

      // 2. Real Investors
      let allInvestors = [...MOCK_INVESTORS];
      try {
        const res = await fetch("/api/investors");
        if (res.ok) {
          const data = await res.json();
          // Assuming API returns { investors: [...] } or array
          const realInvestors = data.investors || [];
          allInvestors = [...realInvestors, ...MOCK_INVESTORS];
        }
      } catch (e) {
        console.log("Failed to fetch real investors", e);
      }

      // Remove duplicates if any (based on ID, though likely they differ)
      // Mocks have string IDs "1", "2". Mongo has ObjectIds. Should be safe.
      setInvestors(allInvestors);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load investors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // Even if not logged in, we might want to show public investors?
      // But for dashboard, we usually require user.
      // Let's rely on Layout/Protect route, but effectively just load mocks if no user for now.
      setInvestors(MOCK_INVESTORS);
      setIsLoading(false);
    }
  }, [user]);

  // Sync saved list
  useEffect(() => {
    if (user && user.saved_investors) {
      setSavedInvestorIds(user.saved_investors);
    }
  }, [user]);

  const handleToggleSave = async (id: string) => {
    if (!token) {
      toast.error("Please sign in to save investors");
      return;
    }

    const isCurrentlySaved = savedInvestorIds.includes(id);
    const newSavedIds = isCurrentlySaved
      ? savedInvestorIds.filter((savedId) => savedId !== id)
      : [...savedInvestorIds, id];

    setSavedInvestorIds(newSavedIds); // Optimistic

    try {
      const res = await fetch("/api/investors/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId: id }),
      });

      if (!res.ok) throw new Error("Failed to save");

      if (refreshUser) refreshUser();
      toast.success(
        isCurrentlySaved ? "Removed from saved" : "Investor saved!",
      );
    } catch (error) {
      setSavedInvestorIds(savedInvestorIds);
      toast.error("Something went wrong.");
    }
  };

  const filteredInvestors = investors.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? inv.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AddInvestorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

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
          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-xl shadow-lg shadow-yellow-500/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1 rounded-xl shadow-sm flex dark:bg-white/5 dark:border-white/10 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar">
            {/* Simple Scrollable Types */}
            <div className="flex gap-1">
              {["All", "VC", "Angel", "Accelerator"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type === "All" ? null : type)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    (type === "All" && !selectedType) || selectedType === type
                      ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-20 z-30">
        <div className="glass-card p-2 rounded-2xl border border-white/60 shadow-lg flex items-center bg-white/70 backdrop-blur-xl dark:bg-black/40 dark:border-white/10 gap-2">
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
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-2.5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-yellow-500/20 hover:shadow-lg hover:scale-105 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            Investor
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInvestors.map((investor) => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              isSaved={savedInvestorIds.includes(investor.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredInvestors.length === 0 && (
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
