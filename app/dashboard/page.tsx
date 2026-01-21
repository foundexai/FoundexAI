"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Onboarding from "@/components/Onboarding";
import TasksList from "@/components/TasksList";
import NotesList from "@/components/NotesList";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Startup {
  _id: string;
  company_name: string;
  business_description: string;
  sector?: string;
  mission?: string;
  vision?: string;
  readiness_score?: number;
  image?: string;
  authorImage?: string;
  tags?: string[];
  location?: string;
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
                <div className="p-4 bg-yellow-400 rounded-lg text-center">
                  <p className="font-bold">FoundexAI</p>
                  <p className="text-sm mb-4">
                    Get access to all features and functions
                  </p>
                  <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold">
                    Get Pro
                  </button>
                </div>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v1h-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1H3V4zm0 3v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm2-5h10v1H5V2z" />
                  </svg>
                  <span>Messages</span>
                </a>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.49l-4.75.69c-1.6.23-2.24 2.18-1.07 3.33l3.44 3.35-.81 4.73c-.27 1.58 1.39 2.79 2.81 2.08L10 18.39l4.25 2.23c1.42.71 3.08-.5 2.81-2.08l-.81-4.73 3.44-3.35c1.17-1.15.53-3.1-1.07-3.33L12 7.49l-.51-4.32z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
            <a href="#" className="flex items-center space-x-2 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sign Out</span>
            </a>
          </aside>
          <main className="w-full flex-1 p-8 bg-gray-100 animate-pulse">
            <header className="flex justify-between md:justify-end items-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="hidden md:block w-24 h-10 bg-gray-300 rounded-lg"></div>
                <div className="hidden md:block w-24 h-10 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded"></div>
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                </div>
              </div>
            </header>
            <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4">
                  <div className="bg-gray-300 rounded-lg mb-4 h-40"></div>
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded mb-1 w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                </div>
              ))}
              <div className="bg-gray-200 rounded-lg shadow p-6 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-gray-300 rounded-md"></div>
                  <div className="mt-2 h-4 w-24 bg-gray-300 rounded mx-auto"></div>
                  <div className="mt-1 h-3 w-40 bg-gray-300 rounded mx-auto"></div>
                </div>
              </div>
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
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500"></div>
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
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-200/40 to-orange-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 dark:from-yellow-900/20 dark:to-orange-900/20 dark:opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 dark:bg-yellow-900/10"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-6">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 border border-white/50 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                  {currentStartup.sector || "Technology"}
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight dark:text-white">
                  {currentStartup.company_name}
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="group p-5 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 dark:text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                      Mission
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium group-hover:text-gray-900 transition-colors dark:text-gray-300 dark:group-hover:text-white">
                      {currentStartup.mission || "No mission defined."}
                    </p>
                  </div>
                  <div className="group p-5 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 dark:text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      Vision
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium group-hover:text-gray-900 transition-colors dark:text-gray-300 dark:group-hover:text-white">
                      {currentStartup.vision || "No vision defined."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <ReadinessScore score={currentStartup.readiness_score || 0} />
              </div>
            </div>
          </div>

          {/* Editable Description Block */}
          <DescriptionBlock startup={currentStartup} onUpdate={fetchStartups} />

          {/* Tasks and Notes - Commented out for now
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TasksList />
            <NotesList />
          </div>
          */}
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

import ReadinessScore from "@/components/ReadinessScore";
import { Pencil, Save, X } from "lucide-react";

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

  // Sync description if startup changes from parent
  useEffect(() => {
    setDescription(startup.business_description);
  }, [startup.business_description]);

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
    <div className="glass-card p-8 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
          <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
          Business Description
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-lg dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setDescription(startup.business_description);
              }}
              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all min-h-[120px] dark:bg-black/50 dark:border-zinc-700 dark:text-gray-200"
        />
      ) : (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap dark:text-gray-300">
          {description}
        </p>
      )}
    </div>
  );
}
