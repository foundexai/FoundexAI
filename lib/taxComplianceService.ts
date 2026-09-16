import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import TaxComplianceDocument, { ITaxComplianceDocument, TaxFormType } from "@/lib/models/TaxComplianceDocument";
import CapTable from "@/lib/models/CapTable";
import Notification from "@/lib/models/Notification";
import Startup from "@/lib/models/Startup";
import TaxCreditClaim from "@/lib/models/TaxCreditClaim";
import { decryptSecret } from "@/lib/cryptoUtils";

/**
 * Calculates the statutory IRS Form W-8BEN expiration date:
 * A Form W-8BEN is valid from the date signed through December 31st of the
 * 3rd succeeding calendar year (Treas. Reg. § 1.1441-1(e)(4)(ii)).
 */
export function calculateW8ExpirationDate(dateSigned: Date | string): Date {
  const signed = new Date(dateSigned);
  const signedYear = signed.getFullYear();
  // 3 succeeding calendar years -> December 31st 23:59:59 UTC
  const expirationYear = signedYear + 3;
  return new Date(Date.UTC(expirationYear, 11, 31, 23, 59, 59));
}

/**
 * Mask a Tax Identification Number (TIN/SSN/EIN) for secure UI display
 * e.g., "12-3456789" -> "••-•••6789"
 * Handles both plaintext and AES-256-GCM cipher strings safely.
 */
export function maskTaxId(taxId?: string): string {
  if (!taxId) return "Not Provided";
  let plain = taxId;
  if (taxId.includes(":") && taxId.split(":").length === 3) {
    try {
      plain = decryptSecret(taxId);
    } catch {
      plain = taxId;
    }
  }
  const cleaned = plain.trim();
  if (cleaned.length <= 4) return `••••${cleaned}`;
  const visible = cleaned.slice(-4);
  return `••-•••${visible}`;
}

export interface ExpirationAuditReport {
  scanned_count: number;
  expiring_soon_count: number;
  expired_count: number;
  renewals_triggered_count: number;
  flagged_documents: Array<{
    id: string;
    shareholder_name: string;
    form_type: string;
    expires_at: Date;
    status: string;
    days_until_expiration: number;
  }>;
}

/**
 * Audits all tax documents for a startup, updating statuses to 'expiring_soon' (<90 days)
 * or 'expired' based on current date, and optionally dispatches reminder notifications.
 */
export async function auditTaxDocumentExpirations({
  startupId,
  userId,
  triggerRenewals = false,
}: {
  startupId: string;
  userId?: string;
  triggerRenewals?: boolean;
}): Promise<ExpirationAuditReport> {
  await connectDB();

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const documents = await TaxComplianceDocument.find({
    startup_id: new mongoose.Types.ObjectId(startupId),
  });

  let expiringSoonCount = 0;
  let expiredCount = 0;
  let renewalsTriggered = 0;
  const flaggedDocs: ExpirationAuditReport["flagged_documents"] = [];

  for (const doc of documents) {
    if (!doc.expires_at) continue;

    const expiryTime = new Date(doc.expires_at).getTime();
    const diffMs = expiryTime - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let updatedStatus = doc.status;

    if (diffMs <= 0) {
      updatedStatus = "expired";
      expiredCount++;
      flaggedDocs.push({
        id: doc._id.toString(),
        shareholder_name: doc.shareholder_name,
        form_type: doc.form_type,
        expires_at: doc.expires_at,
        status: "expired",
        days_until_expiration: daysUntilExpiry,
      });
    } else if (expiryTime <= ninetyDaysFromNow.getTime()) {
      updatedStatus = "expiring_soon";
      expiringSoonCount++;
      flaggedDocs.push({
        id: doc._id.toString(),
        shareholder_name: doc.shareholder_name,
        form_type: doc.form_type,
        expires_at: doc.expires_at,
        status: "expiring_soon",
        days_until_expiration: daysUntilExpiry,
      });
    }

    if (updatedStatus !== doc.status) {
      doc.status = updatedStatus;
      await doc.save();

      // Sync status back to CapTable shareholder record if linked
      if (doc.shareholder_id) {
        await CapTable.findByIdAndUpdate(doc.shareholder_id, {
          $set: {
            tax_status: updatedStatus,
            tax_form_id: doc._id,
          },
        });
      }
    }

    // Trigger renewal notification if requested and flagged
    if (triggerRenewals && (updatedStatus === "expired" || updatedStatus === "expiring_soon")) {
      doc.last_reminder_sent_at = new Date();
      await doc.save();
      renewalsTriggered++;

      if (userId) {
        try {
          await Notification.create({
            recipient_id: new mongoose.Types.ObjectId(userId),
            title: `Tax Form Renewal Request: ${doc.shareholder_name}`,
            message: `Investor tax document (${doc.form_type}) for ${doc.shareholder_name} is ${updatedStatus === "expired" ? "expired" : "expiring soon"}. A renewal certificate has been requested.`,
            type: "system",
            link: "/dashboard/captable",
          });
        } catch (e) {
          console.warn("Failed to create in-app notification:", e);
        }
      }
    }
  }

  return {
    scanned_count: documents.length,
    expiring_soon_count: expiringSoonCount,
    expired_count: expiredCount,
    renewals_triggered_count: renewalsTriggered,
    flagged_documents: flaggedDocs,
  };
}

