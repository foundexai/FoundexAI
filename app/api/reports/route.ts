import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const reports = await Report.find({ status: "published" }).sort({ created_at: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
