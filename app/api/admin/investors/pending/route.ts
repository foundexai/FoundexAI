import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken, isAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const investorsDocs = await Investor.find({ isApproved: false });

    const investors = investorsDocs.map((inv) => ({
      id: inv._id.toString(),
      name: inv.name,
      type: inv.type,
      focus: inv.focus,
      location: inv.location,
      logoInitial: inv.logoInitial,
      logoColor: inv.logoColor,
      description: inv.description,
      investmentRange: inv.investmentRange || inv.investment_range,
      website: inv.website,
    }));

    return NextResponse.json({ investors });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
