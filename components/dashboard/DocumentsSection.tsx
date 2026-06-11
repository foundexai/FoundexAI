"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FileText, Plus, DotsThree, Clock, PaperPlaneTilt, CircleNotch, X } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface UploadedDoc {
  name: string;
  type: string;
  url: string;
  date: Date | string;
}

interface DocumentsSectionProps {
  documents?: UploadedDoc[];
}

export default function DocumentsSection({
  documents = [],
}: DocumentsSectionProps) {
  const { token } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<UploadedDoc | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [outreachLogs, setOutreachLogs] = useState<any[]>([]);

  // Load saved investors for the sharing target dropdown
  useEffect(() => {
    async function loadInvestors() {
      if (!token) return;
      try {
        const res = await fetch("/api/investors/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSavedInvestors(data.investors || []);
        }
      } catch (err) {
        console.error("Failed to fetch saved investors for share modal", err);
      }
    }
    loadInvestors();
  }, [token]);

  // Load database outreach logs
  useEffect(() => {
    async function fetchLogs() {
      if (!token) return;
      try {
        const res = await fetch("/api/documents/share", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map database key fields (doc_name, investor_name, message, created_at) to match original format (docName, investorName, message, date)
          const formatted = (data.shares || []).map((s: any) => ({
            docName: s.doc_name,
            investorName: s.investor_name,
            message: s.message,
            date: s.created_at
          }));
          setOutreachLogs(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch shared document logs", err);
      }
    }
    fetchLogs();
  }, [token, isShareModalOpen]);

  const handleShareSubmit = async () => {
    if (!selectedDoc || !selectedInvestorId || !shareMessage) return;
    setSharing(true);

    const investor = savedInvestors.find(inv => inv.id === selectedInvestorId);
    const investorName = investor ? investor.name : "Selected Investor";

    try {
      const res = await fetch("/api/documents/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          docName: selectedDoc.name,
          docUrl: selectedDoc.url,
          investorName: investorName,
          investorId: selectedInvestorId,
          message: shareMessage
        })
      });

      if (!res.ok) throw new Error("Failed to share document via API");

      toast.success("Document shared successfully!", {
        description: `Your memo was sent to ${investorName} along with ${selectedDoc.name}.`,
      });

      setIsShareModalOpen(false);
      setShareMessage("");
      setSelectedInvestorId("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to share document.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 h-full dark:bg-zinc-900/60 dark:border-zinc-800 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Documents
          </h3>
          <Link
            href="/dashboard/documents"
            className="text-gray-400 hover:text-gray-600 text-sm font-medium dark:text-gray-500 dark:hover:text-gray-300"
          >
            See all
          </Link>
        </div>

        <div className="space-y-4">
          {documents.length > 0 ? (
            documents.slice(0, 1).map((doc, i) => (
              <div
                key={i}
                className="group relative bg-black rounded-xl overflow-hidden aspect-2/1 flex items-center justify-center cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {/* Background Graphics mimicking a deck slide */}
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 to-black opacity-80"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

                <div className="relative z-10 text-center">
                  <FileText className="w-8 h-8 text-white/80 mx-auto mb-2" weight="bold" />
                  <h4 className="text-white font-bold text-lg tracking-tight">
                    {doc.name}
                  </h4>
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                      {format(new Date(doc.date), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-1 text-white/40 text-[9px] font-medium">
                      <Clock className="w-2.5 h-2.5" weight="bold" />
                      {format(new Date(doc.date), "h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDoc(doc);
                      setShareMessage(`Hi, please find our ${doc.name} shared. We would love to arrange a brief introductory call to discuss our current milestones.`);
                      setIsShareModalOpen(true);
                    }}
                    className="p-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-500 transition-all font-bold cursor-pointer"
                    title="Share with Matched Investors"
                  >
                    <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
                  </button>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all font-bold cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DotsThree className="w-3.5 h-3.5" weight="bold" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 p-8 rounded-2xl text-center space-y-2 dark:bg-zinc-800/10 dark:border-zinc-800">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-650 mx-auto" weight="bold" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">No documents uploaded yet</p>
              <p className="text-xs text-gray-500 leading-relaxed">Upload your pitch deck or write a memo to share with investors.</p>
            </div>
          )}

          <Link href="/dashboard/documents/new">
            <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center justify-center gap-1 dark:border-zinc-700 dark:hover:bg-white/5 dark:text-gray-500 cursor-pointer">
              <Plus className="w-6 h-6" weight="bold" />
              <span>Add New Document</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Outreach Logs List inside the card */}
      {outreachLogs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-850 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Outreach Logs</h4>
            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">Active</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto thin-scrollbar">
            {outreachLogs.slice(0, 3).map((log, index) => (
              <div key={index} className="p-2.5 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-850 dark:text-gray-250 truncate max-w-[140px]">{log.investorName}</span>
                  <span className="text-zinc-400">{format(new Date(log.date), "MMM d, h:mm a")}</span>
                </div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 line-clamp-1 leading-tight italic">
                  "{log.message}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal Dialog Overlay */}
      {isShareModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-gray-900 dark:text-white">Share Document</h4>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-3">
              <FileText className="w-6 h-6 text-yellow-500 shrink-0" weight="bold" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">{selectedDoc.name}</p>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{selectedDoc.type}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Select Matched Investor</label>
                {savedInvestors.length === 0 ? (
                  <div className="text-xs text-red-500 italic p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                    No shortlisted investors. Search and shortlist investors in the Database first.
                  </div>
                ) : (
                  <select
                    value={selectedInvestorId}
                    onChange={(e) => setSelectedInvestorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                  >
                    <option value="">-- Choose an Investor --</option>
                    {savedInvestors.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Message Template</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="e.g. Hello, please find our pitch deck attached. We look forward to connecting with you."
                  className="w-full h-24 p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-xl text-xs focus:outline-none resize-none dark:text-white leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleShareSubmit}
              disabled={sharing || !selectedInvestorId || !shareMessage}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {sharing ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" />}
              Send Document & Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
