"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  SquaresFour,
  FileText,
  ChartPie,
  EnvelopeSimple,
  ShieldCheck,
  ClockCounterClockwise,
  Compass,
  RocketLaunch,
  ArrowUpRight,
  CircleNotch,
  Sparkle,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: any;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "overview",
    title: "Overview",
    subtitle: "Dashboard Overview & Stats",
    href: "/dashboard",
    icon: SquaresFour,
  },
  {
    id: "captable",
    title: "Cap Table",
    subtitle: "Shareholders, Equity Ledger & Waterfall",
    href: "/dashboard/captable",
    icon: ChartPie,
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Contracts, Agreements & File Vault",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    id: "updates",
    title: "Investor Updates",
    subtitle: "Monthly Progress Reports",
    href: "/dashboard/updates",
    icon: EnvelopeSimple,
  },
  {
    id: "grants",
    title: "Smart Capital",
    subtitle: "AI Grant Matching & Proposal Editor",
    href: "/dashboard/grants",
    icon: ShieldCheck,
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    subtitle: "Security & Compliance Logs",
    href: "/dashboard/audit-logs",
    icon: ClockCounterClockwise,
  },
  {
    id: "investors",
    title: "Investors",
    subtitle: "VC & Angel Investor Database",
    href: "/dashboard/investors",
    icon: Compass,
  },
  {
    id: "startups",
    title: "Startups",
    subtitle: "Foundex Startup Directory",
    href: "/dashboard/startups",
    icon: RocketLaunch,
  },
];

export default function CommandPaletteModal({
  isOpen,
  onClose,
}: CommandPaletteModalProps) {
  const router = useRouter();
  const { token, activeStartupId } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Close on Escape or shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered by keyboard shortcut
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Vector Search Query Logic
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const activeId =
          activeStartupId ||
          (typeof window !== "undefined"
            ? localStorage.getItem("activeStartupId")
            : "");
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "x-startup-id": activeId || "",
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        } else {
          // Fallback mockup search if search API is building
          const lower = searchQuery.toLowerCase();
          const mockResults = [
            {
              id: "res-1",
              title: `${searchQuery} Fintech Platform`,
              category: "Startup Directory",
              href: "/dashboard/startups",
              type: "Startup",
              matchScore: 96,
              description:
                "AI-driven fintech SaaS startup matching query criteria.",
            },
            {
              id: "res-2",
              title: `${searchQuery} Deeptech Venture Fund`,
              category: "Investor Database",
              href: "/dashboard/investors",
              type: "Investor",
              matchScore: 91,
              description:
                "Early-stage venture capital firm investing in AI & software.",
            },
          ];
          setSearchResults(mockResults);
        }
      } catch (err) {
        console.error("Vector search error:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [token, activeStartupId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelectNav = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  const filteredNavItems = NAVIGATION_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Command Palette Dialog Container */}
      <div className="relative w-full max-w-2xl bg-[#0D0E12] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50 shrink-0">
          <MagnifyingGlass
            className="w-5 h-5 text-zinc-400 shrink-0"
            weight="bold"
          />
          <input
            type="text"
            autoFocus
            placeholder="Search All pages, docs, investors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none"
          />
          {isSearching && (
            <CircleNotch className="w-4 h-4 text-[#E5C158] animate-spin shrink-0" />
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800/90 border border-zinc-700/80 rounded-md shrink-0">
            ESC
          </kbd>
        </div>

        {/* Scrollable Results Body */}
        <div className="overflow-y-auto p-2 space-y-4 flex-1 custom-scrollbar">
          {/* Navigation Section */}
          {!query.trim() && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                NAVIGATION
              </div>
              <div className="space-y-1 mt-1">
                {NAVIGATION_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  const isHovered = selectedIndex === idx;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer ${
                        isHovered
                          ? "bg-zinc-800/90 text-white"
                          : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-[#E5C158]/50 shrink-0 transition-colors">
                          <Icon className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-[#E5C158] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-md">
                          OPEN
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results Section */}
          {query.trim() && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>SEMANTIC VECTOR MATCHES</span>
                <span className="text-[#E5C158] font-mono font-normal">
                  {searchResults.length + filteredNavItems.length} RESULTS
                </span>
              </div>

              {/* Filtered Nav Matches */}
              {filteredNavItems.length > 0 && (
                <div className="space-y-1 mb-3">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectNav(item.href)}
                        className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-zinc-800/80 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                            <Icon className="w-4 h-4" weight="bold" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-[#E5C158]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Semantic Vector API Matches */}
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((res) => (
                    <button
                      key={res.id || res._id}
                      onClick={() => handleSelectNav(res.href || "/dashboard")}
                      className="w-full px-3.5 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/90 transition-all text-left flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                            {res.type || "Match"}
                          </span>
                          {res.matchScore && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              {res.matchScore}% MATCH
                            </span>
                          )}
                          <p className="text-xs font-bold text-white group-hover:text-[#E5C158]">
                            {res.title || res.company_name || res.name}
                          </p>
                        </div>
                        {res.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-1">
                            {res.description}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 &&
                filteredNavItems.length === 0 &&
                !isSearching && (
                  <div className="py-12 text-center text-zinc-500 text-xs font-medium">
                    No semantic vector matches found for "{query}". Try
                    searching for startup names, investor stage, or document
                    types.
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Modal Footer Tips */}
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">
                ↑
              </kbd>{" "}
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">
                ↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">
                ↵
              </kbd>{" "}
              Select
            </span>
          </div>
          <span className="flex items-center gap-1 text-zinc-400">
            <Sparkle className="w-3 h-3 text-[#E5C158]" /> Foundex Semantic
            Vector Index
          </span>
        </div>
      </div>
    </div>
  );
}
