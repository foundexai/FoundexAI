"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Buildings,
  ShieldCheck,
  Code,
  ArrowLeft,
  House,
  CaretRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const DOC_NAV = [
  {
    title: "Overview",
    items: [
      { name: "Documentation Home", href: "/docs", icon: House, exact: true },
    ],
  },
  {
    title: "Platform Guides",
    items: [
      {
        name: "Architecture Guide",
        href: "/docs/architecture",
        icon: Buildings,
      },
      {
        name: "Admin Manual",
        href: "/docs/admin-manual",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Developer",
    items: [
      {
        name: "API Reference",
        href: "/docs/api-reference",
        icon: Code,
      },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-yellow-400/30">
      {/* Top Navigation Bar (Translucent Apple-style) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-gray-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors active:scale-[0.98] shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
              <span className="hidden sm:inline">Back to App</span>
            </Link>
            <span className="text-gray-300 dark:text-zinc-700 hidden sm:inline">/</span>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-sm font-black tracking-tight text-gray-900 dark:text-white shrink-0"
            >
              <BookOpen className="w-4 h-4 text-yellow-500" weight="bold" />
              <span>Foundex Docs</span>
            </Link>
          </div>

          <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest hidden md:inline">
            v1.0 · Production
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
          <nav className="space-y-7 pr-2">
            {DOC_NAV.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isExact = (item as { exact?: boolean }).exact === true;
                    const isActive = isExact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]",
                          isActive
                            ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20"
                            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-400 dark:text-zinc-500"
                            )}
                            weight={isActive ? "fill" : "bold"}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        {isActive && (
                          <CaretRight
                            className="w-3 h-3 text-yellow-600 dark:text-yellow-400 shrink-0"
                            weight="bold"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Support callout */}
            <div className="mt-6 p-4 rounded-2xl bg-zinc-900 dark:bg-zinc-900 text-white border border-white/5 shadow-xs space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-yellow-500 font-bold">
                Need Help?
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Reach our platform engineering team for integration support and
                architecture reviews.
              </p>
              <a
                href="mailto:api@foundex.ai"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                api@foundex.ai
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Doc Switcher */}
      <div className="md:hidden sticky bottom-0 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-t border-gray-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 py-2 -mx-1 px-1 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 gap-1 w-fit shrink-0">
            {DOC_NAV.flatMap((g) => g.items).map((item) => {
              const isExact = (item as { exact?: boolean }).exact === true;
              const isActive = isExact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs"
                      : "text-gray-500 dark:text-zinc-400"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
