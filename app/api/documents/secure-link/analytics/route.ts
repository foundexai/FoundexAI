import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import SecureLink from "@/lib/models/SecureLink";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docUrl = searchParams.get("url");

    if (!docUrl) {
      return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
    }

    // Find all links generated for this document by this founder/startup
    const links = await SecureLink.find({
      doc_url: docUrl,
      founder_id: decoded.user._id,
    });

    const pageDurations: Record<number, number> = {};
    const viewerSummariesMap: Record<string, { totalSeconds: number; lastViewed: Date }> = {};

    links.forEach((link) => {
      link.access_logs.forEach((log: any) => {
        const email = log.viewer_email.toLowerCase().trim();

        // Aggregate viewer summary
        if (!viewerSummariesMap[email]) {
          viewerSummariesMap[email] = {
            totalSeconds: 0,
            lastViewed: log.viewed_at,
          };
        }
        viewerSummariesMap[email].totalSeconds += log.duration_seconds;
        if (new Date(log.viewed_at) > new Date(viewerSummariesMap[email].lastViewed)) {
          viewerSummariesMap[email].lastViewed = log.viewed_at;
        }

        // Aggregate page Views heatmap durations
        if (log.page_views && Array.isArray(log.page_views)) {
          log.page_views.forEach((pv: any) => {
            const pageNum = pv.page_number;
            pageDurations[pageNum] = (pageDurations[pageNum] || 0) + pv.duration_seconds;
          });
        }
      });
    });

    const viewerSummaries = Object.entries(viewerSummariesMap).map(([email, stats]) => ({
      email,
      totalSeconds: stats.totalSeconds,
      lastViewed: stats.lastViewed,
    }));

    // Find the max duration on any page to allow frontend normalized color gradient overlays
    const durationsList = Object.values(pageDurations);
    const maxDuration = durationsList.length > 0 ? Math.max(...durationsList) : 0;

    return NextResponse.json({
      pageDurations,
      viewerSummaries,
      maxDuration,
    });
  } catch (err) {
    console.error("GET /api/documents/secure-link/analytics error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
