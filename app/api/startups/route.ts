import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      console.log("API Startups: No token provided");
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log("API Startups: Invalid token");
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }
    const { user } = decoded;

    const { company_name, business_description } = await req.json();

    if (!company_name || !business_description) {
      return NextResponse.json(
        { error: "Company name and business description are required" },
        { status: 400 }
      );
    }

    const newStartup = await Startup.create({
      user_id: user._id, // Use user._id which is standard for MongoDB documents
      company_name,
      business_description,
    });

    return NextResponse.json({ startup: newStartup }, { status: 201 });
  } catch (error) {
    console.error("Error creating startup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      console.log("API Startups GET: No token provided");
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log("API Startups GET: Invalid token");
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }
    const { user } = decoded;

    const userStartups = await Startup.find({ user_id: user._id }); // Use user._id for the query

    return NextResponse.json({ startups: userStartups });
  } catch (error) {
    console.error("Error fetching startups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
