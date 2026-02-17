import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import { verifyToken, isAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    await connectDB();

    const allowedUpdates = [
      "company_name",
      "business_description",
      "sector",
      "stage",
      "location",
      "website_url",
      "logo_url",
      "logoInitial",
      "logoColor",
      "traction",
    ];

    const updateData: Record<string, any> = {};
    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updatedStartup = await Startup.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedStartup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    return NextResponse.json(updatedStartup);
  } catch (error) {
    console.error("Error updating startup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
