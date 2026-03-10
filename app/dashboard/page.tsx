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
          <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/50 max-w-md w-full relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight dark:text-white">
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
                Welcome back, {user?.full_name?.split(" ")[0]}! Let's build something great.
              </p>
            </div>
          </div>

          {/* Description Block - Full Width */}
          <div className="w-full">
            <DescriptionBlock
              startup={currentStartup}
              onUpdate={() => window.location.reload()}
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
                onUpdate={() => window.location.reload()}
              />
              <DocumentsSection documents={currentStartup.documents} />
            </div>

            {/* Column 2: Strategy */}
            <div className="space-y-6">
              <BusinessModelCard
                startupId={currentStartup._id}
                sector={currentStartup.sector}
                selectedModels={currentStartup.business_models}
                onUpdate={() => window.location.reload()}
              />
              <NotesList startupId={currentStartup._id} />
            </div>

            {/* Column 3: Intelligence & Execution */}
            <div className="space-y-6">
              <ReadinessScore
                  score={currentStartup.readiness_score || 0}
                  startupId={currentStartup._id}
                  feedback={currentStartup.readiness_feedback}
                  onUpdate={() => window.location.reload()}
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
          description: description,
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
                    className="flex-1 py-4 bg-yellow-500 text-white rounded-2xl text-sm font-black hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
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
                        <span className="text-xs font-black uppercase tracking-widest">Sophia's Suggestion</span>
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
                          <MagicWand className={`w-4 h-4 ${improving ? 'animate-spin' : ''}`} />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                        <Sparkle className="w-8 h-8 text-yellow-500" />
                      </div>
                      <h4 className="text-white font-black text-xl tracking-tight">Need a professional polish?</h4>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                        Sophia can analyze your draft and generate a compelling, investor-ready business description for you.
                      </p>
                      <button
                        onClick={handleAskSophia}
                        disabled={improving}
                        className="bg-yellow-500 text-white font-black text-sm px-8 py-4 rounded-2xl hover:bg-yellow-600 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 mx-auto disabled:opacity-50 shadow-lg shadow-yellow-500/30"
                      >
                        {improving ? (
                          <CircleNotch className="w-5 h-5 animate-spin" />
                        ) : (
                          <MagicWand className="w-5 h-5" />
                        )}
                        {improving ? "Sophia is thinking..." : "Generate Suggestion"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl">
              <p className="text-xl text-gray-600 leading-[1.8] font-medium dark:text-gray-300 whitespace-pre-wrap">
                {description || "No description provided yet. Click edit to define your business for investors."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
