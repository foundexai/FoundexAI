import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { runSOC2RetentionCleanup } from "@/lib/soc2RetentionService";

export async function POST(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("Authorization");
    const cronSecret = req.headers.get("x-cron-secret");

    // Allow execution via valid Admin/User Token or internal Cron Secret
    let isAuthorized = false;

    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      isAuthorized = true;
    } else if (authHeader) {
      const token = authHeader.split(" ")[1];
      const decoded = await verifyToken(token, true);
      if (decoded && decoded.user) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runSOC2RetentionCleanup();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error("Error running SOC2 retention cleanup:", err);
    return NextResponse.json({ error: "Failed to execute SOC2 cleanup" }, { status: 500 });
  }
}
