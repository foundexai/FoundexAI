import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import InvestorUpdate from "@/lib/models/InvestorUpdate";
import Startup from "@/lib/models/Startup";

async function getUserId(req: Request) {
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

    if (!startupId) {
      return NextResponse.json({ error: "No startup_id" }, { status: 400 });
    }

    // Verify ownership
    const startup = await Startup.findOne({
      _id: startupId,
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const updates = await InvestorUpdate.find({ startup_id: startup._id }).sort({ month: -1 });
    return NextResponse.json({ updates });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const data = await req.json();
    const { startup_id, month, title, metrics, kpis, body, attachments } = data;

    if (!startup_id) {
      return NextResponse.json({ error: "No startup_id provided" }, { status: 400 });
    }
    if (!month || !title) {
      return NextResponse.json({ error: "Month and title are required" }, { status: 400 });
    }

    // Verify startup ownership
    const startup = await Startup.findOne({
      _id: startup_id,
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup not found or access denied" }, { status: 403 });
    }

    // Check if an update for this month already exists
    const existing = await InvestorUpdate.findOne({ startup_id: startup._id, month });
    if (existing) {
      return NextResponse.json({ error: `An investor update for ${month} already exists.` }, { status: 409 });
    }

    const newUpdate = new InvestorUpdate({
      startup_id: startup._id,
      month,
      title,
      metrics: {
        mrr: metrics?.mrr || 0,
        cash_in_bank: metrics?.cash_in_bank || 0,
        runway_months: metrics?.runway_months || 0,
      },
      kpis: {
        highlights: kpis?.highlights || "",
        lowlights: kpis?.lowlights || "",
        help_needed: kpis?.help_needed || "",
      },
      body: body || "",
      attachments: attachments || [],
    });

    await newUpdate.save();
    return NextResponse.json({ success: true, update: newUpdate });
  } catch (err) {
    console.error("POST /api/updates error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
