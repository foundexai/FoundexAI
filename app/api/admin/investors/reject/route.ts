import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken, isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token, true);
    if (!decoded || !isAdmin(decoded.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const investor = await Investor.findById(id);
    if (investor) {
      const { notifyUser, notifyAdmins } = await import("@/lib/notifications");
      if (investor.submittedBy) {
        await notifyUser(
          investor.submittedBy.toString(),
          "❌ Investor Profile Rejected",
          `The investor profile for "${investor.name}" has been rejected.`,
          "rejection",
          "/dashboard"
        );
      }
      
      await notifyAdmins(
        "❌ Investor Rejected",
        `An admin rejected the investor profile for ${investor.name}.`,
        "rejection",
        "/dashboard/admin"
      );
    }

    await Investor.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting investor:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
