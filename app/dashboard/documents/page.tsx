"use client";

import { useEffect, useState } from "react";
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
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import CreateSecureLinkModal from "@/components/dashboard/CreateSecureLinkModal";

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

export default function DocumentsPage() {
  const { token, activeStartupId } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState<"documents" | "secure_links">("documents");

  // Secure Links State
  const [secureLinks, setSecureLinks] = useState<SecureLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Modal States
  const [selectedDocForSecureLink, setSelectedDocForSecureLink] = useState<Document | null>(null);
  const [isSecureLinkModalOpen, setIsSecureLinkModalOpen] = useState(false);

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
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-zinc-800"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Document Control & Security
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage pitch decks, generate secure links, and track viewer analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsWatermarkDefaultsOpen(true)}
            className="px-3 py-2 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60 rounded-xl text-xs font-bold hover:bg-yellow-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            Watermark Defaults
          </button>

          <Link
            href="/dashboard/documents/new"
            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Link>
        </div>
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "documents"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" /> All Pitch Decks ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("secure_links")}
            className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "secure_links"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-yellow-500" /> Secure Links & Viewer Audit Logs ({secureLinks.length})
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          doc.type === "deck"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : doc.type === "financials"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                        }`}
                      >
                        <FileText className="w-6 h-6" weight="bold" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {doc.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 dark:text-white">
                      {doc.name}
                    </h3>

                    {/* Action Row */}
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {doc.date ? format(new Date(doc.date), "MMM d, yyyy") : "Recently"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Create Protected Secure Link Button */}
                        <button
                          onClick={() => {
                            setSelectedDocForSecureLink(doc);
                            setIsSecureLinkModalOpen(true);
                          }}
                          className="py-2 px-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" weight="bold" /> Secure Link
                        </button>

                        {/* 2. Direct Preview */}
                        <Link
                          href={`/dashboard/documents/view?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name)}&type=${doc.type}`}
                          className="py-2 px-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-4 h-4" /> View Deck
                        </Link>
                      </div>
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
    </div>
  );
}
