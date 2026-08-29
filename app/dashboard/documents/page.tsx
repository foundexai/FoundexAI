"use client";
 
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  CaretLeft,
  FileText,
  Plus,
  MagnifyingGlass,
  CircleNotch,
  Calendar,
  Clock,
  PaperPlaneTilt,
  X,
  ShieldCheck,
  LockKey,
  Eye,
  Trash,
  Copy,
  Check,
  Globe,
  EnvelopeSimple,
  Sliders,
  Signature,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import CreateSecureLinkModal from "@/components/dashboard/CreateSecureLinkModal";
import InvestorUpdatesSection from "@/components/dashboard/InvestorUpdatesSection";

interface Document {
  name: string;
  type: string;
  url: string;
  date: string;
  _id?: string;
}

interface SecureLinkItem {
  id: string;
  token: string;
  url: string;
  docName: string;
  docUrl: string;
  docType: string;
  accessType: string;
  viewCount: number;
  maxViews?: number;
  expiresAt?: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkStyle: string;
  isRevoked: boolean;
  accessLogs: Array<{
    email: string;
    ip: string;
    userAgent: string;
    viewedAt: string;
  }>;
  createdAt: string;
}

function DocumentsPageContent() {
  const { token, activeStartupId } = useAuth();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState<"documents" | "investor_updates" | "secure_links" | "signatures">(
    initialTabParam === "updates" || initialTabParam === "investor_updates"
      ? "investor_updates"
      : "documents"
  );

  // Secure Links State
  const [secureLinks, setSecureLinks] = useState<SecureLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // E-Signature State
  const [sentSignRequests, setSentSignRequests] = useState<any[]>([]);
  const [receivedSignRequests, setReceivedSignRequests] = useState<any[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [isSignRequestModalOpen, setIsSignRequestModalOpen] = useState(false);

  // Modal States
  const [selectedDocForSecureLink, setSelectedDocForSecureLink] = useState<Document | null>(null);
  const [isSecureLinkModalOpen, setIsSecureLinkModalOpen] = useState(false);

  // E-Signature Create Request States
  const [selectedDocForSign, setSelectedDocForSign] = useState("");
  const [signersInput, setSignersInput] = useState<Array<{ email: string; name: string; role: string }>>([
    { email: "", name: "", role: "investor" },
  ]);
  const [requireNdaForSign, setRequireNdaForSign] = useState(false);
  const [ndaTextForSign, setNdaTextForSign] = useState(
    "MUTUAL NON-DISCLOSURE AGREEMENT\n\nBy signing below, the recipient agrees that all investor updates, pitches, and financial charts are considered confidential."
  );
  const [isSubmittingSignRequest, setIsSubmittingSignRequest] = useState(false);

  // Global Watermark Defaults Modal State
  const [isWatermarkDefaultsOpen, setIsWatermarkDefaultsOpen] = useState(false);
  const [defaultWatermarkText, setDefaultWatermarkText] = useState("CONFIDENTIAL • {email} • {date}");

  // Standard Share Modal States
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch Documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/startups", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (data.startups && data.startups.length > 0) {
          const activeId = activeStartupId || localStorage.getItem("activeStartupId");
          const currentStartup = data.startups.find((s: any) => s._id === activeId) || data.startups[0];
          setDocuments(currentStartup.documents || []);
        }
      } catch (error) {
        console.error("Failed to fetch docs", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDocs();
  }, [token, activeStartupId]);

  // Fetch Secure Links
  const fetchSecureLinks = async () => {
    if (!token) return;
    setLoadingLinks(true);
    try {
      const res = await fetch("/api/documents/secure-link", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSecureLinks(data.links || []);
      }
    } catch (err) {
      console.error("Failed to fetch secure links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === "secure_links") {
      fetchSecureLinks();
    }
  }, [token, activeTab]);

  // Fetch Signature Requests
  const fetchSignRequests = async () => {
    if (!token) return;
    setLoadingSignatures(true);
    try {
      const res = await fetch("/api/documents/signatures", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSentSignRequests(data.sentRequests || []);
        setReceivedSignRequests(data.receivedRequests || []);
      }
    } catch (err) {
      console.error("Failed to fetch signature requests:", err);
    } finally {
      setLoadingSignatures(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === "signatures") {
      fetchSignRequests();
    }
  }, [token, activeTab]);

  // Load saved investors for selection
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

  // Revoke Secure Link
  const handleRevokeLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/documents/secure-link?id=${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Secure link revoked!");
        fetchSecureLinks();
      }
    } catch (err) {
      toast.error("Failed to revoke link");
    }
  };

  const copySecureUrl = (shareToken: string) => {
    const fullUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(shareToken);
    toast.success("Protected Link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleShareSubmit = async () => {
    if (!selectedDoc || !selectedInvestorId || !shareMessage) return;
    setSharing(true);
    const investor = savedInvestors.find((inv) => inv.id === selectedInvestorId);
    const investorName = investor ? investor.name : "Selected Investor";

    try {
      const res = await fetch("/api/documents/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          docName: selectedDoc.name,
          docUrl: selectedDoc.url,
          investorName: investorName,
          investorId: selectedInvestorId,
          message: shareMessage,
        }),
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

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between dark:bg-zinc-900 dark:border-zinc-800 gap-4 rounded-3xl">
        <div className="flex items-start gap-3 w-full md:w-auto">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors dark:hover:bg-zinc-800 shrink-0 mt-0.5"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Document Control & Security
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Manage pitch decks, generate secure links, and track viewer analytics.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setIsWatermarkDefaultsOpen(true)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60 rounded-xl text-xs font-bold hover:bg-yellow-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Watermark Defaults</span>
          </button>

          <button
            onClick={() => setIsSignRequestModalOpen(true)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60 rounded-xl text-xs font-bold hover:bg-yellow-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Signature className="w-4 h-4" />
            <span>Request E-Signature</span>
          </button>

          <Link
            href="/dashboard/documents/new"
            className="w-full sm:w-auto px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Apple Segmented Navigation Bar */}
        <div className="p-1.5 bg-zinc-200/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-black/[0.04] dark:border-white/[0.04] mb-8 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "documents"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("investor_updates")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "investor_updates"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <EnvelopeSimple className="w-4 h-4 text-yellow-500" />
            <span>Investor Updates</span>
          </button>
          <button
            onClick={() => setActiveTab("secure_links")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "secure_links"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-yellow-500" />
            <span>Secure Links ({secureLinks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("signatures")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "signatures"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Signature className="w-4 h-4 text-yellow-500" />
            <span>E-Signatures ({sentSignRequests.length + receivedSignRequests.length})</span>
          </button>
        </div>

        {/* TAB 1: ALL DOCUMENTS */}
        {activeTab === "documents" && (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
              <div className="relative w-full md:w-96">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" weight="bold" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                {["all", "deck", "financials", "legal", "memo", "other"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap border transition-all ${
                      filterType === type
                        ? "bg-black text-white border-black dark:bg-white dark:text-black"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
              </div>
            ) : filteredDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="group bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E5C158]/10 text-[#E5C158] border border-[#E5C158]/20">
                          <FileText className="w-6 h-6" weight="bold" />
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-widest bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-700/60 uppercase">
                          {doc.type}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-gray-900 dark:text-white mb-1.5 text-base line-clamp-2 leading-snug">
                        {doc.name}
                      </h3>

                      <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono mb-4 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {doc.date ? format(new Date(doc.date), "MMM d, yyyy") : "Recently Uploaded"}
                      </p>
                    </div>

                    {/* High-Contrast Action Buttons */}
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          setSelectedDocForSecureLink(doc);
                          setIsSecureLinkModalOpen(true);
                        }}
                        className="w-full py-2.5 px-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#E5C158] border border-yellow-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-4 h-4" weight="bold" />
                        Secure Link
                      </button>

                      <Link
                        href={`/dashboard/documents/view?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name)}&type=${doc.type}`}
                        className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs"
                      >
                        <Eye className="w-4 h-4" weight="bold" />
                        View Deck
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">No documents found</h3>
                <p className="text-gray-500 text-xs mb-4">Upload a deck to generate secure links.</p>
              </div>
            )}
          </>
        )}

        {/* TAB 2: INVESTOR UPDATES */}
        {activeTab === "investor_updates" && (
          <InvestorUpdatesSection />
        )}

        {/* TAB 2: SECURE LINKS & AUDIT LOGS */}
        {activeTab === "secure_links" && (
          <div className="space-y-6">
            {loadingLinks ? (
              <div className="flex items-center justify-center h-64">
                <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
              </div>
            ) : secureLinks.length > 0 ? (
              <div className="space-y-4">
                {secureLinks.map((linkItem) => (
                  <div
                    key={linkItem.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm space-y-4 transition-all ${
                      linkItem.isRevoked
                        ? "border-red-200 dark:border-red-900/40 opacity-60"
                        : "border-gray-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold shrink-0">
                          <ShieldCheck className="w-5 h-5" weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                              {linkItem.docName}
                            </h4>
                            {linkItem.isRevoked && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-[10px] font-bold rounded-md uppercase">
                                Access Revoked
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-mono">/share/{linkItem.token}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => copySecureUrl(linkItem.token)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedToken === linkItem.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          {copiedToken === linkItem.token ? "Copied" : "Copy Link"}
                        </button>

                        {!linkItem.isRevoked && (
                          <button
                            onClick={() => handleRevokeLink(linkItem.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash className="w-4 h-4" /> Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Controls Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl text-xs">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Access Gate</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                          {linkItem.accessType.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Total Views</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {linkItem.viewCount} {linkItem.maxViews ? `/ ${linkItem.maxViews}` : "views"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Expiration</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {linkItem.expiresAt ? format(new Date(linkItem.expiresAt), "MMM d, h:mm a") : "Never"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Watermarking</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {linkItem.watermarkEnabled ? "Active (Dynamic)" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    {/* Viewer Audit Logs Dropdown */}
                    {linkItem.accessLogs && linkItem.accessLogs.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                          Viewer Access Audit History ({linkItem.accessLogs.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {linkItem.accessLogs.map((log, lIdx) => (
                            <div
                              key={lIdx}
                              className="flex items-center justify-between text-[11px] p-2 bg-gray-50 dark:bg-zinc-800/60 rounded-xl"
                            >
                              <div className="flex items-center gap-2">
                                <EnvelopeSimple className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="font-bold text-gray-800 dark:text-gray-200">{log.email}</span>
                                <span className="text-gray-400 font-mono text-[10px]">({log.ip})</span>
                              </div>
                              <span className="text-gray-400 text-[10px]">
                                {format(new Date(log.viewedAt), "MMM d, yyyy • h:mm a")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No viewer access logs recorded yet.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <ShieldCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">No Secure Links Generated</h3>
                <p className="text-gray-500 text-xs mb-4">Click "Secure Link" on any pitch deck to generate a protected share link.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: E-SIGNATURE REQUESTS */}
        {activeTab === "signatures" && (
          <div className="space-y-6">
            {/* Received requests list */}
            {receivedSignRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Pending Actions (Sign Requests For You)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receivedSignRequests.map((req) => {
                    const mySigner = req.signers.find((s: any) => s.email.toLowerCase() === useAuth().user?.email?.toLowerCase());
                    const isSigned = mySigner?.status === "signed";
                    return (
                      <div key={req._id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-5 flex justify-between items-center gap-4 shadow-xs">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{req.doc_name}</p>
                          <p className="text-[10px] text-gray-400">Created: {format(new Date(req.created_at), "MMM d, yyyy")}</p>
                        </div>
                        {isSigned ? (
                          <span className="px-3 py-1.5 bg-green-500/10 text-green-700 text-xs font-bold rounded-xl flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Signed
                          </span>
                        ) : (
                          <a
                            href={`/share/signature/${req._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Sign Now
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outbound requests sent by the founder */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Sent Signature Requests ({sentSignRequests.length})</h3>
                <button
                  onClick={() => setIsSignRequestModalOpen(true)}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  New Request
                </button>
              </div>

              {loadingSignatures ? (
                <div className="flex items-center justify-center h-48">
                  <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
                </div>
              ) : sentSignRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentSignRequests.map((req) => (
                    <div key={req._id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-xs space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                            <Signature className="w-5 h-5" weight="bold" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">{req.doc_name}</h4>
                            <span className="text-[10px] text-gray-400 font-medium">Created: {format(new Date(req.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/share/signature/${req._id}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast.success("Signing URL copied to clipboard!");
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Sign Link
                          </button>

                          {req.status === "completed" && (
                            <a
                              href={req.signed_doc_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Signed PDF
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Signers Tracker */}
                      <div className="border-t border-gray-100 dark:border-zinc-800 pt-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Signers Status</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {req.signers.map((signer: any) => (
                            <div key={signer.email} className="p-2.5 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                              <div className="truncate pr-2">
                                <p className="font-bold text-gray-800 dark:text-zinc-200 truncate">{signer.name || signer.email.split("@")[0]}</p>
                                <p className="text-[9px] text-gray-400 truncate">{signer.email}</p>
                              </div>
                              {signer.status === "signed" ? (
                                <span className="text-[10px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded">Signed</span>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">Pending</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-zinc-900 dark:border-zinc-805">
                  <Signature className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-gray-900 mb-1 dark:text-white">No Outbound Signature Requests</h4>
                  <p className="text-gray-450 text-xs mb-4">You have not initiated any document signature contracts.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. Create Secure Link Modal */}
      {isSecureLinkModalOpen && selectedDocForSecureLink && (
        <CreateSecureLinkModal
          document={selectedDocForSecureLink}
          onClose={() => {
            setIsSecureLinkModalOpen(false);
            setSelectedDocForSecureLink(null);
          }}
          onSuccess={() => {
            fetchSecureLinks();
          }}
        />
      )}

      {/* 2. Global Watermark Defaults Modal */}
      {isWatermarkDefaultsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-yellow-500" /> Default Watermark Settings
              </h4>
              <button
                onClick={() => setIsWatermarkDefaultsOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Set the default corporate watermark template pre-filled whenever you create new secure share links.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Default Watermark Text Template
              </label>
              <input
                type="text"
                value={defaultWatermarkText}
                onChange={(e) => setDefaultWatermarkText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white focus:outline-none"
              />
              <div className="flex gap-1 mt-2">
                {["{email}", "{date}"].map((tag) => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                toast.success("Global Watermark Defaults Saved!");
                setIsWatermarkDefaultsOpen(false);
              }}
              className="w-full py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-xl hover:bg-gray-800 cursor-pointer"
            >
              Save Default Template
            </button>
          </div>
        </div>
      )}

      {/* 3. Create E-Signature Request Modal */}
      {isSignRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250/80 dark:border-zinc-800 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Signature className="w-5 h-5 text-yellow-500" /> Request E-Signatures
              </h4>
              <button
                onClick={() => {
                  setIsSignRequestModalOpen(false);
                  setSignersInput([{ email: "", name: "", role: "investor" }]);
                  setSelectedDocForSign("");
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Send a signature request to multiple parties. Once all parties sign, a certified PDF will be compiled.
            </p>

            <div className="space-y-4">
              {/* Select document */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Select Pitch Deck / Document</label>
                <select
                  value={selectedDocForSign}
                  onChange={(e) => setSelectedDocForSign(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                >
                  <option value="">-- Choose a Document --</option>
                  {documents.map((doc, idx) => (
                    <option key={doc._id || idx} value={doc.url}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signers list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Signers ({signersInput.length})</label>
                  <button
                    type="button"
                    onClick={() => setSignersInput([...signersInput, { email: "", name: "", role: "investor" }])}
                    className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 cursor-pointer"
                  >
                    + Add Signer
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {signersInput.map((signer, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50/50 dark:bg-black/20 border border-gray-150 dark:border-zinc-800 rounded-2xl space-y-2.5 relative">
                      {signersInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSignersInput(signersInput.filter((_, i) => i !== idx))}
                          className="absolute top-2.5 right-2.5 text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                          <input
                            type="email"
                            value={signer.email}
                            onChange={(e) => {
                              const copy = [...signersInput];
                              copy[idx].email = e.target.value;
                              setSignersInput(copy);
                            }}
                            placeholder="signer@company.com"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Name</label>
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => {
                              const copy = [...signersInput];
                              copy[idx].name = e.target.value;
                              setSignersInput(copy);
                            }}
                            placeholder="Full Name"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</label>
                        <select
                          value={signer.role}
                          onChange={(e) => {
                            const copy = [...signersInput];
                            copy[idx].role = e.target.value;
                            setSignersInput(copy);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none dark:text-white"
                        >
                          <option value="investor">Investor</option>
                          <option value="founder">Founder</option>
                          <option value="counsel">Counsel</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Require NDA */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requireNdaForSign"
                  checked={requireNdaForSign}
                  onChange={(e) => setRequireNdaForSign(e.target.checked)}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <label htmlFor="requireNdaForSign" className="text-xs font-bold text-gray-700 dark:text-zinc-300 select-none">
                  Require Mutual NDA signing prior to execution
                </label>
              </div>

              {requireNdaForSign && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">NDA Terms / Text</label>
                  <textarea
                    value={ndaTextForSign}
                    onChange={(e) => setNdaTextForSign(e.target.value)}
                    className="w-full h-20 p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none dark:text-white resize-none"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignRequestModalOpen(false);
                  setSignersInput([{ email: "", name: "", role: "investor" }]);
                  setSelectedDocForSign("");
                }}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingSignRequest || !selectedDocForSign}
                onClick={async () => {
                  // Validate inputs
                  const invalidSigner = signersInput.some((s) => !s.email.includes("@"));
                  if (invalidSigner) {
                    alert("Please provide valid emails for all signers.");
                    return;
                  }

                  setIsSubmittingSignRequest(true);
                  try {
                    const document = documents.find((d) => d.url === selectedDocForSign);
                    const docName = document ? document.name : "Document";

                    const res = await fetch("/api/documents/signatures", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        doc_name: docName,
                        doc_url: selectedDocForSign,
                        signers: signersInput,
                        require_nda: requireNdaForSign,
                        nda_text: requireNdaForSign ? ndaTextForSign : "",
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to create signature request");

                    toast.success("Signature Request sent successfully!");
                    setIsSignRequestModalOpen(false);
                    setSignersInput([{ email: "", name: "", role: "investor" }]);
                    setSelectedDocForSign("");
                    fetchSignRequests();
                  } catch (err: any) {
                    console.error(err);
                    alert(err.message || "Failed to create signature request.");
                  } finally {
                    setIsSubmittingSignRequest(false);
                  }
                }}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingSignRequest ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
}
