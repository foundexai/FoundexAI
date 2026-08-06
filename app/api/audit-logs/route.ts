import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const { searchParams } = new URL(req.url);

    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");
    const entityFilter = searchParams.get("entity");
    const actionFilter = searchParams.get("action");
    const searchQuery = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    // Fetch user startups
    const userStartups = await Startup.find({ user_id: user._id }).sort({ created_at: 1 });
    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({
        success: true,
        userStartups: [],
        currentStartup: null,
        auditLogs: [],
        totalLogs: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    const targetStartup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    // Build Mongoose query
    const query: any = { startup_id: targetStartup._id };

    if (entityFilter && entityFilter !== "all") {
      query.entity = entityFilter;
    }

    if (actionFilter && actionFilter !== "all") {
      query.action = actionFilter;
    }

    if (searchQuery.trim()) {
      const regex = new RegExp(searchQuery.trim(), "i");
      query.$or = [
        { action: regex },
        { entity: regex },
        { "details.shareholder_name": regex },
        { "details.share_class": regex },
      ];
    }

    const totalLogs = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit) || 1;
    const skip = (page - 1) * limit;

    const auditLogs = await AuditLog.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id", "email name avatar");

    return NextResponse.json({
      success: true,
      userStartups: userStartups.map((s) => ({
        _id: s._id.toString(),
        company_name: s.company_name,
        stage: s.stage,
      })),
      currentStartup: {
        _id: targetStartup._id.toString(),
        company_name: targetStartup.company_name,
        stage: targetStartup.stage,
      },
      auditLogs,
      totalLogs,
      totalPages,
      currentPage: page,
    });
  } catch (err: any) {
    console.error("Error fetching Audit Logs:", err);
    return NextResponse.json({ error: "Failed to load activity history" }, { status: 500 });
  }
}
