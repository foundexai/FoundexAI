import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import User from "@/lib/models/User";
import Investor from "@/lib/models/Investor";
import PipelineDeal from "@/lib/models/PipelineDeal";
import { MOCK_INVESTORS } from "@/lib/data";
import { calculateFitScore } from "@/lib/fit-score";
import mongoose from "mongoose";

// GET: Retrieve all pipeline deals for the user with status synchronization
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.user._id;

    // 1. Fetch user startup
    const startup = await Startup.findOne({ user_id: userId });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // 2. Data Migration Sync: Import old ad-hoc saved investors & statuses to PipelineDeals
    const userDoc = await User.findById(userId);
    if (userDoc) {
      const savedIds = userDoc.saved_investors || [];
      const oldStatuses = userDoc.investor_statuses || new Map();

      for (const invId of savedIds) {
        // Check if deal already exists
        let deal = await PipelineDeal.findOne({ user_id: userId, investor_id: invId });
        if (!deal) {
          // Find investor details to get name
          let invName = "Unknown Investor";
          if (mongoose.Types.ObjectId.isValid(invId)) {
            const dbInv = await Investor.findById(invId);
            if (dbInv) invName = dbInv.name;
          } else {
            const mockInv = MOCK_INVESTORS.find(m => m.id === invId);
            if (mockInv) invName = mockInv.name;
          }

          // Map old statuses to upgraded 7 stages
          const oldStatus = (oldStatuses as any).get ? (oldStatuses as any).get(invId) : oldStatuses[invId];
          let mappedStage = "shortlisted";
          if (oldStatus === "Emailed") mappedStage = "outreach_sent";
          else if (oldStatus === "In Conversation") mappedStage = "intro_meeting";
          else if (oldStatus === "Due Diligence") mappedStage = "due_diligence";

          // Create new PipelineDeal document
          await PipelineDeal.create({
            user_id: userId,
            startup_id: startup._id,
            investor_id: invId,
            investor_name: invName,
            stage: mappedStage,
            deal_amount: startup.funding_amount || 0,
            activity_log: [
              {
                date: new Date(),
                type: "system",
                description: `Deal migrated to pipeline in stage "${mappedStage}".`,
              },
            ],
          });
        }
      }
    }

    // 3. Fetch all current pipeline deals
    const dealsDocs = await PipelineDeal.find({ user_id: userId }).sort({ updated_at: -1 });

    // 4. Enrich deals with full investor card/profile details and fit scores
    const enrichedDeals = [];
    for (const deal of dealsDocs) {
      let investorDetails: any = null;

      if (mongoose.Types.ObjectId.isValid(deal.investor_id)) {
        const dbInv = await Investor.findById(deal.investor_id);
        if (dbInv) {
          investorDetails = {
            id: dbInv._id.toString(),
            name: dbInv.name,
            type: dbInv.type,
            focus: dbInv.focus || [],
            location: dbInv.location,
            logoInitial: dbInv.logoInitial || dbInv.name.charAt(0),
            logoColor: dbInv.logoColor || "from-gray-500 to-zinc-600",
            description: dbInv.description,
            investmentRange: dbInv.investmentRange || dbInv.investment_range,
            website: dbInv.website,
          };
        }
      }

      if (!investorDetails) {
        const mockInv = MOCK_INVESTORS.find(m => m.id === deal.investor_id);
        if (mockInv) {
          investorDetails = mockInv;
        }
      }

      if (!investorDetails) {
        // Fallback placeholder
        investorDetails = {
          id: deal.investor_id,
          name: deal.investor_name,
          type: "VC",
          focus: [],
          location: "Unknown Location",
          logoInitial: deal.investor_name.charAt(0),
          logoColor: "from-gray-400 to-zinc-500",
          description: "",
          investmentRange: "Undisclosed",
          website: "",
        };
      }

      const fitScore = calculateFitScore(startup, investorDetails);

      enrichedDeals.push({
        id: deal._id.toString(),
        startupId: deal.startup_id.toString(),
        investorId: deal.investor_id,
        investorName: deal.investor_name,
        stage: deal.stage,
        dealAmount: deal.deal_amount,
        notes: deal.notes,
        nextFollowup: deal.next_followup,
        activityLog: deal.activity_log,
        reminders: deal.reminders,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        investor: investorDetails,
        fitScore: fitScore.overall,
        fitBreakdown: fitScore,
      });
    }

    return NextResponse.json({ deals: enrichedDeals });
  } catch (error) {
    console.error("GET pipeline deals error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add a new investor to the pipeline
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.user._id;
    const body = await req.json();
    const { investorId } = body;

    if (!investorId) {
      return NextResponse.json({ error: "Investor ID is required" }, { status: 400 });
    }

    // 1. Fetch startup
    const startup = await Startup.findOne({ user_id: userId });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // 2. Fetch investor details to save investor name
    let investorName = "Unknown Investor";
    if (mongoose.Types.ObjectId.isValid(investorId)) {
      const dbInv = await Investor.findById(investorId);
      if (dbInv) investorName = dbInv.name;
    } else {
      const mockInv = MOCK_INVESTORS.find(m => m.id === investorId);
      if (mockInv) investorName = mockInv.name;
    }

    // 3. Check if deal already exists
    let deal = await PipelineDeal.findOne({ user_id: userId, investor_id: investorId });
    if (deal) {
      return NextResponse.json({ error: "Investor is already in the pipeline" }, { status: 400 });
    }

    // 4. Create new pipeline deal
    deal = await PipelineDeal.create({
      user_id: userId,
      startup_id: startup._id,
      investor_id: investorId,
      investor_name: investorName,
      stage: "shortlisted",
      deal_amount: startup.funding_amount || 0,
      activity_log: [
        {
          date: new Date(),
          type: "system",
          description: `Added "${investorName}" to pipeline as Shortlisted.`,
        },
      ],
    });

    // 5. Also sync to User saved_investors list if not already there
    await User.findByIdAndUpdate(userId, {
      $addToSet: { saved_investors: investorId },
      $set: { [`investor_statuses.${investorId}`]: "Not Contacted" }
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error("POST pipeline deal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
