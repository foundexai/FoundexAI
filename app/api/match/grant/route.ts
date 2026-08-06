import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Grant from "@/lib/models/Grant";
import Startup from "@/lib/models/Startup";

async function getUserId(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

const MOCK_GRANTS = [
  {
    title: "NSF SBIR Phase I: Deeptech & Artificial Intelligence",
    agency: "National Science Foundation (NSF)",
    description: "Supports R&D in early-stage deeptech and AI startups. High focus on technological innovation and commercial potential.",
    amount: 275000,
    currency: "USD",
    eligibility_criteria: {
      stages: ["Pre-Seed", "Seed"],
      sectors: ["Deeptech", "AI", "Robotics", "Software"],
      locations: ["United States"],
    },
    deadline: new Date("2026-11-15"),
    url: "https://seedfund.nsf.gov/",
  },
  {
    title: "NIH STTR: Innovation in Healthcare & Medtech",
    agency: "National Institutes of Health (NIH)",
    description: "Funding for startups developing breakthrough medical devices, diagnostic tools, and therapeutic technologies.",
    amount: 250000,
    currency: "USD",
    eligibility_criteria: {
      stages: ["Pre-Seed", "Seed", "Series A"],
      sectors: ["Healthcare", "Biotech", "Life Sciences", "Hardware"],
      locations: ["United States"],
    },
    deadline: new Date("2026-12-05"),
    url: "https://sbir.nih.gov/",
  },
  {
    title: "Horizon Europe: EIC Accelerator Grant",
    agency: "European Commission",
    description: "Assists high-risk, high-potential startups to scale up breakthroughs in clean tech, healthcare, and deep software systems.",
    amount: 150000,
    currency: "EUR",
    eligibility_criteria: {
      stages: ["Seed", "Series A", "Series B+"],
      sectors: ["AI", "Fintech", "Deeptech", "Cleantech", "Software"],
      locations: ["Europe"],
    },
    deadline: new Date("2026-10-20"),
    url: "https://eic.ec.europa.eu/",
  },
  {
    title: "Innovative Solutions Canada: Technology Sandbox",
    agency: "Government of Canada",
    description: "Provides non-dilutive capital to Canadian software, cybersecurity, and information technology startups.",
    amount: 150000,
    currency: "CAD",
    eligibility_criteria: {
      stages: ["Pre-Seed", "Seed"],
      sectors: ["Software", "Cybersecurity", "AI", "Fintech"],
      locations: ["Canada"],
    },
    deadline: new Date("2026-09-12"),
    url: "https://www.ic.gc.ca/",
  },
  {
    title: "DoE Clean Energy Federal Innovation Fund",
    agency: "Department of Energy (DoE)",
    description: "Federal grant for research into battery storage, solar efficiency, and grid scale cleantech solutions.",
    amount: 500000,
    currency: "USD",
    eligibility_criteria: {
      stages: ["Seed", "Series A"],
      sectors: ["Cleantech", "Hardware", "Energy"],
      locations: ["United States"],
    },
    deadline: new Date("2026-11-01"),
    url: "https://www.energy.gov/",
  },
];

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    
    const { searchParams } = new URL(req.url);
    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");

    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: 1 });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ matches: [], userStartups: [], currentStartup: null });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    // Seed mock grants if none exist in the DB
    const count = await Grant.countDocuments();
    if (count === 0) {
      await Grant.insertMany(MOCK_GRANTS);
    }

    const grants = await Grant.find({});
    
    // Eligibility Scoring Algorithm (Vector embeddings simulation)
    const matches = grants.map((g) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Stage Matching
      const startupStage = startup.stage || "Unknown";
      if (g.eligibility_criteria.stages.includes(startupStage)) {
        score += 30;
        reasons.push(`Matches startup stage: ${startupStage}`);
      } else {
        reasons.push(`Typically targets ${g.eligibility_criteria.stages.join(" or ")}`);
      }

      // 2. Location Matching
      const startupLocation = startup.location || "United States";
      const isLocationMatched = g.eligibility_criteria.locations.some((loc: string) => 
        startupLocation.toLowerCase().includes(loc.toLowerCase()) || 
        loc.toLowerCase().includes(startupLocation.toLowerCase())
      );
      if (isLocationMatched) {
        score += 30;
        reasons.push(`Target region matches startup: ${startupLocation}`);
      } else {
        reasons.push(`Available in ${g.eligibility_criteria.locations.join(", ")}`);
      }

      // 3. Sector & Semantic Keyword Matching
      const startupSector = startup.sector || "";
      const startupDesc = (startup.business_description || "").toLowerCase();

      // Direct sector list intersection
      const sectorIntersection = g.eligibility_criteria.sectors.filter((sec: string) => 
        startupSector.toLowerCase().includes(sec.toLowerCase()) ||
        sec.toLowerCase().includes(startupSector.toLowerCase())
      );

      if (sectorIntersection.length > 0) {
        score += 30;
        reasons.push(`Direct sector match: ${sectorIntersection.join(", ")}`);
      }

      // Semantic Description Keyword Match (Vector similarity proxy)
      const descKeywords = [
        "artificial intelligence", "ai", "deeptech", "software", "healthcare", 
        "biotech", "cleantech", "fintech", "hardware", "robotics", "energy", "cybersecurity"
      ];
      
      let semanticMatches = 0;
      descKeywords.forEach(kw => {
        const inStartup = startupDesc.includes(kw);
        const inGrant = g.description.toLowerCase().includes(kw) || g.title.toLowerCase().includes(kw);
        if (inStartup && inGrant) {
          semanticMatches++;
        }
      });

      if (semanticMatches > 0) {
        score += Math.min(10, semanticMatches * 3);
        reasons.push(`Semantic description match on terms: ${semanticMatches} matches`);
      }

      return {
        _id: g._id,
        title: g.title,
        agency: g.agency,
        description: g.description,
        amount: g.amount,
        currency: g.currency,
        deadline: g.deadline,
        url: g.url,
        matchScore: Math.min(100, score),
        reasons,
      };
    });

    // Sort matches descending by score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      matches,
      userStartups: userStartups.map((s) => ({
        _id: s._id.toString(),
        company_name: s.company_name,
        stage: s.stage,
      })),
      currentStartup: {
        _id: startup._id.toString(),
        company_name: startup.company_name,
        stage: startup.stage,
      },
    });
  } catch (err) {
    console.error("GET /api/match/grant error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
