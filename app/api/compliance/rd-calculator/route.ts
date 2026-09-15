import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import TaxCreditClaim from "@/lib/models/TaxCreditClaim";
import { calculateUSResearchCredit, calculateUKResearchCredit } from "@/lib/taxCalculator";

async function getUserId(req: Request): Promise<string> {
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
    const country = searchParams.get("country") as "US" | "UK" | null;
    const taxYear = searchParams.get("tax_year") ? Number(searchParams.get("tax_year")) : new Date().getFullYear();

    if (!startupId) {
      return NextResponse.json({ error: "Missing startup_id parameter" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startupId),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const query: any = {
      startup_id: new mongoose.Types.ObjectId(startupId),
      tax_year: taxYear,
    };
    if (country) query.country = country;

    const claims = await TaxCreditClaim.find(query).sort({ updated_at: -1 });

    return NextResponse.json({ claims });
  } catch (error: any) {
    console.error("GET /api/compliance/rd-calculator error:", error);
    return NextResponse.json({ error: "Failed to retrieve tax credit claims" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const {
      startup_id,
      country,
      tax_year = new Date().getFullYear(),
      save = true,
      us_input,
      uk_input,
    } = body;

    if (!startup_id || !country || !["US", "UK"].includes(country)) {
      return NextResponse.json({ error: "Invalid startup_id or country ('US' | 'UK')" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startup_id),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    if (country === "US") {
      const calculation = calculateUSResearchCredit({
        wages_qre: us_input?.wages_qre || 0,
        supplies_qre: us_input?.supplies_qre || 0,
        contractor_qre: us_input?.contractor_qre || 0,
        cloud_hosting_qre: us_input?.cloud_hosting_qre || 0,
        gross_receipts: us_input?.gross_receipts || startup.arr || 0,
        years_with_revenue: us_input?.years_with_revenue || 1,
        credit_rate_pct: us_input?.credit_rate_pct || 10,
      });

      let claimRecord = null;
      if (save) {
        claimRecord = await TaxCreditClaim.findOneAndUpdate(
          {
            startup_id: new mongoose.Types.ObjectId(startup_id),
            country: "US",
            tax_year,
          },
          {
            $set: {
              user_id: new mongoose.Types.ObjectId(userId),
              us_details: {
                wages_qre: calculation.eligible_wages,
                supplies_qre: calculation.eligible_supplies,
                contractor_qre: calculation.eligible_contractors,
                cloud_hosting_qre: calculation.eligible_cloud,
                total_qre: calculation.total_qre,
                gross_receipts: us_input?.gross_receipts || 0,
                years_with_revenue: us_input?.years_with_revenue || 1,
                payroll_tax_offset_eligible: calculation.is_qsb_eligible,
                credit_rate_pct: calculation.effective_credit_rate_pct,
                claimed_credit_amount: calculation.gross_credit_amount,
                payroll_offset_amount: calculation.payroll_offset_amount,
                quarterly_burn_reduction: calculation.quarterly_burn_reduction,
              },
              status: "calculated",
              updated_at: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        country: "US",
        tax_year,
        calculation,
        saved_claim: claimRecord,
      });
    } else {
      // UK
      const calculation = calculateUKResearchCredit({
        staff_costs: uk_input?.staff_costs || 0,
        subcontractor_costs: uk_input?.subcontractor_costs || 0,
        consumables_software: uk_input?.consumables_software || 0,
        total_company_expenditure: uk_input?.total_company_expenditure || 0,
        is_loss_making: uk_input?.is_loss_making !== false,
      });

      let claimRecord = null;
      if (save) {
        claimRecord = await TaxCreditClaim.findOneAndUpdate(
          {
            startup_id: new mongoose.Types.ObjectId(startup_id),
            country: "UK",
            tax_year,
          },
          {
            $set: {
              user_id: new mongoose.Types.ObjectId(userId),
              uk_details: {
                staff_costs: calculation.qualifying_staff,
                subcontractor_costs: calculation.qualifying_subcontractors,
                consumables_software: calculation.qualifying_software,
                total_qualifying_expenditure: calculation.total_qualifying_expenditure,
                total_company_expenditure: calculation.total_company_expenditure,
                rd_intensity_pct: calculation.rd_intensity_pct,
                scheme_type: calculation.scheme_applied,
                is_loss_making: uk_input?.is_loss_making !== false,
                payable_tax_credit_amount: calculation.payable_tax_credit_amount,
                effective_benefit_pct: calculation.effective_benefit_pct,
              },
              status: "calculated",
              updated_at: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        country: "UK",
        tax_year,
        calculation,
        saved_claim: claimRecord,
      });
    }
  } catch (error: any) {
    console.error("POST /api/compliance/rd-calculator error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate R&D tax credit" }, { status: 500 });
  }
}
