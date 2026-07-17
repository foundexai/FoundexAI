"use client";

import { MOCK_INVESTORS } from "@/lib/data";
import {
  CaretLeft,
  MapPin,
  GlobeSimple,
  CheckCircle,
  EnvelopeSimple,
  CircleNotch,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import OutreachCopilotModal from "@/components/dashboard/OutreachCopilotModal";

interface Investor {
  id: string;
  name: string;
  type: string;
  focus: string[];
  location: string;
  logoInitial: string;
  logoColor: string;
  description: string;
  investmentRange?: string;
  website?: string;
  logo_url?: string;
}

export default function InvestorDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Startup & Fit Score States
  const [startup, setStartup] = useState<any | null>(null);
  const [fitScore, setFitScore] = useState<any | null>(null);
  const [loadingFit, setLoadingFit] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // 1. Fetch Investor Profile
  useEffect(() => {
    async function fetchInvestor() {
      setLoading(true);
      setError(false);

      const mockInvestor = MOCK_INVESTORS.find((inv) => inv.id === id);
      if (mockInvestor) {
        setInvestor(mockInvestor as any);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/investors/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.investor) {
            setInvestor(data.investor);
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
      fetchInvestor();
    }
  }, [id, token]);

  // 2. Fetch Startup Profile
  useEffect(() => {
    async function fetchStartup() {
      if (!token) return;
      try {
        const res = await fetch("/api/startups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.startups && data.startups[0]) {
            setStartup(data.startups[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching startup", err);
      }
    }
    fetchStartup();
  }, [token]);

  // 3. Fetch Fit Score once startup is loaded
  useEffect(() => {
    async function fetchScore() {
      if (!token || !startup || !id) return;
      setLoadingFit(true);
      try {
        const res = await fetch(`/api/startups/${startup._id}/fit-score?investorId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFitScore(data.fitScore);
        }
      } catch (err) {
        console.error("Error fetching fit score", err);
      } finally {
        setLoadingFit(false);
      }
    }
    fetchScore();
  }, [startup, id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Investor Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          The investor profile you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/investors"
          className="text-yellow-600 font-semibold hover:underline"
        >
          Back to Database
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <Link
        href="/dashboard/investors"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors group dark:text-gray-400 dark:hover:text-gray-200"
      >
        <CaretLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" weight="bold" />
        Back to Investors
      </Link>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-gray-100 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 dark:from-zinc-800 dark:to-zinc-900 dark:opacity-30"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
          <div
            className={cn(
              "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center shadow-xl shrink-0 border-4 border-white/50 dark:border-white/10 overflow-hidden",
              investor.logo_url 
                ? "bg-white" 
                : cn("bg-linear-to-br", investor.logoColor || "from-yellow-400 to-orange-500")
            )}
          >
            {investor.logo_url ? (
              <img 
                src={investor.logo_url} 
                alt={investor.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl md:text-4xl font-black text-white">
                {investor.logoInitial}
              </span>
            )}
          </div>

          <div className="grow w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight dark:text-white">
                  {investor.name}
                </h1>
                <span className="inline-block px-3 py-1 rounded-full bg-white/60 border border-white/50 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-700 backdrop-blur-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10 self-center md:self-auto">
                  {investor.type}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start text-gray-500 mb-6 font-medium dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1.5" weight="bold" />
              {investor.location}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {investor.website && (
                <a
                  href={`https://${investor.website.replace(/^https?:\/\//, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 cursor-pointer"
                >
                  <GlobeSimple className="w-4 h-4 mr-2 text-yellow-500" weight="bold" />
                  Website
                </a>
              )}
              <Link 
                href="/dashboard/pricing"
                className="inline-flex items-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 dark:bg-white dark:text-black dark:hover:bg-gray-200 cursor-pointer"
              >
                <EnvelopeSimple className="w-4 h-4 mr-2 text-yellow-500" weight="bold" />
                Get connected with investors
              </Link>
              {startup && (
                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="inline-flex items-center px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all cursor-pointer"
                >
                  Outreach Copilot
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-gray-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
              About
            </h3>
            <p className="text-gray-600 leading-relaxed text-md dark:text-gray-300 whitespace-pre-wrap">
              {investor.description}
            </p>
          </section>

          {/* Focus Areas */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 dark:text-white">
              Investment Focus
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {investor.focus.map((tag) => (
                <div
                  key={tag}
                  className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-semibold flex items-center gap-2 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 text-sm md:text-base"
                >
                  <CheckCircle className="w-4 h-4 text-yellow-500" weight="bold" />
                  {tag}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          {/* Investment Range */}
          <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-100 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-900/30">
            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 dark:text-yellow-500">
              Investment Range
            </h4>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {investor.investmentRange || "Undisclosed"}
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium dark:text-gray-400">
              Typical check size per deal
            </p>
          </div>

          {/* Advanced Fit Score Section */}
          {loadingFit || !fitScore ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-6 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              
              <div className="flex items-center justify-center py-2">
                <div className="w-24 h-24 rounded-full border-8 border-gray-100 dark:border-zinc-800/80 animate-pulse flex items-center justify-center" />
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-3 w-8 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-5/6 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-6">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider dark:text-white">
                  Sophia Fit Match
                </h4>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      className="text-gray-100 dark:text-zinc-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="46"
                      cx="56"
                      cy="56"
                    />
                    <circle
                      className={cn(
                        "transition-all duration-1000 ease-out",
                        fitScore.overall >= 75 
                          ? "text-green-500" 
                          : fitScore.overall >= 50 
                            ? "text-yellow-500" 
                            : "text-red-500"
                      )}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * fitScore.overall) / 100}
                      stroke="currentColor"
                      fill="transparent"
                      r="46"
                      cx="56"
                      cy="56"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {fitScore.overall}%
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Dimensional Progress Bars */}
              <div className="space-y-3">
                {[
                  { label: "Sector Focus", score: fitScore.sector },
                  { label: "Funding Stage", score: fitScore.stage },
                  { label: "Check Size Range", score: fitScore.funding },
                  { label: "Geographic Mandate", score: fitScore.geography },
                ].map((dim) => (
                  <div key={dim.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                      <span>{dim.label}</span>
                      <span>{dim.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${dim.score}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          dim.score >= 75 
                            ? "bg-green-500" 
                            : dim.score >= 50 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rationale Reasons */}
              {fitScore.reasons && fitScore.reasons.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Key Alignments
                  </span>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {fitScore.reasons.map((r: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback tips */}
              {fitScore.feedback && fitScore.feedback.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Recommendations
                  </span>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {fitScore.feedback.map((f: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-yellow-500 font-bold">!</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Outreach Copilot Modal */}
      {startup && (
        <OutreachCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          startupId={startup._id}
          investorId={id}
          investorName={investor.name}
        />
      )}
    </div>
  );
}
