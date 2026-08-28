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
    const { docName, section, comment, versionNumber, startupId } = body;

    if (!docName || !comment) {
      return NextResponse.json({ error: "docName and comment are required" }, { status: 400 });
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

    // Initialize redlines array if not present
    if (!doc.redlines) {
      doc.redlines = [];
    }

    // Push the new redlining revision request
    doc.redlines.push({
      author: decoded.user.email,
      section: section || "General",
      comment,
      version_number: versionNumber || 1,
      created_at: new Date(),
    });

    await startup.save();

    // Log security Audit event
    await AuditLog.create({
      startup_id: startup._id,
      user_id: new mongoose.Types.ObjectId(decoded.user._id),
      user_email: decoded.user.email,
      action: "UPDATED",
      entity: "Document Redline",
      entity_id: doc._id?.toString() || startup._id.toString(),
      details: `Added redlining comment on section "${section || "General"}" (v${versionNumber || 1}) of document "${docName}".`,
    });

    return NextResponse.json({ success: true, documents: startup.documents });
  } catch (err) {
    console.error("POST /api/documents/redline error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