/**
 * Generates formatted 1099/K-1 Preparation CSV for investor distributions and CPA reporting
 */
export async function generate1099K1PreparationCsv(startupId: string): Promise<string> {
  await connectDB();

  const documents = await TaxComplianceDocument.find({
    startup_id: new mongoose.Types.ObjectId(startupId),
  }).sort({ shareholder_name: 1 }).lean();

  const headers = [
    "Shareholder Legal Name",
    "Email",
    "Form Type",
    "US Person (Y/N)",
    "Country of Tax Residence",
    "Tax ID (Masked)",
    "Treaty Benefits Claimed",
    "Treaty Withholding Rate (%)",
    "Date Signed",
    "Expiration Date",
    "Compliance Status",
  ];

  const rows = documents.map((doc: any) => {
    const signedStr = doc.date_signed ? new Date(doc.date_signed).toISOString().split("T")[0] : "N/A";
    const expireStr = doc.expires_at ? new Date(doc.expires_at).toISOString().split("T")[0] : "N/A";
    return [
      `"${doc.shareholder_name || ""}"`,
      `"${doc.shareholder_email || ""}"`,
      `"${doc.form_type || "W-9"}"`,
      doc.is_us_person ? "Y" : "N",
      `"${doc.country_of_tax_residence || "United States"}"`,
      `"${maskTaxId(doc.tax_id_number)}"`,
      doc.treaty_benefits_claimed ? "Y" : "N",
      doc.treaty_rate_pct ? `${doc.treaty_rate_pct}%` : "0%",
      signedStr,
      expireStr,
      `"${(doc.status || "requested").toUpperCase()}"`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export interface CpaTaxAuditPackage {
  metadata: {
    package_id: string;
    generated_at: string;
    officer_email: string;
    startup_name: string;
    startup_id: string;
    incorporation_country: string;
    tax_year: number;
    audit_standard: string;
  };
  compliance_summary: {
    total_shareholders: number;
    w9_verified_count: number;
    w8_verified_count: number;
    expiring_soon_count: number;
    expired_count: number;
    unverified_count: number;
    withholding_compliance_rate_pct: number;
  };
  investor_tax_schedule: Array<{
    shareholder_name: string;
    shareholder_email?: string;
    form_type: string;
    tax_residence: string;
    tax_id_masked: string;
    treaty_benefits_claimed: boolean;
    treaty_country?: string;
    treaty_withholding_rate_pct: number;
    date_signed?: string;
    expires_at?: string;
    status: string;
    shares_count?: number;
    ownership_pct?: number;
  }>;
  w8_expiration_audit_trail: Array<{
    shareholder_name: string;
    form_type: string;
    expires_at: string;
    days_until_expiration: number;
    status: string;
    action_recommended: string;
  }>;
  rd_tax_credits: {
    claims_count: number;
    total_us_offset_claimed: number;
    total_uk_benefit_claimed: number;
    claims: any[];
  };
  tamper_evident_integrity: {
    algorithm: "HMAC-SHA256";
    digest_signature: string;
    payload_hash: string;
  };
}

/**
 * Generates an institutional-grade, tamper-evident Tax Compliance Audit Package for CPAs.
 * Consolidates Cap Table Form 1099/K-1 schedules, Form W-8BEN statutory expirations,
 * and US Section 41 / UK HMRC ERIS R&D tax credit study filings.
 */
export async function generateCpaTaxAuditPackage(
  startupId: string,
  officerEmail = "finance@foundex.ai"
): Promise<CpaTaxAuditPackage> {
  await connectDB();

  const startup = await Startup.findById(startupId).lean();
  if (!startup) throw new Error("Startup not found");

  const [documents, capEntries, rdClaims] = await Promise.all([
    TaxComplianceDocument.find({ startup_id: new mongoose.Types.ObjectId(startupId) })
      .sort({ shareholder_name: 1 })
      .lean(),
    CapTable.find({ startup_id: new mongoose.Types.ObjectId(startupId) }).lean(),
    TaxCreditClaim.find({ startup_id: new mongoose.Types.ObjectId(startupId) })
      .sort({ created_at: -1 })
      .lean(),
  ]);

  const now = new Date();
  const currentTaxYear = now.getFullYear();

  // Compute Cap Table ownership map
  const capMap = new Map<string, { shares: number; percentage: number }>();
  for (const cap of capEntries) {
    capMap.set(cap._id.toString(), {
      shares: cap.shares || 0,
      percentage: cap.ownership_percentage || 0,
    });
  }

  // Summary tallies
  const totalShareholders = documents.length;
  const w9Verified = documents.filter((d: any) => d.form_type === "W-9" && d.status === "verified").length;
  const w8Verified = documents.filter((d: any) => d.form_type.startsWith("W-8") && d.status === "verified").length;
  const expiringSoon = documents.filter((d: any) => d.status === "expiring_soon").length;
  const expired = documents.filter((d: any) => d.status === "expired").length;
  const unverified = documents.filter((d: any) => d.status === "requested" || d.status === "submitted").length;

  const verifiedCount = w9Verified + w8Verified;
  const complianceRate = totalShareholders > 0 ? Math.round((verifiedCount / totalShareholders) * 100) : 0;

  // Build Investor Tax Schedule
  const investorSchedule = documents.map((doc: any) => {
    const capInfo = doc.shareholder_id ? capMap.get(doc.shareholder_id.toString()) : undefined;
    return {
      shareholder_name: doc.shareholder_name,
      shareholder_email: doc.shareholder_email,
      form_type: doc.form_type,
      tax_residence: doc.country_of_tax_residence || "United States",
      tax_id_masked: maskTaxId(doc.tax_id_number),
      treaty_benefits_claimed: !!doc.treaty_benefits_claimed,
      treaty_country: doc.treaty_country,
      treaty_withholding_rate_pct: doc.treaty_rate_pct ?? (doc.is_us_person ? 0 : 30),
      date_signed: doc.date_signed ? new Date(doc.date_signed).toISOString().split("T")[0] : undefined,
      expires_at: doc.expires_at ? new Date(doc.expires_at).toISOString().split("T")[0] : undefined,
      status: doc.status,
      shares_count: capInfo?.shares,
      ownership_pct: capInfo?.percentage,
    };
  });

  // Build W-8BEN Expiration Audit Trail
  const expirationTrail = documents
    .filter((doc: any) => doc.form_type.startsWith("W-8") && doc.expires_at)
    .map((doc: any) => {
      const expDate = new Date(doc.expires_at);
      const diffMs = expDate.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        shareholder_name: doc.shareholder_name,
        form_type: doc.form_type,
        expires_at: expDate.toISOString().split("T")[0],
        days_until_expiration: days,
        status: doc.status,
        action_recommended:
          days <= 0
            ? "Certificate expired. Withhold 30% statutory tax under Chapter 3 / FATCA until Form W-8BEN renewal is executed."
            : days <= 90
            ? "Expiring within 90 days. Issue Form W-8BEN renewal notice to maintain tax treaty benefits."
            : "Valid certification under Treas. Reg. § 1.1441-1.",
      };
    });

  // Calculate R&D Tax Credit summaries
  let totalUsOffset = 0;
  let totalUkBenefit = 0;
  for (const claim of rdClaims) {
    if (claim.country === "US" && claim.us_details?.claimed_credit_amount) {
      totalUsOffset += claim.us_details.claimed_credit_amount;
    } else if (claim.country === "UK" && claim.uk_details?.payable_tax_credit_amount) {
      totalUkBenefit += claim.uk_details.payable_tax_credit_amount;
    }
  }

  const packageId = `CPA-AUDIT-${startup._id.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const generatedAt = new Date().toISOString();

  const auditDataWithoutSig = {
    metadata: {
      package_id: packageId,
      generated_at: generatedAt,
      officer_email: officerEmail,
      startup_name: startup.company_name,
      startup_id: startup._id.toString(),
      incorporation_country: startup.country || "United States",
      tax_year: currentTaxYear,
      audit_standard: "IRS Treas. Reg. § 1.1441-1 & US IRC § 41 / UK HMRC CIRD",
    },
    compliance_summary: {
      total_shareholders: totalShareholders,
      w9_verified_count: w9Verified,
      w8_verified_count: w8Verified,
      expiring_soon_count: expiringSoon,
      expired_count: expired,
      unverified_count: unverified,
      withholding_compliance_rate_pct: complianceRate,
    },
    investor_tax_schedule: investorSchedule,
    w8_expiration_audit_trail: expirationTrail,
    rd_tax_credits: {
      claims_count: rdClaims.length,
      total_us_offset_claimed: Math.round(totalUsOffset),
      total_uk_benefit_claimed: Math.round(totalUkBenefit),
      claims: rdClaims,
    },
  };

  const rawJson = JSON.stringify(auditDataWithoutSig);
  const payloadHash = crypto.createHash("sha256").update(rawJson).digest("hex");
  const hmacKey = process.env.JWT_SECRET || "foundex-tax-compliance-master-salt";
  const digestSignature = crypto.createHmac("sha256", hmacKey).update(payloadHash).digest("hex");

  return {
    ...auditDataWithoutSig,
    tamper_evident_integrity: {
      algorithm: "HMAC-SHA256",
      digest_signature: digestSignature,
      payload_hash: payloadHash,
    },
  };
}

