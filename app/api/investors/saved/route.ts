import { NextResponse } from "next/server";
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

    // Get IDs
    const savedIds = user.saved_investors || [];

    // Fetch Investors
    const investors = await Investor.find({ _id: { $in: savedIds } });

    const formattedInvestors = investors.map((inv) => ({
      id: inv._id.toString(),
      name: inv.name,
      type: inv.type,
      focus: inv.focus,
      location: inv.location,
      logoInitial: inv.logoInitial,
      logoColor: inv.logoColor,
      description: inv.description,
      investmentRange: inv.investmentRange,
      website: inv.website,
    }));

    return NextResponse.json({ investors: formattedInvestors });
  } catch (error) {
    console.error("Error fetching saved investors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
