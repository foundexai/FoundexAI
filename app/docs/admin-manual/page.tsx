"use client";

import { ShieldCheck, UsersThree, UserPlus, IdentificationCard, EnvelopeSimple, Trash, Pulse, Receipt } from "@phosphor-icons/react";

export default function AdminManualPage() {
  return (
    <article className="space-y-12 md:space-y-16 pb-16 max-w-3xl">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-black uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" weight="bold" />
          Operations
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          Admin Manual
        </h1>
        <p className="text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
          The operational runbook for platform administrators: user governance,
          subscription billing, content moderation, and incident response.
        </p>
      </header>

      {/* Roles & Permissions */}
      <Section title="Roles & Permissions" icon={UsersThree} id="roles">
        <p>
          Foundex has three administrative roles. Permissions are additive — a
          user with a higher tier inherits everything below it.
        </p>

        <Table
          headers={["Role", "Scope", "Capabilities"]}
          rows={[
            [
              "Super Admin",
              "Platform-wide",
              "All actions across all tenants, including destructive ops and role assignment.",
            ],
            [
              "Compliance Reviewer",
              "Compliance + KYC",
              "Approve / reject investor and startup submissions, manage tax form expirations.",
            ],
            [
              "Support Engineer",
              "Read + audit",
              "View all data, impersonate for debugging, write audit log annotations.",
            ],
          ]}
        />
      </Section>

      {/* User Management */}
      <Section title="User Management" icon={UserPlus} id="user-management">
        <Step n={1} title="Approve pending submissions">
          Navigate to <Inline>/dashboard/admin</Inline> and review the{" "}
          <Badge>Pending</Badge> queue. Each row shows the submitted entity
          (investor or startup) with full KYC details. Approvals write to the
          audit log automatically.
        </Step>
        <Step n={2} title="Create users manually">
          Use the <Badge>Users</Badge> tab → <Badge>+ Create User</Badge>.
          Always set a temporary password and trigger the welcome email so the
          user can rotate it on first login. Never reuse temporary passwords.
        </Step>
        <Step n={3} title="Bulk import investor database">
          From <Badge>Bulk Import</Badge>, paste a JSON array conforming to the{" "}
          <Inline>Investor</Inline> schema. The importer returns a per-row
          status (created / updated / skipped) and surfaces validation
          errors inline. Maximum 1,000 records per import.
        </Step>
        <Step n={4} title="Suspend or delete users">
          Hover any user row → <Badge>⋯</Badge> → <Badge>Suspend</Badge>.{" "}
          Suspension is reversible; deletion is permanent and triggers a 30-day
          soft-delete grace period during which data can be restored from a
          backup.
        </Step>
      </Section>

      {/* Subscriptions */}
      <Section title="Subscription Governance" icon={Receipt} id="subscriptions">
        <p>
          Subscription state is managed via Stripe webhooks. The
          <Inline>/api/subscriptions/webhook</Inline> endpoint handles the full
          lifecycle: <Inline>created</Inline>, <Inline>updated</Inline>,{" "}
          <Inline>deleted</Inline>, <Inline>payment_failed</Inline>, and{" "}
          <Inline>trial_will_end</Inline>.
        </p>

        <Callout variant="warning">
          <strong>Manual overrides</strong> must be applied via the admin
          panel's <Badge>Subscriptions</Badge> tab — never edit the Stripe
          dashboard directly, or the local state will drift from the source of
          truth.
        </Callout>

        <p>Common admin tasks:</p>
        <ul className="space-y-2 list-disc list-inside marker:text-yellow-500">
          <li>
            <strong>Extend a trial:</strong> Open the user, click{" "}
            <Badge>Extend Trial +14d</Badge>. The new expiry is written to both
            Stripe and the local <Inline>Subscription</Inline> record.
          </li>
          <li>
            <strong>Issue a refund:</strong> Issue from the Stripe dashboard
            first, then mark the local invoice as{" "}
            <Inline>refunded</Inline> in the admin panel to suppress dunning.
          </li>
          <li>
            <strong>Cancel a subscription:</strong> Always set the cancellation
            reason — it's surfaced in monthly churn reports and is required for
            accurate forecasting.
          </li>
        </ul>
      </Section>

      {/* Tax Compliance Moderation */}
      <Section title="Tax Compliance Moderation" icon={IdentificationCard} id="tax">
        <p>
          Tax forms (W-9, W-8BEN, W-8BEN-E) flow through the compliance
          reviewer's queue when an investor or shareholder is onboarded. The
          platform automatically:
        </p>
        <ul className="space-y-2 list-disc list-inside marker:text-yellow-500">
          <li>Encrypts the TIN/FTIN at rest using AES-256-GCM.</li>
          <li>
            Detects expiration on December 31 of the third calendar year after
            signing (per IRS Treas. Reg. § 1.1441-1).
          </li>
          <li>
            Queues renewal notifications 90 days before expiry via the{" "}
            <Inline>/api/compliance/tax-vault/audit-expirations</Inline>{" "}
            endpoint.
          </li>
        </ul>
        <p>
          Compliance reviewers can manually flag a form as{" "}
          <Inline>verified</Inline> after visual inspection. The action is
          recorded in the audit log with the reviewer's identity.
        </p>
      </Section>

      {/* Incident Response */}
      <Section title="Incident Response" icon={Pulse} id="incidents">
        <p>
          Severity definitions and on-call rotation live in PagerDuty. The
          first responder acknowledges within 5 minutes and opens a war room in
          the <Inline>#incident-platform</Inline> Slack channel.
        </p>

        <Table
          headers={["Severity", "Definition", "Response", "Comms"]}
          rows={[
            ["SEV-1", "Production outage", "5 min", "Public status page + email"],
            ["SEV-2", "Major degradation", "15 min", "Status page"],
            ["SEV-3", "Minor bug", "Next business day", "Internal only"],
            ["SEV-4", "Cosmetic", "Next sprint", "Internal only"],
          ]}
        />

        <Callout variant="info">
          Always write a blameless post-mortem within 5 business days of
          resolution. Use the template at{" "}
          <Inline>/docs/templates/postmortem.md</Inline>.
        </Callout>
      </Section>

      {/* Communication Templates */}
      <Section title="Outbound Communications" icon={EnvelopeSimple} id="comms">
        <p>
          Admin-initiated broadcasts use the <Inline>Notification</Inline>{" "}
          collection. Templates are versioned and live in{" "}
          <Inline>/lib/email-templates/</Inline>. Always preview before sending:
          the platform renders the email exactly as it will arrive, including
          dark-mode inversion.
        </p>

        <ul className="space-y-2 list-disc list-inside marker:text-yellow-500">
          <li>
            <strong>Account suspension notice:</strong>{" "}
            <Inline>suspension-notice-v3.md</Inline>
          </li>
          <li>
            <strong>Tax form renewal reminder:</strong>{" "}
            <Inline>tax-renewal-v2.md</Inline>
          </li>
          <li>
            <strong>Subscription payment failed:</strong>{" "}
            <Inline>dunning-v4.md</Inline>
          </li>
          <li>
            <strong>Investor approval:</strong>{" "}
            <Inline>investor-approved-v1.md</Inline>
          </li>
        </ul>
      </Section>

      {/* Data Retention */}
      <Section title="Data Retention & Deletion" icon={Trash} id="retention">
        <p>
          Personally identifiable information follows GDPR Art. 17 (right to
          erasure). Users can self-serve from{" "}
          <Inline>/dashboard/settings → Download Archive</Inline>, which
          generates a portable JSON export. Erasure requests are honored within
          30 days; the user receives confirmation once deletion is complete.
        </p>

        <Callout variant="warning">
          Tax forms are retained for 7 years per IRS recordkeeping
          requirements (IRC § 6501). Erasure requests for tax documents
          anonymize the PII fields but preserve the audit log entry.
        </Callout>
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

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 flex items-center justify-center text-xs font-black font-mono mt-0.5">
        {n}
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <div className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[11px] font-mono font-semibold text-gray-800 dark:text-zinc-200">
      {children}
    </code>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
      {children}
    </span>
  );
}

function Callout({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning";
}) {
  const isWarning = variant === "warning";
  return (
    <div
      className={`p-4 rounded-2xl border ${
        isWarning
          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
          : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300"
      }`}
    >
      <div className="text-xs leading-relaxed">{children}</div>
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
