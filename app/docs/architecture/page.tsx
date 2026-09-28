"use client";

import { Buildings, Database, Globe, Lock, ShieldCheck, Stack, Pulse } from "@phosphor-icons/react";

export default function ArchitecturePage() {
  return (
    <article className="space-y-12 md:space-y-16 pb-16 max-w-3xl">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-black uppercase tracking-widest">
          <Buildings className="w-3 h-3" weight="bold" />
          Engineering
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          Architecture Guide
        </h1>
        <p className="text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
          How the Foundex platform is built: from the Next.js edge to the
          MongoDB replication topology and the security boundaries between
          tenants.
        </p>
      </header>

      {/* System Topology */}
      <Section
        title="System Topology"
        icon={Stack}
        id="topology"
      >
        <p>
          Foundex is a single-binary Next.js 16 application deployed on Vercel's
          edge network with multi-region database replicas. The codebase is
          organized into four layers, each isolated by clear import boundaries.
        </p>

        <Layer>
          <LayerTitle>Edge Layer (Next.js + React Server Components)</LayerTitle>
          <LayerDesc>
            Static generation for marketing surfaces; React Server Components
            for dashboard routes; Server Actions for mutations. The edge
            terminates TLS, performs authentication, and forwards signed
            requests to the application layer.
          </LayerDesc>
        </Layer>

        <Layer>
          <LayerTitle>Application Layer (Route Handlers)</LayerTitle>
          <LayerDesc>
            All API endpoints live under <Inline>/api</Inline> and are
            implemented as Next.js Route Handlers. Each handler authenticates
            via JWT bearer tokens or scoped API keys, validates payloads with
            Zod schemas, and enforces row-level tenant isolation.
          </LayerDesc>
        </Layer>

        <Layer>
          <LayerTitle>Domain Services</LayerTitle>
          <LayerDesc>
            Stateful logic is concentrated in <Inline>lib/*Service.ts</Inline>{" "}
            modules (cap table, accelerator, tax, grants, CRM). These services
            own their Mongoose models and are the only callers permitted to
            mutate persisted records directly.
          </LayerDesc>
        </Layer>

        <Layer>
          <LayerTitle>Persistence Layer (MongoDB Atlas)</LayerTitle>
          <LayerDesc>
            Multi-region replica set with one primary in{" "}
            <Inline>eu-west-1</Inline> and three secondaries across{" "}
            <Inline>us-east-1</Inline>, <Inline>ap-southeast-1</Inline>, and{" "}
            <Inline>sa-east-1</Inline>. All sensitive fields (TINs, API
            secrets, document URLs) are encrypted at rest with AES-256-GCM
            using envelope encryption keys held in AWS KMS.
          </LayerDesc>
        </Layer>
      </Section>

      {/* Data Flow */}
      <Section title="Request Lifecycle" icon={Pulse} id="lifecycle">
        <ol className="space-y-4 list-decimal list-inside marker:text-yellow-500 marker:font-black">
          <li>
            <strong>Request enters edge:</strong> TLS terminated; JWT or API
            key resolved from <Inline>Authorization</Inline> header.
          </li>
          <li>
            <strong>Tenant context loaded:</strong>{" "}
            <Inline>verifyToken()</Inline> populates the user identity and
            active startup. Subscription tier is resolved in parallel via a
            signed session cookie to avoid a second round trip.
          </li>
          <li>
            <strong>Handler validates payload:</strong> Zod schema rejects
            malformed requests with a 400 before any database call.
          </li>
          <li>
            <strong>Authorization check:</strong> row-level filter applied to
            every MongoDB query. Cross-tenant reads are impossible by
            construction.
          </li>
          <li>
            <strong>Domain service executes:</strong> business rules are
            enforced (QSB limits, W-8BEN expiration math, cohort seat caps).
          </li>
          <li>
            <strong>Audit log appended:</strong> every mutating action writes
            to the <Inline>AuditLog</Inline> collection with the acting
            user_id, target document, and diff.
          </li>
          <li>
            <strong>Response returned:</strong> standardized JSON envelope;
            cached at the edge for read-only idempotent endpoints.
          </li>
        </ol>
      </Section>

      {/* Security Model */}
      <Section title="Security Model" icon={ShieldCheck} id="security">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SecurityCard
            title="Transport"
            items={[
              "TLS 1.3 enforced edge-wide",
              "HSTS preload enabled",
              "mTLS for service-to-service calls",
            ]}
          />
          <SecurityCard
            title="Authentication"
            items={[
              "JWT (HS256) for session cookies",
              "Scoped API keys (fd_live_/fd_test_) for partner integrations",
              "OAuth 2.0 with PKCE for third-party flows",
            ]}
          />
          <SecurityCard
            title="Data at Rest"
            items={[
              "AES-256-GCM envelope encryption for sensitive fields",
              "Per-tenant data encryption keys (DEKs)",
              "KMS-managed key rotation every 90 days",
            ]}
          />
          <SecurityCard
            title="Application"
            items={[
              "Strict row-level tenant isolation in every query",
              "Zod schema validation at every API boundary",
              "Rate-limited via Vercel KV sliding window (60 req/min)",
            ]}
          />
        </div>
      </Section>

      {/* Multi-Region */}
      <Section title="Multi-Region Replication" icon={Globe} id="replication">
        <p>
          Reads are served from the nearest replica with a target p95 latency
          under 80ms. Writes always hit the primary and are replicated
          asynchronously to the secondaries. Conflict resolution is handled
          via the <Inline>_id</Inline> + <Inline>version</Inline>{" "}
          optimistic-concurrency pair on every document.
        </p>

        <Table
          headers={["Region", "Role", "Replication Lag Target", "Failover"]}
          rows={[
            ["eu-west-1", "Primary", "0 ms", "Manual"],
            ["us-east-1", "Secondary", "< 250 ms", "Auto-promote"],
            ["ap-southeast-1", "Secondary", "< 400 ms", "Auto-promote"],
            ["sa-east-1", "Secondary", "< 600 ms", "Auto-promote"],
          ]}
        />

        <p>
          If the primary fails for more than 30 seconds, the closest healthy
          secondary promotes itself and triggers a global DNS reroute. The
          promotion is gated on a quorum check ({" "}
          <Inline>secondaries.length &gt;= 2</Inline>) to prevent split-brain
          scenarios.
        </p>
      </Section>

      {/* Tech Stack */}
      <Section title="Technology Stack" icon={Database} id="stack">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <StackRow label="Frontend" value="Next.js 16, React 19, Tailwind CSS, Phosphor Icons" />
          <StackRow label="Backend" value="Next.js Route Handlers, Node.js 22 LTS" />
          <StackRow label="Database" value="MongoDB Atlas (replica set, AES-256-GCM)" />
          <StackRow label="Auth" value="JWT (jose), OAuth 2.0 PKCE, scoped API keys" />
          <StackRow label="Caching" value="Vercel KV (Redis), edge cache, TanStack Query" />
          <StackRow label="File Storage" value="Cloudinary (signed URLs, 1h expiry)" />
          <StackRow label="Email" value="Resend transactional + SendGrid bulk" />
          <StackRow label="Search" value="MongoDB Atlas Vector Search (cosine, 1536d)" />
        </div>
      </Section>

      {/* Operational Notes */}
      <Section title="Operational Notes" icon={Lock} id="ops">
        <ul className="space-y-2 list-disc list-inside marker:text-yellow-500">
          <li>Backups run hourly with point-in-time recovery for 30 days.</li>
          <li>Synthetic uptime checks from 6 global regions every 60 seconds.</li>
          <li>
            On-call rotation is managed in PagerDuty with a 5-minute response
            SLA for SEV-1 incidents.
          </li>
          <li>
            Quarterly third-party penetration tests; full report available
            under NDA.
          </li>
        </ul>
      </Section>
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

function Layer({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 space-y-2">
      {children}
    </div>
  );
}

function LayerTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
      {children}
    </h3>
  );
}

function LayerDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
      {children}
    </p>
  );
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[11px] font-mono font-semibold text-gray-800 dark:text-zinc-200">
      {children}
    </code>
  );
}

function SecurityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-2">
      <h3 className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
        {title}
      </h3>
      <ul className="space-y-1 text-xs text-gray-700 dark:text-zinc-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5">
            <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
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
                  className="py-2.5 px-3 font-mono font-semibold text-gray-700 dark:text-zinc-300"
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

function StackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60">
      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}
