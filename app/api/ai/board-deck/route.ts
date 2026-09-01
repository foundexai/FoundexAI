import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";
import Task from "@/lib/models/Task";
import InvestorUpdate from "@/lib/models/InvestorUpdate";
import { callAI } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const body = await req.json().catch(() => ({}));
    const {
      startupId,
      focus = "Quarterly Review & Governance",
      quarter = "Q4 2026",
    } = body;

    // Resolve startup context
    let startup: any = null;
    const activeId = startupId || req.headers.get("x-startup-id");
    if (activeId) {
      startup = await Startup.findById(activeId).lean();
    } else {
      startup = await Startup.findOne({ user_id: user.id || user._id }).lean();
    }

    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // 1. Fetch Cap Table
    const shareholders = await CapTable.find({ startup_id: startup._id }).lean();
    const totalIssuedShares = shareholders.reduce((sum, s) => sum + (s.share_count || 0), 0);
    const totalCapitalRaised = shareholders.reduce((sum, s) => sum + (s.investment_amount || 0), 0);
    const capTableSummary = {
      shareholderCount: shareholders.length,
      totalIssuedShares,
      totalCapitalRaised: totalCapitalRaised || startup.funding_amount || 0,
      classes: Array.from(new Set(shareholders.map((s) => s.share_class))),
    };

    // 2. Fetch Tasks / Milestones
    const completedTasks = await Task.find({
      startup_id: startup._id,
      status: "completed",
    })
      .limit(10)
      .lean();

    const pendingTasks = await Task.find({
      startup_id: startup._id,
      status: { $ne: "completed" },
    })
      .limit(6)
      .lean();

    // 3. Fetch Recent Investor Updates
    const recentUpdates = await InvestorUpdate.find({ startup_id: startup._id })
      .sort({ created_at: -1 })
      .limit(3)
      .lean();

    // Calculate runway
    const monthlyBurn = startup.monthly_burn || 15000;
    const cashOnHand = startup.cash_on_hand || 180000;
    const runwayMonths = monthlyBurn > 0 ? (cashOnHand / monthlyBurn).toFixed(1) : "18+";

    const systemPrompt = `You are an elite Silicon Valley Chief of Staff and Board Advisor.
You synthesize authentic, institutional-grade 10-Slide Board of Directors Deck presentations.

Format the output in strict JSON.

Deck Requirements (10 Slides):
Slide 1: State of the Union & Executive Summary
Slide 2: Financial Performance & Runway Analysis
Slide 3: Cap Table & Equity Structure
Slide 4: Key Milestones Delivered (Last Quarter)
Slide 5: Product & Engineering Milestones
Slide 6: Go-to-Market & Pipeline Momentum
Slide 7: Strategic Priorities & Next Quarter OKRs
Slide 8: Key Headwinds, Risks & Mitigation
Slide 9: Board Resolutions & Required Approvals
Slide 10: Outlook, Next Steps & Open Discussion

Each slide must have:
- slideNumber: integer (1 to 10)
- title: string
- category: string
- keyPoints: string[] (3-5 punchy bullets)
- metrics: { label: string, value: string }[] (2-4 key data chips)
- speakerNotes: string (natural script for the CEO/Founder presenting to board members)
- resolutionsOrDecisions: string (optional action item for the board)

JSON Schema:
{
  "deckTitle": "string",
  "quarter": "string",
  "executiveSummary": "string",
  "financialSnapshot": {
    "arr": "string",
    "mrr": "string",
    "cashOnHand": "string",
    "monthlyBurn": "string",
    "runwayMonths": "string"
  },
  "slides": [
    {
      "slideNumber": number,
      "title": "string",
      "category": "string",
      "keyPoints": ["string"],
      "metrics": [{ "label": "string", "value": "string" }],
      "speakerNotes": "string",
      "resolutionsOrDecisions": "string"
    }
  ]
}`;

    const userPrompt = `
Synthesize a 10-slide board presentation for:
Company: ${startup.company_name}
Sector: ${startup.sector || "Enterprise Tech"}
Stage: ${startup.stage || startup.funding_stage || "Seed"}
Business Model: ${startup.business_model || "B2B SaaS"}
Mission: ${startup.mission || "Accelerate venture growth"}
Description: ${startup.business_description || "Venture technology company"}
Board Focus: ${focus}
Quarter: ${quarter}

Financials:
- Cash on Hand: $${cashOnHand.toLocaleString()}
- Monthly Net Burn: $${monthlyBurn.toLocaleString()}
- Runway: ${runwayMonths} months
- MRR: $${(startup.mrr || 0).toLocaleString()}
- ARR: $${(startup.arr || 0).toLocaleString()}
- Total Capital Raised: $${(capTableSummary.totalCapitalRaised || 0).toLocaleString()}

Cap Table:
- Total Shareholders: ${capTableSummary.shareholderCount}
- Total Issued Shares: ${capTableSummary.totalIssuedShares.toLocaleString()}
- Share Classes: ${capTableSummary.classes.join(", ") || "Common"}

Completed Milestones (${completedTasks.length}):
${completedTasks.map((t) => `- ${t.title} (${t.category || "General"})`).join("\n") || "Delivered product MVP and initiated investor outreach"}

Upcoming Priorities (${pendingTasks.length}):
${pendingTasks.map((t) => `- ${t.title} (${t.category || "General"})`).join("\n") || "Scale customer acquisition and optimize burn rate"}

Recent Updates:
${recentUpdates.map((u) => `- [${u.title || "Monthly Update"}]: ${u.metrics_summary || u.highlights || "Positive momentum"}`).join("\n") || "Consistent operational progress"}
`;

    const aiRes = await callAI({
      systemPrompt,
      prompt: userPrompt,
      responseFormat: "json_object",
      temperature: 0.5,
    });

    let deckData;
    try {
      deckData = JSON.parse(aiRes.content);
    } catch {
      deckData = {
        deckTitle: `${startup.company_name} - ${quarter} Board of Directors Presentation`,
        quarter,
        executiveSummary: `${startup.company_name} has maintained disciplined cash management while achieving core product roadmap milestones.`,
        financialSnapshot: {
          arr: `$${(startup.arr || 0).toLocaleString()}`,
          mrr: `$${(startup.mrr || 0).toLocaleString()}`,
          cashOnHand: `$${cashOnHand.toLocaleString()}`,
          monthlyBurn: `$${monthlyBurn.toLocaleString()}`,
          runwayMonths: `${runwayMonths} Months`,
        },
        slides: [
          {
            slideNumber: 1,
            title: "State of the Union & Executive Overview",
            category: "Executive Summary",
            keyPoints: [
              `Operating with ${runwayMonths} months of runway.`,
              "Delivered key infrastructure and compliance milestones.",
              "Preparing for high-velocity go-to-market scaling.",
            ],
            metrics: [
              { label: "Runway", value: `${runwayMonths} Mos` },
              { label: "MRR", value: `$${(startup.mrr || 0).toLocaleString()}` },
            ],
            speakerNotes: "Welcome board members. Today we review our strong execution against our quarterly goals and outline our capital allocation strategy.",
            resolutionsOrDecisions: "Approve previous board meeting minutes.",
          },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      deck: deckData,
      startup: {
        id: startup._id,
        name: startup.company_name,
        stage: startup.stage || startup.funding_stage || "Seed",
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in board-deck synthesizer route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synthesize board deck" },
      { status: 500 }
    );
  }
}
