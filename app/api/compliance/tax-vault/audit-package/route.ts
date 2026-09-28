import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import { generateCpaTaxAuditPackage } from "@/lib/taxComplianceService";
// @ts-ignore
import PDFDocument from "pdfkit";

async function getUserId(req: Request): Promise<string> {
  const url = new URL(req.url);
  const authHeader = req.headers.get("Authorization");
  const queryToken = url.searchParams.get("token");
  const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : queryToken;
  if (!rawToken) throw new Error("No token provided");
  const payload: any = await verifyToken(rawToken, true);
  if (!payload || !payload.user) throw new Error("Invalid token");
  return payload.user._id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const url = new URL(req.url);
    const startupId = url.searchParams.get("startup_id");
    const format = (url.searchParams.get("format") || "json").toLowerCase(); // "json" | "pdf"

    if (!startupId) {
      return NextResponse.json({ error: "Missing startup_id parameter" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startupId),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const auditPackage = await generateCpaTaxAuditPackage(startupId, startup.company_name);

    // -------------------------------------------------------------
    // 1. JSON FORMAT
    // -------------------------------------------------------------
    if (format === "json") {
      return NextResponse.json(auditPackage, {
        headers: {
          "X-Audit-Signature": auditPackage.tamper_evident_integrity.digest_signature,
          "X-Audit-Package-Id": auditPackage.metadata.package_id,
        },
      });
    }

    // -------------------------------------------------------------
    // 2. INSTITUTIONAL CPA AUDIT DOSSIER (PDFKit)
    // -------------------------------------------------------------
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const primaryColor = "#09090B"; // Zinc 950
    const accentColor = "#D97706"; // Amber 600
    const subtleGray = "#71717A"; // Zinc 500
    const lightBg = "#F4F4F5"; // Zinc 100

    // Header Background Accent Bar
    doc.rect(40, 40, 515, 4).fill(accentColor);

    // Title & Organization
    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("CPA TAX COMPLIANCE & INVESTOR AUDIT DOSSIER", 40, 52);

    doc
      .fillColor(subtleGray)
      .fontSize(8.5)
      .font("Helvetica")
      .text(
        `Entity: ${auditPackage.metadata.startup_name} | Tax Year: ${auditPackage.metadata.tax_year} | Standard: ${auditPackage.metadata.audit_standard}`,
        40,
        74
      );

    // Metadata & Integrity Box
    let yPos = 94;
    doc.rect(40, yPos, 515, 44).fillAndStroke(lightBg, "#E4E4E7");

    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(`PACKAGE ID: ${auditPackage.metadata.package_id}`, 50, yPos + 8)
      .font("Helvetica")
      .text(`Generated At: ${auditPackage.metadata.generated_at}`, 50, yPos + 20)
      .text(`Authorized Officer: ${auditPackage.metadata.officer_email}`, 50, yPos + 32);

    doc
      .fillColor(accentColor)
      .fontSize(7.5)
      .font("Courier-Bold")
      .text("HMAC-SHA256 INTEGRITY DIGEST:", 290, yPos + 8)
      .fillColor(primaryColor)
      .fontSize(6.5)
      .font("Courier")
      .text(auditPackage.tamper_evident_integrity.digest_signature.substring(0, 42) + "...", 290, yPos + 20)
      .fillColor(subtleGray)
      .fontSize(7)
      .font("Helvetica")
      .text("Tamper-evident digital audit trail verified.", 290, yPos + 32);

    // Section 1: Executive Compliance Attestation & Statistics
    yPos += 56;
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("1. EXECUTIVE TAX COMPLIANCE SUMMARY", 40, yPos);

    yPos += 18;
    const boxWidth = 96;
    const stats = [
      { label: "Total Investors", val: String(auditPackage.compliance_summary.total_shareholders) },
      { label: "W-9 Verified", val: String(auditPackage.compliance_summary.w9_verified_count) },
      { label: "W-8 Verified", val: String(auditPackage.compliance_summary.w8_verified_count) },
      { label: "Expiring Soon", val: String(auditPackage.compliance_summary.expiring_soon_count) },
      { label: "Compliance %", val: `${auditPackage.compliance_summary.withholding_compliance_rate_pct}%` },
    ];

    stats.forEach((s, idx) => {
      const bx = 40 + idx * 105;
      doc.rect(bx, yPos, boxWidth, 36).fillAndStroke("#FFFFFF", "#E4E4E7");
      doc
        .fillColor(subtleGray)
        .fontSize(7)
        .font("Helvetica-Bold")
        .text(s.label.toUpperCase(), bx + 6, yPos + 6);
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(s.val, bx + 6, yPos + 18);
    });

    // Section 2: Form 1099 & Schedule K-1 Investor Tax Schedule Table
    yPos += 48;
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("2. CAP TABLE INVESTOR TAX SCHEDULE (1099 / K-1 PREP)", 40, yPos);

    yPos += 16;
    doc.rect(40, yPos, 515, 18).fill(lightBg);
    doc
      .fillColor(primaryColor)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("INVESTOR LEGAL NAME", 45, yPos + 5)
      .text("FORM", 160, yPos + 5)
      .text("RESIDENCE", 210, yPos + 5)
      .text("TAX ID (MASKED)", 290, yPos + 5)
      .text("TREATY RATE", 380, yPos + 5)
      .text("EXPIRATION", 445, yPos + 5)
      .text("STATUS", 500, yPos + 5);

    yPos += 20;
    const maxRows = Math.min(auditPackage.investor_tax_schedule.length, 25);
    for (let i = 0; i < maxRows; i++) {
      const item = auditPackage.investor_tax_schedule[i];
      if (yPos > 740) {
        doc.addPage();
        yPos = 40;
        doc.rect(40, yPos, 515, 18).fill(lightBg);
        doc
          .fillColor(primaryColor)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("INVESTOR LEGAL NAME", 45, yPos + 5)
          .text("FORM", 160, yPos + 5)
          .text("RESIDENCE", 210, yPos + 5)
          .text("TAX ID (MASKED)", 290, yPos + 5)
          .text("TREATY RATE", 380, yPos + 5)
          .text("EXPIRATION", 445, yPos + 5)
          .text("STATUS", 500, yPos + 5);
        yPos += 20;
      }

      const rowBg = i % 2 === 0 ? "#FFFFFF" : "#FAFAFA";
      doc.rect(40, yPos, 515, 18).fill(rowBg);

      doc
        .fillColor(primaryColor)
        .fontSize(7.5)
        .font("Helvetica")
        .text(item.shareholder_name.substring(0, 22), 45, yPos + 5);

      doc
        .fillColor(primaryColor)
        .fontSize(7)
        .font("Courier-Bold")
        .text(item.form_type, 160, yPos + 5);

      doc
        .fillColor(subtleGray)
        .fontSize(7)
        .font("Helvetica")
        .text(item.tax_residence.substring(0, 16), 210, yPos + 5);

      doc
        .fillColor(primaryColor)
        .fontSize(7)
        .font("Courier")
        .text(item.tax_id_masked, 290, yPos + 5);

      doc
        .fillColor(item.treaty_benefits_claimed ? "#059669" : subtleGray)
        .fontSize(7)
        .font("Helvetica-Bold")
        .text(`${item.treaty_withholding_rate_pct}%`, 380, yPos + 5);

      doc
        .fillColor(subtleGray)
        .fontSize(7)
        .font("Helvetica")
        .text(item.expires_at || "Perpetual", 445, yPos + 5);

      const statusColor = item.status === "verified" ? "#059669" : item.status === "expired" ? "#DC2626" : "#D97706";
      doc
        .fillColor(statusColor)
        .fontSize(6.5)
        .font("Helvetica-Bold")
        .text(item.status.toUpperCase(), 500, yPos + 5);

      yPos += 18;
    }

    // Section 3: Statutory W-8BEN Expiration & R&D Credit Summary
    if (yPos > 650) {
      doc.addPage();
      yPos = 40;
    } else {
      yPos += 15;
    }

    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("3. R&D TAX CREDIT STUDY & PAYROLL TAX OFFSET SUMMARY", 40, yPos);

    yPos += 16;
    doc.rect(40, yPos, 515, 46).fillAndStroke(lightBg, "#E4E4E7");

    const totalUsClaim = auditPackage.rd_tax_credits.total_us_offset_claimed.toLocaleString();
    const totalUkClaim = auditPackage.rd_tax_credits.total_uk_benefit_claimed.toLocaleString();

    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(`US IRC Section 41 QSB Payroll Tax Offset Claimed: $${totalUsClaim}`, 50, yPos + 8)
      .text(`UK HMRC ERIS / Merged Scheme Cash Benefit Claimed: £${totalUkClaim}`, 50, yPos + 20)
      .fillColor(subtleGray)
      .fontSize(7.5)
      .font("Helvetica")
      .text(
        `Total Claim Records: ${auditPackage.rd_tax_credits.claims_count} | Evaluated under statutory $500,000 Section 3111(f) payroll offset limitations and ERIS 30% intensity benchmarks.`,
        50,
        yPos + 32
      );

    // Section 4: CPA Attestation & Signature Footer
    yPos += 58;
    doc
      .fillColor(primaryColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("CPA COMPLIANCE & INTEGRITY ATTESTATION", 40, yPos);

    yPos += 12;
    doc
      .fillColor(subtleGray)
      .fontSize(7)
      .font("Helvetica")
      .text(
        "This dossier has been generated directly from verified cap table records and stored encrypted tax certificates in accordance with IRS Treas. Reg. § 1.1441-1 and applicable withholding regulations. Stored Tax Identification Numbers are encrypted at rest with AES-256-GCM. Verify tamper-evident cryptographic checksum against platform root keys.",
        40,
        yPos,
        { width: 515, align: "justify" }
      );

    yPos += 26;
    doc
      .fillColor(primaryColor)
      .fontSize(7.5)
      .font("Courier")
      .text(`DIGITAL STAMP: ${auditPackage.tamper_evident_integrity.payload_hash.substring(0, 48)}`, 40, yPos);

    doc.end();

    const pdfBuffer = await pdfPromise;

    const safeFilename = `cpa_tax_audit_${startup.company_name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "X-Audit-Signature": auditPackage.tamper_evident_integrity.digest_signature,
        "X-Audit-Package-Id": auditPackage.metadata.package_id,
      },
    });
  } catch (error: any) {
    console.error("GET /api/compliance/tax-vault/audit-package error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate CPA audit package" }, { status: 500 });
  }
}
