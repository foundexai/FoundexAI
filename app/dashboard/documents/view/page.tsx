"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CaretLeft,
  DownloadSimple,
  ArrowSquareOut,
  CircleNotch,
  FileText,
  PaperPlaneTilt,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function DocumentViewerContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();

  const url = searchParams.get("url");
  const name = searchParams.get("name");
  // const type = searchParams.get("type"); // Unused

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sharing States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  // Load saved investors for selection dropdown
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

  useEffect(() => {
    if (!url) return;

    // Check if it's strictly a text file extension (Cloudinary URLs usually end with extension)
    // If it's a raw resource, it might be text, but let's be safe.
    // If the user created it via "Write New", we saved it as .txt.
    const isTextFile =
      url.toLowerCase().endsWith(".txt") || url.toLowerCase().endsWith(".md");

    if (isTextFile) {
      setLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load");
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch text content", err);
          // Fallback to iframe if text fetch fails? No, just show error or let iframe try.
          setTextContent(null);
          setLoading(false);
        });
    } else {
      // It's a PDF, Image, or DOC.
      setLoading(false);
    }
  }, [url]);

  const handleShareSubmit = async () => {
    if (!url || !selectedInvestorId || !shareMessage) return;
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
          docName: name || "Document",
          docUrl: url,
          investorName: investorName,
          investorId: selectedInvestorId,
          message: shareMessage
        })
      });

      if (!res.ok) throw new Error("Failed to share document via API");

      toast.success("Document shared successfully!", {
        description: `Your memo was sent to ${investorName} along with ${name || "Document"}.`,
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

  if (!url) return <div>Invalid Document URL</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/documents"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-zinc-800"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-white">
              <FileText className="w-4 h-4 text-gray-400" weight="bold" />
              {name || "Document Viewer"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShareMessage(`Hi, please find our ${name || "Document"} shared. We would love to arrange a brief introductory call to discuss our current milestones.`);
              setIsShareModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-600 rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-yellow-500/10 cursor-pointer"
          >
            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
            Share
          </button>
          <a
            href={url}
            download
            target="_blank"
            className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            Download
          </a>
          <a
            href={url}
            target="_blank"
            className="hidden sm:flex px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 items-center gap-2 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <ArrowSquareOut className="w-4 h-4" weight="bold" />
            Open Original
          </a>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="grow overflow-hidden relative flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
          </div>
        ) : textContent !== null ? (
          // Text Viewer (In-House Experience for Memos/Drafts)
          <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
            <div className="bg-white p-6 md:p-12 min-h-full shadow-lg rounded-xl dark:bg-zinc-900 dark:text-gray-200">
              <pre className="whitespace-pre-wrap wrap-break-word font-sans text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-300 max-w-full">
                {textContent}
              </pre>
            </div>
          </div>
        ) : (
          // PDF/File Viewer via Iframe
          <iframe
            src={url}
            className="w-full h-full border-none bg-gray-200 dark:bg-zinc-800"
            title="Document Viewer"
          />
        )}
      </div>

      {/* Share Modal Dialog Overlay */}
      {isShareModalOpen && (
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
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">{name || "Document"}</p>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Document</span>
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

export default function DocumentViewerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><CircleNotch className="w-8 h-8 animate-spin text-gray-400" weight="bold" /></div>}>
      <DocumentViewerContent />
    </Suspense>
  );
}
