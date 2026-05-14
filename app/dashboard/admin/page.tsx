"use client";

import { useEffect, useState } from "react";
import { useAuth, Startup as StartupModel } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check, X, CircleNotch, ShieldWarning, FileText, MagnifyingGlass, Funnel, RocketLaunch, PencilSimple, Star, Trash, Checks, UserPlus, Users, UserGear, ShieldCheck, Envelope, Lock, IdentificationCard, CaretLeft, CaretRight } from "@phosphor-icons/react";
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
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "startups" | "users" | "bulk">("pending");
  const [usersPage, setUsersPage] = useState(1);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    user_type: "founder" as "founder" | "investor",
    is_admin: false
  });
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

  const allUsersQuery = useQuery({
    queryKey: ["admin", "users", "all", usersPage, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/all?page=${usersPage}&limit=10&search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      return data;
    },
    enabled: !!token && user?.isAdmin,
    staleTime: 30000,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserForm) => {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateUserOpen(false);
      setNewUserForm({
        full_name: "",
        email: "",
        password: "",
        user_type: "founder",
        is_admin: false
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
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
    (activeTab === "users" && allUsersQuery.isLoading) ||
    (activeTab === "startups" && allStartupsQuery.isLoading);
    
  const pendingInvestors = pendingInvestorsQuery.data || [];
  const allInvestors = allInvestorsQuery.data || [];
  const allStartups = allStartupsQuery.data || [];
  const pendingStartups = pendingStartupsQuery.data || [];
  const allUsers = allUsersQuery.data?.users || [];
  const usersPagination = allUsersQuery.data?.pagination;

  const filteredInvestors = (activeTab === "pending" ? pendingInvestors : allInvestors).filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredStartups = allStartups.filter(s =>
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Users are filtered on the backend now, but we keep this for reactive consistency if needed
  const filteredUsers = allUsers;

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

      <div className="space-y-10">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                Manage global investor data and submissions.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto max-w-full">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <MagnifyingGlass className="w-5 h-5" weight="bold" />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search database..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1.5 rounded-[1.5rem] shadow-sm flex dark:bg-white/5 dark:border-white/10 overflow-x-auto no-scrollbar w-full max-w-full">
                    <button
                      onClick={() => setActiveTab("pending")}
                      className={cn(
                        "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
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
                        "px-4 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
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
                        "px-4 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                        activeTab === "startups"
                        ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      Startups ({allStartups.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("users")}
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                        activeTab === "users"
                        ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      Users ({allUsers.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("bulk")}
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
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
                className="flex-2 sm:px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
             <div className="max-h-[700px] overflow-y-auto thin-scrollbar pr-4 space-y-12">
                {/* Pending Startups Section */}
                <div className="space-y-6">
                    <div className="flex items-center">
                        <h2 className="text-xl font-bold dark:text-white tracking-tight">Pending Startup Submissions <span className="text-zinc-400 ml-2 font-medium">({pendingStartups.length})</span></h2>
                    </div>
                    {pendingStartupsQuery.isError ? (
                        <div className="glass-card p-12 text-center rounded-3xl border border-red-100 dark:border-red-900/20 bg-red-50/10">
                            <ShieldWarning className="w-10 h-10 text-red-500 mx-auto mb-3" weight="bold" />
                            <p className="text-red-800 dark:text-red-400 font-bold">Failed to load pending startups</p>
                            <button onClick={() => pendingStartupsQuery.refetch()} className="text-sm text-red-600 underline mt-2">Retry</button>
                        </div>
                    ) : pendingStartups.length === 0 ? (
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
                    <div className="flex items-center">
                        <h2 className="text-xl font-bold dark:text-white tracking-tight">Pending Investor Submissions <span className="text-zinc-400 ml-2 font-medium">({pendingInvestors.length})</span></h2>
                    </div>
                    {pendingInvestorsQuery.isError ? (
                        <div className="glass-card p-12 text-center rounded-3xl border border-red-100 dark:border-red-900/20 bg-red-50/10">
                            <ShieldWarning className="w-10 h-10 text-red-500 mx-auto mb-3" weight="bold" />
                            <p className="text-red-800 dark:text-red-400 font-bold">Failed to load pending investors</p>
                            <button onClick={() => pendingInvestorsQuery.refetch()} className="text-sm text-red-600 underline mt-2">Retry</button>
                        </div>
                    ) : pendingInvestors.length === 0 ? (
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
             <div className="max-h-[700px] overflow-y-auto thin-scrollbar pr-4">
             {allStartupsQuery.isError ? (
                <div className="glass-card p-20 text-center rounded-3xl border border-red-100 dark:border-red-900/20 bg-red-50/10">
                    <ShieldWarning className="w-12 h-12 text-red-500 mx-auto mb-4" weight="bold" />
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Database Error</h3>
                    <p className="text-sm text-red-600/70 dark:text-red-400/60 mb-6">Failed to load startup database.</p>
                    <button onClick={() => allStartupsQuery.refetch()} className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold">Retry Load</button>
                </div>
             ) : filteredStartups.length === 0 ? (
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
             )}
             </div>
         ) : activeTab === "users" ? (
             // USERS MANAGEMENT VIEW
             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-yellow-500" weight="bold" />
                        <h2 className="text-xl font-bold dark:text-white">User Management</h2>
                    </div>
                    <button 
                        onClick={() => setIsCreateUserOpen(true)}
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        <UserPlus weight="bold" />
                        Create New User
                    </button>
                </div>

                {allUsersQuery.isError ? (
                    <div className="glass-card p-12 text-center rounded-3xl border border-red-100 dark:border-red-900/20 bg-red-50/10">
                        <ShieldWarning className="w-12 h-12 text-red-500 mx-auto mb-4" weight="bold" />
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Error Loading Users</h3>
                        <p className="text-sm text-red-600/70 dark:text-red-400/60 mb-6">We couldn't retrieve the user list. This might be a temporary connection issue.</p>
                        <button 
                            onClick={() => allUsersQuery.refetch()}
                            className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                        >
                            Retry Request
                        </button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" weight="bold" />
                        <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No users found matching your search.</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or adding a new user.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col h-[700px] glass-card rounded-[2.5rem] border border-white/60 dark:border-white/10 bg-white/40 shadow-xl overflow-hidden">
                            <div className="flex-1 overflow-y-auto thin-scrollbar p-1">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
                                            <tr className="border-b border-gray-100 dark:border-white/5">
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400">User</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Type / Plan</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Joined</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {filteredUsers.map((u: any) => (
                                                <tr key={u._id} className="group hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white font-black shadow-inner">
                                                                {u.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {u.full_name}
                                                                    {u.is_admin && <ShieldCheck weight="fill" className="w-3.5 h-3.5 text-yellow-500" />}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit",
                                                                u.user_type === "founder" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                                                            )}>
                                                                {u.user_type}
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-400 uppercase">{u.plan_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Active</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                            <UserGear weight="bold" className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Fixed Pagination at the bottom of the container */}
                            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                                {usersPagination && usersPagination.totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Showing <span className="text-gray-900 dark:text-white">{filteredUsers.length}</span> of <span className="text-gray-900 dark:text-white">{usersPagination.total}</span> users
                                        </p>
                                        <div className="flex gap-2">
                                            <button 
                                                disabled={usersPage === 1}
                                                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                                className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <CaretLeft weight="bold" className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                                                {[...Array(usersPagination.totalPages)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setUsersPage(i + 1)}
                                                        className={cn(
                                                            "w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0",
                                                            usersPage === i + 1 
                                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg" 
                                                            : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400"
                                                        )}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                disabled={usersPage === usersPagination.totalPages}
                                                onClick={() => setUsersPage(prev => Math.min(usersPagination.totalPages, prev + 1))}
                                                className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <CaretRight weight="bold" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
             </div>
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
            <div className="max-h-[700px] overflow-y-auto thin-scrollbar pr-4">
            {allInvestorsQuery.isError ? (
                <div className="glass-card p-20 text-center rounded-3xl border border-red-100 dark:border-red-900/20 bg-red-50/10">
                    <ShieldWarning className="w-12 h-12 text-red-500 mx-auto mb-4" weight="bold" />
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Database Error</h3>
                    <p className="text-sm text-red-600/70 dark:text-red-400/60 mb-6">Failed to load investor database.</p>
                    <button onClick={() => allInvestorsQuery.refetch()} className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold">Retry Load</button>
                </div>
            ) : filteredInvestors.length === 0 ? (
            <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                <p className="text-xl font-bold text-gray-500 dark:text-gray-400">No investors found.</p>
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
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
            )}
            </div>
        ) }
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />

      {/* Create User Modal */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Create User</h2>
                <p className="text-gray-500 text-sm">Add a new investor or founder to the platform.</p>
              </div>
              <button 
                onClick={() => setIsCreateUserOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X weight="bold" className="w-5 h-5" />
              </button>
            </div>

            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    createUserMutation.mutate(newUserForm);
                }}
                className="p-8 space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <IdentificationCard weight="bold" />
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                    value={newUserForm.full_name}
                    onChange={e => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <Envelope weight="bold" />
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="Email Address"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <Lock weight="bold" />
                  </span>
                  <input
                    required
                    type="password"
                    placeholder="Set Password"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                    value={newUserForm.password}
                    onChange={e => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setNewUserForm(prev => ({ ...prev, user_type: "founder" }))}
                        className={cn(
                            "py-3 rounded-2xl font-bold text-sm transition-all border",
                            newUserForm.user_type === "founder" 
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent" 
                            : "bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-100 dark:border-white/5"
                        )}
                    >
                        Founder
                    </button>
                    <button
                        type="button"
                        onClick={() => setNewUserForm(prev => ({ ...prev, user_type: "investor" }))}
                        className={cn(
                            "py-3 rounded-2xl font-bold text-sm transition-all border",
                            newUserForm.user_type === "investor" 
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent" 
                            : "bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-100 dark:border-white/5"
                        )}
                    >
                        Investor
                    </button>
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-gray-100 dark:border-white/5">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={newUserForm.is_admin}
                            onChange={e => setNewUserForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                        />
                        <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-yellow-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-inner"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Grant Admin Access</span>
                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Full Platform Control</span>
                    </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black shadow-xl shadow-yellow-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {createUserMutation.isPending ? <CircleNotch className="w-5 h-5 animate-spin" /> : <UserPlus weight="bold" className="w-5 h-5" />}
                {createUserMutation.isPending ? "Creating Account..." : "Create User Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
