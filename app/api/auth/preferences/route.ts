import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function PATCH(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { preferences } = await req.json();
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    await connectDB();
    const userId = (decoded.user as any).id || (decoded.user as any)._id;

    const update: Record<string, boolean> = {};
    if (typeof preferences.dealFlowAlerts === "boolean") {
      update["preferences.dealFlowAlerts"] = preferences.dealFlowAlerts;
    }
    if (typeof preferences.profileVisibility === "boolean") {
      update["preferences.profileVisibility"] = preferences.profileVisibility;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      preferences: user?.preferences || preferences,
    });
  } catch (error) {
    console.error("PATCH /api/auth/preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
