import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { searchVectors } from "@/lib/vectorSearch";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const typeParam = searchParams.get("type") || "investor";

    if (typeParam !== "startup" && typeParam !== "investor") {
      return NextResponse.json({ error: "Invalid type parameter. Must be 'startup' or 'investor'." }, { status: 400 });
    }

    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const results = await searchVectors(q, typeParam, limit);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Error performing vector search:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
