import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MOCK_INVESTORS } from "@/lib/data";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Investor from "@/lib/models/Investor";
import Startup from "@/lib/models/Startup";
import { verifyToken } from "@/lib/auth";
import { calculateFitScore } from "@/lib/fit-score";

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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.user_type === "investor") {
      const DocumentShare = mongoose.models.DocumentShare || (await import("@/lib/models/DocumentShare")).default;
      const InvestorProfile = mongoose.models.InvestorProfile || (await import("@/lib/models/InvestorProfile")).default;
      
      const profile = await InvestorProfile.findOne({ user_id: user._id });
      const companyName = profile?.company_name || user.full_name;

      const shares = await DocumentShare.find({
        $or: [
          { investor_id: user._id },
          { investor_name: { $regex: new RegExp(`^${companyName}$`, "i") } }
        ]
      }).populate("startup_id");

      const uniqueDeals = new Map();
      for (const share of shares) {
        const key = share.startup_id?._id?.toString() || share.founder_id?.toString();
        if (!key) continue;
        if (!uniqueDeals.has(key)) {
          const startup = share.startup_id;
          uniqueDeals.set(key, {
            id: companyName || user._id.toString(), // Room ID is investor identity
            name: startup?.company_name || "Foundex Startup",
            website: startup?.website_url || "#",
            type: startup?.sector || "Fintech",
            location: startup?.location || "Lagos, Nigeria",
            status: "In Conversation",
          });
        }
      }

      return NextResponse.json({ investors: Array.from(uniqueDeals.values()) });
    }

    // Get IDs and Statuses
    const savedIds = user.saved_investors || [];
    const statuses = user.investor_statuses || new Map();

    // Fetch Startup for this user
    const startup = await Startup.findOne({ user_id: user._id });

    // Fetch Investors from DB
    const dbIds = savedIds.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const investorsDocs = await Investor.find({ _id: { $in: dbIds } });

    const formattedDBInvestors = investorsDocs.map((inv) => {
      const id = inv._id.toString();
      const score = startup ? calculateFitScore(startup, inv).overall : null;
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
        fitScore: score,
      };
    });

    // Fetch saved Mock Investors
    const savedMocks = MOCK_INVESTORS.filter((inv) =>
      savedIds.includes(inv.id),
    ).map(inv => {
      const score = startup ? calculateFitScore(startup, inv).overall : null;
      return {
        ...inv,
        status: (statuses as any).get ? (statuses as any).get(inv.id) : statuses[inv.id] || "Not Contacted",
        fitScore: score,
      };
    });

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
