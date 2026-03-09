"use client";

import { useState } from "react";
import { ArrowsClockwise, Lightning, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

interface ReadinessScoreProps {
  score: number;
  startupId: string;
  feedback?: string[]; // New prop
  onUpdate?: () => void;
}

export default function ReadinessScore({
  score,
  startupId,
  feedback = [],
  onUpdate,
}: ReadinessScoreProps) {
  const [analyzing, setAnalyzing] = useState(false);

  // Calculate circle properties
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color based on score
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500 dark:text-green-400";
    if (s >= 40) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

  const colorClass = getColor(score);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/startups/${startupId}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Score updated: ${data.score}%`);
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to analyze profile");
      }
    } catch (e) {
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-3xl border border-gray-200 flex flex-col items-center justify-center relative dark:bg-zinc-900/60 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-gray-900 font-bold text-lg dark:text-white flex items-center gap-2">
          Readiness
          {analyzing && (
            <span className="text-xs font-normal text-yellow-500 animate-pulse">
              Analyzing...
            </span>
          )}
        </h3>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 dark:hover:bg-white/10 dark:text-gray-500"
          title="Recalculate Score with AI"
        >
          <ArrowsClockwise className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} weight="bold" />
        </button>
      </div>

      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-100 dark:text-zinc-800"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
          <span className={`text-4xl font-black ${colorClass}`}>{score}%</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">
            Score
          </span>
        </div>
      </div>

      <div className="mt-4 w-full text-center">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="text-xs font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 cursor-pointer"
        >
          <Lightning className="w-3 h-3" weight="bold" />
          {analyzing ? "AI Analyzing..." : "AI Analysis"}
        </button>
      </div>

      {/* Feedback moved to separate section/tasks */}
    </div>
  );
}
