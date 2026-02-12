import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { name, sector, description, location, website } = await req.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    const newStartup = await Startup.create({
      company_name: name,
      business_description: description,
      sector: sector || "Technology",
      location: location || "Africa",
      website_url: website,
      isApproved: false, // Joins waitlist
      submittedBy: decoded.user._id.toString(),
      logoInitial: name.charAt(0).toUpperCase(),
      logoColor: "from-blue-500 to-indigo-600",
    });

    return NextResponse.json({
      message: "Startup submitted successfully! You have joined the waitlist.",
      startup: newStartup,
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting startup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
