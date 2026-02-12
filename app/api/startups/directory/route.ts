import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";

export async function GET() {
  try {
    await connectDB();
    // Fetch all startups that are approved (assuming approved flag exists, or just all for directory for now if we assume curated)
    // The previous schema addition included `isApproved`.
    // Fetch all startups that are approved
    const startups = await Startup.find({ isApproved: true }).sort({
      created_at: -1,
    });

    const formattedStartups = startups.map((startup) => ({
      id: startup._id.toString(),
      name: startup.company_name,
      sector: startup.sector || "Uncategorized",
      stage: startup.stage || "Unknown",
      location: startup.location || "Africa",
      logoInitial: startup.logoInitial || startup.company_name.charAt(0) || "S",
      logoColor: startup.logoColor || "bg-blue-500",
      description: startup.business_description,
      website: startup.website_url, // Map website_url to website
      traction: startup.funding_amount
        ? `$${startup.funding_amount.toLocaleString()} Raised`
        : startup.readiness_score
          ? `${startup.readiness_score}% Readiness`
          : "Pre-revenue",
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
