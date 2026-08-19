import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    let startups = [];

    if (user.user_type === "founder") {
      // Fetch all startups managed by this founder
      startups = await Startup.find({ user_id: user._id });
    } else if (user.user_type === "investor") {
      // Find all startups where this investor is in the cap table
      const capTableEntries = await CapTable.find({ email: user.email.toLowerCase().trim() });
      const startupIds = capTableEntries.map((entry: any) => entry.startup_id);
      
      if (startupIds.length > 0) {
        startups = await Startup.find({ _id: { $in: startupIds } });
      }
    }

    // Perform consolidated aggregations
    let totalMRR = 0;
    let totalARR = 0;
    let totalCash = 0;
    let totalFunding = 0;
    let combinedBurn = 0;

    const formattedStartups = startups.map((startup: any) => {
      const mrr = startup.mrr || 0;
      // Auto-calculate ARR as MRR * 12 if not specifically set
      const arr = startup.arr || mrr * 12;
      const cash = startup.cash_on_hand || 0;
      const burn = startup.monthly_burn || 0;
      const funding = startup.funding_amount || 0;

      totalMRR += mrr;
      totalARR += arr;
      totalCash += cash;
      totalFunding += funding;
      combinedBurn += burn;

      const runway = burn > 0 ? parseFloat((cash / burn).toFixed(1)) : 999; // 999 = infinite runway

      return {
        id: startup._id.toString(),
        name: startup.company_name,
        sector: startup.sector || "Uncategorized",
        stage: startup.stage || "Unknown",
        location: startup.location || "N/A",
        mrr,
        arr,
        cash_on_hand: cash,
        monthly_burn: burn,
        funding_amount: funding,
        runway,
        logo_url: startup.logo_url || null,
        logoInitial: startup.logoInitial || startup.company_name.charAt(0),
        logoColor: startup.logoColor || "bg-zinc-800",
      };
    });

    const combinedRunway = combinedBurn > 0 ? parseFloat((totalCash / combinedBurn).toFixed(1)) : 999;

    return NextResponse.json({
      startups: formattedStartups,
      summary: {
        totalMRR,
        totalARR,
        totalCash,
        totalFunding,
        combinedBurn,
        combinedRunway,
      },
      userRole: user.user_type,
    });
  } catch (err) {
    console.error("GET /api/portfolio/analytics error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
