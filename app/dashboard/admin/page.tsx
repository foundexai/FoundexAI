"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth, Startup as StartupModel } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check, X, CircleNotch, ShieldWarning, FileText, MagnifyingGlass, Funnel, RocketLaunch, PencilSimple, Star, Trash, Checks, UserPlus, Users, UserGear, ShieldCheck, Envelope, Lock, IdentificationCard, CaretLeft, CaretRight, DownloadSimple, CreditCard, Circle, MapPin, TrendUp } from "@phosphor-icons/react";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { toast } from "sonner";
import EditInvestorDialog from "@/components/admin/EditInvestorDialog";
import EditStartupDialog from "@/components/admin/EditStartupDialog";
import { StartupCard, Startup } from "@/components/StartupCard";
import { InvestorCardSkeleton } from "@/components/ui/skeletons/InvestorCardSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface SubscriptionRecord {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
    profile_image_url?: string;
  };
  plan: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  provider_name: string;
}

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "startups" | "users" | "subscriptions" | "bulk">("pending");
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
  
  // Filtering states for approved database
  const [selectedFilterFocus, setSelectedFilterFocus] = useState<string>("");
  const [selectedFilterRange, setSelectedFilterRange] = useState<string>("");
  const [selectedFilterType, setSelectedFilterType] = useState<string>("");
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  
  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isEditStartupOpen, setIsEditStartupOpen] = useState(false);
  
  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  
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

  const subscriptionsQuery = useQuery({
    queryKey: ["admin", "subscriptions", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const data = await res.json();
      return (data.subscriptions || []) as SubscriptionRecord[];
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

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "User deletion failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("User permanently removed");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
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

  const exportToCSV = (data: Investor[]) => {
    const headers = [
      "ID",
      "Name",
      "Type",
      "Focus/Sectors",
      "Location",
      "HQ Country",
      "Description",
      "Investment Range",
      "Stage",
      "Website",
      "LinkedIn",
      "Email",
      "Featured",
      "Status"
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return "";
      let str = "";
      if (Array.isArray(val)) {
        str = val.join(", ");
      } else {
        str = String(val);
      }
      str = str.replace(/"/g, '""');
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = data.map((inv) => [
      inv.id,
      inv.name,
      inv.type,
      inv.focus,
      inv.location,
      inv.hq_country || "",
      inv.description,
      inv.investmentRange || "",
      inv.stage || "",
      inv.website || "",
      inv.linkedin || "",
      inv.email || "",
      inv.isFeatured ? "Yes" : "No",
      inv.active_status || "Active"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `investors_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  const exportToJSON = (data: Investor[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `investors_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON export downloaded successfully!");
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
  const subscriptions = subscriptionsQuery.data || [];

  const allSectors = useMemo(() => {
    return Array.from(new Set(allInvestors.flatMap(inv => inv.focus || []))).sort();
  }, [allInvestors]);

  const allInvestmentRanges = useMemo(() => {
    return Array.from(new Set(allInvestors.map(inv => inv.investmentRange).filter(Boolean))).sort();
  }, [allInvestors]);

  const allTypes = useMemo(() => {
    return Array.from(new Set(allInvestors.map(inv => inv.type).filter(Boolean))).sort();
  }, [allInvestors]);

  const filteredInvestors = useMemo(() => {
    const list = activeTab === "pending" ? pendingInvestors : allInvestors;
    return list.filter(inv => {
      const matchesSearch = 
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.focus && inv.focus.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (inv.location && inv.location.toLowerCase().includes(searchQuery.toLowerCase()));

      if (activeTab === "pending") return matchesSearch;

      const matchesFocus = !selectedFilterFocus || 
        (inv.focus && inv.focus.some(tag => tag.toLowerCase() === selectedFilterFocus.toLowerCase()));

      const matchesRange = !selectedFilterRange || 
        inv.investmentRange === selectedFilterRange;

      const matchesType = !selectedFilterType || 
        inv.type === selectedFilterType;

      return matchesSearch && matchesFocus && matchesRange && matchesType;
    });
  }, [activeTab, pendingInvestors, allInvestors, searchQuery, selectedFilterFocus, selectedFilterRange, selectedFilterType]);
  
  const filteredStartups = useMemo(() => {
    return allStartups.filter(s =>
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allStartups, searchQuery]);

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
                         className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white shadow-xs text-sm font-bold"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                     />
                 </div>
 
                 {/* Tab Switches (Segmented Control style) */}
                 <div className="bg-gray-100/80 dark:bg-zinc-900/60 p-1 rounded-2xl flex dark:border dark:border-zinc-800/80 overflow-x-auto no-scrollbar w-full max-w-full shadow-inner">
                     <button
                       onClick={() => setActiveTab("pending")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-97",
                         activeTab === "pending"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       Pending ({pendingInvestors.length + pendingStartups.length})
                     </button>
                     <button
                       onClick={() => setActiveTab("all")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-97",
                         activeTab === "all"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       Investors ({allInvestors.length})
                     </button>
                     <button
                       onClick={() => setActiveTab("startups")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-97",
                         activeTab === "startups"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       Startups ({allStartups.length})
                     </button>
                     <button
                       onClick={() => setActiveTab("users")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-97",
                         activeTab === "users"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       Users ({allUsers.length})
                     </button>
                     <button
                       onClick={() => setActiveTab("subscriptions")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-97",
                         activeTab === "subscriptions"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       Subscriptions ({subscriptions.length})
                     </button>
                     <button
                       onClick={() => setActiveTab("bulk")}
                       className={cn(
                         "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer active:scale-97",
                         activeTab === "bulk"
                         ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                         : "text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                       )}
                     >
                       <FileText className="w-3.5 h-3.5" weight="bold" />
                       Bulk Import
                     </button>
                 </div>
             </div>
         </div>
 
         {/* Filter and Export Bar */}
         {activeTab === "all" && (
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-white/50 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/80 animate-in fade-in duration-300">
             <div className="flex items-center gap-3">
               <button
                 onClick={() => setShowFilterPanel(!showFilterPanel)}
                 className={cn(
                   "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer active:scale-97",
                   showFilterPanel || selectedFilterFocus || selectedFilterRange || selectedFilterType
                     ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400 shadow-xs"
                     : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                 )}
               >
                 <Funnel weight="bold" className="w-4 h-4" />
                 <span>Filters</span>
                 {(selectedFilterFocus || selectedFilterRange || selectedFilterType) && (
                   <span className="px-1.5 py-0.5 rounded-md bg-yellow-500 text-black text-[9px] font-black leading-none shrink-0">
                     {[selectedFilterFocus, selectedFilterRange, selectedFilterType].filter(Boolean).length}
                   </span>
                 )}
               </button>
 
               {(selectedFilterFocus || selectedFilterRange || selectedFilterType) && (
                 <button
                   onClick={() => {
                     setSelectedFilterFocus("");
                     setSelectedFilterRange("");
                     setSelectedFilterType("");
                   }}
                   className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                 >
                   Clear Filters
                 </button>
               )}
             </div>
 
             <div className="flex gap-2">
               <button
                 onClick={() => exportToCSV(filteredInvestors)}
                 disabled={filteredInvestors.length === 0}
                 className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-97"
                 title="Export filtered list to CSV"
               >
                 <DownloadSimple weight="bold" className="w-4 h-4" />
                 <span>Export CSV</span>
               </button>
               <button
                 onClick={() => exportToJSON(filteredInvestors)}
                 disabled={filteredInvestors.length === 0}
                 className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-97"
                 title="Export filtered list to JSON"
               >
                 <DownloadSimple weight="bold" className="w-4 h-4" />
                 <span>Export JSON</span>
               </button>
             </div>
           </div>
         )}

        {/* Expanded Filters Drawer/Panel */}
        {activeTab === "all" && showFilterPanel && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Sector/Focus Filter */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Focus / Sector
              </label>
              <select
                value={selectedFilterFocus}
                onChange={(e) => setSelectedFilterFocus(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all cursor-pointer"
              >
                <option value="">All Sectors</option>
                {allSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Investment Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Investment Range / Fee
              </label>
              <select
                value={selectedFilterRange}
                onChange={(e) => setSelectedFilterRange(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all cursor-pointer"
              >
                <option value="">All Ranges</option>
                {allInvestmentRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            {/* Investor Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Investor Type
              </label>
              <select
                value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                {allTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pendingStartups.map(startup => (
                                <div
                                  key={startup._id}
                                  className={cn(
                                    "bg-white dark:bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative group h-full",
                                    selectedIds.includes(startup._id) ? "border-yellow-500 ring-1 ring-yellow-500" : "border-gray-200/80 dark:border-zinc-800"
                                  )}
                                >
                                  <div>
                                    {/* Logo & Checkbox & Edit Row */}
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-yellow-400 dark:bg-yellow-950/20 text-black dark:text-yellow-400 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-gray-100 dark:border-zinc-800">
                                          {startup.logo_url ? (
                                            <img src={startup.logo_url} alt={startup.company_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span>{startup.company_name.charAt(0)}</span>
                                          )}
                                        </div>

                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedIds(prev => 
                                              prev.includes(startup._id) ? prev.filter(i => i !== startup._id) : [...prev, startup._id]
                                            );
                                          }}
                                          className={cn(
                                            "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer",
                                            selectedIds.includes(startup._id)
                                              ? "bg-yellow-500 border-yellow-500 text-black"
                                              : "bg-white/50 border-gray-300 dark:bg-white/5 dark:border-zinc-700"
                                          )}
                                        >
                                          {selectedIds.includes(startup._id) && <Check weight="bold" className="w-3 h-3" />}
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => {
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
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                                        title="Edit Details"
                                      >
                                        <PencilSimple className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Company Details */}
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight leading-tight line-clamp-1">
                                      {startup.company_name}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {startup.sector || "Uncategorized"}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10 text-[9px] font-mono font-bold uppercase">
                                        {(startup as any).stage || "Unknown"}
                                      </span>
                                    </div>

                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-3 leading-relaxed h-8 overflow-hidden">
                                      {startup.business_description || "No description provided."}
                                    </p>

                                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 font-bold">
                                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" weight="bold" />
                                      <span className="truncate">{(startup as any).location || "Unknown"}</span>
                                    </div>
                                  </div>

                                  {/* Approve / Reject Actions */}
                                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex gap-2">
                                    <button
                                      onClick={() => approveMutation.mutate({ id: startup._id, type: "startup" })}
                                      disabled={!!processingId}
                                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    >
                                      <Check className="w-3.5 h-3.5" weight="bold" />
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
                                      className="p-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 dark:bg-zinc-850 dark:text-gray-400 rounded-xl font-bold transition-all cursor-pointer active:scale-95"
                                    >
                                      <X className="w-4 h-4" weight="bold" />
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pendingInvestors.map(inv => (
                                <div
                                  key={inv.id}
                                  className={cn(
                                    "bg-white dark:bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative group h-full",
                                    selectedIds.includes(inv.id) ? "border-yellow-500 ring-1 ring-yellow-500" : "border-gray-200/80 dark:border-zinc-800"
                                  )}
                                >
                                  <div>
                                    {/* Logo & Checkbox & Edit Row */}
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-yellow-400 dark:bg-yellow-950/20 text-black dark:text-yellow-400 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-gray-100 dark:border-zinc-800">
                                          {inv.logo_url ? (
                                            <img src={inv.logo_url} alt={inv.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span>{inv.name.charAt(0)}</span>
                                          )}
                                        </div>

                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedIds(prev => 
                                              prev.includes(inv.id) ? prev.filter(i => i !== inv.id) : [...prev, inv.id]
                                            );
                                          }}
                                          className={cn(
                                            "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer",
                                            selectedIds.includes(inv.id)
                                              ? "bg-yellow-500 border-yellow-500 text-black"
                                              : "bg-white/50 border-gray-300 dark:bg-white/5 dark:border-zinc-700"
                                          )}
                                        >
                                          {selectedIds.includes(inv.id) && <Check weight="bold" className="w-3 h-3" />}
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleEdit(inv)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                                        title="Edit Details"
                                      >
                                        <PencilSimple className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Company Details */}
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight leading-tight line-clamp-1">
                                      {inv.name}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {inv.type || "Angel"}
                                      </span>
                                      {inv.investmentRange && (
                                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10 text-[9px] font-mono font-bold uppercase">
                                          {inv.investmentRange}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-3 leading-relaxed h-8 overflow-hidden">
                                      {inv.description || "No description provided."}
                                    </p>

                                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 font-bold">
                                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" weight="bold" />
                                      <span className="truncate">{inv.location || "Unknown"}</span>
                                    </div>
                                  </div>

                                  {/* Approve / Reject Actions */}
                                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex gap-2">
                                    <button
                                      onClick={() => approveMutation.mutate({ id: inv.id, type: "investor" })}
                                      disabled={!!processingId}
                                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    >
                                      <Check className="w-3.5 h-3.5" weight="bold" />
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
                                      className="p-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 dark:bg-zinc-850 dark:text-gray-400 rounded-xl font-bold transition-all cursor-pointer active:scale-95"
                                    >
                                      <X className="w-4 h-4" weight="bold" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredStartups.map(startup => (
                        <div
                          key={startup._id}
                          onClick={() => {
                            setNavigatingId(startup._id);
                            router.push(`/dashboard/startups/${startup._id}`);
                          }}
                          className={cn(
                            "bg-white dark:bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative group h-full overflow-hidden cursor-pointer hover:border-zinc-350 dark:hover:border-zinc-700",
                            selectedIds.includes(startup._id) ? "border-yellow-500 ring-1 ring-yellow-500" : "border-gray-200/80 dark:border-zinc-800"
                          )}
                        >
                          {/* Navigation Loading Overlay */}
                          {navigatingId === startup._id && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-30 transition-all duration-200">
                              <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
                            </div>
                          )}
                          <div>
                            {/* Logo & Checkbox Row */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-yellow-400 dark:bg-yellow-950/20 text-black dark:text-yellow-400 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-gray-100 dark:border-zinc-800">
                                  {startup.logo_url ? (
                                    <img src={startup.logo_url} alt={startup.company_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{startup.company_name.charAt(0)}</span>
                                  )}
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedIds(prev => 
                                      prev.includes(startup._id) ? prev.filter(i => i !== startup._id) : [...prev, startup._id]
                                    );
                                  }}
                                  className={cn(
                                    "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer",
                                    selectedIds.includes(startup._id)
                                      ? "bg-yellow-500 border-yellow-500 text-black"
                                      : "bg-white/50 border-gray-300 dark:bg-white/5 dark:border-zinc-700"
                                  )}
                                >
                                  {selectedIds.includes(startup._id) && <Check weight="bold" className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Company Details */}
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight leading-tight line-clamp-1">
                              {startup.company_name}
                            </h3>

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {startup.sector || "Uncategorized"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10 text-[9px] font-mono font-bold uppercase">
                                {(startup as any).stage || "Unknown"}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-3 leading-relaxed h-8 overflow-hidden">
                              {startup.business_description || "No description provided."}
                            </p>

                            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" weight="bold" />
                              <span className="truncate">{(startup as any).location || "Unknown"}</span>
                            </div>
                          </div>

                          {/* Uplifted Admin Controls Overlay */}
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="relative md:absolute inset-x-0 bottom-0 p-3 bg-gray-50/50 dark:bg-zinc-900/50 md:bg-white/95 md:dark:bg-zinc-950/95 md:backdrop-blur-md border-t border-gray-150 dark:border-zinc-800/80 rounded-b-3xl flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-200 z-20"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              className="flex-1 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                              Edit Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmModal({
                                  isOpen: true,
                                  title: "PERMANENT TAKE DOWN",
                                  message: "This will permanently delete this startup from the platform. Irreversible.",
                                  onConfirm: () => deleteStartupMutation.mutate(startup._id),
                                  isDestructive: true
                                });
                              }}
                              className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Take Down Permanently"
                            >
                              <Trash className="w-4 h-4" weight="bold" />
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
                         <h2 className="text-xl font-bold dark:text-white">User Accounts Control</h2>
                     </div>
                     <button 
                         onClick={() => setIsCreateUserOpen(true)}
                         className="px-5 py-2.5 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all shadow-xs active:scale-95 cursor-pointer"
                     >
                         <UserPlus weight="bold" className="w-4 h-4" />
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
                             className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all cursor-pointer"
                         >
                             Retry Request
                         </button>
                     </div>
                 ) : filteredUsers.length === 0 ? (
                     <div className="glass-card p-20 text-center rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
                         <Users className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" weight="bold" />
                         <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No users found matching search criteria.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="overflow-hidden rounded-3xl border border-gray-200/85 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left border-collapse">
                                     <thead>
                                         <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-white/5">
                                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User / Identity</th>
                                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type / Plan</th>
                                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined Date</th>
                                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                         {filteredUsers.map((u: any) => (
                                             <tr key={u._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                 <td className="px-6 py-4">
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-300 font-bold text-sm">
                                                             {u.full_name?.charAt(0) || "U"}
                                                         </div>
                                                         <div>
                                                             <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                                                                 {u.full_name}
                                                                 {u.is_admin && <ShieldCheck weight="fill" className="w-3.5 h-3.5 text-yellow-500" />}
                                                             </div>
                                                             <div className="text-xs text-gray-500 dark:text-zinc-500 font-medium">{u.email}</div>
                                                         </div>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <div className="flex flex-col gap-1">
                                                         <span className={cn(
                                                             "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md w-fit border",
                                                             u.user_type === "founder" 
                                                               ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" 
                                                               : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                                                         )}>
                                                             {u.user_type}
                                                         </span>
                                                         <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase">{u.plan_type}</span>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <div className="flex items-center gap-2">
                                                         <Circle className="w-2 h-2 text-green-500" weight="fill" />
                                                         <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase">Active</span>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <span className="text-xs text-gray-500 dark:text-zinc-400 font-bold">
                                                         {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                     </span>
                                                 </td>
                                                  <td className="px-6 py-4 text-right">
                                                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer">
                                                              <UserGear weight="bold" className="w-4 h-4 text-gray-400 hover:text-gray-900 dark:hover:text-white" />
                                                          </button>
                                                          {user?.isSuperAdmin && (
                                                            <button 
                                                              onClick={() => {
                                                                setConfirmModal({
                                                                  isOpen: true,
                                                                  title: "Delete User",
                                                                  message: `Are you sure you want to permanently delete user ${u.full_name}? This action cannot be undone.`,
                                                                  isDestructive: true,
                                                                  onConfirm: () => deleteUserMutation.mutate(u._id)
                                                                });
                                                              }}
                                                              className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all cursor-pointer"
                                                              title="Delete User"
                                                            >
                                                              <Trash weight="bold" className="w-4 h-4" />
                                                            </button>
                                                          )}
                                                      </div>
                                                  </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                             
                             {/* Fixed Pagination */}
                             {usersPagination && usersPagination.totalPages > 1 && (
                                 <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                         Showing <span className="text-gray-900 dark:text-white">{filteredUsers.length}</span> of <span className="text-gray-900 dark:text-white">{usersPagination.total}</span> users
                                     </p>
                                     <div className="flex gap-2">
                                         <button 
                                             disabled={usersPage === 1}
                                             onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                             className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
                                         >
                                             <CaretLeft weight="bold" className="w-3.5 h-3.5" />
                                         </button>
                                         <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                                             {[...Array(usersPagination.totalPages)].map((_, i) => (
                                                 <button
                                                     key={i}
                                                     onClick={() => setUsersPage(i + 1)}
                                                     className={cn(
                                                         "w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0 active:scale-95",
                                                         usersPage === i + 1 
                                                         ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm" 
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
                                             className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
                                         >
                                             <CaretRight weight="bold" className="w-3.5 h-3.5" />
                                         </button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
              </div>
          ) : activeTab === "bulk" ? (
              <div className="glass-card p-10 rounded-3xl border border-gray-250/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-6">
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
                   className="w-full h-80 p-6 bg-white border border-gray-200/80 rounded-2xl font-mono text-sm focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 outline-none transition-all dark:bg-black/40 dark:border-zinc-800 dark:text-zinc-300"
                 />
                 
                 <div className="flex justify-end">
                   <button
                     onClick={handleBulkImport}
                     disabled={isProcessingBulk || !bulkData.trim()}
                     className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-yellow-500/10 transition-all transform active:scale-97 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                   >
                     {isProcessingBulk ? <CircleNotch className="w-4 h-4 animate-spin" /> : <RocketLaunch className="w-4 h-4" weight="bold" />}
                     {isProcessingBulk ? "Processing..." : "Run Import / Sync"}
                   </button>
                 </div>
 
                 <div className="mt-8 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                   <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Import Format Instructions</h3>
                   <ul className="text-xs text-blue-700/80 space-y-1 dark:text-blue-400/70 list-disc pl-4 font-medium">
                     <li>Requires array of objects: <code>[]</code></li>
                     <li>Fields: <code>name*</code>, <code>website</code>, <code>description</code>, <code>focus (array)</code>, <code>location</code>, <code>type</code></li>
                     <li>Existing records will be updated; new ones will be created.</li>
                   </ul>
                 </div>
              </div>
          ) : activeTab === "subscriptions" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-yellow-500" weight="bold" />
                    <h2 className="text-xl font-bold dark:text-white">Active Member Subscriptions</h2>
                  </div>
                  <button 
                    onClick={() => subscriptionsQuery.refetch()}
                    className="px-4 py-2 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Refresh List
                  </button>
                </div>

                {/* Subscriptions Metrics Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xs">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Subscribers</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{subscriptions.length}</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xs">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">MRR Est.</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      ${subscriptions.filter(s => s.status === "active").reduce((acc, curr) => acc + (curr.plan === "pro" ? 49 : curr.plan === "founder" ? 99 : 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xs">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Pro Plans</p>
                    <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400 mt-1">
                      {subscriptions.filter(s => s.plan === "pro" && s.status === "active").length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xs">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Founder Plans</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                      {subscriptions.filter(s => s.plan === "founder" && s.status === "active").length}
                    </p>
                  </div>
                </div>

                {/* Subscriptions List Table */}
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Subscriber / Organization</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan Tier</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Provider / Billing</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Renewal Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {subscriptions.map((sub) => (
                          <tr key={sub._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                                  {sub.user_id?.full_name?.charAt(0) || "U"}
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
                            <td className="px-6 py-4">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                sub.plan === "pro" ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-600 dark:text-yellow-400" :
                                sub.plan === "founder" ? "bg-blue-400/10 border-blue-400/20 text-blue-600 dark:text-blue-400" :
                                "bg-gray-100 dark:bg-white/5 border-transparent text-gray-500"
                              )}>
                                {sub.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-700 dark:text-white capitalize">{sub.billing_cycle}</p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-tighter">{sub.provider_name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-xs font-bold text-gray-900 dark:text-white">
                                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "N/A"}
                              </p>
                            </td>
                          </tr>
                        ))}
                        {subscriptions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center text-gray-400 dark:text-zinc-600 italic text-xs font-bold">
                              No active organization subscriptions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredInvestors.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setNavigatingId(inv.id);
                        router.push(`/dashboard/investors/${inv.id}`);
                      }}
                      className={cn(
                        "bg-white dark:bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative group h-full overflow-hidden cursor-pointer hover:border-zinc-350 dark:hover:border-zinc-700",
                        selectedIds.includes(inv.id) ? "border-yellow-500 ring-1 ring-yellow-500" : "border-gray-200/80 dark:border-zinc-800"
                      )}
                    >
                      {/* Navigation Loading Overlay */}
                      {navigatingId === inv.id && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-30 transition-all duration-200">
                          <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
                        </div>
                      )}
                      <div>
                        {/* Logo & Checkbox Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-yellow-400 dark:bg-yellow-950/20 text-black dark:text-yellow-400 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-gray-100 dark:border-zinc-800">
                              {inv.logo_url ? (
                                <img src={inv.logo_url} alt={inv.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{inv.name.charAt(0)}</span>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedIds(prev => 
                                  prev.includes(inv.id) ? prev.filter(i => i !== inv.id) : [...prev, inv.id]
                                );
                              }}
                              className={cn(
                                "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer",
                                selectedIds.includes(inv.id)
                                  ? "bg-yellow-500 border-yellow-500 text-black"
                                  : "bg-white/50 border-gray-300 dark:bg-white/5 dark:border-zinc-700"
                              )}
                            >
                              {selectedIds.includes(inv.id) && <Check weight="bold" className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Company Details */}
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight leading-tight line-clamp-1">
                          {inv.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {inv.type || "Angel"}
                          </span>
                          {inv.investmentRange && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10 text-[9px] font-mono font-bold uppercase">
                              {inv.investmentRange}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-3 leading-relaxed h-8 overflow-hidden">
                          {inv.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" weight="bold" />
                          <span className="truncate">{inv.location || "Unknown"}</span>
                        </div>
                      </div>

                      {/* Uplifted Admin Controls Overlay */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative md:absolute inset-x-0 bottom-0 p-3 bg-gray-50/50 dark:bg-zinc-900/50 md:bg-white/95 md:dark:bg-zinc-950/95 md:backdrop-blur-md border-t border-gray-150 dark:border-zinc-800/80 rounded-b-3xl flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-200 z-20"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFeatured(inv);
                          }}
                          className={cn(
                            "p-2 rounded-xl font-bold transition-all border cursor-pointer active:scale-95 shrink-0 flex items-center justify-center",
                            inv.isFeatured 
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                              : "bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:text-white"
                          )}
                          title={inv.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                        >
                          <Star weight={inv.isFeatured ? "fill" : "bold"} className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvestor(inv);
                            setIsEditOpen(true);
                          }}
                          className="flex-1 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                          Edit Details
                        </button>
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

                {user?.isSuperAdmin && (
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
                )}
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
