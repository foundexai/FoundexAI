import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SignatureRequest from "@/lib/models/SignatureRequest";
import AuditLog from "@/lib/models/AuditLog";
import { overlaySignaturesAndCertificate } from "@/lib/pdfSigner";
import { cloudinary } from "@/lib/cloudinary";
import { eventBus } from "@/lib/eventBus";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json();
    const { email, signature_type, signature_data, signer_name } = body;

    if (!email || !signature_type || !signature_data) {
      return NextResponse.json(
        { error: "email, signature_type, and signature_data are required" },
        { status: 400 }
      );
    }

    const request = await SignatureRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 });
    }

    if (request.status === "completed" || request.status === "cancelled") {
      return NextResponse.json(
        { error: `This signature request is already ${request.status}` },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const signer = request.signers.find((s: any) => s.email.toLowerCase() === cleanEmail);

    if (!signer) {
      return NextResponse.json(
        { error: `You are not listed as a signer for this document. List: ${request.signers.map((s: any) => s.email).join(", ")}` },
        { status: 404 }
      );
    }

    if (signer.status === "signed") {
      return NextResponse.json({ message: "Already signed", signatureRequest: request });
    }

    // Generate cryptographic hash signature audit stamp
    const timestampStr = new Date().toISOString();
    const signatureHash = crypto
      .createHash("sha256")
      .update(`${cleanEmail}-${timestampStr}-${signature_data}`)
      .digest("hex");

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Update signer specific details
    signer.status = "signed";
    signer.name = signer_name || signer.name || cleanEmail.split("@")[0];
    signer.signed_at = new Date();
    signer.ip_address = ipAddress;
    signer.signature_type = signature_type;
    signer.signature_data = signature_data;
    signer.signature_hash = signatureHash;

    // Log individual signature action
    await AuditLog.create({
      startup_id: request.startup_id,
      user_email: cleanEmail,
      action: "SIGNED",
      entity: "Signature Request",
      entity_id: request._id.toString(),
      details: `Signer '${cleanEmail}' (${signer.role.toUpperCase()}) signed document. Hash: ${signatureHash.substring(0, 10)}...`,
    });

    // Check if ALL signers have now signed
    const allSigned = request.signers.every((s: any) => s.status === "signed");

    if (allSigned) {
      console.log(`[Signature Engine] All signers have completed signing for request: ${request._id}. Appending certificate...`);

      // 1. Overlay signatures and generate certificate PDF page
      const signedPdfBuffer = await overlaySignaturesAndCertificate(
        request.doc_url,
        request.signers.map((s: any) => ({
          email: s.email,
          name: s.name,
          role: s.role,
          signed_at: s.signed_at,
          ip_address: s.ip_address,
          signature_type: s.signature_type,
          signature_data: s.signature_data,
          signature_hash: s.signature_hash,
        })),
        request.doc_name
      );

      // 2. Upload signed PDF buffer directly to Cloudinary
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
              folder: "signed_docs",
              public_id: `signed_${request._id}_${Date.now()}`,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(signedPdfBuffer);
      });

      // 3. Update request status to completed and save URL
      request.signed_doc_url = uploadResult.secure_url;
      request.status = "completed";

      // Log overall completion
      await AuditLog.create({
        startup_id: request.startup_id,
        user_email: cleanEmail,
        action: "COMPLETED",
        entity: "Signature Request",
        entity_id: request._id.toString(),
        details: `Signature request for "${request.doc_name}" completed successfully. Signed document url: ${uploadResult.secure_url}`,
      });

      // 4. Emit event completion trigger to eventBus for system alerts
      eventBus.safeEmit("signature:completed", { signatureRequest: request });
    }

    request.updated_at = new Date();
    await request.save();

    return NextResponse.json({ message: "Successfully signed", signatureRequest: request });
  } catch (err) {
    console.error("POST /api/documents/signatures/[id]/sign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
