import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import AuditLog from "@/lib/models/AuditLog";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { docName, newUrl, changeSummary, startupId } = body;

    if (!docName || !newUrl) {
      return NextResponse.json({ error: "docName and newUrl are required" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: startupId,
      user_id: decoded.user._id,
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found or unauthorized" }, { status: 404 });
    }

    // Find the target document matching the name
    const doc = startup.documents.find((d: any) => d.name === docName);
    if (!doc) {
      return NextResponse.json({ error: "Document not found by that name" }, { status: 404 });
    }

    // Initialize versions array if not present
    if (!doc.versions) {
      doc.versions = [];
    }

    const nextVerNum = doc.versions.length + 1;

    // Push the current version state to the history array
    doc.versions.push({
      version_number: nextVerNum,
      url: doc.url,
      change_summary: changeSummary || "Version release update",
      uploaded_by: decoded.user.email,
      created_at: doc.date || new Date(),
    });

    // Update document to new state URL
    doc.url = newUrl;
    doc.date = new Date();

    await startup.save();

    // Log security Audit event
    await AuditLog.create({
      startup_id: startup._id,
      user_id: new mongoose.Types.ObjectId(decoded.user._id),
      user_email: decoded.user.email,
      action: "UPDATED",
      entity: "Document Version",
      entity_id: doc._id?.toString() || startup._id.toString(),
      details: `Uploaded new version (v${nextVerNum + 1}) for document "${docName}". Change memo: ${changeSummary || "none"}.`,
    });

    return NextResponse.json({ success: true, documents: startup.documents });
  } catch (err) {
    console.error("POST /api/documents/version error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
