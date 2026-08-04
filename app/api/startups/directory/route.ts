import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let formattedStartups: any[] = [];

    if (search.trim()) {
      const { searchVectors } = await import("@/lib/vectorSearch");
      const vectorResults = await searchVectors(search, "startup", 100);
      formattedStartups = vectorResults.map((res) => {
        const startup = res.item;
        return {
          id: startup._id.toString(),
          name: startup.company_name,
          sector: startup.sector || "Uncategorized",
          stage: startup.stage || "Unknown",
          location: startup.location || "Africa",
          logoInitial: startup.logoInitial || startup.company_name.charAt(0) || "S",
          logoColor: startup.logoColor || "bg-blue-500",
          description: startup.business_description,
          website: startup.website_url,
          readiness_score: startup.readiness_score || 0,
          traction: startup.funding_amount
            ? `$${startup.funding_amount.toLocaleString()} Raised`
            : startup.readiness_score
              ? `${startup.readiness_score}% Readiness`
              : "Pre-revenue",
          score: res.score,
        };
      });
    } else {
      const startups = await Startup.find({ isApproved: true }).sort({
        created_at: -1,
      });

      formattedStartups = startups.map((startup) => ({
        id: startup._id.toString(),
        name: startup.company_name,
        sector: startup.sector || "Uncategorized",
        stage: startup.stage || "Unknown",
        location: startup.location || "Africa",
        logoInitial: startup.logoInitial || startup.company_name.charAt(0) || "S",
        logoColor: startup.logoColor || "bg-blue-500",
        description: startup.business_description,
        website: startup.website_url,
        readiness_score: startup.readiness_score || 0,
        traction: startup.funding_amount
          ? `$${startup.funding_amount.toLocaleString()} Raised`
          : startup.readiness_score
            ? `${startup.readiness_score}% Readiness`
            : "Pre-revenue",
      }));
    }

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
