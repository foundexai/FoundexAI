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
    const { searchParams } = new URL(req.url);
    const requestedStartupId = searchParams.get("startup_id");

    // Fetch all startups belonging to this user (sorted by created_at ascending: earliest created first)
    const userStartups = await Startup.find({ user_id: user._id }).sort({ created_at: 1 });
    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({
        success: true,
        userStartups: [],
        currentStartup: null,
        summary: null,
        shareholders: [],
        auditLogs: [],
      });
    }

    // Resolve target startup: requested startup_id OR default to first created startup
    const targetStartup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    // Fetch all cap table entries STRICTLY for this target startup
    const entries = await CapTable.find({ startup_id: targetStartup._id }).sort({ created_at: -1 });

    // Fetch recent audit logs STRICTLY for this target startup
    const AuditLog = (await import("@/lib/models/AuditLog")).default;
    const auditLogs = await AuditLog.find({ startup_id: targetStartup._id })
      .sort({ created_at: -1 })
      .limit(10)
      .populate("user_id", "email name");

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
      userStartups: userStartups.map((s) => ({
        _id: s._id,
        company_name: s.company_name,
        stage: s.stage,
      })),
      currentStartup: {
        _id: targetStartup._id,
        company_name: targetStartup.company_name,
        stage: targetStartup.stage,
      },
      summary: {
        totalIssuedShares: totalShares,
        totalCapitalRaised,
        totalEsopPool,
        totalVestedEsop,
        totalUnvestedEsop: totalEsopPool - totalVestedEsop,
        classTotals,
      },
      shareholders: shareholdersWithOwnership,
      auditLogs,
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
      startupId,
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

    // Resolve target startup owned by user
    const userStartups = await Startup.find({ user_id: user._id }).sort({ created_at: 1 });
    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    const targetStartup =
      (startupId && userStartups.find((s) => s._id.toString() === startupId)) ||
      userStartups[0];

    const entry = await CapTable.create({
      startup_id: targetStartup._id,
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

    // Audit Logging
    const { logAction } = await import("@/lib/auditLogger");
    await logAction({
      startupId: targetStartup._id,
      userId: user._id,
      action: "create",
      entity: "CapTable",
      entityId: entry._id,
      details: { shareholder_name: shareholderName, share_count: shareCount, share_class: shareClass }
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

export async function PUT(req: Request) {
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
      id,
      shareholderName,
      shareholderType,
      email,
      shareClass,
      shareCount,
      investmentAmount,
      pricePerShare,
      grantDate,
      isVesting,
      totalMonths,
      cliffMonths,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const entry = await CapTable.findById(id);
    if (!entry) {
      return NextResponse.json({ error: "Shareholder entry not found" }, { status: 404 });
    }

    // Verify startup ownership across user's companies
    const userStartups = await Startup.find({ user_id: user._id });
    const isOwner = userStartups.some((s) => s._id.toString() === entry.startup_id.toString());
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const previousDetails = {
      shareholder_name: entry.shareholder_name,
      shareholder_type: entry.shareholder_type,
      email: entry.email,
      share_class: entry.share_class,
      share_count: entry.share_count,
      investment_amount: entry.investment_amount,
      price_per_share: entry.price_per_share,
      notes: entry.notes,
    };

    if (shareholderName !== undefined) entry.shareholder_name = shareholderName;
    if (shareholderType !== undefined) entry.shareholder_type = shareholderType;
    if (email !== undefined) entry.email = email;
    if (shareClass !== undefined) entry.share_class = shareClass;
    if (shareCount !== undefined) entry.share_count = Number(shareCount);
    if (investmentAmount !== undefined) entry.investment_amount = Number(investmentAmount);
    if (pricePerShare !== undefined) entry.price_per_share = Number(pricePerShare);
    if (notes !== undefined) entry.notes = notes;
    if (grantDate !== undefined) {
      entry.grant_date = new Date(grantDate);
      if (entry.esop_vesting) {
        entry.esop_vesting.start_date = new Date(grantDate);
      }
    }
    if (entry.esop_vesting) {
      if (isVesting !== undefined) entry.esop_vesting.is_vesting = Boolean(isVesting);
      if (totalMonths !== undefined) entry.esop_vesting.total_months = Number(totalMonths);
      if (cliffMonths !== undefined) entry.esop_vesting.cliff_months = Number(cliffMonths);
    }

    entry.updated_at = new Date();
    await entry.save();

    // Audit Logging
    const { logAction } = await import("@/lib/auditLogger");
    await logAction({
      startupId: entry.startup_id,
      userId: user._id,
      action: "update",
      entity: "CapTable",
      entityId: entry._id,
      details: {
        previous: previousDetails,
        current: {
          shareholder_name: entry.shareholder_name,
          shareholder_type: entry.shareholder_type,
          email: entry.email,
          share_class: entry.share_class,
          share_count: entry.share_count,
          investment_amount: entry.investment_amount,
          price_per_share: entry.price_per_share,
          notes: entry.notes,
        }
      }
    });

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (err: any) {
    console.error("Error updating Cap Table entry:", err);
    return NextResponse.json({ error: "Failed to update cap table entry" }, { status: 500 });
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

    const entry = await CapTable.findById(id);
    if (!entry) {
      return NextResponse.json({ error: "Shareholder entry not found" }, { status: 404 });
    }

    // Verify startup ownership across user's companies
    const userStartups = await Startup.find({ user_id: decoded.user._id });
    const isOwner = userStartups.some((s) => s._id.toString() === entry.startup_id.toString());
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Audit Logging
    const { logAction } = await import("@/lib/auditLogger");
    await logAction({
      startupId: entry.startup_id,
      userId: decoded.user._id,
      action: "delete",
      entity: "CapTable",
      entityId: entry._id,
      details: { shareholder_name: entry.shareholder_name, share_count: entry.share_count, share_class: entry.share_class }
    });

    await CapTable.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Shareholder entry deleted" });
  } catch (err: any) {
    console.error("Error deleting Cap Table entry:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
