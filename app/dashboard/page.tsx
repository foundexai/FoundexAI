"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Onboarding from "@/components/Onboarding";
import TasksList from "@/components/TasksList";
import NotesList from "@/components/NotesList";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import LegalStructureCard from "@/components/dashboard/LegalStructureCard";
import BusinessModelCard from "@/components/dashboard/BusinessModelCard";
import DocumentsSection from "@/components/dashboard/DocumentsSection";
import SelectedInvestors from "@/components/dashboard/SelectedInvestors";
import ReadinessScore from "@/components/ReadinessScore";
import { Pencil, Save, X, Sparkles, Loader2 } from "lucide-react";

interface Startup {
  _id: string;
  company_name: string;
  business_description: string;
  sector?: string;
  mission?: string;
  vision?: string;
  readiness_score?: number;
  readiness_feedback?: string[];
  image?: string;
  authorImage?: string;
  tags?: string[];
  location?: string;
  legal_structure_details?: string;
  legal_structure?: string;
  business_models?: string[];
  documents?: any[];
}

export default function Dashboard() {
  const { user, token, loading, logout, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchStartups = useCallback(async () => {
    if (!token || token.trim() === "") {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);

    try {
      const res = await fetch("/api/startups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStartups(data.startups || []);
      } else if (res.status === 401) {
        logout();
      } else {
        setError(`Failed to fetch startups: ${res.statusText}`);
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setIsFetching(false);
    }
  }, [token, logout]);

  // Fetch startups when the component mounts or when the user/token changes
  useEffect(() => {
    // If we are not in an initial loading state and a token exists,
    // we should attempt to fetch the startups.
    if (!loading && token) {
      fetchStartups();
    }
  }, [token, loading, fetchStartups]); // Depend on token and loading state

  useEffect(() => {}, [startups]);

  const handleOnboardingComplete = useCallback(
    async (name: string, idea: string) => {
      if (!token || token.trim() === "") {
        alert(
          "You are not logged in or your session has expired. Please log in again.",
        );
        logout(); // Use the logout function from context
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
        fetchStartups(); // Refresh the list of startups
      } else if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        logout(); // Use the logout function from context
      } else {
        alert("Failed to create startup. Please try again.");
      }
    },
    [token, fetchStartups, logout],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex">
          <aside className="w-full lg:w-64 bg-gray-50 p-2 lg:p-6 flex flex-col justify-between">
            <div>
              <nav className="space-y-4">
                <a
                  href="#"
                  className="flex items-center space-x-2 text-gray-700 font-semibold"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V6h2v5H9zm1 3a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <span>Action Items</span>
                </a>
              </nav>
            </div>
          </aside>
          <main className="w-full flex-1 p-8 bg-gray-100 animate-pulse">
            <div className="h-64 bg-gray-300 rounded-3xl mb-8"></div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="h-40 bg-gray-300 rounded-2xl"></div>
              <div className="h-40 bg-gray-300 rounded-2xl"></div>
              <div className="h-40 bg-gray-300 rounded-2xl"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    window.location.href = "/";
    return null;
  }

  const currentStartup = startups.length > 0 ? startups[0] : null;

  return (
    <>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!currentStartup && !loading && !isFetching ? (
        // Empty State
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="glass-card p-10 rounded-3xl border border-white/50 max-w-md w-full relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-orange-500 to-yellow-500"></div>
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 transition-transform hover:rotate-6 duration-300 dark:bg-yellow-900/20">
              <svg
                className="w-10 h-10 text-yellow-600 dark:text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight dark:text-white">
              Start Your Journey
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-400">
              Create your first startup profile to unlock the FoundexAI
              dashboard and tools.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transform duration-200 dark:bg-white dark:text-black dark:shadow-none dark:hover:bg-gray-200"
            >
              Create Startup Profile
            </button>
          </div>
        </div>
      ) : currentStartup ? (
        // Dashboard View
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Header Section */}
          <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-yellow-200/40 to-orange-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 dark:from-yellow-900/20 dark:to-orange-900/20 dark:opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 dark:bg-yellow-900/10"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-6">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 border border-white/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                  {currentStartup.sector || "Technology"}
                </div>
                <div className="flex justify-start items-center gap-x-3">
                  <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight dark:text-white">
                    {currentStartup.company_name}
                  </h1>
                  <Link
                    href="/dashboard/investors"
                    className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:-translate-y-1 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:shadow-white/10"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Find Matches
                  </Link>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <p className="text-lg text-gray-500 font-medium dark:text-gray-400 max-w-lg">
                    Welcome back, {user?.full_name?.split(" ")[0] || "Founder"}!
                    Let's bring your idea to life.
                  </p>

                  <Link
                    href="/dashboard/investors"
                    className="inline-flex md:hidden items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:-translate-y-1 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:shadow-white/10"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Find Matches
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-6">
                <ReadinessScore
                  score={currentStartup.readiness_score || 0}
                  startupId={currentStartup._id}
                  feedback={currentStartup.readiness_feedback}
                  onUpdate={fetchStartups}
                />
              </div>
            </div>
          </div>

          {/* Row 1: Description | Legal | Business Model */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <DescriptionBlock
              startup={currentStartup}
              onUpdate={fetchStartups}
            />

            <LegalStructureCard
              startupId={currentStartup._id}
              location={currentStartup.location}
              currentStructure={currentStartup.legal_structure}
              details={currentStartup.legal_structure_details}
              onUpdate={fetchStartups}
            />

            <BusinessModelCard
              startupId={currentStartup._id}
              sector={currentStartup.sector}
              selectedModels={currentStartup.business_models}
              onUpdate={fetchStartups}
            />
          </div>

          {/* Row 2: Documents | Notes | Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <DocumentsSection documents={currentStartup.documents} />

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <NotesList />
              <TasksList />
            </div>
          </div>

          {/* Row 3: Selected Investors */}
          <SelectedInvestors />
        </div>
      ) : (
        // Loading Skeleton Shell
        <div className="space-y-8 animate-pulse">
          <div className="h-96 rounded-3xl bg-gray-200/50"></div>
          <div className="h-40 rounded-2xl bg-white/50 border border-white/50"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 rounded-2xl bg-white/50 border border-white/50"></div>
            <div className="h-96 rounded-2xl bg-white/50 border border-white/50"></div>
          </div>
        </div>
      )}

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
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);

  // Sync description if startup changes from parent
  useEffect(() => {
    setDescription(startup.business_description);
  }, [startup.business_description]);

  async function handleImprove() {
    if (!description) {
      toast.error("Please add a basic description first");
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
      if (res.ok) {
        const data = await res.json();
        setDescription(data.improved);
        setIsEditing(true);
        toast.success("Description optimized by AI!");
      } else {
        toast.error("Improvement failed");
      }
    } catch (e) {
      toast.error("Error connecting to AI");
    } finally {
      setImproving(false);
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
        onUpdate();
        toast.success("Description updated");
      } else {
        toast.error("Failed to update");
      }
    } catch (e) {
      toast.error("Error updating description");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-white">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Business Description
        </h3>

        {/* Helper Badge */}
        {!isEditing && (
          <button
            onClick={handleImprove}
            disabled={improving}
            className="text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors disabled:opacity-50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 cursor-pointer"
          >
            {improving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {improving ? "Optimizing..." : "AI Improve"}
          </button>
        )}
      </div>

      <div className="grow">
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all min-h-[150px] dark:bg-black/50 dark:border-zinc-700 dark:text-gray-200"
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap dark:text-gray-300 line-clamp-6">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors dark:bg-white/5 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Edit Description
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setDescription(startup.business_description);
              }}
              className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:bg-transparent dark:border-zinc-700 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 shadow-lg shadow-green-500/20"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
