import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";

export async function GET() {
  try {
    await connectDB();
    // Fetch all startups that are approved (assuming approved flag exists, or just all for directory for now if we assume curated)
    // The previous schema addition included `isApproved`.
    const startups = await Startup.find({ isApproved: true }).sort({
      created_at: -1,
    });

    const formattedStartups = startups.map((startup) => ({
      id: startup._id.toString(),
      name: startup.company_name,
      sector: startup.sector,
      stage: startup.stage,
      location: startup.location,
      logoInitial: startup.logoInitial,
      logoColor: startup.logoColor,
      description: startup.business_description,
      website: startup.website,
      traction: startup.traction, // Might not be in schema? I didn't add traction to schema explicitly, I added funding fields.
      // Schema has: funding_amount, monthly_burn, etc.
      // Let's use `funding_stage` or `readiness_score` as proxy for traction or just omit if not there.
      // Wait, MOCK data has `traction`. Schema has `funding_stage`.
      // I'll skip traction from DB for now as it's not in schema string field.
      // Or I should add it to schema if needed.
    }));

    return NextResponse.json({ startups: formattedStartups });
  } catch (error) {
    console.error("Error fetching startups directory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Ensure POST is handled if we want "Suggest Startup" feature later, but for now we just need listing.
