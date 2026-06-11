"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CaretLeft,
  FileText,
  Plus,
  MagnifyingGlass,
  Funnel,
  CircleNotch,
  Calendar,
  Eye,
  DotsThree,
  Clock,
  PaperPlaneTilt,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface Document {
  name: string;
  type: string;
  url: string;
  date: string;
  _id?: string; // If we add IDs to subdocs, otherwise index
}

export default function DocumentsPage() {
  const { token, activeStartupId } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Share Modal States
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);

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

  // Load saved investors for the share dropdown
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

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-zinc-800"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            All Documents
          </h1>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Link>
      </div>

      <div className="p-4 py-8 lg:p-8 max-w-7xl mx-auto w-full">
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
            {["all", "deck", "financials", "legal", "memo", "other"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap border transition-all ${
                    filterType === type
                      ? "bg-black text-white border-black dark:bg-white dark:text-black"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocs.map((doc, i) => (
              <Link
                key={i}
                href={`/dashboard/documents/view?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name)}&type=${doc.type}`}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedDoc(doc);
                        setShareMessage(`Hi, please find our ${doc.name} shared. We would love to arrange a brief introductory call to discuss our current milestones.`);
                        setIsShareModalOpen(true);
                      }}
                      className="p-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors cursor-pointer z-10"
                      title="Share Document"
                    >
                      <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {doc.type}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                  {doc.name}
                </h3>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" weight="bold" />
                    {doc.date ? format(new Date(doc.date), "MMM d, yyyy") : "Recently"}
                  </div>
                  {doc.date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 ml-5">
                      <Clock className="w-3 h-3" weight="bold" />
                      {format(new Date(doc.date), "h:mm a")}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-zinc-800">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" weight="bold" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">
              No documents found
            </h3>
            <p className="text-gray-500 mb-6 dark:text-gray-400">
              Upload your pitch deck or write a memo to get started.
            </p>
            <Link
              href="/dashboard/documents/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all dark:bg-white dark:text-black"
            >
              <Plus className="w-4 h-4" weight="bold" />
              Add Document
            </Link>
          </div>
        )}
      </div>

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
