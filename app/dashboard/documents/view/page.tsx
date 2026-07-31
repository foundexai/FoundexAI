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
  ChatCircleDots,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function DocumentViewerContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();

  const url = searchParams.get("url");
  const name = searchParams.get("name");

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sharing States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  // Comments & Threads States
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedCommentInvestor, setSelectedCommentInvestor] = useState("general");

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
        console.error("Failed to fetch saved investors", err);
      }
    }
    loadInvestors();
  }, [token]);

  // Load text content if it's a text-based document
  useEffect(() => {
    if (!url) return;

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
          setTextContent(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [url]);

  // Fetch comments matching this document URL
  const fetchComments = async () => {
    if (!token || !url) return;
    try {
      const res = await fetch(`/api/pipeline/chat?refId=${encodeURIComponent(url)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    if (token && url) {
      fetchComments();
      const interval = setInterval(fetchComments, 8000);
      return () => clearInterval(interval);
    }
  }, [token, url]);

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

      if (!res.ok) throw new Error("Failed to share document");

      toast.success("Document shared successfully!", {
        description: `Your memo was sent to ${investorName} along with ${name || "Document"}.`,
      });

      setIsShareModalOpen(false);
      setShareMessage("");
      setSelectedInvestorId("");
      fetchComments(); // Refresh comment log
    } catch (err) {
      console.error(err);
      toast.error("Failed to share document.");
    } finally {
      setSharing(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !url) return;
    setSubmittingComment(true);

    try {
      const res = await fetch("/api/pipeline/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          investorId: selectedCommentInvestor,
          text: commentText,
          sender: "founder",
          context: {
            type: "document",
            ref_id: url,
            title: name || "Document",
            url: url
          }
        })
      });

      if (res.ok) {
        setCommentText("");
        fetchComments();
        toast.success("Comment posted!");
      } else {
        toast.error("Failed to post comment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error posting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!url) return <div>Invalid Document URL</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-150 px-6 py-3.5 flex items-center justify-between shrink-0 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/documents"
            className="p-2 hover:bg-gray-150 rounded-full transition-colors dark:hover:bg-zinc-900"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2 dark:text-white">
              <FileText className="w-4 h-4 text-zinc-400" weight="bold" />
              {name || "Document Viewer"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Comments Toggle Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              showComments
                ? "bg-zinc-100 dark:bg-zinc-900 text-yellow-600 dark:text-yellow-450"
                : "text-zinc-650 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            <ChatCircleDots className="w-4 h-4" />
            Comments ({comments.length})
          </button>
          <button
            onClick={() => {
              setShareMessage(`Hi, please find our ${name || "Document"} shared. We would love to arrange a brief introductory call to discuss our milestones.`);
              setIsShareModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-mono font-bold bg-yellow-500 text-black hover:bg-yellow-600 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-yellow-500/10"
          >
            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
            Share Document
          </button>
          <a
            href={url}
            download
            target="_blank"
            className="px-4 py-2 text-xs font-mono font-bold text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2 transition-colors dark:text-gray-300 dark:hover:bg-zinc-900"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            Download
          </a>
          <a
            href={url}
            target="_blank"
            className="hidden sm:flex px-4 py-2 text-xs font-mono font-bold bg-zinc-900 text-white rounded-xl hover:bg-black items-center gap-2 transition-all dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
          >
            <ArrowSquareOut className="w-4 h-4" weight="bold" />
            Open Original
          </a>
        </div>
      </div>

      {/* Viewer Main Body Area split panel */}
      <div className="grow flex overflow-hidden relative">
        {/* Left Column: Viewer Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <CircleNotch className="w-8 h-8 text-zinc-400 animate-spin" weight="bold" />
            </div>
          ) : textContent !== null ? (
            <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
              <div className="bg-white p-6 md:p-12 min-h-full shadow-2xs border border-gray-150/40 rounded-3xl dark:bg-zinc-950 dark:border-zinc-900 dark:text-gray-200">
                <pre className="whitespace-pre-wrap wrap-break-word font-sans text-xs md:text-sm leading-relaxed text-gray-800 dark:text-gray-350 max-w-full">
                  {textContent}
                </pre>
              </div>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-none bg-zinc-100 dark:bg-zinc-900"
              title="Document Viewer"
            />
          )}
        </div>

        {/* Right Column: Context-Aware Sidebar Chat Comments Panel */}
        <div
          className={`h-full border-l border-gray-150 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col transition-all duration-300 ${
            showComments ? "w-80 shrink-0" : "w-0 overflow-hidden pointer-events-none"
          }`}
        >
          {/* Comments Panel Header */}
          <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550 leading-none">
                Inline Thread Comments
              </h3>
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comments Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 thin-scrollbar">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <ChatCircleDots className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">No comments yet</p>
                <p className="text-[9px] text-zinc-500 mt-1 max-w-[200px]">
                  Share feedback or type inline messages. Comments will link to active investor conversations.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isFounder = comment.sender === "founder";
                return (
                  <div
                    key={comment._id}
                    className={`flex flex-col space-y-1 ${isFounder ? "items-end" : "items-start"}`}
                  >
                    {/* Header Label (Thread identifier or recipient) */}
                    <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500">
                      {isFounder ? "You" : comment.investor_id}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-normal ${
                        isFounder
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-tr-none"
                          : "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-none"
                      }`}
                    >
                      {comment.text}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400/70">
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* New Comment Submission Form */}
          <form
            onSubmit={handleSendComment}
            className="p-4 border-t border-gray-100 dark:border-zinc-900 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/40"
          >
            {/* Thread Target Selector */}
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-bold text-zinc-450 uppercase tracking-widest block">
                Post Thread Context:
              </span>
              <select
                value={selectedCommentInvestor}
                onChange={(e) => setSelectedCommentInvestor(e.target.value)}
                className="w-full text-[10px] font-mono bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-1.5 outline-none dark:text-zinc-350"
              >
                <option value="general">General (No specific investor)</option>
                {savedInvestors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    To: {inv.name} ({inv.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1.5 items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write inline comment..."
                className="flex-1 text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-xl outline-none focus:border-zinc-400 dark:focus:border-zinc-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="p-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {submittingComment ? (
                  <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PaperPlaneTilt className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
        </div>
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
