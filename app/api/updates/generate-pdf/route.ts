import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import InvestorUpdate from "@/lib/models/InvestorUpdate";
import Startup from "@/lib/models/Startup";
// @ts-ignore
import PDFDocument from "pdfkit";

async function getUserId(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Also support token in query params for easy PDF download links if needed
    const { searchParams } = new URL(req.url);
    const queryToken = searchParams.get("token");
    if (queryToken) {
      const payload: any = await verifyToken(queryToken);
      return payload.user._id;
    }
    throw new Error("No token");
  }
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const updateId = searchParams.get("id");

    if (!updateId) {
      return NextResponse.json(
        { error: "Update ID is required" },
        { status: 400 },
      );
    }

    // Verify token & user ID
    let userId;
    try {
      userId = await getUserId(req);
    } catch (err) {
      return NextResponse.json(
        { error: "Unauthorized access token" },
        { status: 401 },
      );
    }

    // Fetch the investor update
    const update = await InvestorUpdate.findById(updateId);
    if (!update) {
      return NextResponse.json(
        { error: "Investor update not found" },
        { status: 404 },
      );
    }

    // Fetch the associated startup to verify ownership & get company details
    const startup = await Startup.findById(update.startup_id);
    if (!startup) {
      return NextResponse.json(
        { error: "Startup profile not found" },
        { status: 404 },
      );
    }

    // Ensure user owns this startup
    if (startup.user_id && startup.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate PDF via PDFKit
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));

    // Wait for the document generation to finish
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // -------------------------------------------------------------
    // PDF DESIGN & LAYOUT
    // -------------------------------------------------------------
    const primaryColor = "#0F172A"; // Slate 900
    const secondaryColor = "#475569"; // Slate 600
    const accentColor = "#D97706"; // Amber 600
    const bgLightColor = "#F8FAFC"; // Slate 50
    const dividerColor = "#E2E8F0"; // Slate 200

    // Header Panel
    doc.rect(50, 40, 495, 110).fill(primaryColor);

    doc
      .fillColor("#FFFFFF")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("MONTHLY INVESTOR REPORT", 70, 60);
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(startup.company_name.toUpperCase(), 70, 75);

    doc
      .fillColor("#94A3B8")
      .fontSize(10)
      .font("Helvetica")
      .text("REPORTING PERIOD:", 360, 60);
    doc
      .fillColor("#FFFFFF")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(update.month, 360, 75);

    doc
      .fillColor("#FFFFFF")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(update.title, 70, 115, { width: 450 });

    // Financial KPI Cards
    const cardY = 170;
    const cardWidth = 155;
    const cardHeight = 65;

    // Card 1: MRR
    doc
      .rect(50, cardY, cardWidth, cardHeight)
      .fill(bgLightColor)
      .strokeColor(dividerColor)
      .lineWidth(1)
      .stroke();
    doc
      .fillColor(secondaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("MONTHLY RECURRING REVENUE", 60, cardY + 15);
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`$${(update.metrics?.mrr || 0).toLocaleString()}`, 60, cardY + 32);

    // Card 2: Cash in Bank
    doc
      .rect(220, cardY, cardWidth, cardHeight)
      .fill(bgLightColor)
      .strokeColor(dividerColor)
      .lineWidth(1)
      .stroke();
    doc
      .fillColor(secondaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("CASH ON HAND", 230, cardY + 15);
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(
        `$${(update.metrics?.cash_in_bank || 0).toLocaleString()}`,
        230,
        cardY + 32,
      );

    // Card 3: Runway
    doc
      .rect(390, cardY, cardWidth, cardHeight)
      .fill(bgLightColor)
      .strokeColor(dividerColor)
      .lineWidth(1)
      .stroke();
    doc
      .fillColor(secondaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("ESTIMATED RUNWAY", 400, cardY + 15);
    doc
      .fillColor(accentColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${update.metrics?.runway_months || 0} Months`, 400, cardY + 32);

    let nextY = 260;

    // Highlights Section
    if (update.kpis?.highlights) {
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("🚀 Key Highlights & Wins", 50, nextY);
      doc
        .moveTo(50, nextY + 16)
        .lineTo(545, nextY + 16)
        .strokeColor(dividerColor)
        .lineWidth(0.5)
        .stroke();
      doc
        .fillColor("#1E293B")
        .fontSize(10)
        .font("Helvetica")
        .text(update.kpis.highlights, 50, nextY + 25, {
          width: 495,
          lineGap: 4,
        });

      const height = doc.heightOfString(update.kpis.highlights, {
        width: 495,
        lineGap: 4,
      });
      nextY = nextY + 35 + height;
    }

    // Lowlights Section
    if (update.kpis?.lowlights) {
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("⚠️ Roadblocks & Challenges", 50, nextY);
      doc
        .moveTo(50, nextY + 16)
        .lineTo(545, nextY + 16)
        .strokeColor(dividerColor)
        .lineWidth(0.5)
        .stroke();
      doc
        .fillColor("#1E293B")
        .fontSize(10)
        .font("Helvetica")
        .text(update.kpis.lowlights, 50, nextY + 25, {
          width: 495,
          lineGap: 4,
        });

      const height = doc.heightOfString(update.kpis.lowlights, {
        width: 495,
        lineGap: 4,
      });
      nextY = nextY + 35 + height;
    }

    // Help Needed Section
    if (update.kpis?.help_needed) {
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("🤝 Help Needed", 50, nextY);
      doc
        .moveTo(50, nextY + 16)
        .lineTo(545, nextY + 16)
        .strokeColor(dividerColor)
        .lineWidth(0.5)
        .stroke();
      doc
        .fillColor("#1E293B")
        .fontSize(10)
        .font("Helvetica")
        .text(update.kpis.help_needed, 50, nextY + 25, {
          width: 495,
          lineGap: 4,
        });

      const height = doc.heightOfString(update.kpis.help_needed, {
        width: 495,
        lineGap: 4,
      });
      nextY = nextY + 35 + height;
    }

    // Narrative Section
    if (update.body) {
      // Check page break headroom
      if (nextY > 650) {
        doc.addPage();
        nextY = 50;
      }
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("📝 Founder Narrative & Notes", 50, nextY);
      doc
        .moveTo(50, nextY + 16)
        .lineTo(545, nextY + 16)
        .strokeColor(dividerColor)
        .lineWidth(0.5)
        .stroke();
      doc
        .fillColor("#334155")
        .fontSize(10)
        .font("Helvetica")
        .text(update.body, 50, nextY + 25, { width: 495, lineGap: 5 });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.rect(50, 780, 495, 0.5).fill(dividerColor);
      doc
        .fillColor("#94A3B8")
        .fontSize(8)
        .font("Helvetica")
        .text(`Page ${i + 1} of ${pages.count}`, 50, 790);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} via FoundexAI`,
        380,
        790,
      );
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Investor_Update_${update.month}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF compiling error:", err);
    return NextResponse.json(
      { error: "Failed to compile PDF: " + err.message },
      { status: 550 },
    );
  }
}
