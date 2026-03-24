import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const report = await Report.findOne({ slug, status: "published" });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Increment views
    await Report.updateOne({ _id: report._id }, { $inc: { views: 1 } });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
