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
    <div className="h-screen flex flex-col bg-zinc-50/70 dark:bg-black overflow-hidden font-sans">
      {/* Header with Apple Glassmorphism and Catch-lights */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard/documents"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            title="Back to Documents"
          >
            <CaretLeft className="w-5 h-5" weight="bold" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-xs">
              <FileText className="w-4 h-4 text-yellow-500" weight="bold" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                {name || "Document Viewer"}
              </h1>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                {pdfPages.length > 0 ? `${pdfPages.length} Pages • PDF` : "Document Preview"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Comments & Heatmap Drawer Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
              showComments
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white shadow-xs"
                : "bg-white/70 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-300 border-black/5 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <ChatCircleDots className="w-4 h-4" weight={showComments ? "fill" : "regular"} />
            <span className="hidden sm:inline">Insights & Notes</span>
            <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-md">
              {comments.length}
            </span>
          </button>

          {/* Share Modal Trigger */}
          <button
            onClick={() => {
              setShareMessage(`Hi, please find our ${name || "Document"} shared. We would love to arrange a brief introductory call to discuss our milestones.`);
              setIsShareModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-yellow-500 hover:bg-yellow-450 text-black rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-yellow-500/20"
          >
            <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
            <span>Share</span>
          </button>

          {/* Download Original */}
          <a
            href={url}
            download
            target="_blank"
            className="px-3 py-1.5 text-xs font-medium bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <a
            href={url}
            target="_blank"
            className="hidden md:flex px-3 py-1.5 text-xs font-medium bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl items-center gap-1.5 transition-all active:scale-95"
          >
            <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" />
            <span>Original</span>
          </a>
        </div>
      </header>

      {/* Viewer Main Body Area split panel */}
      <div className="grow flex overflow-hidden relative">
        {/* Left Column: Viewer Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-zinc-100/50 dark:bg-zinc-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <CircleNotch className="w-8 h-8 text-yellow-500 animate-spin" weight="bold" />
              <p className="text-xs font-mono text-zinc-400">Loading document...</p>
            </div>
          ) : textContent !== null ? (
            <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
              <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 md:p-12 min-h-full shadow-lg shadow-black/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl dark:text-gray-200">
                <pre className="whitespace-pre-wrap wrap-break-word font-sans text-xs md:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 max-w-full">
                  {textContent}
                </pre>
              </div>
            </div>
          ) : pdfLoading ? (
            <div className="flex flex-col items-center justify-center grow h-full text-zinc-400 gap-3">
              <div className="relative">
                <CircleNotch className="w-9 h-9 animate-spin text-yellow-500" />
                <FileText className="w-4 h-4 text-yellow-600 absolute inset-0 m-auto" weight="bold" />
              </div>
              <p className="text-xs font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">Rendering high-resolution vector pages...</p>
            </div>
          ) : pdfPages.length > 0 ? (
            <div className="h-full overflow-y-auto p-4 md:p-8 flex flex-col gap-8 items-center thin-scrollbar">
              {/* Heatmap Control Bar */}
              <div className="flex items-center justify-between w-full max-w-2xl px-3 py-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-2xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Real-Time Heatmap Tracking</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <span>Show Engagement Hotspots</span>
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="accent-yellow-500 rounded w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Pages Column */}
              <div className="flex flex-col gap-8 items-center w-full max-w-2xl select-none pb-12">
                {pdfPages.map((pageUrl, idx) => {
                  const pageDuration = analyticsData?.pageDurations?.[idx] || 0;
                  const maxDur = analyticsData?.maxDuration || 0;
                  const ratio = maxDur > 0 ? pageDuration / maxDur : 0;

                  let heatColor = "bg-zinc-300 dark:bg-zinc-700";
                  let textColor = "text-zinc-500";
                  let borderHighlight = "border-black/[0.08] dark:border-white/[0.08]";
                  let glowStyle = "";

                  if (ratio > 0.75) {
                    heatColor = "bg-rose-500";
                    textColor = "text-rose-600 dark:text-rose-400 font-semibold";
                    borderHighlight = "border-rose-500/40 dark:border-rose-500/30";
                    glowStyle = "shadow-[0_8px_30px_rgb(244,63,94,0.15)]";
                  } else if (ratio > 0.4) {
                    heatColor = "bg-amber-500";
                    textColor = "text-amber-600 dark:text-amber-400 font-semibold";
                    borderHighlight = "border-amber-500/40 dark:border-amber-500/30";
                    glowStyle = "shadow-[0_8px_30px_rgb(245,158,11,0.12)]";
                  } else if (ratio > 0.1) {
                    heatColor = "bg-yellow-500";
                    textColor = "text-yellow-600 dark:text-yellow-400 font-semibold";
                    borderHighlight = "border-yellow-500/40 dark:border-yellow-500/30";
                    glowStyle = "shadow-[0_8px_30px_rgb(234,179,8,0.1)]";
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-full relative bg-white dark:bg-zinc-900 border ${borderHighlight} ${glowStyle} rounded-[1.75rem] shadow-md overflow-hidden transition-all duration-300`}
                    >
                      {/* Heatmap Frosted Glass Badge */}
                      {showHeatmap && pageDuration > 0 && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3.5 py-1.5 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full shadow-lg text-[11px]">
                          <Fire className="w-3.5 h-3.5 text-yellow-500 shrink-0" weight="fill" />
                          <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Page {idx + 1}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          <span className={textColor}>{pageDuration}s engagement</span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${heatColor} ring-2 ring-white dark:ring-zinc-900`} />
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

        {/* Right Column: Apple-styled Drawer Sidebar (Comments & Heatmaps & Version History) */}
        <div
          className={`h-full border-l border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl flex flex-col transition-all duration-300 ease-out shadow-xl ${
            showComments ? "w-88 shrink-0" : "w-0 overflow-hidden pointer-events-none"
          }`}
        >
          {/* Apple Segmented Controls Bar */}
          <div className="p-3 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex p-1 bg-zinc-200/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-xl flex-1 border border-black/[0.04] dark:border-white/[0.04]">
              <button
                onClick={() => setActiveSidebarTab("comments")}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  activeSidebarTab === "comments"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveSidebarTab("heatmap")}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  activeSidebarTab === "heatmap"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Heatmap & History
              </button>
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          </div>

          {/* TAB A: COMMENTS */}
          {activeSidebarTab === "comments" ? (
            <>
              {/* Comments Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 thin-scrollbar">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-zinc-400">
                      <ChatCircleDots className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No Comments Yet</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[200px]">
                      Add contextual notes or investor messages linked to this document.
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
                        <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                          {isFounder ? "You" : comment.investor_id}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isFounder
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-black rounded-tr-xs shadow-xs"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-850 dark:text-zinc-200 rounded-tl-xs border border-black/[0.04] dark:border-white/[0.06]"
                          }`}
                        >
                          {comment.text}
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400/80">
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
                className="p-3.5 border-t border-black/[0.05] dark:border-white/[0.08] space-y-2.5 bg-zinc-50/50 dark:bg-zinc-900/30"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Recipient / Thread Context
                  </span>
                  <select
                    value={selectedCommentInvestor}
                    onChange={(e) => setSelectedCommentInvestor(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    <option value="general">General (Internal team note)</option>
                    {savedInvestors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        To: {inv.name} ({inv.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/30 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="p-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-black rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40 shrink-0 shadow-xs"
                  >
                    {submittingComment ? (
                      <CircleNotch className="w-4 h-4 animate-spin" />
                    ) : (
                      <PaperPlaneTilt className="w-4 h-4" weight="bold" />
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-yellow-500" weight="bold" /> Viewer Engagement History
                </span>
                
                {analyticsData?.viewerSummaries && analyticsData.viewerSummaries.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto thin-scrollbar">
                    {analyticsData.viewerSummaries.map((summary: any, idx: number) => (
                      <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/70 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl text-xs space-y-1">
                        <div className="flex justify-between items-center font-medium text-zinc-900 dark:text-zinc-100">
                          <span className="truncate max-w-[150px]">{summary.email}</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold font-mono text-[11px]">{summary.totalSeconds}s</span>
                        </div>
                        <span className="block text-[10px] text-zinc-400">Last View: {format(new Date(summary.lastViewed), "MMM d, h:mm a")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-center">
                    <p className="text-[11px] text-zinc-400">No viewer access logs recorded yet.</p>
                  </div>
                )}
              </div>

              {/* 2. Version history tracker */}
              <div className="space-y-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-yellow-500" weight="bold" /> Version History (v{documentVersions.length + 1})
                </span>

                {/* Upload version upgrade form */}
                <div className="p-3.5 bg-zinc-50/70 dark:bg-zinc-900/50 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl space-y-2.5">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wide">Upload New Revision</span>
                  <input
                    type="text"
                    placeholder="New Document URL (e.g. PDF link)"
                    value={newVersionUrl}
                    onChange={(e) => setNewVersionUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-850 border border-black/10 dark:border-white/10 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Change summary memo (e.g. Revised Section 4)"
                    value={newVersionMemo}
                    onChange={(e) => setNewVersionMemo(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-850 border border-black/10 dark:border-white/10 rounded-xl outline-none"
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
                        fetchStartupDocHistory();
                        window.location.href = `/dashboard/documents/view?url=${encodeURIComponent(newVersionUrl)}&name=${encodeURIComponent(name || "")}`;
                      } catch (err: any) {
                        toast.error(err.message || "Failed to save version.");
                      } finally {
                        setIsCommittingVersion(false);
                      }
                    }}
                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isCommittingVersion ? "Committing..." : "Commit Version Upgrade"}
                  </button>
                </div>

                {/* Versions list */}
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">v{documentVersions.length + 1} (Current Active)</span>
                      <span className="block text-[10px] text-zinc-400">Live preview version</span>
                    </div>
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold rounded-md">Live</span>
                  </div>
                  {[...documentVersions].reverse().map((v: any, vIdx: number) => (
                    <div key={vIdx} className="p-3 bg-white dark:bg-zinc-900 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">v{v.version_number}</span>
                        <a href={v.url} target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline text-[11px] font-medium">View File</a>
                      </div>
                      <span className="block text-zinc-500 dark:text-zinc-400">"{v.change_summary}"</span>
                      <span className="block text-zinc-400 text-[10px]">Uploaded on {format(new Date(v.created_at), "MMM d, yyyy")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Contract redlines and revisions */}
              <div className="space-y-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Fire className="w-4 h-4 text-yellow-500" weight="bold" /> Contract Redlining Logs ({documentRedlines.length})
                </span>

                {/* Add redline comment form */}
                <div className="p-3.5 bg-zinc-50/70 dark:bg-zinc-900/50 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl space-y-2.5">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wide">Add Redline Revision</span>
                  <input
                    type="text"
                    placeholder="Section/Clause (e.g. Clause 4.2)"
                    value={redlineSection}
                    onChange={(e) => setRedlineSection(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-850 border border-black/10 dark:border-white/10 rounded-xl outline-none"
                  />
                  <textarea
                    placeholder="Revision requested note..."
                    value={redlineComment}
                    onChange={(e) => setRedlineComment(e.target.value)}
                    className="w-full h-14 text-xs p-2.5 bg-white dark:bg-zinc-850 border border-black/10 dark:border-white/10 rounded-xl outline-none resize-none"
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
                    className="w-full py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-black text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isPostingRedline ? "Posting..." : "Register Redline Comment"}
                  </button>
                </div>

                {/* Redlines log list */}
                <div className="space-y-2">
                  {[...documentRedlines].reverse().map((red: any, rIdx: number) => (
                    <div key={rIdx} className="p-3.5 bg-white dark:bg-zinc-900 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl text-xs space-y-1.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {red.section} (v{red.version_number})
                        </span>
                        <span className="text-[10px] text-zinc-400">{format(new Date(red.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">"{red.comment}"</p>
                      <span className="block text-[10px] text-zinc-400 italic text-right font-medium">By {red.author}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Share Document</h4>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-black/5 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{name || "Document"}</p>
                <span className="text-[10px] font-mono text-zinc-400">PDF Document</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Select Matched Investor</label>
                {savedInvestors.length === 0 ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    No shortlisted investors. Shortlist investors in the Database first to send direct updates.
                  </div>
                ) : (
                  <select
                    value={selectedInvestorId}
                    onChange={(e) => setSelectedInvestorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-yellow-500/30 outline-none dark:text-white"
                  >
                    <option value="">-- Choose an Investor --</option>
                    {savedInvestors.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Message Memo</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="e.g. Hello, please find our deck attached..."
                  className="w-full h-24 p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-yellow-500/30 outline-none resize-none dark:text-white leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleShareSubmit}
              disabled={sharing || !selectedInvestorId || !shareMessage}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm shadow-yellow-500/20"
            >
              {sharing ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" weight="bold" />}
              <span>Send Document Memo</span>
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
