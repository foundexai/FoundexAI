import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AcceleratorCohort from "@/lib/models/AcceleratorCohort";
import { computeCohortRollup } from "@/lib/acceleratorService";

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  if (!payload || !payload.user) throw new Error("Invalid token");
  return payload.user._id;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid cohort ID" }, { status: 400 });
    }

    const cohort = await AcceleratorCohort.findOne({
      _id: new mongoose.Types.ObjectId(id),
      program_director_id: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found or access denied" }, { status: 404 });
    }

    const rollup = computeCohortRollup(cohort);

    return NextResponse.json({
      cohort,
      rollup,
    });
  } catch (error: any) {
    console.error("GET /api/enterprise/cohorts/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch cohort" }, { status: 401 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await context.params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid cohort ID" }, { status: 400 });
    }

    const cohort = await AcceleratorCohort.findOne({
      _id: new mongoose.Types.ObjectId(id),
      program_director_id: new mongoose.Types.ObjectId(userId),
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found or access denied" }, { status: 404 });
    }

    if (body.cohort_name) cohort.cohort_name = body.cohort_name;
    if (body.status) cohort.status = body.status;
    if (body.season) cohort.season = body.season;
    if (body.year) cohort.year = Number(body.year);
    if (body.target_startups_count) cohort.target_startups_count = Number(body.target_startups_count);
    if (body.notes !== undefined) cohort.notes = body.notes;
    if (body.start_date) cohort.start_date = new Date(body.start_date);
    if (body.end_date) cohort.end_date = new Date(body.end_date);
    if (body.demo_day_date) cohort.demo_day_date = new Date(body.demo_day_date);

    // Recalculate benchmarks
    const rollup = computeCohortRollup(cohort);
    cohort.benchmarks = {
      average_mrr: rollup.average_mrr,
      average_runway_months: rollup.average_runway_months,
      total_follow_on_raised: rollup.total_follow_on_raised,
      survival_rate_pct: rollup.survival_rate_pct,
    };

    await cohort.save();

    return NextResponse.json({
      message: "Cohort updated successfully",
      cohort,
      rollup,
    });
  } catch (error: any) {
    console.error("PUT /api/enterprise/cohorts/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update cohort" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid cohort ID" }, { status: 400 });
    }

    const cohort = await AcceleratorCohort.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      program_director_id: new mongoose.Types.ObjectId(userId),
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ message: "Cohort deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/enterprise/cohorts/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete cohort" }, { status: 500 });
  }
}
