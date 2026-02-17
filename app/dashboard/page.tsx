"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { NotePencil, FloppyDiskBack, X, MagicWand, Sparkle, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";


export default function Dashboard() {
  const { user, token, loading, logout, startups, activeStartupId } = useAuth();
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
        window.location.reload();
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
        <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  if (!user && !loading) {
    window.location.href = "/";
    return null;
  }

  const currentStartup = startups.find((s) => s._id === activeStartupId) || (startups.length > 0 ? startups[0] : null);

  return (
    <>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!currentStartup && !loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="glass-card p-10 rounded-3xl border border-white/50 max-w-md w-full relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight dark:text-white">
              Start Your Journey
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-400">
              Create your first startup profile to unlock the FoundexAI dashboard.
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

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <StartupSwitcher />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight dark:text-white">
                    {currentStartup.company_name}
                  </h1>
                  <Link
                    href="/dashboard/investors"
                    className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg dark:bg-white dark:text-black"
                  >
                    {/* <Sparkle className="w-5 h-5 text-yellow-500" weight="bold" /> */}
                    Find Matches
                  </Link>
                </div>
                <div>
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 border border-white/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                    {currentStartup.sector || "Technology"}
                  </div>
                </div>
                <p className="text-lg text-gray-500 font-medium dark:text-gray-400 max-w-lg">
                  Welcome back, {user?.full_name?.split(" ")[0]}! Let's build something great.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-6">
                <ReadinessScore
                  score={currentStartup.readiness_score || 0}
                  startupId={currentStartup._id}
                  feedback={currentStartup.readiness_feedback}
                  onUpdate={() => window.location.reload()}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <DescriptionBlock
              startup={currentStartup}
              onUpdate={() => window.location.reload()}
            />

            <LegalStructureCard
              startupId={currentStartup._id}
              location={currentStartup.location}
              currentStructure={currentStartup.legal_structure}
              details={currentStartup.legal_structure_details}
              onUpdate={() => window.location.reload()}
            />

            <BusinessModelCard
              startupId={currentStartup._id}
              sector={currentStartup.sector}
              selectedModels={currentStartup.business_models}
              onUpdate={() => window.location.reload()}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <DocumentsSection documents={currentStartup.documents} />

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <NotesList startupId={currentStartup._id} />
              <TasksList startupId={currentStartup._id} />
            </div>
          </div>

          <SelectedInvestors />
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

  useEffect(() => {
    setDescription(startup.business_description);
  }, [startup.business_description]);

  async function handleAskSophia() {
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
          description: description, // Send current edited description as base
          company_name: startup.company_name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.improved);
        toast.success("Sophia has a suggestion for you!");
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
        setAiSuggestion(null); // Clear suggestion on save
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
    <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Business Description
        </h3>
      </div>

      <div className="grow space-y-4">
        {isEditing ? (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl text-gray-700 min-h-[150px] font-medium leading-relaxed dark:bg-black/50 dark:border-zinc-700 dark:text-gray-200 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 outline-none transition-all"
              placeholder="Describe your business model, target audience, and value proposition..."
            />
            
            {/* Ask Sophia Section */}
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 dark:bg-black/80 dark:border-zinc-800 relative overflow-hidden group">
               {aiSuggestion && (
                   <div className="flex justify-end items-center mb-3">
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopySuggestion}
                                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <NotePencil className="w-3.5 h-3.5" weight="bold" />
                                Copy
                            </button>
                            <button 
                                onClick={handleAskSophia}
                                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <div className={`w-3.5 h-3.5 ${improving ? 'animate-spin' : ''}`}>
                                    <MagicWand weight="bold" />
                                </div>
                                Regenerate
                            </button>
                        </div>
                   </div>
               )}

               {aiSuggestion ? (
                   <div className="text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                       {aiSuggestion}
                   </div>
               ) : (
                   <div className="text-center py-4">
                       <p className="text-gray-500 text-xs mb-3">
                           Need help refining your description? Sophia can generate a professional version for you.
                       </p>
                       <button
                        onClick={handleAskSophia}
                        disabled={improving}
                        className="bg-yellow-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-yellow-600 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-yellow-500/20"
                       >
                           {improving && <CircleNotch className="w-4 h-4 animate-spin" />}
                           {improving ? "Generating..." : "Generate Suggestion"}
                       </button>
                   </div>
               )}
            </div>
          </>
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
            className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:bg-white/5 dark:border-zinc-700 dark:text-gray-300"
          >
            Edit Description
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setDescription(startup.business_description);
                setAiSuggestion(null);
              }}
              className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold dark:bg-transparent dark:border-zinc-700 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/30"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
