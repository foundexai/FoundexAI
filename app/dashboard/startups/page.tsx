"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Loader2,
  Rocket,
} from "lucide-react";
import { StartupCard, Startup } from "@/components/StartupCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { MOCK_STARTUPS } from "@/lib/data";

export default function StartupsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Saved Startups Logic (Maybe later)

      // 2. Real Startups
      let allStartups = [...MOCK_STARTUPS];
      try {
        const res = await fetch("/api/startups/directory");
        if (res.ok) {
          const data = await res.json();
          const realStartups = data.startups || [];
          allStartups = [...realStartups, ...MOCK_STARTUPS];
        }
      } catch (e) {
        console.log("Failed to fetch real startups", e);
      }

      setStartups(allStartups);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load startups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch =
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Simple sector matching - if sector includes the selected tags or exact match
    const matchesSector = selectedSector
      ? startup.sector.includes(selectedSector)
      : true;

    return matchesSearch && matchesSector;
  });

  const sectors = [
    "All",
    "Fintech",
    "HealthTech",
    "EdTech",
    "Logistics",
    "SaaS",
    "E-commerce",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 dark:text-white">
            Startup Directory
          </h1>
          <p className="text-gray-500 max-w-xl text-lg dark:text-gray-400">
            Discover the most innovative companies building the future of
            Africa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Can add "Submit Startup" here if needed */}
          <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1 rounded-xl shadow-sm flex dark:bg-white/5 dark:border-white/10 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar">
            <div className="flex gap-1">
              {sectors.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedSector(type === "All" ? null : type)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    (type === "All" && !selectedSector) ||
                    selectedSector === type
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
            placeholder="Search startups by name, sector, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium h-12 dark:text-white"
          />
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
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
          {filteredStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStartups.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:bg-white/5 dark:text-gray-500">
            <Rocket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            No startups found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}
    </div>
  );
}
