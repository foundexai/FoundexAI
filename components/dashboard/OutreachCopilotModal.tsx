"use client";

import { useState } from "react";
import { 
  X, 
  Sparkle, 
  CircleNotch, 
  Copy, 
  Check, 
  LinkedinLogo, 
  EnvelopeSimple, 
  ArrowClockwise 
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OutreachCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string;
  investorId: string;
  investorName: string;
}

export default function OutreachCopilotModal({
  isOpen,
  onClose,
  startupId,
  investorId,
  investorName
}: OutreachCopilotModalProps) {
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [tone, setTone] = useState<"professional" | "visionary" | "casual">("professional");
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const token = localStorage.getItem("token"); // or context
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          startupId,
          investorId,
          channel,
          tone,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate outreach copy");
      
      const data = await res.json();
      setGeneratedText(data.content);
      toast.success("Outreach copy generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate outreach message. Using fallback template.");
      // Fallback
      if (channel === "linkedin") {
        setGeneratedText(`Hi ${investorName} team, noticed your focus on investments. We are building our startup and raising a round. Would love to share our deck. Are you open to a brief chat?`);
      } else {
        setGeneratedText(`Subject: FIT: Proposal & intro\n\nDear ${investorName} Team,\n\nI hope you are well. We are building a tech startup and raising our seed round. Since you focus on early stage deals, I thought we would be a great fit.\n\nWould you be open to a 10-minute call next week?\n\nBest,\nFounder`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success("Outreach memo copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-150 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-yellow-400/20 to-orange-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>

        {/* Modal Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Sparkle className="w-5 h-5 text-white" weight="fill" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                AI Outreach <span className="text-yellow-500">Copilot</span>
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Outreach draft for {investorName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto grow">
          {/* Settings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Outreach Channel
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3.5 border rounded-2xl text-sm font-bold transition-all cursor-pointer",
                    channel === "email"
                      ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-lg"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  )}
                >
                  <EnvelopeSimple className="w-5 h-5" weight="bold" />
                  Email Copy
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("linkedin")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3.5 border rounded-2xl text-sm font-bold transition-all cursor-pointer",
                    channel === "linkedin"
                      ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 shadow-lg shadow-blue-500/20"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  )}
                >
                  <LinkedinLogo className="w-5 h-5" weight="fill" />
                  LinkedIn InMail
                </button>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Persona Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
              >
                <option value="professional">Professional (Data-Driven)</option>
                <option value="visionary">Visionary (Big Picture/Impact)</option>
                <option value="casual">Casual (Friendly/Conversational)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          {!generatedText && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl space-y-4">
              <Sparkle className="w-12 h-12 text-yellow-500 animate-pulse" weight="bold" />
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300">Generate warm intro proposal</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Sophia will analyze your startup's metrics and investor thesis to write a high-conversion outreach copy.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-all shadow-md cursor-pointer"
              >
                Generate Draft
              </button>
            </div>
          )}

          {/* Generating Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-4 border border-gray-100 dark:border-zinc-800 rounded-3xl bg-gray-50/50 dark:bg-black/10">
              <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" weight="bold" />
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300">Sophia is drafting your intro...</p>
                <p className="text-xs text-gray-400 mt-1 animate-pulse">
                  Synthesizing sector overlap, stage alignment, and check size statistics...
                </p>
              </div>
            </div>
          )}

          {/* Result Editor */}
          {generatedText && !loading && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Generated Draft
                </span>
                <span className="text-[10px] bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-0.5 rounded-md font-bold">
                  Editable
                </span>
              </div>
              <textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={10}
                className="w-full p-4 border border-gray-200 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white font-mono"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {generatedText && !loading && (
          <div className="p-6 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 justify-between items-center z-10 shrink-0">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-800 w-full sm:w-auto cursor-pointer"
            >
              <ArrowClockwise className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 hover:-translate-y-0.5 transition-all shadow-md w-full sm:w-auto cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" weight="bold" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" weight="bold" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
