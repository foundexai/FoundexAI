import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/lib/models/User";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";
import PipelineDeal from "@/lib/models/PipelineDeal";
import InvestorUpdate from "@/lib/models/InvestorUpdate";
import Note from "@/lib/models/Note";
import Task from "@/lib/models/Task";
import Notification from "@/lib/models/Notification";
import SecureLink from "@/lib/models/SecureLink";
import AuditLog from "@/lib/models/AuditLog";

const HMAC_SECRET = process.env.JWT_SECRET || "foundex-gdpr-archive-salt";

function generateArchiveSignature(payload: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("Authorization");
    const queryToken = url.searchParams.get("token");
    const rawToken = authHeader?.split(" ")[1] || queryToken;

    if (!rawToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(rawToken, true);
    if (!decoded || !decoded.user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    await connectDB();
    const userId = decoded.user._id || decoded.user.id;

    // 1. Fetch User Record (Sanitized, excluding sensitive passwords)
    const user = await User.findById(userId)
      .select("-password -password_hash -__v")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 2. Fetch User's Startups
    const startups = await Startup.find({ user_id: userId })
      .select("-__v")
      .lean();
    const startupIds = startups.map((s) => s._id);

    // 3. Fetch Cap Table Grants across owned startups
    const capTables = await CapTable.find({
      startup_id: { $in: startupIds },
    })
      .select("-__v")
      .lean();

    // 4. Fetch Investor Pipeline Deals & CRM Relationships
    const pipelineDeals = await PipelineDeal.find({
      $or: [{ user_id: userId }, { startup_id: { $in: startupIds } }],
    })
      .select("-__v")
      .lean();

    // 5. Fetch Monthly Investor Updates
    const investorUpdates = await InvestorUpdate.find({
      startup_id: { $in: startupIds },
    })
      .select("-__v")
      .lean();

    // 6. Fetch Notes & Operational Tasks
    const [notes, tasks] = await Promise.all([
      Note.find({
        startup_id: { $in: startupIds },
      })
        .select("-__v")
        .lean(),
      Task.find({
        startup_id: { $in: startupIds },
      })
        .select("-__v")
        .lean(),
    ]);

    // 7. Fetch Notifications
    const notifications = await Notification.find({
      recipient_id: userId,
    })
      .select("-__v")
      .lean();

    // 8. Fetch Secure Links & Deal Rooms (Redact active OTP secret codes)
    const secureLinks = await SecureLink.find({
      founder_id: userId,
    })
      .select("-otp_requests.code -__v")
      .lean();

    // 9. Fetch Audit Logs
    const auditLogs = await AuditLog.find({
      $or: [{ user_id: userId }, { startup_id: { $in: startupIds } }],
    })
      .select("-__v")
      .lean();

    const exportTimestamp = new Date().toISOString();
    const totalRecords =
      1 + // user account
      startups.length +
      capTables.length +
      pipelineDeals.length +
      investorUpdates.length +
      notes.length +
      tasks.length +
      notifications.length +
      secureLinks.length +
      auditLogs.length;

    // Build raw data object
    const archiveData = {
      export_metadata: {
        archive_standard: "GDPR (Regulation EU 2016/679) Article 15 & Article 20 Compliance",
        export_version: "2026.1.0",
        exported_at: exportTimestamp,
        subject_id: userId.toString(),
        subject_email: user.email,
        data_controller: "Foundex Technologies Inc.",
        purpose: "Data Subject Access Request (DSAR) & Right to Portability",
        record_breakdown: {
          account_profile: 1,
          startups: startups.length,
          cap_table_grants: capTables.length,
          pipeline_deals: pipelineDeals.length,
          investor_updates: investorUpdates.length,
          notes: notes.length,
          tasks: tasks.length,
          notifications: notifications.length,
          secure_links_and_deal_rooms: secureLinks.length,
          compliance_audit_logs: auditLogs.length,
          total_records: totalRecords,
        },
      },
      account_profile: user,
      startups,
      cap_table: capTables,
      investor_pipeline: pipelineDeals,
      investor_updates: investorUpdates,
      workspace: {
        notes,
        tasks,
      },
      notifications,
      data_room_and_document_shares: secureLinks,
      audit_trail: auditLogs,
    };

    // Calculate Cryptographic HMAC Signature of the entire export payload
    const stringifiedPayload = JSON.stringify(archiveData);
    const digitalSignature = generateArchiveSignature(stringifiedPayload);

    // Attach signature to export metadata
    (archiveData.export_metadata as any).sha256_hmac_signature = digitalSignature;

    const formattedJson = JSON.stringify(archiveData, null, 2);
    const filenameDate = exportTimestamp.split("T")[0];

    return new NextResponse(formattedJson, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="foundex_data_archive_${user.email.replace(/[@.]/g, "_")}_${filenameDate}.json"`,
        "X-GDPR-Export-Timestamp": exportTimestamp,
        "X-GDPR-Integrity-Signature": digitalSignature,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GDPR Data Archive Export Error:", error);
    return NextResponse.json(
      { error: "Failed to generate GDPR data archive", details: error.message },
      { status: 500 }
    );
  }
}
