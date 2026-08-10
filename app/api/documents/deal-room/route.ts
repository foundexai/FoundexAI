import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import SecureLink from "@/lib/models/SecureLink";
import Startup from "@/lib/models/Startup";
import AuditLog from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// Role-based permission tier hierarchy validation helper
export function validateRolePermission(
  memberRole: string,
  allowedTiers: string[]
): { allowed: boolean; reason?: string } {
  if (!allowedTiers || allowedTiers.length === 0) {
    return { allowed: true };
  }

  // Founders & Co-founders always have full administrative access
  if (memberRole === "founder" || memberRole === "co-founder") {
    return { allowed: true };
  }

  if (allowedTiers.includes(memberRole)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Access restricted. Your role '${memberRole}' is not included in the required deal room tiers (${allowedTiers.join(", ")}).`,
  };
}

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

    const { searchParams } = new URL(req.url);
    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");

    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: 1 });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ dealRooms: [], userStartups: [], currentStartup: null });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    const dealRooms = await SecureLink.find({
      startup_id: startup._id,
      is_deal_room: true,
    }).sort({ created_at: -1 });

    return NextResponse.json({
      dealRooms,
      userStartups: userStartups.map((s) => ({
        _id: s._id.toString(),
        company_name: s.company_name,
      })),
      currentStartup: {
        _id: startup._id.toString(),
        company_name: startup.company_name,
      },
    });
  } catch (err) {
    console.error("GET /api/documents/deal-room error:", err);
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

    const body = await req.json();
    const {
      doc_name,
      doc_url,
      doc_type,
      deal_room_name,
      allowed_tiers,
      members,
      require_nda,
      nda_text,
      watermark_enabled,
      watermark_text,
      startup_id,
    } = body;

    if (!doc_name || !doc_url) {
      return NextResponse.json({ error: "doc_name and doc_url are required" }, { status: 400 });
    }

    const requestedStartupId = startup_id || req.headers.get("x-startup-id");
    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: 1 });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    const shareToken = `DR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const formattedMembers = (members || []).map((m: any) => ({
      email: m.email,
      name: m.name || m.email.split("@")[0],
      role: m.role || "investor",
      status: "invited",
      invited_at: new Date(),
    }));

    // Ensure founder is included as founder tier
    const founderEmail = decoded.user.email || "founder@foundex.ai";
    if (!formattedMembers.some((m: any) => m.email === founderEmail)) {
      formattedMembers.unshift({
        email: founderEmail,
        name: decoded.user.name || "Founder",
        role: "founder",
        status: "active",
        invited_at: new Date(),
        joined_at: new Date(),
      });
    }

    const newDealRoom = await SecureLink.create({
      share_token: shareToken,
      founder_id: new mongoose.Types.ObjectId(userId),
      startup_id: startup._id,
      doc_name,
      doc_url,
      doc_type: doc_type || "deck",
      is_deal_room: true,
      deal_room_name: deal_room_name || `${doc_name} Deal Room`,
      allowed_tiers: allowed_tiers || ["founder", "investor", "counsel"],
      deal_room_members: formattedMembers,
      require_nda: !!require_nda,
      nda_text: nda_text || "CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT\n\nBy accessing this deal room, recipient agrees to keep all financial statements, cap tables, and pitch materials strictly confidential.",
      access_type: "tier_restricted",
      watermark_enabled: watermark_enabled !== false,
      watermark_text: watermark_text || `CONFIDENTIAL • {email} • ${new Date().toISOString().split("T")[0]}`,
    });

    // Log security audit event
    await AuditLog.create({
      startup_id: startup._id,
      user_id: new mongoose.Types.ObjectId(userId),
      user_email: founderEmail,
      action: "CREATED",
      entity: "Deal Room",
      entity_id: newDealRoom._id.toString(),
      details: `Created multi-party Deal Room "${newDealRoom.deal_room_name}" with tiers: ${(allowed_tiers || ["founder", "investor", "counsel"]).join(", ")}.`,
    });

    return NextResponse.json({ dealRoom: newDealRoom }, { status: 201 });
  } catch (err) {
    console.error("POST /api/documents/deal-room error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = await verifyToken(token);
    const userId = decoded.user._id;

    const body = await req.json();
    const { dealRoomId, action, memberEmail, memberRole, memberName, allowed_tiers, require_nda } = body;

    if (!dealRoomId) {
      return NextResponse.json({ error: "dealRoomId is required" }, { status: 400 });
    }

    const dealRoom = await SecureLink.findById(dealRoomId);
    if (!dealRoom) {
      return NextResponse.json({ error: "Deal Room not found" }, { status: 404 });
    }

    if (action === "update_tiers" && Array.isArray(allowed_tiers)) {
      dealRoom.allowed_tiers = allowed_tiers;
    }

    if (action === "invite_member" && memberEmail) {
      const existing = dealRoom.deal_room_members.find((m: any) => m.email.toLowerCase() === memberEmail.toLowerCase());
      if (existing) {
        existing.role = memberRole || existing.role;
        existing.status = "invited";
      } else {
        dealRoom.deal_room_members.push({
          email: memberEmail.toLowerCase(),
          name: memberName || memberEmail.split("@")[0],
          role: memberRole || "investor",
          status: "invited",
          invited_at: new Date(),
        });
      }
    }

    if (action === "revoke_member" && memberEmail) {
      const member = dealRoom.deal_room_members.find((m: any) => m.email.toLowerCase() === memberEmail.toLowerCase());
      if (member) {
        member.status = "revoked";
      }
    }

    if (typeof require_nda === "boolean") {
      dealRoom.require_nda = require_nda;
    }

    await dealRoom.save();

    // Log Audit Event
    await AuditLog.create({
      startup_id: dealRoom.startup_id,
      user_id: new mongoose.Types.ObjectId(userId),
      user_email: decoded.user.email,
      action: "UPDATED",
      entity: "Deal Room",
      entity_id: dealRoom._id.toString(),
      details: `Updated Deal Room "${dealRoom.deal_room_name}". Action: ${action || "update"}.`,
    });

    return NextResponse.json({ dealRoom });
  } catch (err) {
    console.error("PUT /api/documents/deal-room error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
