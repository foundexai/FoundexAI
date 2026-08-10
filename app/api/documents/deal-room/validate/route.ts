import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SecureLink from "@/lib/models/SecureLink";
import AuditLog from "@/lib/models/AuditLog";
import { validateRolePermission } from "../route";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { shareToken, email, signerName, signNda } = await req.json();

    if (!shareToken || !email) {
      return NextResponse.json({ error: "shareToken and email are required" }, { status: 400 });
    }

    const dealRoom = await SecureLink.findOne({
      share_token: shareToken,
      is_deal_room: true,
    });

    if (!dealRoom) {
      return NextResponse.json({ error: "Deal Room not found or link expired" }, { status: 404 });
    }

    if (dealRoom.is_revoked) {
      return NextResponse.json({ error: "Deal Room access has been revoked by founder" }, { status: 403 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find member record in deal room
    let member = dealRoom.deal_room_members.find((m: any) => m.email.toLowerCase() === cleanEmail);

    // If deal room is restricted and member not listed, check domain match or default investor role
    const memberRole = member ? member.role : "investor";
    const memberStatus = member ? member.status : "invited";

    if (memberStatus === "revoked") {
      return NextResponse.json({
        allowed: false,
        reason: "Your access to this deal room has been revoked by the deal admin.",
      }, { status: 403 });
    }

    // Role-based permission tier validation
    const permCheck = validateRolePermission(memberRole, dealRoom.allowed_tiers || []);
    if (!permCheck.allowed) {
      return NextResponse.json({
        allowed: false,
        reason: permCheck.reason,
        role: memberRole,
      }, { status: 403 });
    }

    // NDA Verification
    let ndaSigned = false;
    const existingNda = dealRoom.nda_signatures.find((s: any) => s.email.toLowerCase() === cleanEmail);
    if (existingNda) {
      ndaSigned = true;
    }

    // Handle NDA signing request if provided
    if (signNda && !ndaSigned) {
      dealRoom.nda_signatures.push({
        email: cleanEmail,
        signer_name: signerName || cleanEmail.split("@")[0],
        signed_at: new Date(),
        ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
        nda_version: "v1.0",
      });
      ndaSigned = true;
    }

    if (dealRoom.require_nda && !ndaSigned) {
      return NextResponse.json({
        allowed: false,
        requiresNda: true,
        ndaText: dealRoom.nda_text,
        role: memberRole,
        message: "Mutual Non-Disclosure Agreement signature required prior to document access.",
      });
    }

    // Update member status to active
    if (!member) {
      dealRoom.deal_room_members.push({
        email: cleanEmail,
        name: signerName || cleanEmail.split("@")[0],
        role: "investor",
        status: "active",
        joined_at: new Date(),
      });
    } else if (member.status === "invited") {
      member.status = "active";
      member.joined_at = new Date();
    }

    // Log Access
    dealRoom.view_count = (dealRoom.view_count || 0) + 1;
    dealRoom.access_logs.push({
      viewer_email: cleanEmail,
      viewer_ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      user_agent: req.headers.get("user-agent") || "Browser",
      viewed_at: new Date(),
    });

    await dealRoom.save();

    // Log Security Audit
    await AuditLog.create({
      startup_id: dealRoom.startup_id,
      user_email: cleanEmail,
      action: "READ",
      entity: "Deal Room",
      entity_id: dealRoom._id.toString(),
      details: `Member '${cleanEmail}' (${memberRole.toUpperCase()}) accessed Deal Room "${dealRoom.deal_room_name}".`,
    });

    return NextResponse.json({
      allowed: true,
      role: memberRole,
      docName: dealRoom.doc_name,
      docUrl: dealRoom.doc_url,
      docType: dealRoom.doc_type,
      dealRoomName: dealRoom.deal_room_name,
      watermarkEnabled: dealRoom.watermark_enabled,
      watermarkText: dealRoom.watermark_text.replace("{email}", cleanEmail).replace("{date}", new Date().toISOString().split("T")[0]),
    });
  } catch (err) {
    console.error("POST /api/documents/deal-room/validate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
