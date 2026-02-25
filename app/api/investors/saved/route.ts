import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MOCK_INVESTORS } from "@/lib/data";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Investor from "@/lib/models/Investor";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get IDs and Statuses
    const savedIds = user.saved_investors || [];
    const statuses = user.investor_statuses || new Map();

    // Fetch Investors from DB
    const dbIds = savedIds.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const investorsDocs = await Investor.find({ _id: { $in: dbIds } });

    const formattedDBInvestors = investorsDocs.map((inv) => {
      const id = inv._id.toString();
      return {
        id,
        name: inv.name,
        type: inv.type,
        focus: inv.focus,
        location: inv.location,
        logoInitial: inv.logoInitial,
        logoColor: inv.logoColor,
        description: inv.description,
        investmentRange: inv.investmentRange || inv.investment_range,
        website: inv.website,
        status: (statuses as any).get ? (statuses as any).get(id) : statuses[id] || "Not Contacted",
      };
    });

    // Fetch saved Mock Investors
    const savedMocks = MOCK_INVESTORS.filter((inv) =>
      savedIds.includes(inv.id),
    ).map(inv => ({
        ...inv,
        status: (statuses as any).get ? (statuses as any).get(inv.id) : statuses[inv.id] || "Not Contacted",
    }));

    const allSaved = [...formattedDBInvestors, ...savedMocks];

    return NextResponse.json({ investors: allSaved });
  } catch (error) {
    console.error("Error fetching saved investors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
