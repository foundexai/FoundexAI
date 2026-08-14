import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import SignatureRequest from "@/lib/models/SignatureRequest";
import Startup from "@/lib/models/Startup";
import AuditLog from "@/lib/models/AuditLog";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = await verifyToken(token);
    const userId = decoded.user._id;
    const userEmail = decoded.user.email?.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");

    // Fetch user's startups to check ownership
    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!userStartups || userStartups.length === 0) {
      // If user has no startups, return signature requests where they are a pending signer
      const requestsToSign = await SignatureRequest.find({
        "signers.email": userEmail,
      }).sort({ created_at: -1 });

      return NextResponse.json({ sentRequests: [], receivedRequests: requestsToSign });
    }

    const currentStartup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    // Signature requests initiated by the founder for the active startup
    const sentRequests = await SignatureRequest.find({
      startup_id: currentStartup._id,
      founder_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: -1 });

    // Signature requests targeting the current user's email
    const receivedRequests = await SignatureRequest.find({
      "signers.email": userEmail,
      founder_id: { $ne: new mongoose.Types.ObjectId(userId) },
    }).sort({ created_at: -1 });

    return NextResponse.json({ sentRequests, receivedRequests });
  } catch (err) {
    console.error("GET /api/documents/signatures error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = await verifyToken(token);
    const userId = decoded.user._id;
    const userEmail = decoded.user.email;

    const body = await req.json();
    const { doc_name, doc_url, signers, require_nda, nda_text, startup_id } = body;

    if (!doc_name || !doc_url || !signers || !Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json({ error: "doc_name, doc_url, and at least one signer are required" }, { status: 400 });
    }

    const requestedStartupId = startup_id || req.headers.get("x-startup-id");
    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    // Format signers
    const formattedSigners = signers.map((s: any) => ({
      email: s.email.toLowerCase().trim(),
      name: s.name || s.email.split("@")[0],
      role: s.role || "investor",
      status: "pending",
    }));

    const newRequest = await SignatureRequest.create({
      doc_name,
      doc_url,
      startup_id: startup._id,
      founder_id: new mongoose.Types.ObjectId(userId),
      signers: formattedSigners,
      require_nda: !!require_nda,
      nda_text: nda_text || "",
      status: "pending",
    });

    // Log Audit Event
    await AuditLog.create({
      startup_id: startup._id,
      user_id: new mongoose.Types.ObjectId(userId),
      user_email: userEmail,
      action: "CREATED",
      entity: "Signature Request",
      entity_id: newRequest._id.toString(),
      details: `Created Signature Request for "${doc_name}" with ${formattedSigners.length} signer(s).`,
    });

    return NextResponse.json({ signatureRequest: newRequest }, { status: 201 });
  } catch (err) {
    console.error("POST /api/documents/signatures error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
