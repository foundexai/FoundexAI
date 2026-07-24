import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import CapTable from "@/lib/models/CapTable";
import Startup from "@/lib/models/Startup";

// Helper: Calculate ESOP Vested Shares based on months elapsed and cliff
function calculateVestedShares(grant: any): number {
  if (!grant.esop_vesting || !grant.esop_vesting.is_vesting) {
    return grant.share_count || 0;
  }

  const { total_months = 48, cliff_months = 12, start_date, vested_shares } = grant.esop_vesting;
  if (vested_shares && vested_shares > 0) return vested_shares;

  const start = new Date(start_date || grant.grant_date || Date.now());
  const now = new Date();

  // Months difference
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (monthsElapsed < cliff_months) {
    return 0; // Cliff not reached
  }

  if (monthsElapsed >= total_months) {
    return grant.share_count; // Fully vested
  }

  // Linear monthly vesting
  const vestedRatio = monthsElapsed / total_months;
  return Math.floor(grant.share_count * vestedRatio);
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;

    // Fetch startup
    const startup = await Startup.findOne({ user_id: user._id });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // Fetch all cap table entries for this startup
    const entries = await CapTable.find({ startup_id: startup._id }).sort({ created_at: -1 });

    // Calculate aggregated metrics
    let totalShares = 0;
    let totalCapitalRaised = 0;
    let totalEsopPool = 0;
    let totalVestedEsop = 0;

    const classTotals: Record<string, { shares: number; capital: number }> = {
      Common: { shares: 0, capital: 0 },
      "Preferred Series Seed": { shares: 0, capital: 0 },
      "Preferred Series A": { shares: 0, capital: 0 },
      "Options / ESOP": { shares: 0, capital: 0 },
      "SAFE / Convertible": { shares: 0, capital: 0 },
    };

    const shareholders = entries.map((e) => {
      const shareCount = e.share_count || 0;
      const capital = e.investment_amount || 0;
      const vestedShares = calculateVestedShares(e);

      totalShares += shareCount;
      totalCapitalRaised += capital;

      if (e.share_class === "Options / ESOP") {
        totalEsopPool += shareCount;
        totalVestedEsop += vestedShares;
      }

      if (classTotals[e.share_class]) {
        classTotals[e.share_class].shares += shareCount;
        classTotals[e.share_class].capital += capital;
      }

      return {
        _id: e._id,
        shareholder_name: e.shareholder_name,
        shareholder_type: e.shareholder_type,
        email: e.email,
        share_class: e.share_class,
        share_count: shareCount,
        investment_amount: capital,
        price_per_share: e.price_per_share || (shareCount > 0 && capital > 0 ? capital / shareCount : 0),
        grant_date: e.grant_date,
        esop_vesting: {
          ...e.esop_vesting?.toObject?.() || e.esop_vesting,
          calculated_vested_shares: vestedShares,
          unvested_shares: shareCount - vestedShares,
        },
        notes: e.notes,
      };
    });

    // Calculate ownership percentage for each entry
    const shareholdersWithOwnership = shareholders.map((s) => ({
      ...s,
      ownership_pct: totalShares > 0 ? Number(((s.share_count / totalShares) * 100).toFixed(2)) : 0,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalIssuedShares: totalShares,
        totalCapitalRaised,
        totalEsopPool,
        totalVestedEsop,
        totalUnvestedEsop: totalEsopPool - totalVestedEsop,
        classTotals,
      },
      shareholders: shareholdersWithOwnership,
    });
  } catch (err: any) {
    console.error("Error fetching Cap Table data:", err);
    return NextResponse.json({ error: "Failed to load cap table" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const body = await req.json();

    const {
      shareholderName,
      shareholderType = "investor",
      email,
      shareClass = "Common",
      shareCount,
      investmentAmount = 0,
      pricePerShare = 0,
      grantDate,
      isVesting = false,
      totalMonths = 48,
      cliffMonths = 12,
      notes,
    } = body;

    if (!shareholderName || !shareCount || shareCount <= 0) {
      return NextResponse.json({ error: "Shareholder name and positive share count are required" }, { status: 400 });
    }

    // Resolve startup ID
    const startup = await Startup.findOne({ user_id: user._id });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    const entry = await CapTable.create({
      startup_id: startup._id,
      shareholder_name: shareholderName,
      shareholder_type: shareholderType,
      email,
      share_class: shareClass,
      share_count: Number(shareCount),
      investment_amount: Number(investmentAmount),
      price_per_share: Number(pricePerShare),
      grant_date: grantDate ? new Date(grantDate) : new Date(),
      esop_vesting: {
        is_vesting: Boolean(isVesting),
        total_months: Number(totalMonths),
        cliff_months: Number(cliffMonths),
        start_date: grantDate ? new Date(grantDate) : new Date(),
      },
      notes,
    });

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (err: any) {
    console.error("Error creating Cap Table entry:", err);
    return NextResponse.json({ error: "Failed to add cap table entry" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    await CapTable.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Shareholder entry deleted" });
  } catch (err: any) {
    console.error("Error deleting Cap Table entry:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
