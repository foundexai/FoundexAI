import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import Investor from "@/lib/models/Investor";

export async function GET() {
  try {
    await connectDB();

    const [startupsCount, investorsCount, startups, investors] = await Promise.all([
      Startup.countDocuments({ isApproved: true }),
      Investor.countDocuments({ isApproved: true }),
      Startup.find({ isApproved: true }, "sector location funding_amount created_at"),
      Investor.find({ isApproved: true }, "focus location created_at")
    ]);

    // Aggregate Sectors
    const sectorMap: { [key: string]: number } = {};
    startups.forEach(s => {
      if (s.sector) {
        sectorMap[s.sector] = (sectorMap[s.sector] || 0) + 1;
      }
    });

    const topSectors = Object.entries(sectorMap)
      .map(([name, count]) => ({ name, value: `${Math.round((count / startupsCount) * 100)}%` }))
      .sort((a, b) => parseInt(b.value) - parseInt(a.value))
      .slice(0, 10);

    // Aggregate Countries
    const countryMap: { [key: string]: number } = {};
    startups.forEach(s => {
      if (s.location) {
        const country = s.location.split(",").pop()?.trim() || "Global";
        countryMap[country] = (countryMap[country] || 0) + 1;
      }
    });

    const dealVolume = Object.entries(countryMap)
      .map(([country, count]) => ({ country, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    // Aggregate monthly transactions (e.g., funding milestones based on creation dates or explicit funding rounds)
    // For now, let's use created_at as a proxy for "deals active in the system"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => (currentMonth - 5 + i + 12) % 12);
    
    const transactions = last6Months.map(monthIdx => {
      const count = startups.filter(s => new Date(s.created_at).getMonth() === monthIdx).length;
      return { month: months[monthIdx], value: count };
    });

    return NextResponse.json({
      startupsCount,
      investorsCount,
      topSectors,
      dealVolume,
      transactions,
      // Recent active approved startups/investors
      recentStartups: startups.slice(0, 3).map(s => ({ name: (s as any).company_name, location: s.location })),
      recentInvestors: investors.slice(0, 6).map(i => ({ name: (i as any).name, category: i.type, location: i.location }))
    });
  } catch (error) {
    console.error("Error generating report stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
