import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { investors } = await req.json();
    if (!Array.isArray(investors)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of investors." }, { status: 400 });
    }

    await connectDB();

    const results = {
      updated: 0,
      created: 0,
      errors: 0
    };

    for (const data of investors) {
      try {
        // Find by name or website (as unique identifiers)
        const filter = data.website 
          ? { $or: [{ name: data.name }, { website: data.website }] }
          : { name: data.name };

        const updateData = {
          ...data,
          isApproved: true, // Auto-approve admin updates
          updated_at: new Date()
        };

        const existing = await Investor.findOneAndUpdate(filter, updateData, { 
          new: true, 
          upsert: true,
          setDefaultsOnInsert: true
        });

        if (existing.created_at && (new Date().getTime() - new Date(existing.created_at).getTime() < 1000)) {
            results.created++;
        } else {
            results.updated++;
        }
      } catch (err) {
        console.error(`Error processing investor ${data.name}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      message: "Bulk update complete",
      results
    });

  } catch (error) {
    console.error("Bulk Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
