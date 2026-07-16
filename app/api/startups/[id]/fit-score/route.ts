import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import Investor from "@/lib/models/Investor";
import { MOCK_INVESTORS } from "@/lib/data";
import { calculateFitScore } from "@/lib/fit-score";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");

    if (!investorId) {
      return NextResponse.json({ error: "Investor ID is required" }, { status: 400 });
    }

    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Startup
    const startup = await Startup.findOne({
      _id: id,
      user_id: decoded.user._id,
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // 2. Fetch Investor (either DB or Mock)
    let investor: any = null;
    if (mongoose.Types.ObjectId.isValid(investorId)) {
      const dbInv = await Investor.findById(investorId);
      if (dbInv) {
        investor = {
          id: dbInv._id.toString(),
          name: dbInv.name,
          type: dbInv.type,
          focus: dbInv.focus || [],
          location: dbInv.location,
          investmentRange: dbInv.investmentRange || dbInv.investment_range,
          stage: dbInv.stage,
        };
      }
    }

    if (!investor) {
      const mockInv = MOCK_INVESTORS.find((inv) => inv.id === investorId);
      if (mockInv) {
        investor = mockInv;
      }
    }

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    // 3. Calculate Fit Score
    const fitScore = calculateFitScore(startup, investor);

    return NextResponse.json({ fitScore });
  } catch (error) {
    console.error("Error calculating fit score API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
