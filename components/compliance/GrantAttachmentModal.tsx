"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Copy,
  Download,
  X,
  CircleNotch,
  CheckCircle,
  ShieldCheck,
  NotePencil,
} from "@phosphor-icons/react";

interface GrantAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string;
  grantId?: string;
  grantTitle?: string;
  grantAgency?: string;
  defaultAmount?: number;
  token: string;
}

export default function GrantAttachmentModal({
  isOpen,
  onClose,
  startupId,
  grantId,
  grantTitle,
  grantAgency,
  defaultAmount = 275000,
  token,
}: GrantAttachmentModalProps) {
  const [program, setProgram] = useState<"SBIR" | "EIC">("SBIR");
  const [attachmentType, setAttachmentType] = useState<string>("commercialization_plan");
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [piName, setPiName] = useState<string>("Dr. Alex Vance, CTO");
  const [targetTrl, setTargetTrl] = useState<number>(6);

  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [metaSummary, setMetaSummary] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!startupId) {
      toast.error("No active startup selected");
      return;
    }
    setGenerating(true);
    setGeneratedDoc("");
    setMetaSummary(null);

    try {
      const res = await fetch("/api/compliance/grant-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startup_id: startupId,
          grant_id: grantId,
          program,
          attachment_type: attachmentType,
          requested_amount: amount,
          project_duration_months: durationMonths,
          pi_name: piName,
          target_trl: targetTrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attachment) {
          setGeneratedDoc(data.attachment.generated_document);
          setDocTitle(data.attachment.title);
          setMetaSummary(data.meta_summary);
          toast.success("Grant form attachment generated!");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate attachment");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error generating grant attachment");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    toast.success("Attachment markdown copied to clipboard!");
  };

  const handleDownload = () => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(docTitle || "grant_attachment").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Attachment downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Institutional Grant Form Attachments
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Compose compliant attachments for federal SBIR and European EIC Accelerator filings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Options Bar (Program & Type) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Program Selector (Segmented) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Grant Framework
              </label>
              <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setProgram("SBIR");
                    setAttachmentType("commercialization_plan");
                    setAmount(275000);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    program === "SBIR"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  🇺🇸 Federal SBIR / STTR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgram("EIC");
                    setAttachmentType("eic_annex_work_packages");
                    setAmount(2500000);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    program === "EIC"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  🇪🇺 EIC Accelerator
                </button>
              </div>
            </div>

            {/* Attachment Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Required Attachment
              </label>
              <select
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {program === "SBIR" ? (
                  <>
                    <option value="commercialization_plan">Commercialization Plan (Market, Sales & IP)</option>
                    <option value="budget_justification">Budget Justification (SF-424A Breakdown & Fringe)</option>
                    <option value="key_personnel">Key Personnel Biosketch & Facilities</option>
                  </>
                ) : (
                  <>
                    <option value="eic_annex_work_packages">Work Packages & Milestones (TRL 5 to 8)</option>
                    <option value="eic_budget_breakdown">Budget Breakdown & Person-Months (25% Flat Indirect)</option>
                    <option value="eic_ipr_freedom_to_operate">IPR Strategy & Freedom to Operate (FTO)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Parameters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50/50 dark:bg-zinc-800/30 p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Requested Funding
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Duration (Months)
              </label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Principal Investigator
              </label>
              <input
                type="text"
                value={piName}
                onChange={(e) => setPiName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white truncate"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Target TRL Level
              </label>
              <input
                type="number"
                min={1}
                max={9}
                value={targetTrl}
                onChange={(e) => setTargetTrl(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Trigger Button */}
          {!generatedDoc && !generating && (
            <div className="text-center py-6">
              <button
                type="button"
                onClick={handleGenerate}
                className="px-6 py-3 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <FileText className="w-4 h-4" weight="bold" />
                Generate {program} Attachment
              </button>
            </div>
          )}

          {/* Loading State */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <CircleNotch className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" weight="bold" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Compiling institutional {program} attachment...
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Verifying federal and European guideline compliance
              </p>
            </div>
          )}

          {/* Generated Document Area */}
          {generatedDoc && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {docTitle || "Generated Attachment"}
                  </span>
                  {metaSummary && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {metaSummary.word_count} words
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <NotePencil className="w-3.5 h-3.5" />
                    {isEditing ? "Preview" : "Edit"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>

              {/* Compliance Badges */}
              {metaSummary?.compliance_flags && metaSummary.compliance_flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {metaSummary.compliance_flags.map((flag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Editor or Preview */}
              {isEditing ? (
                <textarea
                  value={generatedDoc}
                  onChange={(e) => setGeneratedDoc(e.target.value)}
                  rows={14}
                  className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed outline-none focus:border-zinc-500"
                />
              ) : (
                <div className="p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-sans text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedDoc}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <span className="text-[11px] text-zinc-400">
            Compliant with 2 CFR 200 (Uniform Guidance) & Horizon Europe Guidelines
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
