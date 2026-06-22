"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import TasksList from "@/components/TasksList";
import NotesList from "@/components/NotesList";
import { useAuth, Startup } from "@/context/AuthContext";
import { toast } from "sonner";

import LegalStructureCard from "@/components/dashboard/LegalStructureCard";
import BusinessModelCard from "@/components/dashboard/BusinessModelCard";
import DocumentsSection from "@/components/dashboard/DocumentsSection";
import SelectedInvestors from "@/components/dashboard/SelectedInvestors";
import ReadinessScore from "@/components/ReadinessScore";
import StartupSwitcher from "@/components/dashboard/StartupSwitcher";
import {
  NotePencil,
  FloppyDiskBack,
  X,
  MagicWand,
  Sparkle,
  CircleNotch,
  MagnifyingGlass,
  Lock,
  EnvelopeSimple,
  RocketLaunch,
  Handshake,
  PaperPlaneTilt,
  Clock,
  ArrowRight,
  Trash,
  Eye,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { useSubscription } from "@/context/SubscriptionContext";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, token, loading, logout, startups, activeStartupId } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = useCallback(
    async (name: string, idea: string) => {
      if (!token || token.trim() === "") {
        alert(
          "You are not logged in or your session has expired. Please log in again.",
        );
        logout();
        return;
      }

      const res = await fetch("/api/startups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: name,
          business_description: idea,
        }),
      });

      if (res.ok) {
        setShowOnboarding(false);
        router.refresh();
      } else if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        logout();
      } else {
        alert("Failed to create startup. Please try again.");
      }
    },
    [token, logout],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <CircleNotch
          className="w-10 h-10 animate-spin text-yellow-500"
          weight="bold"
        />
      </div>
    );
  }

  if (!user && !loading) {
    router.push("/");
    return null;
  }

  if (user?.user_type === "investor") {
    return <InvestorDashboard />;
  }

  const currentStartup =
    startups.find((s) => s._id === activeStartupId) ||
    (startups.length > 0 ? startups[0] : null);

  return (
    <>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!currentStartup && !loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/50 max-w-md w-full relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight dark:text-white">
              Start Your Journey
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-400">
              Create your first startup profile to unlock the FoundexAI
              dashboard.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl dark:bg-white dark:text-black"
            >
              Create Startup Profile
            </button>
          </div>
        </div>
      ) : currentStartup ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/50 relative z-30 dark:bg-zinc-900/60 dark:border-zinc-800">
            {/* Background Blurs - in a contained absolute container */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-yellow-200/40 to-orange-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 dark:from-yellow-900/20 dark:to-orange-900/20 dark:opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 dark:bg-yellow-900/10"></div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <StartupSwitcher />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight dark:text-white wrap-break-word">
                  {currentStartup.company_name}
                </h1>
                <Link
                  href="/dashboard/pricing"
                  className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg dark:bg-white dark:text-black"
                >
                  Get connected with investors
                </Link>
              </div>
              <div>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 border border-white/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                  {currentStartup.sector || "Technology"}
                </div>
              </div>
              <p className="text-lg text-gray-500 font-medium dark:text-gray-400 max-w-lg">
                Welcome back, {user?.full_name?.split(" ")[0]}! Let's build
                something great.
              </p>
            </div>
          </div>

          {/* Description Block - Full Width */}
          <div className="w-full">
            <DescriptionBlock
              startup={currentStartup}
              onUpdate={() => router.refresh()}
            />
          </div>

          {/* Selected Investors Section - Right below Description */}
          <SelectedInvestors />

          {/* Main Dashboard Grid - Balanced 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Foundation */}
            <div className="space-y-6">
              <LegalStructureCard
                startupId={currentStartup._id}
                location={currentStartup.location}
                currentStructure={currentStartup.legal_structure}
                details={currentStartup.legal_structure_details}
                onUpdate={() => router.refresh()}
              />
              <DocumentsSection documents={currentStartup.documents} />
            </div>

            {/* Column 2: Strategy */}
            <div className="space-y-6">
              <BusinessModelCard
                startupId={currentStartup._id}
                sector={currentStartup.sector}
                selectedModels={currentStartup.business_models}
                onUpdate={() => router.refresh()}
              />
              <NotesList startupId={currentStartup._id} />
            </div>

            {/* Column 3: Intelligence & Execution */}
            <div className="space-y-6">
              <ReadinessScore
                score={currentStartup.readiness_score || 0}
                startupId={currentStartup._id}
                feedback={currentStartup.readiness_feedback}
                onUpdate={() => router.refresh()}
              />
              <TasksList startupId={currentStartup._id} />
            </div>
          </div>
        </div>
      ) : null}

      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}

