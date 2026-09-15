import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";
import TaxComplianceDocument, { ComplianceStatus, TaxFormType } from "@/lib/models/TaxComplianceDocument";
import { calculateW8ExpirationDate, generate1099K1PreparationCsv } from "@/lib/taxComplianceService";

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startup_id");
    const exportFormat = searchParams.get("export"); // "csv"

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

    // CSV Export Workflow
    if (exportFormat === "csv") {
      const csvData = await generate1099K1PreparationCsv(startupId);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="foundex_investor_tax_prep_${startup.company_name.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
        },
      });
    }

    const documents = await TaxComplianceDocument.find({
      startup_id: new mongoose.Types.ObjectId(startupId),
    }).sort({ created_at: -1 });

    // Compliance Summary Metrics
    const totalCount = documents.length;
    const verifiedCount = documents.filter((d) => d.status === "verified").length;
    const requestedCount = documents.filter((d) => d.status === "requested" || d.status === "submitted").length;
    const expiringSoonCount = documents.filter((d) => d.status === "expiring_soon").length;
    const expiredCount = documents.filter((d) => d.status === "expired").length;

    const w9Count = documents.filter((d) => d.form_type === "W-9").length;
    const w8Count = documents.filter((d) => d.form_type.startsWith("W-8")).length;

    return NextResponse.json({
      documents,
      metrics: {
        total_documents: totalCount,
        verified_count: verifiedCount,
        pending_action_count: requestedCount,
        expiring_soon_count: expiringSoonCount,
        expired_count: expiredCount,
        w9_count: w9Count,
        w8_count: w8Count,
        compliance_rate_pct: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/compliance/tax-vault error:", error);
    return NextResponse.json({ error: "Failed to fetch tax compliance documents" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const {
      startup_id,
      shareholder_id,
      shareholder_name,
      shareholder_email,
      form_type = "W-9",
      tax_id_number,
      country_of_tax_residence = "United States",
      is_us_person = true,
      treaty_benefits_claimed = false,
      treaty_country,
      treaty_rate_pct = 0,
      status = "requested",
      date_signed,
      notes,
    } = body;

    if (!startup_id || !shareholder_name) {
      return NextResponse.json({ error: "Missing required fields (startup_id, shareholder_name)" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startup_id),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    // Auto calculate expiration date for Form W-8BEN (3-year calendar year rule)
    let calculatedExpiration: Date | undefined = undefined;
    if (form_type.startsWith("W-8") && date_signed) {
      calculatedExpiration = calculateW8ExpirationDate(date_signed);
    }

    const doc = await TaxComplianceDocument.create({
      startup_id: new mongoose.Types.ObjectId(startup_id),
      shareholder_id: shareholder_id ? new mongoose.Types.ObjectId(shareholder_id) : undefined,
      shareholder_name,
      shareholder_email,
      form_type: form_type as TaxFormType,
      tax_id_number,
      country_of_tax_residence,
      is_us_person,
      treaty_benefits_claimed,
      treaty_country,
      treaty_rate_pct,
      status: status as ComplianceStatus,
      date_signed: date_signed ? new Date(date_signed) : undefined,
      expires_at: calculatedExpiration,
      notes,
    });

    // Update shareholder record in Cap Table if present
    if (shareholder_id) {
      const capStatus = status === "verified"
        ? (form_type === "W-9" ? "w9_verified" : "w8_verified")
        : "pending";

      await CapTable.findByIdAndUpdate(shareholder_id, {
        $set: {
          tax_status: capStatus,
          tax_form_id: doc._id,
          tax_residence_country: country_of_tax_residence,
        },
      });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("POST /api/compliance/tax-vault error:", error);
    return NextResponse.json({ error: error.message || "Failed to create tax document" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const { id, startup_id, status, tax_id_number, date_signed, certified_by, notes } = body;

    if (!id || !startup_id) {
      return NextResponse.json({ error: "Missing document id or startup_id" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startup_id),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const doc = await TaxComplianceDocument.findOne({
      _id: new mongoose.Types.ObjectId(id),
      startup_id: new mongoose.Types.ObjectId(startup_id),
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (status) doc.status = status;
    if (tax_id_number !== undefined) doc.tax_id_number = tax_id_number;
    if (certified_by) doc.certified_by = certified_by;
    if (notes !== undefined) doc.notes = notes;

    if (date_signed) {
      doc.date_signed = new Date(date_signed);
      if (doc.form_type.startsWith("W-8")) {
        doc.expires_at = calculateW8ExpirationDate(date_signed);
      }
    }

    await doc.save();

    // Sync status to linked cap table record
    if (doc.shareholder_id) {
      const capStatus = doc.status === "verified"
        ? (doc.form_type === "W-9" ? "w9_verified" : "w8_verified")
        : (doc.status === "expired" ? "expired" : (doc.status === "expiring_soon" ? "expiring_soon" : "pending"));

      await CapTable.findByIdAndUpdate(doc.shareholder_id, {
        $set: {
          tax_status: capStatus,
          tax_form_id: doc._id,
        },
      });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("PATCH /api/compliance/tax-vault error:", error);
    return NextResponse.json({ error: error.message || "Failed to update tax document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const startupId = searchParams.get("startup_id");

    if (!id || !startupId) {
      return NextResponse.json({ error: "Missing document id or startup_id" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startupId),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const doc = await TaxComplianceDocument.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      startup_id: new mongoose.Types.ObjectId(startupId),
    });

    if (doc?.shareholder_id) {
      await CapTable.findByIdAndUpdate(doc.shareholder_id, {
        $set: { tax_status: "pending", tax_form_id: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/compliance/tax-vault error:", error);
    return NextResponse.json({ error: "Failed to delete tax document" }, { status: 500 });
  }
}
