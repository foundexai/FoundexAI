import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import TaxComplianceDocument, { ITaxComplianceDocument, TaxFormType } from "@/lib/models/TaxComplianceDocument";
import CapTable from "@/lib/models/CapTable";
import Notification from "@/lib/models/Notification";

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
 */
export function maskTaxId(taxId?: string): string {
  if (!taxId) return "Not Provided";
  const cleaned = taxId.trim();
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