function DescriptionBlock({
  startup,
  onUpdate,
}: {
  startup: any;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(startup.business_description);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const { is_subscribed, is_admin } = useSubscription();

  useEffect(() => {
    setDescription(startup.business_description);
  }, [startup.business_description]);

  async function handleAskSophia() {
    if (!is_subscribed && !is_admin) {
      toast.info(
        "Sophia's Business Description AI is a premium feature. Please upgrade to Pro.",
      );
      return;
    }
    setImproving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/startups/${startup._id}/improve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: description,
          company_name: startup.company_name,
        }),
      });
      if (res.status === 429) {
        toast.error(
          "Sophia is currently handling many requests. Please take a short break and try again in a few moments.",
        );
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.improved);
        toast.success("Sophia has a suggestion for you!");
      } else {
        toast.error(
          "Sophia is temporarily unavailable. Please try again later.",
        );
      }
    } catch (e) {
      toast.error("Error connecting to AI");
    } finally {
      setImproving(false);
    }
  }

  function handleCopySuggestion() {
    if (aiSuggestion) {
      setDescription(aiSuggestion);
      toast.success("Suggestion copied to description");
    }
  }

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/startups/${startup._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ business_description: description }),
      });
      if (res.ok) {
        setIsEditing(false);
        setAiSuggestion(null);
        onUpdate();
        toast.success("Description updated");
      }
    } catch (e) {
      toast.error("Error updating description");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border border-white/50 relative overflow-hidden dark:bg-zinc-900/40 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-yellow-100/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none dark:from-yellow-900/10"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Business Description
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Your core value proposition and mission defined.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md flex items-center gap-2 dark:bg-white dark:text-black cursor-pointer"
            >
              <NotePencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-6 border border-gray-200 rounded-2xl text-gray-700 min-h-[250px] font-medium leading-relaxed dark:bg-black/40 dark:border-zinc-800 dark:text-gray-200 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/50 outline-none transition-all text-lg"
                  placeholder="Describe your business model, target audience, and value proposition..."
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDescription(startup.business_description);
                      setAiSuggestion(null);
                    }}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-200 transition-all dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-4 bg-yellow-500 text-white rounded-2xl text-sm font-black hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <CircleNotch
                        className="w-4 h-4 animate-spin text-white"
                        weight="bold"
                      />
                    )}
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>

              <div className="h-full">
                <div className="bg-zinc-950 rounded-4xl p-8 border border-zinc-800 dark:bg-black/60 relative overflow-hidden h-full flex flex-col justify-center min-h-[300px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-orange-500 to-yellow-500"></div>

                  {aiSuggestion ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Sparkle weight="fill" className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">
                          Sophia's Suggestion
                        </span>
                      </div>
                      <p className="text-lg text-gray-300 leading-relaxed font-medium italic">
                        "{aiSuggestion}"
                      </p>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleCopySuggestion}
                          className="flex-1 bg-yellow-500 text-white text-xs font-black px-4 py-3 rounded-xl transition-all hover:bg-yellow-600 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                        >
                          <NotePencil className="w-4 h-4" />
                          Apply Suggestion
                        </button>
                        <button
                          onClick={handleAskSophia}
                          disabled={improving}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-black px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <MagicWand
                            className={`w-4 h-4 ${improving ? "animate-spin" : ""}`}
                          />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 relative group/ai">
                      {!is_subscribed && !is_admin && (
                        <div className="absolute inset-x-0 -top-10 -bottom-10 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-4xl border border-yellow-400/10 scale-105 opacity-0 group-hover/ai:opacity-100 transition-all duration-300 pointer-events-none">
                          <Lock
                            className="w-10 h-10 text-yellow-400 mb-2"
                            weight="bold"
                          />
                          <span className="text-xs font-black text-white uppercase tracking-widest">
                            Premium Intelligence
                          </span>
                        </div>
                      )}

                      <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                        <Sparkle className="w-8 h-8 text-yellow-500" />
                      </div>
                      <h4 className="text-white font-black text-xl tracking-tight">
                        Need a professional polish?
                      </h4>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                        Sophia can analyze your draft and generate a compelling,
                        investor-ready business description for you.
                      </p>
                      <button
                        onClick={handleAskSophia}
                        disabled={improving}
                        className="bg-yellow-500 text-white font-black text-sm px-8 py-4 rounded-2xl hover:bg-yellow-600 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 mx-auto disabled:opacity-50 shadow-lg shadow-yellow-500/30"
                      >
                        {!is_subscribed && !is_admin ? (
                          <Lock className="w-5 h-5" weight="bold" />
                        ) : improving ? (
                          <CircleNotch className="w-5 h-5 animate-spin" />
                        ) : (
                          <MagicWand className="w-5 h-5" />
                        )}
                        {improving
                          ? "Sophia is thinking..."
                          : "Generate Suggestion"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl">
              <p className="text-xl text-gray-600 leading-[1.8] font-medium dark:text-gray-300 whitespace-pre-wrap">
                {description ||
                  "No description provided yet. Click edit to define your business for investors."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestorDashboard() {
  const { user, token } = useAuth();
  const [shares, setShares] = useState<any[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [directoryStartups, setDirectoryStartups] = useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();

  // Load incoming outreach requests (shares)
  useEffect(() => {
    async function fetchShares() {
      if (!token) return;
      setLoadingShares(true);
      try {
        const res = await fetch("/api/documents/share", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setShares(data.shares || []);
        } else {
          toast.error("Failed to load outreach proposals");
        }
      } catch (err) {
        console.error("Error loading outreach proposals:", err);
      } finally {
        setLoadingShares(false);
      }
    }
    fetchShares();
  }, [token]);

  // Load startup directory (profiles with >= 75% completion)
  useEffect(() => {
    async function fetchDirectory() {
      if (!token) return;
      setLoadingDirectory(true);
      try {
        const res = await fetch("/api/startups/directory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const filtered = (data.startups || []).filter(
            (s: any) => s.readiness_score >= 75,
          );
          setDirectoryStartups(filtered);
        }
      } catch (err) {
        console.error("Error fetching startup directory:", err);
      } finally {
        setLoadingDirectory(false);
      }
    }
    fetchDirectory();
  }, [token]);

  // Auto-slide carousel
  useEffect(() => {
    if (directoryStartups.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % directoryStartups.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [directoryStartups]);

  const handleDeclineShare = async (shareId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/documents/share?id=${shareId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setShares((prev) =>
          prev.filter((s) => s.id !== shareId && s._id !== shareId),
        );
        toast.info("Outreach request archived");
      } else {
        toast.error("Failed to archive outreach request");
      }
    } catch (err) {
      console.error("Error archiving outreach request:", err);
      toast.error("Failed to archive outreach request");
    }
  };

  const handleAcceptShare = async (share: any) => {
    toast.success(
      `Request accepted! Opening pipeline chat with ${share.startupName || "founder"}`,
    );
    
    // Call API to notify the founder of proposal acceptance
    if (token) {
      fetch("/api/documents/share", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: share.id || share._id }),
      }).catch((err) => console.error("Error notifying proposal acceptance:", err));
    }

    // Redirect to the pipeline messaging page
    router.push("/dashboard/pipeline");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-yellow-200/20 to-orange-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest shadow-sm">
            Investor Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight dark:text-white">
            Investor <span className="text-yellow-500">Workspace</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium dark:text-gray-400 max-w-2xl leading-relaxed">
            Welcome, {user?.full_name}! Review pitch decks and outreach memos
            sent by vetted founders looking for capital.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Incoming Proposals",
            value: shares.length,
            icon: EnvelopeSimple,
            color: "text-blue-500",
          },
          {
            label: "Vetted Startups",
            value: 15,
            icon: RocketLaunch,
            color: "text-yellow-500",
          },
          {
            label: "Active Deals",
            value: 3,
            icon: Handshake,
            color: "text-purple-500",
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-card p-6 rounded-3xl border border-white/50 flex items-center gap-4 dark:bg-zinc-900/60 dark:border-zinc-800"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center dark:bg-zinc-800",
                  stat.color,
                )}
              >
                <Icon className="w-6 h-6" weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Inbox Section - Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 dark:text-white">
              <EnvelopeSimple
                className="w-5 h-5 text-yellow-500"
                weight="bold"
              />
              Incoming Outreach & Proposals
              {shares.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black rounded-full animate-pulse">
                  {shares.length} NEW
                </span>
              )}
            </h3>

            {loadingShares ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" />
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider animate-pulse">
                  Loading outreach proposals...
                </p>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No active outreach requests at this moment. You will receive
                notifications when founders share documents with you.
              </div>
            ) : (
              <div className="space-y-4">
                {shares.map((share, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs dark:bg-zinc-950 dark:border-zinc-850 hover:border-yellow-400/30 transition-all flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2 grow">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {share.startupName || "Startup Submission"}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg dark:bg-white/5">
                          {share.docName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic max-w-lg">
                        "{share.message}"
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(share.date).toLocaleDateString()} at{" "}
                          {new Date(share.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() =>
                          handleDeclineShare(share.id || share._id)
                        }
                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all dark:bg-white/5 dark:hover:bg-red-900/10 cursor-pointer"
                        title="Decline / Archive"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/dashboard/documents/view?url=${encodeURIComponent(share.docUrl || "/reports/saas-expansion.pdf")}&name=${encodeURIComponent(share.docName)}`}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-all dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleAcceptShare(share)}
                        className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-yellow-500/15 cursor-pointer"
                      >
                        <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
                        Review / Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Startup Directory Quick Feed - Right Col */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-widest dark:text-white">
                Vetted Startups
              </h3>
              <Link
                href="/dashboard/startups"
                className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingDirectory ? (
              <div className="flex items-center justify-center py-12">
                <CircleNotch className="w-6 h-6 animate-spin text-yellow-500" />
              </div>
            ) : directoryStartups.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                No startups with completed profiles yet.
              </p>
            ) : (
              <div className="relative overflow-hidden">
                <div
                  key={activeSlide}
                  className="p-4 md:p-5 bg-gray-50/50 border border-gray-100 rounded-2xl dark:bg-black/20 dark:border-white/5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-md bg-linear-to-br",
                        directoryStartups[activeSlide].logoColor,
                      )}
                    >
                      {directoryStartups[activeSlide].logoInitial}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {directoryStartups[activeSlide].name}
                      </h4>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider bg-white px-2 py-0.5 rounded-md dark:bg-white/5">
                        {directoryStartups[activeSlide].stage}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {directoryStartups[activeSlide].description}
                  </p>
                  <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                    {directoryStartups[activeSlide].traction}
                  </p>
                  <Link
                    href={`/dashboard/startups/${directoryStartups[activeSlide].id}`}
                    className="block text-center py-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl text-[11px] font-black uppercase text-gray-700 dark:bg-white/5 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
                {directoryStartups.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {directoryStartups.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          idx === activeSlide
                            ? "bg-yellow-500 w-4"
                            : "bg-gray-300 dark:bg-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
