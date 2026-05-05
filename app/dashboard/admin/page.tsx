"use client";

import { useEffect, useState } from "react";
import { useAuth, Startup as StartupModel } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check, X, CircleNotch, ShieldWarning, FileText, MagnifyingGlass, Funnel, RocketLaunch, PencilSimple, Star, Trash, Checks } from "@phosphor-icons/react";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { toast } from "sonner";
import EditInvestorDialog from "@/components/admin/EditInvestorDialog";
import EditStartupDialog from "@/components/admin/EditStartupDialog";
import { StartupCard, Startup } from "@/components/StartupCard";
import { InvestorCardSkeleton } from "@/components/ui/skeletons/InvestorCardSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "startups" | "bulk">("pending");
  const [bulkData, setBulkData] = useState("");
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isEditStartupOpen, setIsEditStartupOpen] = useState(false);
  
  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleBulkImport = async () => {
    if (!bulkData.trim()) return;
    setIsProcessingBulk(true);
    try {
      const parsed = JSON.parse(bulkData);
      const res = await fetch("/api/admin/bulk-investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ investors: parsed })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Import complete! ${data.results.updated} updated, ${data.results.created} created.`);
        setBulkData("");
        queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      } else {
        const err = await res.json();
        toast.error(err.error || "Import failed");
      }
    } catch (e) {
      toast.error("Invalid JSON format");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/dashboard");
      return;
    }
    if (!loading && user && !user.isAdmin) {
      toast.error("Unauthorized access");
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  // Queries
  const pendingInvestorsQuery = useQuery({
    queryKey: ["admin", "investors", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/investors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load pending investors");
      const data = await res.json();
      return (data.investors || []) as Investor[];
    },
    enabled: !!token && user?.isAdmin,
    staleTime: 30000,
  });

  const allInvestorsQuery = useQuery({
    queryKey: ["admin", "investors", "all"],
    queryFn: async () => {
      const res = await fetch("/api/investors?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load database");
      const data = await res.json();
      return (data.investors || []) as Investor[];
    },
    enabled: !!token && user?.isAdmin,
    staleTime: 60000,
  });

  const pendingStartupsQuery = useQuery({
    queryKey: ["admin", "startups", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/startups/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load pending startups");
      const data = await res.json();
      return (data.startups || []) as StartupModel[];
    },
    enabled: !!token && user?.isAdmin,
    staleTime: 30000,
  });

  const allStartupsQuery = useQuery({
    queryKey: ["admin", "startups", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/startups/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load global database");
      const data = await res.json();
      return (data.startups || []) as StartupModel[];
    },
    enabled: !!token && user?.isAdmin,
    staleTime: 60000,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "investor" | "startup" }) => {
      const endpoint = type === "investor" ? "/api/admin/investors/approve" : "/api/admin/startups/approve";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Approval failed");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type === "investor" ? "Investor" : "Startup"} Approved!`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "investor" | "startup" }) => {
      const endpoint = type === "investor" ? "/api/admin/investors/reject" : "/api/admin/startups/reject";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Submission Rejected");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });
  const deleteStartupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/startups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Deletion failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Startup permanently removed");
      queryClient.invalidateQueries({ queryKey: ["admin", "startups"] });
    }
  });

  const handleToggleFeatured = async (investor: Investor) => {
    const newFeatured = !investor.isFeatured;
    try {
      const res = await fetch(`/api/admin/investors/${investor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(newFeatured ? "Investor Featured!" : "Removed from Featured");
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsEditOpen(true);
  };

  const isLoading = 
    (activeTab === "pending" && (pendingInvestorsQuery.isLoading || pendingStartupsQuery.isLoading)) ||
    (activeTab === "all" && allInvestorsQuery.isLoading) ||
    (activeTab === "startups" && allStartupsQuery.isLoading);
    
  const pendingInvestors = pendingInvestorsQuery.data || [];
  const allInvestors = allInvestorsQuery.data || [];
  const allStartups = allStartupsQuery.data || [];
  const pendingStartups = pendingStartupsQuery.data || [];

  const filteredInvestors = (activeTab === "pending" ? pendingInvestors : allInvestors).filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredStartups = allStartups.filter(s =>
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const processingId = approveMutation.isPending ? approveMutation.variables?.id : 
                     (rejectMutation.isPending ? rejectMutation.variables?.id : 
                     (deleteStartupMutation.isPending ? deleteStartupMutation.variables : null));

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EditInvestorDialog 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin", "investors"] })}
        investor={selectedInvestor}
      />
      
      <EditStartupDialog
        isOpen={isEditStartupOpen}
        onClose={() => setIsEditStartupOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin", "startups"] })}
        startup={selectedStartup}
      />

      <div className="space-y-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage global investor data and submissions.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
             {/* Search */}
            <div className="relative grow md:grow-0 md:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <MagnifyingGlass className="w-5 h-5" weight="bold" />
                </span>
                <input 
                    type="text" 
                    placeholder="Search database..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1 rounded-2xl shadow-sm flex dark:bg-white/5 dark:border-white/10 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeTab === "pending"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  Pending ({pendingInvestors.length + pendingStartups.length})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeTab === "all"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  Investors ({allInvestors.length})
                </button>
                <button
                  onClick={() => setActiveTab("startups")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeTab === "startups"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  Startups ({allStartups.length})
                </button>
                <button
                  onClick={() => setActiveTab("bulk")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
                    activeTab === "bulk"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <FileText className="w-4 h-4" weight="bold" />
                  Bulk Import
                </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 w-full sm:w-auto px-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 shrink-0">
                <Checks weight="bold" />
              </div>
              <p className="font-bold text-sm sm:text-base">{selectedIds.length} items selected</p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setSelectedIds([])}
                className="flex-1 sm:px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: "Bulk Delete Items",
                    message: `Are you sure you want to delete ${selectedIds.length} selected items? This action cannot be undone.`,
                    onConfirm: async () => {
                      for (const id of selectedIds) {
                        if (activeTab === "startups") {
                            await deleteStartupMutation.mutateAsync(id);
                        } else {
                            await rejectMutation.mutateAsync({ id, type: "investor" });
                        }
                      }
                      setSelectedIds([]);
                      toast.success("Bulk deletion complete!");
                    },
                    isDestructive: true
                  });
                }}
                className="flex-[2] sm:px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Trash weight="bold" className="w-4 h-4" />
                <span className="whitespace-nowrap">Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <InvestorCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === "pending" ? (
             <div className="space-y-12">
                {/* Pending Startups Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <RocketLaunch className="w-6 h-6 text-yellow-500" weight="bold" />
                        <h2 className="text-xl font-bold dark:text-white">Pending Startup Submissions ({pendingStartups.length})</h2>
                    </div>
                    {pendingStartups.length === 0 ? (
                        <div className="glass-card p-12 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                             <p className="text-gray-500 font-medium">No new startup submissions.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingStartups.map(startup => (
                                <div key={startup._id} className="relative group">
                                    <StartupCard 
                                      startup={{
                                          id: startup._id,
                                          name: startup.company_name,
                                          sector: startup.sector || "Uncategorized",
                                          stage: (startup as any).stage || "Unknown",
                                          location: (startup as any).location || "Unknown",
                                          logoInitial: (startup as any).logoInitial,
                                          logoColor: (startup as any).logoColor,
                                          description: startup.business_description || "",
                                          website: (startup as any).website_url,
                                          logo_url: (startup as any).logo_url,
                                          traction: (startup as any).traction
                                      }}
                                      onSelect={(id) => {
                                        setSelectedIds(prev => 
                                          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                        );
                                      }}
                                      isSelected={selectedIds.includes(startup._id)}
                                      onEdit={() => {
                                        const mapped: Startup = {
                                          id: startup._id,
                                          name: startup.company_name,
                                          sector: startup.sector || "",
                                          stage: (startup as any).stage || "",
                                          location: (startup as any).location || "",
                                          logoInitial: (startup as any).logoInitial || "",
                                          logoColor: (startup as any).logoColor || "",
                                          description: startup.business_description || "",
                                          website: (startup as any).website_url,
                                          logo_url: (startup as any).logo_url,
                                          traction: (startup as any).traction,
                                        };
                                        setSelectedStartup(mapped);
                                        setIsEditStartupOpen(true);
                                      }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 rounded-b-3xl flex gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all translate-y-0 xl:translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                                        <button
                                            onClick={() => approveMutation.mutate({ id: startup._id, type: "startup" })}
                                            disabled={!!processingId}
                                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" weight="bold" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                              setConfirmModal({
                                                isOpen: true,
                                                title: "Reject Submission",
                                                message: "Are you sure you want to reject and delete this startup submission?",
                                                onConfirm: () => rejectMutation.mutate({ id: startup._id, type: "startup" }),
                                                isDestructive: true
                                              });
                                            }}
                                            className="p-2.5 bg-white/10 hover:bg-red-500 hover:text-white text-white rounded-xl font-bold transition-all"
                                        >
                                            <X className="w-5 h-5" weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Investors Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-500" weight="bold" />
                        <h2 className="text-xl font-bold dark:text-white">Pending Investor Submissions ({pendingInvestors.length})</h2>
                    </div>
                    {pendingInvestors.length === 0 ? (
                        <div className="glass-card p-12 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                             <p className="text-gray-500 font-medium">No new investor submissions.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingInvestors.map(inv => (
                                <div key={inv.id} className="relative group">
                                    <InvestorCard
                                      investor={inv}
                                      onSelect={(id) => {
                                        setSelectedIds(prev => 
                                          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                        );
                                      }}
                                      isSelected={selectedIds.includes(inv.id)}
                                      onEdit={handleEdit}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 rounded-b-3xl flex gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all translate-y-0 xl:translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                                        <button
                                            onClick={() => approveMutation.mutate({ id: inv.id, type: "investor" })}
                                            disabled={!!processingId}
                                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" weight="bold" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                              setConfirmModal({
                                                isOpen: true,
                                                title: "Reject Submission",
                                                message: "Are you sure you want to reject and delete this investor submission?",
                                                onConfirm: () => rejectMutation.mutate({ id: inv.id, type: "investor" }),
                                                isDestructive: true
                                              });
                                            }}
                                            className="p-2.5 bg-white/10 hover:bg-red-500 hover:text-white text-white rounded-xl font-bold transition-all"
                                        >
                                            <X className="w-5 h-5" weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
        ) : activeTab === "startups" ? (
             // ALL STARTUPS VIEW
             filteredStartups.length === 0 ? (
                <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                    <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No startups found.</p>
                </div>
             ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStartups.map(startup => (
                        <div key={startup._id} className="relative group">
                            <StartupCard 
                              startup={{
                                id: startup._id,
                                name: startup.company_name,
                                sector: startup.sector || "Uncategorized",
                                stage: (startup as any).stage || "Unknown",
                                location: (startup as any).location || "Unknown",
                                logoInitial: (startup as any).logoInitial,
                                logoColor: (startup as any).logoColor,
                                description: startup.business_description || "",
                                website: (startup as any).website_url,
                                logo_url: (startup as any).logo_url,
                                traction: (startup as any).traction
                              }} 
                              onSelect={(id) => {
                                setSelectedIds(prev => 
                                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                );
                              }}
                              isSelected={selectedIds.includes(startup._id)}
                              onEdit={() => {
                                const mapped: Startup = {
                                  id: startup._id,
                                  name: startup.company_name,
                                  sector: startup.sector || "",
                                  stage: (startup as any).stage || "",
                                  location: (startup as any).location || "",
                                  logoInitial: (startup as any).logoInitial || "",
                                  logoColor: (startup as any).logoColor || "",
                                  description: startup.business_description || "",
                                  website: (startup as any).website_url,
                                  logo_url: (startup as any).logo_url,
                                  traction: (startup as any).traction,
                                };
                                setSelectedStartup(mapped);
                                setIsEditStartupOpen(true);
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 rounded-b-3xl flex gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all translate-y-0 xl:translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                                <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: "PERMANENT TAKE DOWN",
                                        message: "This will permanently delete this startup from the platform. Irreversible.",
                                        onConfirm: () => deleteStartupMutation.mutate(startup._id),
                                        isDestructive: true
                                      });
                                    }}
                                    className="p-2.5 bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold transition-all flex-1 flex items-center justify-center gap-2 border border-red-500/20"
                                >
                                    <Trash className="w-5 h-5" weight="bold" />
                                    Take Down Permanently
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
             )
        ) : activeTab === "bulk" ? (
             <div className="glass-card p-10 rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bulk Investor Import</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paste a JSON array of investors to update existing records or create new ones. Records are matched by name or website.
                  </p>
                </div>
                
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder='[{"name": "Sequoia Capital", "website": "https://sequoiacap.com", "description": "...", "focus": ["SaaS", "AI"]}]'
                  className="w-full h-80 p-6 bg-white border border-gray-200 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all dark:bg-black/40 dark:border-white/10 dark:text-zinc-300"
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={handleBulkImport}
                    disabled={isProcessingBulk || !bulkData.trim()}
                    className="px-8 py-4 bg-yellow-500 text-white rounded-2xl font-black hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-[1.02] flex items-center gap-3 disabled:opacity-50"
                  >
                    {isProcessingBulk ? <CircleNotch className="w-5 h-5 animate-spin" /> : <RocketLaunch className="w-5 h-5" />}
                    {isProcessingBulk ? "Processing..." : "Run Import / Sync"}
                  </button>
                </div>

                <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                  <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Import Format Memo</h3>
                  <ul className="text-xs text-blue-700 space-y-1 dark:text-blue-400/80 list-disc pl-4">
                    <li>Requires array of objects: <code>[]</code></li>
                    <li>Fields: <code>name*</code>, <code>website</code>, <code>description</code>, <code>focus (array)</code>, <code>location</code>, <code>type</code></li>
                    <li>Existing records will be updated; new ones will be created.</li>
                  </ul>
                </div>
             </div>
        ) : (
            // INVESTORS VIEW
            filteredInvestors.length === 0 ? (
            <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No investors found.</p>
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvestors.map((inv) => (
                <div key={inv.id} className="relative group">
                    <InvestorCard
                      investor={inv}
                      isSaved={false}
                      onToggleSave={() => {}}
                      onEdit={handleEdit}
                      onSelect={(id) => {
                        setSelectedIds(prev => 
                          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                        );
                      }}
                      isSelected={selectedIds.includes(inv.id)}
                    />

                    {/* Admin Controls Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 rounded-b-3xl flex gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all translate-y-0 xl:translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleToggleFeatured(inv)}
                            className={cn(
                              "p-2.5 rounded-xl font-bold transition-all border cursor-pointer",
                              inv.isFeatured 
                                ? "bg-yellow-400 border-yellow-500 text-black shadow-lg shadow-yellow-500/20" 
                                : "bg-white/10 border-white/5 text-gray-500 hover:bg-white/20 dark:text-gray-400"
                            )}
                            title={inv.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                          >
                            <Star weight={inv.isFeatured ? "fill" : "bold"} className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvestor(inv);
                              setIsEditOpen(true);
                            }}
                            className="flex-1 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" weight="bold" />
                            Edit Details
                          </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
            )
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
