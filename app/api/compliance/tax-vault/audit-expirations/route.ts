import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import { auditTaxDocumentExpirations } from "@/lib/taxComplianceService";

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const { startup_id, trigger_renewals = false } = body;

    if (!startup_id) {
      return NextResponse.json({ error: "Missing startup_id" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startup_id),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const auditResult = await auditTaxDocumentExpirations({
      startupId: startup_id,
      userId,
      triggerRenewals: Boolean(trigger_renewals),
    });

    return NextResponse.json({
      success: true,
      report: auditResult,
      message: `Audit completed. ${auditResult.scanned_count} documents analyzed. ${auditResult.expiring_soon_count} expiring soon, ${auditResult.expired_count} expired. ${auditResult.renewals_triggered_count} renewal requests sent.`,
    });
  } catch (error: any) {
    console.error("POST /api/compliance/tax-vault/audit-expirations error:", error);
    return NextResponse.json({ error: error.message || "Failed to audit tax document expirations" }, { status: 500 });
  }
}
