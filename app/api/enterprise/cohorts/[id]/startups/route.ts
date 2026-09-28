import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AcceleratorCohort from "@/lib/models/AcceleratorCohort";
import { enrollStartupInCohort, computeCohortRollup } from "@/lib/acceleratorService";

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  if (!payload || !payload.user) throw new Error("Invalid token");
  return payload.user._id;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
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

    const {
      startup_id,
      company_name,
      sector = "Fintech",
      stage = "Seed",
      status = "active",
      funding_received = 125000,
      equity_percentage = 7,
      mentor_assigned = "",
      demo_day_pitch_url = "",
      current_arr = 0,
      monthly_burn = 15000,
      cash_runway_months = 14,
      follow_on_raised = 0,
    } = body;

    if (!company_name) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const updatedCohort = await enrollStartupInCohort(id, {
      startup_id: startup_id && mongoose.Types.ObjectId.isValid(startup_id) ? new mongoose.Types.ObjectId(startup_id) : undefined,
      company_name,
      sector,
      stage,
      status,
      funding_received: Number(funding_received),
      equity_percentage: Number(equity_percentage),
      mentor_assigned,
      demo_day_pitch_url,
      metrics: {
        current_arr: Number(current_arr),
        monthly_burn: Number(monthly_burn),
        cash_runway_months: Number(cash_runway_months),
        follow_on_raised: Number(follow_on_raised),
      },
    });

    return NextResponse.json({
      message: "Startup successfully enrolled in cohort",
      cohort: updatedCohort,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/enterprise/cohorts/[id]/startups error:", error);
    return NextResponse.json({ error: error.message || "Failed to enroll startup" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startup_id");
    const companyName = searchParams.get("company_name");

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

    cohort.startups = cohort.startups.filter((s: any) => {
      if (startupId && s._id?.toString() === startupId) return false;
      if (startupId && s.startup_id?.toString() === startupId) return false;
      if (companyName && s.company_name === companyName) return false;
      return true;
    });

    const rollup = computeCohortRollup(cohort);
    cohort.benchmarks = {
      average_mrr: rollup.average_mrr,
      average_runway_months: rollup.average_runway_months,
      total_follow_on_raised: rollup.total_follow_on_raised,
      survival_rate_pct: rollup.survival_rate_pct,
    };

    await cohort.save();

    return NextResponse.json({
      message: "Startup removed from cohort",
      cohort,
    });
  } catch (error: any) {
    console.error("DELETE /api/enterprise/cohorts/[id]/startups error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove startup" }, { status: 500 });
  }
}
