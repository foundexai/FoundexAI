// Website: https://breega.com/

/*
import { NextResponse } from "next/server";
import { connectDB } from "../db";
import Investor from "../models/Investor";
import { largeInvestorData } from "../seeds/investorData";

export async function POST() {
  try {
    const start = Date.now();
    await connectDB();

    if (!largeInvestorData || largeInvestorData.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 400 });
    }

    console.log(`=> Seeding: Processing ${largeInvestorData.length} investors...`);

    const colors = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-emerald-600",
      "from-orange-500 to-red-600",
      "from-yellow-500 to-orange-500",
      "from-teal-500 to-cyan-600"
    ];

    const bulkOps = largeInvestorData.map(data => {
      const logoInitial = data.name ? data.name.charAt(0).toUpperCase() : "?";
      const logoColor = colors[Math.floor(Math.random() * colors.length)];

      const updateData: any = {
        ...data,
        logoInitial: data.logoInitial || logoInitial,
        logoColor: data.logoColor || logoColor,
        isApproved: true,
      };

      return {
        updateOne: {
          filter: { name: data.name },
          update: { $set: updateData },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      // Chunk bulkOps to avoid payload size issues with MongoDB
      const chunkSize = 500;
      for (let i = 0; i < bulkOps.length; i += chunkSize) {
        const chunk = bulkOps.slice(i, i + chunkSize);
        await Investor.bulkWrite(chunk, { ordered: false });
      }
    }

    const duration = (Date.now() - start) / 1000;
    console.log(`=> Seeding: Completed in ${duration}s. Processed ${largeInvestorData.length} records.`);

    return NextResponse.json({ 
      message: "Seeded and updated batch successfully", 
      totalProcessed: largeInvestorData.length,
      duration: `${duration}s`
    });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ 
      error: "Failed to seed data", 
      details: error.message 
    }, { status: 500 });
  }
}
*/
export async function POST() { return new Response("Seed disabled"); }

