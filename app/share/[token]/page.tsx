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
    <div className="h-screen bg-zinc-950 text-white flex flex-col selection:bg-none select-none overflow-hidden">
      {/* Top Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between z-20 sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 text-black flex items-center justify-center font-black text-sm shrink-0">
            <ShieldCheck className="w-5 h-5" weight="bold" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {linkInfo?.docName || "Protected Document"}
            </h1>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
              <LockKey className="w-3 h-3 text-yellow-500" /> End-to-End Dynamic Watermarking Active
            </span>
          </div>
        </div>

        {isVerified && docContent && (
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                title="Zoom Out"
              >
                <MagnifyingGlassMinus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-zinc-300">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                title="Zoom In"
              >
                <MagnifyingGlassPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Direct Download */}
            {docContent.allowDownload && (
              <a
                href={docContent.docUrl}
                download
                target="_blank"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <DownloadSimple className="w-4 h-4" weight="bold" />
                Download Original
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
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 backdrop-blur-md">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  {linkInfo?.accessType === "passcode" ? (
                    <LockKey className="w-7 h-7" weight="bold" />
                  ) : (
                    <EnvelopeSimple className="w-7 h-7" weight="bold" />
                  )}
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">Security Access Gate</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  This document is protected. Verification is required before viewing.
                </p>
              </div>

              {/* Form A: Passcode Protected */}
              {linkInfo?.accessType === "passcode" && (
                <form onSubmit={handleVerifyAccess} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Enter Security Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="Enter PIN / Passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white text-center tracking-widest"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifying || !passcode}
                    className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Verify & Unlock Document
                  </button>
                </form>
              )}

              {/* Form B: Email OTP Restricted */}
              {linkInfo?.accessType === "email_otp" && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Work Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. partner@sequoiacap.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingOtp || !email}
                        className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {sendingOtp ? <CircleNotch className="w-4 h-4 animate-spin" /> : <EnvelopeSimple className="w-4 h-4" />}
                        Send 6-Digit Verification Code
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyAccess} className="space-y-4">
                      <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60 text-center">
                        <p className="text-xs text-zinc-300">
                          Code sent to <span className="font-bold text-yellow-400">{email}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[10px] text-zinc-500 hover:underline mt-1 cursor-pointer"
                        >
                          Change Email Address
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-lg font-mono font-bold focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white text-center tracking-[0.5em]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifying || otpCode.length < 6}
                        className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {verifying ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Verify & Access Document
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= PROTECTED DOCUMENT VIEWER + WATERMARK ================= */
          <div className="grow flex flex-col relative overflow-hidden bg-zinc-900 items-center justify-center">
            
            {/* 45-Degree Dynamic Tiled Watermark Overlay — fixed so it layers above the scrollable PDF canvas */}
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
              className="w-full h-full grow flex flex-col items-center overflow-y-auto transition-all p-4"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center text-zinc-400 p-12 my-auto">
                  <CircleNotch className="w-8 h-8 animate-spin text-yellow-500 mb-3" />
                  <p className="text-xs font-bold">Rendering high-resolution document pages...</p>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="flex flex-col gap-6 items-center w-full max-w-3xl py-6 select-none pointer-events-none">
                  {pdfPages.map((pageUrl, idx) => (
                    <img
                      key={idx}
                      src={pageUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full shadow-2xl border border-zinc-800 rounded-xl"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ))}
                </div>
              ) : docContent?.docUrl?.endsWith(".txt") || docContent?.docUrl?.endsWith(".md") ? (
                <div className="bg-zinc-950 p-8 md:p-12 rounded-2xl border border-zinc-800 max-w-4xl w-full min-h-[600px] shadow-2xl text-zinc-200 font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {docContent.docUrl}
                </div>
              ) : (
                <iframe
                  src={docContent?.docUrl}
                  className="w-full h-full border-none rounded-xl bg-zinc-950"
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
