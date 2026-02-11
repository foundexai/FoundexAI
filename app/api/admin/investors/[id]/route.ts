import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken, isAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updatedInvestor = await Investor.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedInvestor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, investor: updatedInvestor });
  } catch (error) {
    console.error("Error updating investor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
