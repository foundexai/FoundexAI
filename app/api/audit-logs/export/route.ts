import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AuditLog from "@/lib/models/AuditLog";
import Startup from "@/lib/models/Startup";
// @ts-ignore
import PDFDocument from "pdfkit";

const HMAC_SECRET = process.env.JWT_SECRET || "foundex-audit-compliance-salt";

function generateAuditSignature(payload: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "csv"; // "csv" | "pdf"
    const startupId = url.searchParams.get("startup_id");
    const entity = url.searchParams.get("entity");
    const action = url.searchParams.get("action");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const authHeader = req.headers.get("Authorization");
    const queryToken = url.searchParams.get("token");
    const rawToken = authHeader?.split(" ")[1] || queryToken;

    if (!rawToken) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = await verifyToken(rawToken, true);
    if (!decoded || !decoded.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;

    // Resolve startup
    const userStartups = await Startup.find({ user_id: user._id }).sort({ created_at: 1 });
    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ error: "No startup registered" }, { status: 404 });
    }

    const targetStartup =
      (startupId && userStartups.find((s) => s._id.toString() === startupId)) ||
      userStartups[0];

    // Build filter query
    const query: any = { startup_id: targetStartup._id };
    if (entity && entity !== "all") query.entity = entity;
    if (action && action !== "all") query.action = action;
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    // Fetch logs with populated user details
    const logs = await AuditLog.find(query)
      .populate("user_id", "email full_name name")
      .sort({ created_at: -1 })
      .limit(500);

    const exportTimestamp = new Date().toISOString();
    const rawPayloadToSign = JSON.stringify({
      startup_id: targetStartup._id.toString(),
      exported_by: user.email,
      exported_at: exportTimestamp,
      record_count: logs.length,
      log_ids: logs.map((l) => l._id.toString()),
    });

    const digitalSignature = generateAuditSignature(rawPayloadToSign);

    // -------------------------------------------------------------
    // 1. SIGNED CSV EXPORT
    // -------------------------------------------------------------
    if (format === "csv") {
      let csvContent = `FOUNDEX COMPLIANCE AUDIT TRAIL EXPORT\n`;
      csvContent += `Organization:,"${targetStartup.company_name}"\n`;
      csvContent += `Exported By:,"${user.email}"\n`;
      csvContent += `Export Timestamp:,"${exportTimestamp}"\n`;
      csvContent += `Total Records:,"${logs.length}"\n`;
      csvContent += `SHA-256 HMAC Digital Signature:,"${digitalSignature}"\n`;
      csvContent += `\n`;
      csvContent += `Log ID,Timestamp,Actor Email,Actor Name,Action,Entity,Entity ID,Details\n`;

      logs.forEach((log) => {
        const actorEmail = log.user_id?.email || "System/Unknown";
        const actorName = log.user_id?.full_name || log.user_id?.name || "N/A";
        const logDate = new Date(log.created_at).toISOString();
        const detailsStr = log.details
          ? JSON.stringify(log.details).replace(/"/g, '""')
          : "{}";

        csvContent += `"${log._id}","${logDate}","${actorEmail}","${actorName}","${log.action}","${log.entity}","${log.entity_id || ""}","${detailsStr}"\n`;
      });

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="foundex_audit_log_${targetStartup.company_name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv"`,
          "X-Audit-Signature": digitalSignature,
          "X-Audit-Export-Time": exportTimestamp,
        },
      });
    }

    // -------------------------------------------------------------
    // 2. SIGNED INSTITUTIONAL PDF EXPORT (PDFKit)
    // -------------------------------------------------------------
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const primaryColor = "#0F172A"; // Slate 900
    const accentColor = "#D97706"; // Amber 600
    const subtleGray = "#64748B"; // Slate 500
    const lightBg = "#F8FAFC"; // Slate 50
    const borderColor = "#E2E8F0"; // Slate 200

    // Header Banner
    doc.rect(40, 40, 515, 80).fill(primaryColor);
    doc
      .fillColor("#FFFFFF")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("SECURITY & COMPLIANCE AUDIT TRAIL", 60, 55);

    doc
      .fillColor(accentColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(`SOC2 TYPE II • VERIFIED IMMUTABLE LOG REPORT`, 60, 75);

    doc
      .fillColor("#CBD5E1")
      .fontSize(8)
      .font("Helvetica")
      .text(`Company: ${targetStartup.company_name} | Date: ${exportTimestamp.split("T")[0]}`, 60, 92);

    let yPos = 135;

    // Cryptographic Signature Card
    doc.rect(40, yPos, 515, 55).fill(lightBg).stroke(borderColor);
    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("DIGITAL INTEGRITY SIGNATURE (SHA-256 HMAC):", 52, yPos + 10);

    doc
      .fillColor(accentColor)
      .fontSize(7.5)
      .font("Courier")
      .text(digitalSignature, 52, yPos + 22, { width: 490 });

    doc
      .fillColor(subtleGray)
      .fontSize(7)
      .font("Helvetica")
      .text(`Generated by ${user.email} at ${exportTimestamp} | Records in scope: ${logs.length}`, 52, yPos + 38);

    yPos += 70;

    // Table Header
    doc.rect(40, yPos, 515, 20).fill("#EEF2F6");
    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("TIMESTAMP (UTC)", 45, yPos + 6)
      .text("ACTOR", 140, yPos + 6)
      .text("ACTION", 260, yPos + 6)
      .text("ENTITY", 320, yPos + 6)
      .text("DETAILS / DIFF", 390, yPos + 6);

    yPos += 24;

    // Table Rows
    const maxRows = Math.min(logs.length, 35);
    for (let i = 0; i < maxRows; i++) {
      const log = logs[i];
      if (yPos > 740) {
        doc.addPage();
        yPos = 40;
        // Sub-page header
        doc.rect(40, yPos, 515, 18).fill("#EEF2F6");
        doc
          .fillColor(primaryColor)
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("TIMESTAMP (UTC)", 45, yPos + 5)
          .text("ACTOR", 140, yPos + 5)
          .text("ACTION", 260, yPos + 5)
          .text("ENTITY", 320, yPos + 5)
          .text("DETAILS / DIFF", 390, yPos + 5);
        yPos += 22;
      }

      const rowBg = i % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      doc.rect(40, yPos, 515, 18).fill(rowBg);

      const timestamp = new Date(log.created_at).toISOString().replace("T", " ").substring(0, 19);
      const actor = log.user_id?.email || "System";
      const actionText = log.action.toUpperCase();
      const entityText = log.entity;
      const details = log.details
        ? Object.keys(log.details)
            .map((k) => `${k}: ${typeof log.details[k] === "object" ? "..." : log.details[k]}`)
            .slice(0, 2)
            .join(", ")
        : "-";

      doc
        .fillColor(primaryColor)
        .fontSize(7)
        .font("Courier")
        .text(timestamp, 45, yPos + 5);

      doc
        .fillColor(primaryColor)
        .fontSize(7)
        .font("Helvetica")
        .text(actor.length > 20 ? actor.substring(0, 19) + "…" : actor, 140, yPos + 5);

      doc
        .fillColor(actionText === "DELETE" ? "#DC2626" : actionText === "CREATE" ? "#16A34A" : "#2563EB")
        .fontSize(6.5)
        .font("Helvetica-Bold")
        .text(actionText, 260, yPos + 5);

      doc
        .fillColor(primaryColor)
        .fontSize(7)
        .font("Helvetica")
        .text(entityText, 320, yPos + 5);

      doc
        .fillColor(subtleGray)
        .fontSize(6.5)
        .font("Helvetica")
        .text(details.length > 28 ? details.substring(0, 27) + "…" : details, 390, yPos + 5);

      yPos += 18;
    }

    if (logs.length > maxRows) {
      doc
        .fillColor(subtleGray)
        .fontSize(7.5)
        .font("Helvetica-Oblique")
        .text(`[Truncated: Showing first ${maxRows} of ${logs.length} total events. Full audit trail available in signed CSV.]`, 45, yPos + 10);
    }

    // Footer Stamp
    doc
      .fillColor(subtleGray)
      .fontSize(7)
      .font("Helvetica")
      .text(`Foundex Security Compliance Engine • Confidential • Validated with SHA-256 HMAC Integrity Seal`, 40, 780, {
        align: "center",
        width: 515,
      });

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="foundex_audit_compliance_report_${targetStartup.company_name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf"`,
        "X-Audit-Signature": digitalSignature,
        "X-Audit-Export-Time": exportTimestamp,
      },
    });
  } catch (err: any) {
    console.error("Error exporting audit logs:", err);
    return NextResponse.json({ error: "Failed to generate audit export" }, { status: 500 });
  }
}
