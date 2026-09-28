"use client";

import Link from "next/link";
import { Code, Key, Globe, Pulse, ShieldCheck, FileText, Copy } from "@phosphor-icons/react";

const BASE_URLS = [
  { env: "Production", url: "https://api.foundex.ai", note: "All authenticated traffic" },
  { env: "Sandbox", url: "https://sandbox.foundex.ai", note: "Mirror environment, isolated data" },
  { env: "Local", url: "http://localhost:3000", note: "Development server" },
];

const ENDPOINTS = [
  {
    group: "Startups",
    items: [
      { method: "GET", path: "/api/startups", desc: "List the authenticated user's startups." },
      { method: "POST", path: "/api/startups", desc: "Create a new startup profile." },
      { method: "GET", path: "/api/startups/:id", desc: "Fetch a single startup by ID." },
      { method: "PATCH", path: "/api/startups/:id", desc: "Update startup profile fields." },
      { method: "DELETE", path: "/api/startups/:id", desc: "Soft-delete a startup (30-day recovery)." },
    ],
  },
  {
    group: "Cap Table",
    items: [
      { method: "GET", path: "/api/captable", desc: "List cap table shareholders for a startup." },
      { method: "POST", path: "/api/captable", desc: "Add a new shareholder entry." },
      { method: "POST", path: "/api/waterfall", desc: "Run a waterfall payout simulation." },
    ],
  },
  {
    group: "Compliance (Week 22)",
    items: [
      { method: "POST", path: "/api/compliance/rd-calculator", desc: "Compute IRS § 41 / HMRC ERIS R&D tax credit." },
      { method: "GET", path: "/api/compliance/grant-attachments", desc: "List SBIR / EIC grant form attachments." },
      { method: "POST", path: "/api/compliance/grant-attachments", desc: "Generate a new grant form attachment." },
      { method: "GET", path: "/api/compliance/tax-vault", desc: "List investor tax compliance documents (W-9 / W-8BEN)." },
      { method: "POST", path: "/api/compliance/tax-vault", desc: "Record a new investor tax form." },
      { method: "POST", path: "/api/compliance/tax-vault/audit-expirations", desc: "Trigger the 90-day expiration sweep + renewal dispatch." },
    ],
  },
  {
    group: "Enterprise (Week 23)",
    items: [
      { method: "GET", path: "/api/enterprise/cohorts", desc: "List accelerator / incubator cohorts." },
      { method: "POST", path: "/api/enterprise/cohorts", desc: "Launch a new cohort batch." },
      { method: "GET", path: "/api/enterprise/cohorts/:id", desc: "Fetch cohort detail + analytics." },
      { method: "POST", path: "/api/enterprise/cohorts/:id/startups", desc: "Enroll a venture in a cohort." },
    ],
  },
  {
    group: "Webhooks",
    items: [
      { method: "POST", path: "/webhooks/stripe", desc: "Subscription lifecycle events (HMAC-SHA256 signed)." },
      { method: "POST", path: "/webhooks/hubspot", desc: "CRM sync events." },
      { method: "POST", path: "/webhooks/quickbooks", desc: "Accounting sync events." },
    ],
  },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  PATCH: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

export default function ApiReferencePage() {
  return (
    <article className="space-y-12 md:space-y-16 pb-16 max-w-4xl">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-black uppercase tracking-widest">
          <Code className="w-3 h-3" weight="bold" />
          Developer
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          API Reference
        </h1>
        <p className="text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
          Programmatic access to startups, cap tables, investor pipelines,
          compliance vault, enterprise cohorts, and external integrations.
          OpenAPI 3.1 spec available below.
        </p>
      </header>

      {/* OpenAPI download */}
      <Section title="OpenAPI Specification" icon={FileText} id="openapi">
        <p>
          The full machine-readable spec is published at{" "}
          <Inline>/api/docs/openapi.json</Inline>. Use it with Postman,
          Insomnia, or any OpenAPI generator.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/docs/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-xs"
          >
            <FileText className="w-4 h-4" weight="bold" />
            Download OpenAPI 3.1 JSON
          </a>
        </div>
      </Section>

      {/* Authentication */}
      <Section title="Authentication" icon={Key} id="auth">
        <p>
          All requests must include an{" "}
          <Inline>Authorization: Bearer &lt;token&gt;</Inline> header. Tokens
          come in two flavors:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
              Session JWT
            </h3>
            <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
              Issued at sign-in via <Inline>/api/auth/login</Inline>. Lifetime
              8 hours; refresh on each call to{" "}
              <Inline>/api/auth/refresh</Inline>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
              API Key
            </h3>
            <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
              Prefix <Inline>fd_live_</Inline> for production,{" "}
              <Inline>fd_test_</Inline> for sandbox. Generated from{" "}
              <Inline>/dashboard/settings/developer</Inline>.
            </p>
          </div>
        </div>
      </Section>

      {/* Base URLs */}
      <Section title="Base URLs" icon={Globe} id="base-urls">
        <Table
          headers={["Environment", "Base URL", "Notes"]}
          rows={BASE_URLS.map((b) => [b.env, b.url, b.note])}
        />
      </Section>

      {/* Quickstart */}
      <Section title="Quickstart" icon={Pulse} id="quickstart">
        <p>Fetch your first startup in 30 seconds:</p>

        <CodeBlock
          language="bash"
          code={`# Set your API key
export FOUNDEX_API_KEY="fd_live_••••••••"

# List your startups
curl https://api.foundex.ai/api/startups \\
  -H "Authorization: Bearer $FOUNDEX_API_KEY" \\
  -H "Content-Type: application/json"

# Response
# {
#   "startups": [
#     { "_id": "...", "company_name": "Acme Inc", ... }
#   ]
# }`}
        />
      </Section>

      {/* Endpoint catalog */}
      <Section title="Endpoint Catalog" icon={ShieldCheck} id="endpoints">
        <div className="space-y-8">
          {ENDPOINTS.map((group) => (
            <div key={group.group} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                {group.group}
                <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-600">
                  ({group.items.length})
                </span>
              </h3>
              <div className="space-y-2">
                {group.items.map((ep) => (
                  <EndpointRow
                    key={`${ep.method}-${ep.path}`}
                    method={ep.method}
                    path={ep.path}
                    desc={ep.desc}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Errors */}
      <Section title="Error Codes" icon={FileText} id="errors">
        <Table
          headers={["Status", "Code", "Meaning"]}
          rows={[
            ["400", "bad_request", "Payload failed schema validation."],
            ["401", "unauthorized", "Missing or invalid Authorization header."],
            ["403", "forbidden", "Authenticated but lacks the required scope."],
            ["404", "not_found", "Resource does not exist or is outside your tenant."],
            ["409", "conflict", "Resource already exists or optimistic concurrency check failed."],
            ["429", "rate_limited", "Rate limit exceeded. See Retry-After header."],
            ["500", "internal_error", "Server-side failure. Safe to retry with backoff."],
          ]}
        />
      </Section>

      {/* Rate limits */}
      <Section title="Rate Limits" icon={Pulse} id="rate-limits">
        <p>
          All API tokens are subject to a sliding-window rate limit of{" "}
          <strong>60 requests per minute</strong>, with a burst allowance of{" "}
          <strong>120 requests in any 10-second window</strong>. The current
          state is returned in the response headers:
        </p>
        <CodeBlock
          language="http"
          code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1735689600
Retry-After: 12`}
        />
        <p>
          Rate-limit responses (429) include a <Inline>Retry-After</Inline>{" "}
          header indicating the number of seconds to wait before retrying.
          Implementations should use exponential backoff with jitter.
        </p>
      </Section>

      {/* Webhooks */}
      <Section title="Webhooks" icon={Pulse} id="webhooks">
        <p>
          Outbound webhooks are signed with HMAC-SHA256. Verify the{" "}
          <Inline>X-Foundex-Signature</Inline> header against your endpoint
          secret before processing the payload.
        </p>
        <CodeBlock
          language="typescript"
          code={`import crypto from "node:crypto";

export function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );
}`}
        />
      </Section>

      {/* Footer CTA */}
      <div className="p-6 md:p-8 rounded-3xl bg-zinc-900 dark:bg-black text-white border border-white/5 shadow-xs space-y-4">
        <h3 className="text-lg font-black tracking-tight">Need something custom?</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          For higher rate limits, custom webhooks, or batch import endpoints,
          our platform team can scope an enterprise plan in 24 hours.
        </p>
        <a
          href="mailto:api@foundex.ai"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition-all active:scale-[0.98] shadow-xs"
        >
          Contact Engineering
        </a>
      </div>
    </article>
  );
}

/* ---- Helper Components ---- */

function Section({
  title,
  icon: Icon,
  id,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "fill" }>;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200/80 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5" weight="bold" />
        </div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[11px] font-mono font-semibold text-gray-800 dark:text-zinc-200">
      {children}
    </code>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2 rounded-2xl border border-gray-200/80 dark:border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-zinc-800/60 last:border-0 hover:bg-gray-50/60 dark:hover:bg-zinc-900/30 transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-2.5 px-3 text-gray-700 dark:text-zinc-300 ${j === 0 ? "font-mono font-bold" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(code).catch(() => {});
    }
  };
  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors active:scale-95"
          aria-label="Copy code"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <pre className="p-4 pt-10 rounded-2xl bg-zinc-950 border border-white/10 text-[12px] font-mono text-zinc-200 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  desc,
}: {
  method: string;
  path: string;
  desc: string;
}) {
  const style = METHOD_STYLE[method] ?? "bg-gray-500/15 text-gray-700 border-gray-500/30";
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
      <span
        className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-black border ${style}`}
      >
        {method}
      </span>
      <code className="shrink-0 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-950 text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800">
        {path}
      </code>
      <span className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed flex-1 min-w-0">
        {desc}
      </span>
    </div>
  );
}
