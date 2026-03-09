"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  Funnel,
  FadersHorizontal,
  CircleNotch,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";
import { MatchInvestorModal } from "@/components/MatchInvestorModal";
import { AIFilterModal } from "@/components/AIFilterModal";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import AddInvestorModal from "@/components/AddInvestorModal";
import EditInvestorDialog from "@/components/admin/EditInvestorDialog";
import { Pagination } from "@/components/Pagination";
import { InvestorCardSkeleton } from "@/components/ui/skeletons/InvestorCardSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function InvestorsPage() {
  const { token, user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvestorForEdit, setSelectedInvestorForEdit] = useState<Investor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); 
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // UseQuery for fetching investors
  const { data, isLoading } = useQuery({
    queryKey: ["investors", currentPage, debouncedSearch, selectedType],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        search: debouncedSearch,
        type: selectedType || "",
      });

      const res = await fetch(`/api/investors?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch investors");
      return res.json();
    },
    staleTime: 60 * 1000, 
    retry: 2,
  });

  const investors = (data?.investors || []) as Investor[];
  const pagination = data?.pagination || { total: 0, pages: 1, limit: 12 };
  const savedInvestorIds = user?.saved_investors || [];

  // UseMutation for saving investors
  const saveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/investors/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId: id }),
      });

      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      if (refreshUser) refreshUser();
      queryClient.invalidateQueries({ queryKey: ["investors"] });
    },
    onError: () => {
      toast.error("Cloud synchronization failed.");
    }
  });

  const handleToggleSave = (id: string) => {
    if (!token) {
      toast.error("Please sign in to save investors");
      return;
    }
    saveMutation.mutate(id);
  };

  const handleTypeChange = (type: string | null) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleEdit = (investor: Investor) => {
    setSelectedInvestorForEdit(investor);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-10 pb-10">
      <MatchInvestorModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        investors={investors}
      />
      <AIFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
      <AddInvestorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["investors"] });
        }}
      />
      <EditInvestorDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        investor={selectedInvestorForEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["investors"] });
        }}
      />

      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 dark:text-white">
              Investor Database
            </h1>
            <p className="text-gray-500 max-w-xl text-lg dark:text-gray-400">
              Connect with the leading VCs, Angels, and Accelerators powering the
              next generation of African startups.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-95 w-full md:w-auto shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" weight="bold" />
            <span className="hidden sm:inline">Add New Investor</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1.5 rounded-2xl shadow-sm dark:bg-white/5 dark:border-white/10 overflow-hidden w-full">
           <div className="flex gap-1 overflow-x-auto thin-scrollbar pb-1 px-1">
              <div className="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 dark:text-gray-400 flex items-center gap-2 border-r border-gray-100 dark:border-white/5 mr-1 shrink-0">
                <Funnel weight="bold" />
                Filter
              </div>
              {["All", "Featured", "VC", "Angel", "Accelerator", "Grant"].map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type === "All" ? null : type)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    (type === "All" && !selectedType) || selectedType === type
                      ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
                >
                  {type === "Grant" ? "Grants" : type}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-20 z-30">
        <div className="glass-card p-2 rounded-2xl border border-white/60 shadow-lg flex items-center bg-white/70 backdrop-blur-xl dark:bg-black/40 dark:border-white/10 gap-2 outline-none">
          <div className="pl-4 text-gray-400">
            <MagnifyingGlass className="w-5 h-5" weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Search investors by name, focus, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium h-12 dark:text-white outline-none"
          />
          <button
            onClick={() => setIsMatchModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-zinc-900 text-yellow-400 rounded-xl font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            Match Me
          </button>
          
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 lg:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20 shrink-0 cursor-pointer"
          >
            <FadersHorizontal className="w-4 h-4" weight="bold" />
            <span className="hidden lg:inline">AI Search</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 lg:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-yellow-500/20 hover:shadow-lg hover:scale-105 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span className="hidden lg:inline">Investor</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, i) => (
            <InvestorCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {investors.map((investor) => (
              <InvestorCard
                key={investor.id}
                investor={investor}
                isSaved={savedInvestorIds.includes(investor.id)}
                onToggleSave={handleToggleSave}
                isSaving={saveMutation.isPending && saveMutation.variables === investor.id}
              />
            ))}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Empty State */}
      {!isLoading && investors.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:bg-white/5 dark:text-gray-500">
            <MagnifyingGlass className="w-8 h-8" weight="bold" />
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
