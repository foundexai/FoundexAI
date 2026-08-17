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
  Fire,
  Users,
  Clock,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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
 
  // PDF.js Heatmap Rendering & Versioning States
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"comments" | "heatmap">("comments");
  const [documentVersions, setDocumentVersions] = useState<any[]>([]);
  const [documentRedlines, setDocumentRedlines] = useState<any[]>([]);
 
  // Version Upload and Redline Forms state inputs
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionMemo, setNewVersionMemo] = useState("");
  const [isCommittingVersion, setIsCommittingVersion] = useState(false);
  const [redlineSection, setRedlineSection] = useState("");
  const [redlineComment, setRedlineComment] = useState("");
  const [isPostingRedline, setIsPostingRedline] = useState(false);

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

  // Fetch secure link page engagement analytics
  const fetchAnalytics = async () => {
    if (!token || !url) return;
    try {
      const res = await fetch(`/api/documents/secure-link/analytics?url=${encodeURIComponent(url)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to load secure link analytics:", err);
    }
  };

  useEffect(() => {
    if (token && url) {
      fetchAnalytics();
    }
  }, [token, url]);

  // Load startup details for versions and redlines history matching
  const [startupId, setStartupId] = useState("");
  
  const fetchStartupDocHistory = async () => {
    if (!token || !name) return;
    try {
      const res = await fetch("/api/startups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.startups && data.startups.length > 0) {
          const activeId = localStorage.getItem("activeStartupId") || data.startups[0]._id;
          setStartupId(activeId);
          const currentStartup = data.startups.find((s: any) => s._id === activeId) || data.startups[0];
          const matchedDoc = currentStartup.documents?.find((d: any) => d.name === name);
          if (matchedDoc) {
            setDocumentVersions(matchedDoc.versions || []);
            setDocumentRedlines(matchedDoc.redlines || []);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load startup document history:", err);
    }
  };

  useEffect(() => {
    if (token && name) {
      fetchStartupDocHistory();
    }
  }, [token, name]);

  // PDF.js dynamic render sequence
  useEffect(() => {
    if (!url) return;
    const isPdf = url.toLowerCase().endsWith(".pdf");
    if (!isPdf) return;

    setPdfLoading(true);

    const loadAndRenderPdf = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          setTimeout(loadAndRenderPdf, 200);
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const pageImages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            pageImages.push(canvas.toDataURL("image/png"));
          }
        }

        setPdfPages(pageImages);
      } catch (err) {
        console.error("Error rendering PDF pages via PDF.js:", err);
      } finally {
        setPdfLoading(false);
      }
    };

    // Load PDF.js CDN script
    if (!(window as any).pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => loadAndRenderPdf();
    } else {
      loadAndRenderPdf();
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
          ) : pdfLoading ? (
            <div className="flex flex-col items-center justify-center grow h-full text-zinc-400">
              <CircleNotch className="w-8 h-8 animate-spin text-yellow-500 mb-3" />
              <p className="text-xs font-bold">Rendering document pages...</p>
            </div>
          ) : pdfPages.length > 0 ? (
            <div className="h-full overflow-y-auto p-4 md:p-8 flex flex-col gap-8 items-center bg-gray-50/50 dark:bg-black/20">
              <div className="flex items-center justify-between w-full max-w-2xl px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Viewer Heatmap Overlay</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="rounded text-yellow-500 focus:ring-yellow-500 w-3.5 h-3.5"
                  />
                  <span>Show Engagement Hotspots</span>
                </label>
              </div>

              <div className="flex flex-col gap-6 items-center w-full max-w-2xl select-none">
                {pdfPages.map((pageUrl, idx) => {
                  const pageDuration = analyticsData?.pageDurations?.[idx] || 0;
                  const maxDur = analyticsData?.maxDuration || 0;
                  const ratio = maxDur > 0 ? pageDuration / maxDur : 0;

                  let heatColor = "bg-zinc-200 dark:bg-zinc-800";
                  let textColor = "text-zinc-500";
                  let borderHighlight = "border-gray-200 dark:border-zinc-850";

                  if (ratio > 0.75) {
                    heatColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                    textColor = "text-red-500 font-bold";
                    borderHighlight = "border-red-500/40 dark:border-red-900/40";
                  } else if (ratio > 0.4) {
                    heatColor = "bg-orange-500";
                    textColor = "text-orange-500 font-bold";
                    borderHighlight = "border-orange-500/40 dark:border-orange-900/40";
                  } else if (ratio > 0.1) {
                    heatColor = "bg-yellow-500";
                    textColor = "text-yellow-600 dark:text-yellow-400 font-bold";
                    borderHighlight = "border-yellow-500/40 dark:border-yellow-900/40";
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-full relative bg-white border ${borderHighlight} rounded-[1.5rem] shadow-sm overflow-hidden`}
                    >
                      {/* Heatmap Pill Indicator */}
                      {showHeatmap && pageDuration > 0 && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-gray-150 dark:border-zinc-800 rounded-xl shadow-xs text-[10px]">
                          <Fire className="w-3.5 h-3.5 text-yellow-500 shrink-0" weight="bold" />
                          <span className="text-zinc-400 font-black uppercase tracking-widest text-[8px]">Page {idx + 1}:</span>
                          <span className={textColor}>{pageDuration}s view time</span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${heatColor}`} />
                        </div>
                      )}

                      <img
                        src={pageUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-auto object-contain block"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <iframe
              src={url || ""}
              className="w-full h-full border-none bg-zinc-100 dark:bg-zinc-900"
              title="Document Viewer"
            />
          )}
        </div>

        {/* Right Column: Context-Aware Sidebar Chat Comments & Heatmaps Panel */}
        <div
          className={`h-full border-l border-gray-150 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col transition-all duration-300 ${
            showComments ? "w-80 shrink-0" : "w-0 overflow-hidden pointer-events-none"
          }`}
        >
          {/* Tabs header selector */}
          <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40">
            <button
              onClick={() => setActiveSidebarTab("comments")}
              className={`flex-1 py-3 text-[9px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeSidebarTab === "comments"
                  ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                  : "border-transparent text-gray-400 hover:text-gray-650"
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveSidebarTab("heatmap")}
              className={`flex-1 py-3 text-[9px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeSidebarTab === "heatmap"
                  ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                  : "border-transparent text-gray-400 hover:text-gray-650"
              }`}
            >
              Heatmap & History
            </button>
            <button
              onClick={() => setShowComments(false)}
              className="px-3 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB A: COMMENTS */}
          {activeSidebarTab === "comments" ? (
            <>
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
                        <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-550">
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
                <div className="space-y-1">
                  <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
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
                    className="p-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-150 dark:text-black rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {submittingComment ? (
                      <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PaperPlaneTilt className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* TAB B: HEATMAPS & VERSIONS */
            <div className="flex-1 overflow-y-auto p-4 space-y-6 thin-scrollbar">
              {/* 1. Viewer Logs heatmap analytics */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-450 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-yellow-500" /> Viewer Engagement History
                </span>
                
                {analyticsData?.viewerSummaries && analyticsData.viewerSummaries.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {analyticsData.viewerSummaries.map((summary: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl text-[10px] space-y-1">
                        <div className="flex justify-between items-center font-bold text-gray-800 dark:text-zinc-200">
                          <span className="truncate max-w-[140px]">{summary.email}</span>
                          <span className="text-yellow-600 dark:text-yellow-450">{summary.totalSeconds}s total</span>
                        </div>
                        <span className="block text-gray-400">Last View: {format(new Date(summary.lastViewed), "MMM d, h:mm a")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic">No viewer access log recordings found.</p>
                )}
              </div>

              {/* 2. Version history tracker */}
              <div className="space-y-3 pt-4 border-t border-gray-150 dark:border-zinc-900">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-450 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-yellow-500" /> Version History (v{documentVersions.length + 1})
                </span>

                {/* Upload version upgrade form */}
                <div className="p-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase text-gray-400">Upload New Revision</span>
                  <input
                    type="text"
                    placeholder="New URL (e.g. from upload)"
                    value={newVersionUrl}
                    onChange={(e) => setNewVersionUrl(e.target.value)}
                    className="w-full text-[10px] px-2.5 py-1.5 bg-white dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Change summary (e.g. section updates)"
                    value={newVersionMemo}
                    onChange={(e) => setNewVersionMemo(e.target.value)}
                    className="w-full text-[10px] px-2.5 py-1.5 bg-white dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    disabled={isCommittingVersion || !newVersionUrl}
                    onClick={async () => {
                      setIsCommittingVersion(true);
                      try {
                        const res = await fetch("/api/documents/version", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            docName: name,
                            newUrl: newVersionUrl,
                            changeSummary: newVersionMemo,
                            startupId
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to commit version update");

                        toast.success("Document version committed successfully!");
                        setNewVersionUrl("");
                        setNewVersionMemo("");
                        // Trigger reload
                        fetchStartupDocHistory();
                        // Redirect to the new document URL preview
                        window.location.href = `/dashboard/documents/view?url=${encodeURIComponent(newVersionUrl)}&name=${encodeURIComponent(name || "")}`;
                      } catch (err: any) {
                        toast.error(err.message || "Failed to save version.");
                      } finally {
                        setIsCommittingVersion(false);
                      }
                    }}
                    className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCommittingVersion ? "Commiting..." : "Upload Version Upgrade"}
                  </button>
                </div>

                {/* Versions list */}
                <div className="space-y-2">
                  <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-[10px] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 dark:text-zinc-200">v{documentVersions.length + 1} (Current Active)</span>
                      <span className="block text-gray-400">Active preview URL</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-yellow-150 text-yellow-800 text-[8px] font-bold rounded">Live</span>
                  </div>
                  {[...documentVersions].reverse().map((v: any, vIdx: number) => (
                    <div key={vIdx} className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl text-[10px] space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-zinc-200">Version v{v.version_number}</span>
                        <a href={v.url} target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline">View File</a>
                      </div>
                      <span className="block text-gray-400">Change: "{v.change_summary}"</span>
                      <span className="block text-gray-400 text-[8px]">Uploaded at {format(new Date(v.created_at), "MMM d, yyyy")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Contract redlines and revisions */}
              <div className="space-y-3 pt-4 border-t border-gray-150 dark:border-zinc-900">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-450 flex items-center gap-1.5">
                  <Fire className="w-4 h-4 text-yellow-500" /> Contract Redlining Logs ({documentRedlines.length})
                </span>

                {/* Add redline comment form */}
                <div className="p-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase text-gray-400">Add Redline revision</span>
                  <input
                    type="text"
                    placeholder="Section/Clause (e.g. Clause 4.2)"
                    value={redlineSection}
                    onChange={(e) => setRedlineSection(e.target.value)}
                    className="w-full text-[10px] px-2.5 py-1.5 bg-white dark:bg-zinc-855 border border-gray-250/70 dark:border-zinc-700 rounded-lg outline-none"
                  />
                  <textarea
                    placeholder="Revision requested comment text"
                    value={redlineComment}
                    onChange={(e) => setRedlineComment(e.target.value)}
                    className="w-full h-12 text-[10px] p-2 bg-white dark:bg-zinc-855 border border-gray-250/70 dark:border-zinc-700 rounded-lg outline-none resize-none"
                  />
                  <button
                    type="button"
                    disabled={isPostingRedline || !redlineComment.trim()}
                    onClick={async () => {
                      setIsPostingRedline(true);
                      try {
                        const res = await fetch("/api/documents/redline", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            docName: name,
                            section: redlineSection,
                            comment: redlineComment,
                            versionNumber: documentVersions.length + 1,
                            startupId
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to post redline");

                        toast.success("Redline comment registered!");
                        setRedlineSection("");
                        setRedlineComment("");
                        fetchStartupDocHistory();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to add redline.");
                      } finally {
                        setIsPostingRedline(false);
                      }
                    }}
                    className="w-full py-1.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPostingRedline ? "Posting..." : "Register Redline Comment"}
                  </button>
                </div>

                {/* Redlines log list */}
                <div className="space-y-2">
                  {[...documentRedlines].reverse().map((red: any, rIdx: number) => (
                    <div key={rIdx} className="p-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wide text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {red.section} (v{red.version_number})
                        </span>
                        <span className="text-[8px] text-gray-400">{format(new Date(red.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-gray-700 dark:text-zinc-300 leading-normal">"{red.comment}"</p>
                      <span className="block text-[8px] text-gray-400 italic font-bold pr-2 text-right">By {red.author}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
