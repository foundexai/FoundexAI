"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Warning,
  CheckCircle,
  Clock,
  Download,
  Plus,
  ArrowClockwise,
  EnvelopeSimple,
  CircleNotch,
  FileText,
  X,
  Globe,
  Trash,
} from "@phosphor-icons/react";

function maskTaxId(taxId?: string): string {
  if (!taxId) return "Not Provided";
  const cleaned = taxId.trim();
  if (cleaned.length <= 4) return `••••${cleaned}`;
  const visible = cleaned.slice(-4);
  return `••-•••${visible}`;
}

interface TaxComplianceVaultProps {
  startupId: string;
  token: string;
  shareholders: Array<{
    _id: string;
    shareholder_name: string;
    shareholder_type: string;
    email?: string;
    tax_status?: string;
    tax_residence_country?: string;
  }>;
  onRefreshCapTable?: () => void;
}

export default function TaxComplianceVault({
  startupId,
  token,
  shareholders,
  onRefreshCapTable,
}: TaxComplianceVaultProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formShareholderId, setFormShareholderId] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formType, setFormType] = useState<"W-9" | "W-8BEN" | "W-8BEN-E">("W-9");
  const [formCountry, setFormCountry] = useState<string>("United States");
  const [formTaxId, setFormTaxId] = useState<string>("");
  const [formTreatyClaimed, setFormTreatyClaimed] = useState<boolean>(false);
  const [formTreatyCountry, setFormTreatyCountry] = useState<string>("");
  const [formTreatyRate, setFormTreatyRate] = useState<number>(0);
  const [formSignedDate, setFormSignedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formStatus, setFormStatus] = useState<string>("verified");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (startupId && token) {
      loadDocuments();
    }
  }, [startupId, token]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/tax-vault?startup_id=${startupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setMetrics(data.metrics || null);
      }
    } catch (e) {
      console.error("Failed to load tax documents:", e);
      toast.error("Failed to load investor tax documents");
    } finally {
      setLoading(false);
    }
  };

  const handleAuditAndRenew = async (triggerRenewals = true) => {
    setAuditing(true);
    try {
      const res = await fetch("/api/compliance/tax-vault/audit-expirations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startup_id: startupId,
          trigger_renewals: triggerRenewals,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Tax audit complete.");
        loadDocuments();
        if (onRefreshCapTable) onRefreshCapTable();
      } else {
        toast.error("Audit sweep failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error executing expiration audit");
    } finally {
      setAuditing(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/compliance/tax-vault?startup_id=${startupId}&export=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `investor_tax_prep_1099_k1_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("1099/K-1 Prep CSV exported!");
      } else {
        toast.error("Failed to export CSV");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error downloading tax CSV");
    } finally {
      setExporting(false);
    }
  };

  const [exportingPackage, setExportingPackage] = useState(false);

  const handleExportCpaAuditPackage = async (format: "pdf" | "json" = "pdf") => {
    setExportingPackage(true);
    try {
      const res = await fetch(`/api/compliance/tax-vault/audit-package?startup_id=${startupId}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cpa_tax_compliance_audit_package_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`CPA Audit Package (${format.toUpperCase()}) exported successfully!`);
      } else {
        toast.error("Failed to generate CPA audit package");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error downloading CPA audit package");
    } finally {
      setExportingPackage(false);
    }
  };

  const handleOpenAddModal = (shareholder?: any) => {
    setEditingDocId(null);
    if (shareholder) {
      setFormShareholderId(shareholder._id);
      setFormName(shareholder.shareholder_name);
      setFormEmail(shareholder.email || "");
      const isUS = (shareholder.tax_residence_country || "United States") === "United States";
      setFormType(isUS ? "W-9" : "W-8BEN");
      setFormCountry(shareholder.tax_residence_country || (isUS ? "United States" : "United Kingdom"));
    } else {
      setFormShareholderId("");
      setFormName("");
      setFormEmail("");
      setFormType("W-9");
      setFormCountry("United States");
    }
    setFormTaxId("");
    setFormTreatyClaimed(false);
    setFormTreatyCountry("");
    setFormTreatyRate(0);
    setFormSignedDate(new Date().toISOString().split("T")[0]);
    setFormStatus("verified");
    setModalOpen(true);
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Shareholder legal name is required");
      return;
    }
    setSubmitting(true);
    try {
      const isUS = formType === "W-9";
      const payload = {
        startup_id: startupId,
        shareholder_id: formShareholderId || undefined,
        shareholder_name: formName.trim(),
        shareholder_email: formEmail.trim() || undefined,
        form_type: formType,
        tax_id_number: formTaxId.trim() || undefined,
        country_of_tax_residence: formCountry,
        is_us_person: isUS,
        treaty_benefits_claimed: formTreatyClaimed,
        treaty_country: formTreatyClaimed ? formTreatyCountry : undefined,
        treaty_rate_pct: formTreatyClaimed ? Number(formTreatyRate) : 0,
        status: formStatus,
        date_signed: formSignedDate,
      };

      const res = await fetch("/api/compliance/tax-vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Tax document for ${formName} recorded!`);
        setModalOpen(false);
        loadDocuments();
        if (onRefreshCapTable) onRefreshCapTable();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save tax document");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving tax document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove tax compliance record for ${name}?`)) return;
    try {
      const res = await fetch(`/api/compliance/tax-vault?id=${id}&startup_id=${startupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Document removed");
        loadDocuments();
        if (onRefreshCapTable) onRefreshCapTable();
      }
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };

  const expiringOrExpired = documents.filter((d) => d.status === "expiring_soon" || d.status === "expired");

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" weight="bold" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Investor Tax Compliance Vault
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Track domestic Form W-9 and foreign investor Form W-8BEN/W-8BEN-E statutory certifications.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleAuditAndRenew(true)}
            disabled={auditing}
            className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            title="Scan expiration dates and send renewal requests"
          >
            {auditing ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <ArrowClockwise className="w-3.5 h-3.5" />}
            <span>Audit & Renew</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            {exporting ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export 1099/K-1 Prep CSV</span>
          </button>

          <button
            onClick={() => handleExportCpaAuditPackage("pdf")}
            disabled={exportingPackage}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            title="Download full institutional CPA audit package dossier (PDF) with digital integrity signatures"
          >
            {exportingPackage ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" weight="bold" />}
            <span>Export CPA Audit Package</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" />
            <span>Record Tax Form</span>
          </button>
        </div>
      </div>

      {/* Compliance Stat Cards (Apple Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Total Monitored</span>
          <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">
            {metrics?.total_documents || documents.length}
          </span>
          <span className="text-[11px] text-zinc-500 block">Cap table entities</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Verified Active</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {metrics?.verified_count || 0}
          </span>
          <span className="text-[11px] text-zinc-500 block">Current & valid</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase block">Expiring (&lt;90 Days)</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {metrics?.expiring_soon_count || 0}
          </span>
          <span className="text-[11px] text-zinc-500 block">Requires renewal</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase block">Expired / Missing</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {(metrics?.expired_count || 0) + (metrics?.pending_action_count || 0)}
          </span>
          <span className="text-[11px] text-zinc-500 block">Withholding at risk</span>
        </div>
      </div>

      {/* Expiration Warning Alert Banner */}
      {expiringOrExpired.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-300 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Warning className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" weight="fill" />
            <div>
              <h4 className="text-xs font-bold">
                Tax Form Expiration Warning ({expiringOrExpired.length} certificate{expiringOrExpired.length > 1 ? "s" : ""} flagged)
              </h4>
              <p className="text-[11px] opacity-90 mt-0.5">
                Under IRS Treas. Reg. § 1.1441-1, foreign investor W-8BEN forms expire on December 31st of the 3rd year after signing. Failure to renew exposes payments to 30% statutory withholding.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleAuditAndRenew(true)}
            disabled={auditing}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap self-start sm:self-center shadow-xs"
          >
            {auditing ? "Sending..." : "Send Renewal Requests"}
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Investor Tax Certification Ledger
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Synchronized directly with Cap Table shareholder equity grants.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
            {documents.length} Records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <CircleNotch className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
            <span className="text-xs text-zinc-500 font-mono mt-2 block">Loading tax documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Tax Compliance Documents Recorded</p>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-1">
                Collect W-9 and W-8BEN forms from shareholders to establish tax residency, treaty benefits, and prevent 30% IRS backup withholding.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              Add First Tax Form
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/30 text-[10px] font-mono uppercase text-zinc-400 border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="py-3 px-4">Shareholder / Investor</th>
                  <th className="py-3 px-3">Form Type</th>
                  <th className="py-3 px-3">Tax Residence</th>
                  <th className="py-3 px-3">Tax ID (TIN/FTIN)</th>
                  <th className="py-3 px-3">Treaty Withholding</th>
                  <th className="py-3 px-3">Date Signed</th>
                  <th className="py-3 px-3">Expiration Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {documents.map((doc) => {
                  const isW8 = doc.form_type.startsWith("W-8");
                  const isExpiringSoon = doc.status === "expiring_soon";
                  const isExpired = doc.status === "expired";
                  const isVerified = doc.status === "verified";

                  const signedDate = doc.date_signed ? new Date(doc.date_signed).toLocaleDateString() : "Pending";
                  const expireDate = doc.expires_at ? new Date(doc.expires_at).toLocaleDateString() : (isW8 ? "Calculated" : "Perpetual (W-9)");

                  return (
                    <tr key={doc._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        <div>{doc.shareholder_name}</div>
                        {doc.shareholder_email && (
                          <div className="text-[10px] font-normal text-zinc-400 font-mono">{doc.shareholder_email}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {doc.form_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400">
                        {doc.country_of_tax_residence || "United States"}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-zinc-500">
                        {maskTaxId(doc.tax_id_number)}
                      </td>

                      <td className="py-3.5 px-3">
                        {doc.treaty_benefits_claimed ? (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {doc.treaty_rate_pct || 0}% ({doc.treaty_country || "Treaty"})
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono">30% (Standard)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-zinc-500">
                        {signedDate}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <span>{expireDate}</span>
                          {isExpiringSoon && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Expiring within 90 days" />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isVerified
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : isExpiringSoon
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : isExpired
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}>
                          {isVerified && <CheckCircle className="w-3 h-3" weight="fill" />}
                          {isExpiringSoon && <Warning className="w-3 h-3" weight="fill" />}
                          {isExpired && <Warning className="w-3 h-3" weight="fill" />}
                          {doc.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDelete(doc._id, doc.shareholder_name)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Remove Tax Document"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Recording / Requesting Tax Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Record Investor Tax Compliance Document
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Form W-9 for US entities or Form W-8BEN for foreign investors.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDoc} className="space-y-4 text-xs">
              {/* Cap Table Link */}
              {shareholders && shareholders.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Link Cap Table Shareholder (Optional)
                  </label>
                  <select
                    value={formShareholderId}
                    onChange={(e) => {
                      const sh = shareholders.find((s) => s._id === e.target.value);
                      setFormShareholderId(e.target.value);
                      if (sh) {
                        setFormName(sh.shareholder_name);
                        setFormEmail(sh.email || "");
                        const isUS = (sh.tax_residence_country || "United States") === "United States";
                        setFormType(isUS ? "W-9" : "W-8BEN");
                        setFormCountry(sh.tax_residence_country || (isUS ? "United States" : "United Kingdom"));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold cursor-pointer"
                  >
                    <option value="">-- Select or enter manually below --</option>
                    {shareholders.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.shareholder_name} ({s.shareholder_type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Legal Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Legal Name / Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sequoia Capital / Jane Doe"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="investor@fund.com"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Type & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    IRS Form Certificate
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const ft = e.target.value as any;
                      setFormType(ft);
                      if (ft === "W-9") setFormCountry("United States");
                      else if (formCountry === "United States") setFormCountry("United Kingdom");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="W-9">Form W-9 (US Person / Entity)</option>
                    <option value="W-8BEN">Form W-8BEN (Foreign Individual)</option>
                    <option value="W-8BEN-E">Form W-8BEN-E (Foreign Entity)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Country of Tax Residence
                  </label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tax ID & Date Signed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Tax ID (SSN / EIN / Foreign TIN)
                  </label>
                  <input
                    type="text"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="XX-XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Date Signed / Certified
                  </label>
                  <input
                    type="date"
                    value={formSignedDate}
                    onChange={(e) => setFormSignedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Treaty Details (if W-8) */}
              {formType.startsWith("W-8") && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Claim Double Tax Treaty Withholding Rate
                    </span>
                    <input
                      type="checkbox"
                      checked={formTreatyClaimed}
                      onChange={(e) => setFormTreatyClaimed(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-zinc-900 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {formTreatyClaimed && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1">Treaty Country</label>
                        <input
                          type="text"
                          value={formTreatyCountry}
                          onChange={(e) => setFormTreatyCountry(e.target.value)}
                          placeholder="e.g. United Kingdom"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1">Treaty Withholding Rate (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={formTreatyRate}
                          onChange={(e) => setFormTreatyRate(Number(e.target.value))}
                          placeholder="0, 15, etc."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Document Verification Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="verified">Verified & Active</option>
                  <option value="submitted">Submitted (Pending Verification)</option>
                  <option value="requested">Form Requested (Awaiting Investor)</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
