"use client";

import Link from "next/link";
import {
  BookOpen,
  Buildings,
  ShieldCheck,
  Code,
  ArrowRight,
  GraduationCap,
  Compass,
  Lightning,
} from "@phosphor-icons/react";

const DOCS = [
  {
    title: "Architecture Guide",
    description:
      "System topology, data flow, security model, and the multi-region replication strategy powering the Foundex platform.",
    href: "/docs/architecture",
    icon: Buildings,
    badge: "Engineering",
    readTime: "12 min",
  },
  {
    title: "Admin Manual",
    description:
      "Operational runbook for platform administrators: user management, content moderation, subscription governance, and incident response.",
    href: "/docs/admin-manual",
    icon: ShieldCheck,
    badge: "Operations",
    readTime: "9 min",
  },
  {
    title: "API Reference",
    description:
      "Programmatic access to startups, cap tables, investor pipelines, webhooks, and external integrations (HubSpot, QuickBooks, Stripe).",
    href: "/docs/api-reference",
    icon: Code,
    badge: "Developer",
    readTime: "15 min",
  },
];

const HIGHLIGHTS = [
  {
    icon: GraduationCap,
    title: "Enterprise Accelerator Hierarchy",
    description:
      "Multi-cohort partner dashboards, cross-venture financial rollups, and LP performance auditing.",
  },
  {
    icon: Compass,
    title: "Compliance & Tax Engine",
    description:
      "IRS § 41 R&D credit calculator, HMRC ERIS estimation, W-8BEN/W-9 vault with auto-expiration alerts.",
  },
  {
    icon: Lightning,
    title: "Programmable Infrastructure",
    description:
      "OAuth-secured REST gateway, signed webhook delivery, and rate-limited API tokens for partner integrations.",
  },
];

export default function DocsHomePage() {
  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      {/* Header */}
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-black uppercase tracking-widest">
          <BookOpen className="w-3 h-3" weight="bold" />
          v1.0 · Production
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
          Foundex Platform Documentation
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          The official reference for engineering teams, platform
          administrators, and integration partners. Read end-to-end or jump
          straight to the area you need.
        </p>
      </header>

      {/* Documentation Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
            Documentation
          </h2>
          <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase">
            {DOCS.length} Guides
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.href}
                href={doc.href}
                className="group relative p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs hover:border-yellow-500/50 hover:shadow-md transition-all active:scale-[0.98] flex flex-col space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" weight="bold" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    {doc.badge}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    {doc.readTime} read
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all"
                    weight="bold"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          Platform Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5" weight="bold" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quickstart */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900 dark:bg-black text-white border border-white/5 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
            <Lightning className="w-4.5 h-4.5 text-black" weight="fill" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">
              Ready to integrate?
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generate an API token in under 60 seconds and ship your first
              authenticated request.
            </p>
          </div>
        </div>

        <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
          <code>
{`curl https://api.foundex.ai/v1/startups \\
  -H "Authorization: Bearer fd_live_••••••••" \\
  -H "Content-Type: application/json"`}
          </code>
        </pre>

        <Link
          href="/docs/api-reference"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition-all active:scale-[0.98] shadow-xs"
        >
          View Quickstart Guide
          <ArrowRight className="w-3.5 h-3.5" weight="bold" />
        </Link>
      </section>
    </div>
  );
}
