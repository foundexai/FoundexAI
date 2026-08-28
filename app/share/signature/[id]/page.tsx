"use client";

import React, { useEffect, useState, use } from "react";
import {
  FileText,
  CircleNotch,
  CheckCircle,
  Clock,
  Signature,
  DownloadSimple,
  WarningCircle,
  ShieldCheck,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import ESignModal from "@/components/dashboard/ESignModal";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicSigningPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  
  // Verification states
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Sign states
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingSigner, setSigningSigner] = useState<any>(null);

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`/api/documents/signatures/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load request");
      setRequest(data.signatureRequest);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load signature request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleEmailVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setIsVerifyingEmail(true);
    const cleanEmail = emailInput.toLowerCase().trim();
    const matched = request.signers.find((s: any) => s.email.toLowerCase() === cleanEmail);

    if (matched) {
      setVerifiedEmail(cleanEmail);
      setSigningSigner(matched);
      toast.success(`Welcome back, ${matched.name || cleanEmail.split("@")[0]}! Access granted.`);
    } else {
      toast.error("Your email is not listed as a signer on this document.");
    }
    setIsVerifyingEmail(false);
  };

  const handleSignSubmit = async (signatureType: "drawn" | "typed", signatureData: string) => {
    try {
      const res = await fetch(`/api/documents/signatures/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifiedEmail,
          signature_type: signatureType,
          signature_data: signatureData,
          signer_name: signingSigner?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit signature");

      toast.success("Document signed successfully!");
      fetchRequestDetails(); // Refresh status
      
      // Update local signer status
      const updatedSigner = data.signatureRequest?.signers.find(
        (s: any) => s.email.toLowerCase() === verifiedEmail.toLowerCase()
      );
      if (updatedSigner) {
        setSigningSigner(updatedSigner);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save signature.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
        <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" />
        <span className="mt-4 text-xs font-black uppercase tracking-wider text-gray-500">Loading escrows...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4 text-center space-y-4">
        <WarningCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">Request Not Found</h2>
        <p className="text-xs text-gray-500 max-w-sm">This signature request links may have expired, been cancelled, or the ID is invalid.</p>
      </div>
    );
  }

  const isCompleted = request.status === "completed";

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-black flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <Signature className="w-5 h-5" weight="bold" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[280px] md:max-w-md">
                {request.doc_name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-zinc-400">Cryptographic Signing Protocol</span>
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className={`text-[10px] px-2 py-0.2 rounded-md font-semibold ${
                  isCompleted
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCompleted && (
              <a
                href={request.signed_doc_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-xl shadow-sm shadow-yellow-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                <span>Download Certified PDF</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="max-w-7xl mx-auto w-full grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 lg:p-8">
        {/* PDF Document Iframe Preview (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] rounded-[2rem] overflow-hidden min-h-[500px] lg:h-[calc(100vh-140px)] shadow-lg shadow-black/[0.02]">
          <div className="bg-zinc-50/50 dark:bg-zinc-950/40 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.08] flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-yellow-500" />
              Document Preview
            </span>
          </div>
          <iframe
            src={isCompleted ? request.signed_doc_url : request.doc_url}
            className="w-full grow border-none bg-zinc-100 dark:bg-zinc-950"
            title="PDF Document Viewer"
          />
        </div>

        {/* Sidebar Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Verified Identity Sign Gate */}
          <div className="bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] rounded-[2rem] p-6 shadow-lg shadow-black/[0.02] space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">1. Signer Verification</h3>

            {!verifiedEmail ? (
              <form onSubmit={handleEmailVerification} className="space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Enter your email address to unlock your dedicated signature pad:
                </p>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-yellow-500/30 outline-none dark:text-white"
                    placeholder="name@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifyingEmail}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isVerifyingEmail ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Verify Identity"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" weight="bold" />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Authorized Signer</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{verifiedEmail}</p>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-center space-y-1">
                    <CheckCircle className="w-6 h-6 mx-auto text-emerald-500" weight="fill" />
                    <p className="text-xs font-semibold">Signing Fully Completed</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">All parties have signed and certified this agreement.</p>
                  </div>
                ) : signingSigner?.status === "signed" ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-center space-y-1">
                    <CheckCircle className="w-6 h-6 mx-auto text-emerald-500" weight="fill" />
                    <p className="text-xs font-semibold">Signature Recorded</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Awaiting remaining participants to finish signing.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSignModalOpen(true)}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-xl shadow-sm shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Signature className="w-4 h-4" weight="bold" />
                    Sign This Document
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. List of Signers Status */}
          <div className="bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] rounded-[2rem] p-6 shadow-lg shadow-black/[0.02] space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">2. Participant Tracker</h3>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {request.signers.map((s: any) => (
                <div key={s.email} className="py-3 flex justify-between items-center gap-3">
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{s.name || s.email.split("@")[0]}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{s.email}</p>
                  </div>

                  {s.status === "signed" ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded-md flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" weight="bold" /> Signed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse" /> Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Signature drawing modal */}
      {isSignModalOpen && (
        <ESignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          signerEmail={verifiedEmail}
          signerName={signingSigner?.name || ""}
          onSignSubmit={handleSignSubmit}
        />
      )}
    </div>
  );
}
