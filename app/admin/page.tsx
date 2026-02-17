"use client";

import { useEffect, useState } from "react";
import { useAuth, Startup as StartupModel } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Check, X, CircleNotch, ShieldWarning, FileText, MagnifyingGlass, Funnel, RocketLaunch, PencilSimple } from "@phosphor-icons/react";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { toast } from "sonner";
import EditInvestorDialog from "@/components/admin/EditInvestorDialog";
import EditStartupDialog from "@/components/admin/EditStartupDialog";
import { StartupCard, Startup } from "@/components/StartupCard";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "startups">("pending");
  
  const [pendingInvestors, setPendingInvestors] = useState<Investor[]>([]);
  const [allInvestors, setAllInvestors] = useState<Investor[]>([]);
  const [pendingStartups, setPendingStartups] = useState<StartupModel[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isEditStartupOpen, setIsEditStartupOpen] = useState(false);

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

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/investors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingInvestors(data.investors || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pending requests");
    }
  };

  const fetchAllApproved = async () => {
    try {
      const res = await fetch("/api/investors?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllInvestors(data.investors || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load database");
    }
  };

  const fetchPendingStartups = async () => {
     try {
      const res = await fetch("/api/admin/startups/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingStartups(data.startups || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pending startups");
    }
  }

  const loadData = async () => {
    setIsLoading(true);
    // Always fetch pending counts for the tabs
    await Promise.all([
        fetchPending(),
        fetchPendingStartups()
    ]);
    
    // If 'all' tab is active, we also need that data
    if (activeTab === "all") {
      await fetchAllApproved();
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (token && user?.isAdmin) {
      loadData();
    }
  }, [token, user, activeTab]);

  const handleApprove = async (id: string, type: "investor" | "startup") => {
    setProcessingId(id);
    const endpoint = type === "investor" ? "/api/admin/investors/approve" : "/api/admin/startups/approve";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(`${type === "investor" ? "Investor" : "Startup"} Approved!`);
      if (type === "investor") {
          setPendingInvestors((prev) => prev.filter((inv) => inv.id !== id));
      } else {
          setPendingStartups((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (e) {
      toast.error("Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsEditOpen(true);
  };

  const handleReject = async (id: string, type: "investor" | "startup") => {
    if (!confirm("Are you sure you want to reject and delete this submission?"))
      return;
    setProcessingId(id);
    const endpoint = type === "investor" ? "/api/admin/investors/reject" : "/api/admin/startups/reject";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Submission Rejected");
       if (type === "investor") {
          setPendingInvestors((prev) => prev.filter((inv) => inv.id !== id));
      } else {
          setPendingStartups((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (e) {
      toast.error("Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredInvestors = (activeTab === "pending" ? pendingInvestors : allInvestors).filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredStartups = pendingStartups.filter(s =>
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
      <EditInvestorDialog 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
        investor={selectedInvestor}
      />
      
      <EditStartupDialog
        isOpen={isEditStartupOpen}
        onClose={() => setIsEditStartupOpen(false)}
        onSuccess={loadData}
        startup={selectedStartup}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/20">
              <ShieldWarning className="w-6 h-6 text-red-600 dark:text-red-400" weight="bold" />
            </div>
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
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "pending"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                >
                Pending Investors ({pendingInvestors.length})
                </button>
                 <button
                onClick={() => setActiveTab("startups")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === "startups"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                >
                <RocketLaunch className="w-4 h-4" weight="bold" />
                Startups ({pendingStartups.length})
                </button>
                <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "all"
                    ? "bg-white shadow-md text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                >
                All Investors
                </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" weight="bold" />
          </div>
        ) : activeTab === "startups" ? (
             // STARTUPS VIEW
             filteredStartups.length === 0 ? (
                <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                    <p className="text-xl font-bold text-gray-500 dark:text-gray-400">
                    No pending startup submissions.
                    </p>
                </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStartups.map(startup => (
                        <div key={startup._id} className="relative group">
                            <StartupCard startup={{
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
                            }} />
                             {/* Admin Controls Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 rounded-b-3xl flex gap-2 dark:bg-zinc-900/95 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                                <button 
                                    onClick={() => {
                                      // Map backend startup to frontend Startup interface
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
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                                >
                                    <PencilSimple weight="bold" /> Edit
                                </button>
                                <button
                                    onClick={() => handleApprove(startup._id, "startup")}
                                    disabled={!!processingId}
                                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {processingId === startup._id ? (
                                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                                    ) : (
                                    <Check className="w-4 h-4" weight="bold" />
                                    )}
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(startup._id, "startup")}
                                    disabled={!!processingId}
                                    className="p-2.5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-xl font-bold transition-all disabled:opacity-50"
                                    title="Reject & Delete"
                                >
                                    <X className="w-5 h-5" weight="bold" />
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
             )
        ) : (
            // INVESTORS VIEW
            filteredInvestors.length === 0 ? (
            <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10 bg-white/40">
                <p className="text-xl font-bold text-gray-500 dark:text-gray-400">
                {activeTab === "pending" ? "No pending investor submissions." : "No investors found."}
                </p>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvestors.map((inv) => (
                <div key={inv.id} className="relative group">
                    <InvestorCard
                    investor={inv}
                    isSaved={false}
                    onToggleSave={() => {}}
                    />

                    {/* Admin Controls Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 rounded-b-3xl flex gap-2 dark:bg-zinc-900/95 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200 z-20">
                    {activeTab === "pending" ? (
                        <>
                        <button
                            onClick={() => handleApprove(inv.id, "investor")}
                            disabled={!!processingId}
                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {processingId === inv.id ? (
                            <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                            ) : (
                            <Check className="w-4 h-4" weight="bold" />
                            )}
                            Approve
                        </button>
                        <button
                            onClick={() => handleEdit(inv)}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                            title="Edit Submission"
                        >
                            <FileText className="w-5 h-5" weight="bold" />
                        </button>
                        <button
                            onClick={() => handleReject(inv.id, "investor")}
                            disabled={!!processingId}
                            className="p-2.5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-xl font-bold transition-all disabled:opacity-50"
                            title="Reject & Delete"
                        >
                            <X className="w-5 h-5" weight="bold" />
                        </button>
                        </>
                    ) : (
                        <button
                        onClick={() => handleEdit(inv)}
                        className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                        <FileText className="w-4 h-4" weight="bold" />
                        Edit Details
                        </button>
                    )}
                    </div>
                </div>
                ))}
            </div>
            )
        )}
      </div>
    </div>
  );
}
