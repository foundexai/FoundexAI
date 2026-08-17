import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SecureLink from "@/lib/models/SecureLink";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const body = await req.json();
    const { email, pageIndex, durationSeconds } = body;

    if (pageIndex === undefined || durationSeconds === undefined) {
      return NextResponse.json({ error: "pageIndex and durationSeconds are required" }, { status: 400 });
    }

    const secureLink = await SecureLink.findOne({ share_token: token });
    if (!secureLink) {
      return NextResponse.json({ error: "Secure link not found" }, { status: 404 });
    }

    if (secureLink.is_revoked) {
      return NextResponse.json({ error: "Access revoked" }, { status: 403 });
    }

    const cleanEmail = (email || "Public Viewer").toLowerCase().trim();

    // Find the latest access log for this email
    let accessLog = [...secureLink.access_logs]
      .reverse()
      .find((log: any) => log.viewer_email.toLowerCase() === cleanEmail);

    if (!accessLog) {
      // Create a fresh access log if not found (should rarely happen if verify succeeded first)
      secureLink.access_logs.push({
        viewer_email: cleanEmail,
        viewer_ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        user_agent: req.headers.get("user-agent") || "Browser",
        viewed_at: new Date(),
        duration_seconds: 0,
        page_views: [],
      });
      accessLog = secureLink.access_logs[secureLink.access_logs.length - 1];
    }

    // Find or create the page view duration tracker
    let pageView = accessLog.page_views.find((pv: any) => pv.page_number === pageIndex);

    if (!pageView) {
      accessLog.page_views.push({
        page_number: pageIndex,
        duration_seconds: 0,
      });
      pageView = accessLog.page_views[accessLog.page_views.length - 1];
    }

    // Increment durations
    pageView.duration_seconds += durationSeconds;
    accessLog.duration_seconds += durationSeconds;

    // Direct update to save mongoose nested sub-document arrays correctly
    secureLink.markModified("access_logs");
    await secureLink.save();

    return NextResponse.json({ success: true, totalDuration: accessLog.duration_seconds });
  } catch (err) {
    console.error("POST /api/documents/share/[token]/heatmap error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
