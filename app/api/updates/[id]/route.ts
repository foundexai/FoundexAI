import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import InvestorUpdate from "@/lib/models/InvestorUpdate";

async function getUserId(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;

    const update = await InvestorUpdate.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate("startup_id");

    if (!update) {
      return NextResponse.json({ error: "Investor update not found" }, { status: 404 });
    }

    // Verify startup ownership
    if (update.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ update });
  } catch (err) {
    console.error("GET /api/updates/[id] error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;
    const data = await req.json();

    const update = await InvestorUpdate.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate("startup_id");

    if (!update) {
      return NextResponse.json({ error: "Investor update not found" }, { status: 404 });
    }

    // Verify startup ownership
    if (update.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update fields
    if (data.title !== undefined) update.title = data.title;
    if (data.metrics !== undefined) {
      update.metrics = {
        mrr: data.metrics.mrr !== undefined ? data.metrics.mrr : update.metrics.mrr,
        cash_in_bank: data.metrics.cash_in_bank !== undefined ? data.metrics.cash_in_bank : update.metrics.cash_in_bank,
        runway_months: data.metrics.runway_months !== undefined ? data.metrics.runway_months : update.metrics.runway_months,
      };
    }
    if (data.kpis !== undefined) {
      update.kpis = {
        highlights: data.kpis.highlights !== undefined ? data.kpis.highlights : update.kpis.highlights,
        lowlights: data.kpis.lowlights !== undefined ? data.kpis.lowlights : update.kpis.lowlights,
        help_needed: data.kpis.help_needed !== undefined ? data.kpis.help_needed : update.kpis.help_needed,
      };
    }
    if (data.body !== undefined) update.body = data.body;
    if (data.attachments !== undefined) update.attachments = data.attachments;
    update.updated_at = new Date();

    await update.save();
    return NextResponse.json({ success: true, update });
  } catch (err) {
    console.error("PUT /api/updates/[id] error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;

    const update = await InvestorUpdate.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate("startup_id");

    if (!update) {
      return NextResponse.json({ error: "Investor update not found" }, { status: 404 });
    }

    // Verify startup ownership
    if (update.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await InvestorUpdate.deleteOne({ _id: update._id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/updates/[id] error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
