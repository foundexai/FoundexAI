import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AcceleratorCohort from "@/lib/models/AcceleratorCohort";
import {
  getCrossCohortPartnerAnalytics,
  computeCohortRollup,
} from "@/lib/acceleratorService";

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  if (!payload || !payload.user) throw new Error("Invalid token");
  return payload.user._id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get("export"); // "csv"
    const statusFilter = searchParams.get("status"); // "active" | "upcoming" | "graduated"

    const analytics = await getCrossCohortPartnerAnalytics(userId);

    // CSV Export of Cross-Cohort Startups Ledger
    if (exportFormat === "csv") {
      const headers = [
        "Company Name",
        "Sector",
        "Stage",
        "Cohort Name",
        "Batch Status",
        "Venture Status",
        "Cheque Received ($)",
        "Equity (%)",
        "Current ARR ($)",
        "Monthly Burn ($)",
        "Runway (Months)",
        "Follow-on Funding ($)",
        "Assigned Mentor",
      ];

      const rows = analytics.all_startups_ledger.map((s) => [
        `"${s.company_name.replace(/"/g, '""')}"`,
        `"${s.sector}"`,
        `"${s.stage}"`,
        `"${s.cohort_name.replace(/"/g, '""')}"`,
        s.cohort_status.toUpperCase(),
        s.status.toUpperCase(),
        s.funding_received,
        `${s.equity_percentage}%`,
        s.current_arr,
        s.monthly_burn,
        s.cash_runway_months,
        s.follow_on_raised,
        `"${(s.mentor_assigned || "Unassigned").replace(/"/g, '""')}"`,
      ].join(","));

      const csvContent = [headers.join(","), ...rows].join("\n");
      const filename = `accelerator_cross_cohort_ledger_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Filter cohorts if requested
    let cohorts = analytics.cohorts_summary;
    if (statusFilter && statusFilter !== "all") {
      cohorts = cohorts.filter((c) => c.status === statusFilter);
    }

    return NextResponse.json({
      analytics,
      cohorts,
    });
  } catch (error: any) {
    console.error("GET /api/enterprise/cohorts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch cohorts" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const body = await req.json();

    const {
      organization_name,
      organization_type = "accelerator",
      cohort_name,
      year = new Date().getFullYear(),
      season = "Summer",
      status = "active",
      start_date,
      end_date,
      demo_day_date,
      target_startups_count = 20,
      notes = "",
    } = body;

    if (!organization_name || !cohort_name) {
      return NextResponse.json(
        { error: "Organization name and Cohort name are required." },
        { status: 400 }
      );
    }

    const baseSlug = `${cohort_name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${year}`;
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newCohort = new AcceleratorCohort({
      organization_name,
      organization_type,
      program_director_id: new mongoose.Types.ObjectId(userId),
      cohort_name,
      slug,
      year: Number(year),
      season,
      status,
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : undefined,
      demo_day_date: demo_day_date ? new Date(demo_day_date) : undefined,
      target_startups_count: Number(target_startups_count),
      notes,
      startups: [],
      benchmarks: {
        average_mrr: 0,
        average_runway_months: 12,
        total_follow_on_raised: 0,
        survival_rate_pct: 100,
      },
    });

    await newCohort.save();

    return NextResponse.json({
      message: "Cohort successfully launched",
      cohort: newCohort,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/enterprise/cohorts error:", error);
    return NextResponse.json({ error: error.message || "Failed to create cohort" }, { status: 500 });
  }
}
