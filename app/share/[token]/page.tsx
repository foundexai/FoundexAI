"use client";

import { useEffect, useState, use } from "react";
import {
  ShieldCheck,
  LockKey,
  EnvelopeSimple,
  CircleNotch,
  FileText,
  DownloadSimple,
  WarningCircle,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function SecureSharePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const shareToken = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [linkInfo, setLinkInfo] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Access Gate States
  const [isVerified, setIsVerified] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Verified Payload Content & Watermark
  const [docContent, setDocContent] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  // 1. Initial Link Metadata Check
  useEffect(() => {
    async function checkLink() {
      try {
        const res = await fetch(`/api/documents/share/${shareToken}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorStatus(data.status || "error");
          setErrorMessage(data.error || "Unable to access document");
          setLoading(false);
          return;
        }

        setLinkInfo(data);
        if (!data.requiresGate) {
          // Public link -> verify automatically to load content & watermark
          autoVerifyPublic();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setErrorStatus("error");
        setErrorMessage("Network error accessing secure link");
        setLoading(false);
      }
    }
    checkLink();
  }, [shareToken]);

  // Auto-verify public links
  const autoVerifyPublic = async () => {
    try {
      const res = await fetch(`/api/documents/share/${shareToken}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "Public Viewer" }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocContent(data);
        setIsVerified(true);
      } else {
        setErrorStatus("error");
        setErrorMessage(data.error || "Failed to load document");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP Code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch(`/api/documents/share/${shareToken}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");

      setOtpSent(true);
      toast.success(data.message || "Code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // 3. Submit Passcode or OTP for Verification
  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const res = await fetch(`/api/documents/share/${shareToken}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, email, otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Access verification failed");

      setDocContent(data);
      setIsVerified(true);
      toast.success("Access Granted!");
    } catch (err: any) {
      toast.error(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  // 3.5. Page visibility tracking with IntersectionObserver & 5s Heartbeat loops
  useEffect(() => {
    if (!isVerified || pdfPages.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute("data-page-index") || "0", 10);
          setActivePageIndex(index);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll("[data-page-index]");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isVerified, pdfPages]);

  useEffect(() => {
    if (!isVerified || pdfPages.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const viewerEmail = email || "Public Viewer";
        await fetch(`/api/documents/share/${shareToken}/heatmap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: viewerEmail,
            pageIndex: activePageIndex,
            durationSeconds: 5,
          }),
        });
      } catch (err) {
        console.error("Failed to send heatmap heartbeat:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isVerified, pdfPages, activePageIndex, email, shareToken]);

  // 4. Dynamic PDF.js rendering to canvas to support overlay watermarks
  useEffect(() => {
    if (!isVerified || !docContent?.docUrl) return;

    const isPdf = !docContent.docUrl.endsWith(".txt") && !docContent.docUrl.endsWith(".md");
    if (!isPdf) return;

    setPdfLoading(true);

    const loadAndRenderPdf = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          // If script not loaded yet, retry shortly
          setTimeout(loadAndRenderPdf, 200);
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        
        const loadingTask = pdfjsLib.getDocument(docContent.docUrl);
        const pdf = await loadingTask.promise;
        const pageImages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
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
    const scriptId = "pdfjs-cdn-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      script.onload = () => {
        loadAndRenderPdf();
      };
      document.body.appendChild(script);
    } else {
      loadAndRenderPdf();
    }
  }, [isVerified, docContent]);

  // Prevent Context Menu & Keyboard Print Shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s")) {
        e.preventDefault();
        toast.error("Printing and saving are disabled on this protected document.");
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <CircleNotch className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-zinc-400">Verifying secure connection...</p>
      </div>
    );
  }

  // Error / Expired / Revoked Screen
  if (errorStatus) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 bg-red-900/30 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-800/50">
          <WarningCircle className="w-8 h-8" weight="bold" />
        </div>
        <h2 className="text-2xl font-black mb-2">Access Blocked</h2>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
          {errorMessage || "You do not have permission to view this document."}
        </p>
        <span className="text-xs text-zinc-500 font-mono">Token: {shareToken}</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col selection:bg-none select-none overflow-hidden font-sans">
      {/* Top Header with Translucent Material */}
      <header className="backdrop-blur-xl bg-zinc-900/80 border-b border-white/[0.08] px-6 py-3.5 flex items-center justify-between z-20 sticky top-0 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-500 text-black flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-yellow-500/20">
            <ShieldCheck className="w-5 h-5" weight="bold" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              {linkInfo?.docName || "Protected Document"}
            </h1>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
              <LockKey className="w-3 h-3 text-yellow-500" weight="bold" /> Protected Deal Room Asset
            </span>
          </div>
        </div>

        {isVerified && docContent && (
          <div className="flex items-center gap-3">
            {/* Floating Zoom Controls Pill */}
            <div className="flex items-center bg-zinc-800/80 border border-white/10 rounded-xl px-2 py-1 backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 transition-all active:scale-95 cursor-pointer"
                title="Zoom Out"
              >
                <MagnifyingGlassMinus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-semibold px-2 text-zinc-200">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 transition-all active:scale-95 cursor-pointer"
                title="Zoom In"
              >
                <MagnifyingGlassPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Direct Download */}
            {docContent.allowDownload && (
              <a
                href={docContent.docUrl}
                download
                target="_blank"
                className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-yellow-500/20"
              >
                <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                <span>Download</span>
              </a>
            )}
          </div>
        )}
      </header>

      {/* Main Body: Access Gate OR Protected Document Viewer */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!isVerified ? (
          /* ================= ACCESS GATE SCREEN ================= */
          <div className="grow flex items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="bg-zinc-900/80 border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 backdrop-blur-2xl">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  {linkInfo?.accessType === "passcode" ? (
                    <LockKey className="w-7 h-7" weight="bold" />
                  ) : (
                    <EnvelopeSimple className="w-7 h-7" weight="bold" />
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Security Verification Gate</h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  This document is encrypted under role-based confidentiality. Verify your identity to unlock access.
                </p>
              </div>

              {/* Form A: Passcode Protected */}
              {linkInfo?.accessType === "passcode" && (
                <form onSubmit={handleVerifyAccess} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Security Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="Enter Passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/80 border border-white/10 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 focus:outline-none text-white text-center tracking-widest"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifying || !passcode}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm shadow-yellow-500/20"
                  >
                    {verifying ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" weight="bold" />}
                    <span>Unlock & View Document</span>
                  </button>
                </form>
              )}

              {/* Form B: Email OTP Restricted */}
              {linkInfo?.accessType === "email_otp" && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Authorized Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. partner@sequoiacap.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800/80 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 focus:outline-none text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingOtp || !email}
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm shadow-yellow-500/20"
                      >
                        {sendingOtp ? <CircleNotch className="w-4 h-4 animate-spin" /> : <EnvelopeSimple className="w-4 h-4" weight="bold" />}
                        <span>Send 6-Digit Passcode</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyAccess} className="space-y-4">
                      <div className="bg-zinc-800/60 p-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-xs text-zinc-300">
                          Verification code sent to <span className="font-semibold text-yellow-400">{email}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 underline mt-1 cursor-pointer transition-colors"
                        >
                          Use a different email
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800/80 border border-white/10 rounded-2xl text-lg font-mono font-bold focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 focus:outline-none text-white text-center tracking-[0.4em]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifying || otpCode.length < 6}
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm shadow-yellow-500/20"
                      >
                        {verifying ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" weight="bold" />}
                        <span>Verify & Unlock</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= PROTECTED DOCUMENT VIEWER + WATERMARK ================= */
          <div className="grow flex flex-col relative overflow-hidden bg-zinc-950 items-center justify-center">
            
            {/* 45-Degree Dynamic Tiled Watermark Overlay */}
            {docContent?.watermarkEnabled && (
              <div
                className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex flex-wrap content-start justify-around gap-x-24 gap-y-20 p-10 select-none"
                style={{
                  opacity: (docContent.watermarkOpacity || 0.18) * 4,
                  mixBlendMode: "multiply",
                }}
              >
                {Array.from({ length: 48 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="transform -rotate-45 font-mono font-extrabold text-xs md:text-sm tracking-widest whitespace-nowrap"
                    style={{ color: "#1a1a1a" }}
                  >
                    {docContent.watermarkText}
                  </div>
                ))}
              </div>
            )}

            {/* Document Content Frame */}
            <div
              className="w-full h-full grow flex flex-col items-center overflow-y-auto transition-all p-4 thin-scrollbar"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center text-zinc-400 p-12 my-auto gap-3">
                  <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" />
                  <p className="text-xs font-semibold text-zinc-300">Rendering secure vector document pages...</p>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="flex flex-col gap-6 items-center w-full max-w-3xl py-6 select-none pointer-events-none">
                  {pdfPages.map((pageUrl, idx) => (
                    <div
                      key={idx}
                      data-page-index={idx}
                      className="w-full relative shadow-2xl rounded-2xl overflow-hidden border border-white/10"
                    >
                      <img
                        src={pageUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                  ))}
                </div>
              ) : docContent?.docUrl?.endsWith(".txt") || docContent?.docUrl?.endsWith(".md") ? (
                <div className="bg-zinc-900/90 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/10 max-w-4xl w-full min-h-[600px] shadow-2xl text-zinc-200 font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {docContent.docUrl}
                </div>
              ) : (
                <iframe
                  src={docContent?.docUrl}
                  className="w-full h-full border-none rounded-2xl bg-zinc-950"
                  title="Protected Document Viewer"
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
