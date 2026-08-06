import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { searchVectors } from "@/lib/vectorSearch";
import Startup from "@/lib/models/Startup";
import Investor from "@/lib/models/Investor";
import Grant from "@/lib/models/Grant";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const typeParam = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    if (typeParam === "startup" || typeParam === "investor") {
      const results = await searchVectors(q, typeParam, limit);
      return NextResponse.json({ results });
    }

    // Perform multi-collection semantic vector search
    const [startupResults, investorResults] = await Promise.all([
      searchVectors(q, "startup", 5).catch(() => []),
      searchVectors(q, "investor", 5).catch(() => []),
    ]);

    const formattedStartups = (startupResults || []).map((s: any) => ({
      _id: s._id,
      title: s.company_name,
      description: s.tagline || s.business_description || s.sector,
      type: "Startup",
      category: "Startup Directory",
      href: "/dashboard/startups",
      matchScore: s.score ? Math.round(s.score * 100) : 95,
    }));

    const formattedInvestors = (investorResults || []).map((inv: any) => ({
      _id: inv._id,
      title: inv.name || inv.firm_name,
      description: inv.bio || inv.investment_thesis || inv.sectors?.join(", "),
      type: "Investor",
      category: "Investor Database",
      href: "/dashboard/investors",
      matchScore: inv.score ? Math.round(inv.score * 100) : 92,
    }));

    const combinedResults = [...formattedStartups, ...formattedInvestors].sort(
      (a, b) => b.matchScore - a.matchScore
    );

    return NextResponse.json({ results: combinedResults });
  } catch (err) {
    console.error("Error performing vector search:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
