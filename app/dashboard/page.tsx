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
import { NotePencil, FloppyDiskBack, X, MagicWand, Sparkle, FileText, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";


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
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 border border-white/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                    {currentStartup.sector || "Technology"}
                  </div>
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
                    <Sparkle className="w-5 h-5 text-yellow-500" weight="bold" />
                    Find Matches
                  </Link>
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
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);

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
          <FileText className="w-5 h-5 text-yellow-500" weight="bold" />
          Business Description
        </h3>

        {!isEditing && (
          <button
            onClick={handleImprove}
            disabled={improving}
            className="text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            {improving ? <CircleNotch className="w-3 h-3 animate-spin" weight="bold" /> : <MagicWand className="w-3 h-3" weight="bold" />}
            {improving ? "Optimizing..." : "AI Improve"}
          </button>
        )}
      </div>

      <div className="grow">
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl text-gray-700 min-h-[150px] dark:bg-black/50 dark:border-zinc-700 dark:text-gray-200"
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
              }}
              className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold dark:bg-transparent dark:border-zinc-700 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
