import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { MOCK_INVESTORS } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check Mock Data
    const mockFound = MOCK_INVESTORS.find((inv) => inv.id === id);
    if (mockFound) {
      return NextResponse.json({ investor: mockFound });
    }

    // 2. Check Database
    await connectDB();
    const dbFound = await Investor.findById(id);
    
    if (!dbFound) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    const formatted = {
      id: dbFound._id.toString(),
      name: dbFound.name,
      type: dbFound.type,
      stage: dbFound.stage,
      focus: dbFound.focus,
      location: dbFound.location,
      hq_country: dbFound.hq_country,
      logoInitial: dbFound.logoInitial,
      logoColor: dbFound.logoColor,
      description: dbFound.description,
      thesis: dbFound.thesis,
      investmentRange: dbFound.investmentRange,
      website: dbFound.website,
      linkedin: dbFound.linkedin,
      email: dbFound.email,
      active_status: dbFound.active_status,
      notes: dbFound.notes,
    };

    return NextResponse.json({ investor: formatted });
  } catch (error) {
    console.error("Error fetching single investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
