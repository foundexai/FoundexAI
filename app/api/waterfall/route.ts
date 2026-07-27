import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import CapTable from "@/lib/models/CapTable";
import Startup from "@/lib/models/Startup";
import { runWaterfallSimulation } from "@/lib/waterfall";

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
      exitValuation = 10000000,
      liquidationMultiple = 1.0,
      newInvestment = 0,
      preMoneyValuation = 0,
      newOptionPoolPct = 0,
    } = body;

    const startup = await Startup.findOne({ user_id: user._id });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // Fetch cap table entries for this startup
    const entries = await CapTable.find({ startup_id: startup._id }).sort({ created_at: -1 });

    const formattedEntries = entries.map((e) => ({
      _id: e._id.toString(),
      shareholder_name: e.shareholder_name,
      shareholder_type: e.shareholder_type,
      share_class: e.share_class,
      share_count: e.share_count || 0,
      investment_amount: e.investment_amount || 0,
    }));

    const simulation = runWaterfallSimulation(formattedEntries, {
      exitValuation: Number(exitValuation),
      liquidationMultiple: Number(liquidationMultiple),
      newInvestment: Number(newInvestment),
      preMoneyValuation: Number(preMoneyValuation),
      newOptionPoolPct: Number(newOptionPoolPct),
    });

    return NextResponse.json({
      success: true,
      simulation,
    });
  } catch (err: any) {
    console.error("Error executing Exit Waterfall Simulation:", err);
    return NextResponse.json({ error: "Failed to calculate exit waterfall" }, { status: 500 });
  }
}
