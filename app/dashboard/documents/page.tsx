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
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

interface Document {
  name: string;
  type: string;
  url: string;
  date: string;
  _id?: string; // If we add IDs to subdocs, otherwise index
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/startups", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (data.startups && data.startups[0]) {
          setDocuments(data.startups[0].documents || []);
        }
      } catch (error) {
        console.error("Failed to fetch docs", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDocs();
  }, [token]);

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
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {doc.type}
                  </span>
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
    </div>
  );
}
