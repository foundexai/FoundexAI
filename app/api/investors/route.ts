import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    // Only fetch investors that are approved
    const investors = await Investor.find({ isApproved: true }).sort({
      created_at: -1,
    });

    // Transform _id to id to match frontend interface
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
    console.error("Error fetching investors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // Auth check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();

    // Basic validation
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Name and Type are required" },
        { status: 400 },
      );
    }

    const newInvestor = await Investor.create({
      ...body,
      // Ensure defaults/fallbacks if needed
      focus: body.focus || [],
      logoColor: body.logoColor || "from-blue-500 to-indigo-600",
      logoInitial: body.logoInitial || body.name.charAt(0),
    });

    // Explicitly cast to any or correct type to avoid TS errors with toObject/_id
    const createdInv = newInvestor as any;

    return NextResponse.json(
      {
        message: "Investor created successfully",
        investor: {
          ...createdInv.toObject(),
          id: createdInv._id.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
