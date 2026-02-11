"use client";

import { MOCK_STARTUPS, Startup } from "@/lib/data";
import {
  CaretLeft,
  MapPin,
  GlobeSimple,
  Buildings,
  CheckCircle,
  TrendUp,
  EnvelopeSimple,
  CircleNotch,
  RocketLaunch,
  Lightning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function StartupDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStartup() {
      setLoading(true);
      setError(false);

      // 1. Try finding in Mock Data first
      const mockStartup = MOCK_STARTUPS.find((s) => s.id === id);
      if (mockStartup) {
        setStartup(mockStartup);
        setLoading(false);
        return;
      }

      // 2. If not in mock, try fetching from API
      try {
        const res = await fetch("/api/startups/directory", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          const found = data.startups.find((s: any) => s.id === id);
          if (found) {
            setStartup(found);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchStartup();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Startup Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          The startup profile you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/startups"
          className="text-yellow-600 font-semibold hover:underline"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <Link
        href="/dashboard/startups"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors group dark:text-gray-400 dark:hover:text-gray-200"
      >
        <CaretLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" weight="bold" />
        Back to Startups
      </Link>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-8 mb-8 border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-gray-100 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 dark:from-zinc-800 dark:to-zinc-900 dark:opacity-30"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div
            className={cn(
              "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl bg-linear-to-br shrink-0",
              startup.logoColor,
            )}
          >
            {startup.logoInitial}
          </div>

          <div className="grow">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight dark:text-white">
                {startup.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-white/60 border border-white/50 text-xs font-bold uppercase tracking-wider text-gray-700 backdrop-blur-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                {startup.stage}
              </span>
            </div>

            <div className="flex items-center text-gray-500 mb-6 font-medium dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1.5" weight="bold" />
              {startup.location}
            </div>

            <div className="flex flex-wrap gap-4">
              {startup.website && (
                <a
                  href={`https://${startup.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <GlobeSimple className="w-4 h-4 mr-2 text-gray-400" weight="bold" />
                  Visit Website
                </a>
              )}
              <button className="inline-flex items-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                <EnvelopeSimple className="w-4 h-4 mr-2" weight="bold" />
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
              About
            </h3>
            <p className="text-gray-600 leading-relaxed text-md dark:text-gray-300">
              {startup.description}
            </p>
          </section>

          {/* Sector / Highlights */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 dark:text-white">
              Sector Focus
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-semibold flex items-center gap-2 dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" weight="bold" />
                {startup.sector}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-900/30">
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 dark:text-blue-500">
              Traction
            </h4>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {startup.traction || "N/A"}
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium dark:text-gray-400">
              Key Metric
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Similar Startups
            </h4>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm italic dark:text-gray-500">
                Coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
