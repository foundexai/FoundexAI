import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import { callAI } from "@/lib/ai";

export const VC_PERSONAS = {
  tier1_vc: {
    name: "Alex Vance",
    firm: "Benchmark Peak Capital",
    title: "General Partner (Hardball Tier-1 VC)",
    style: "Direct, skeptical, deeply probing defensibility and product-market fit.",
    avatarColor: "from-amber-500 to-red-600",
    badge: "Tier-1 Hardball VC",
  },
  quant_hawk: {
    name: "Elena Rostova",
    firm: "Metric Horizon Ventures",
    title: "Growth Partner (Quantitative & Unit Economics Hawk)",
    style: "Numbers-obsessed, calculating CAC/LTV, burn multiple, and net retention.",
    avatarColor: "from-blue-600 to-indigo-800",
    badge: "Metrics Hawk VC",
  },
  angel_visionary: {
    name: "Marcus Chen",
    firm: "First Spark Syndicate",
    title: "Serial Founder & Super Angel",
    style: "Vision-focused, evaluating founder-market fit, 'earned secrets', and 'Why Now?'.",
    avatarColor: "from-emerald-500 to-teal-700",
    badge: "Founder-Friendly Angel",
  },
  corporate_vc: {
    name: "Sarah Jenkins",
    firm: "Apex Corporate Ventures",
    title: "Managing Director (Strategic Enterprise VC)",
    style: "Risk-sensitive, examining enterprise sales cycles, compliance, and distribution moats.",
    avatarColor: "from-purple-600 to-fuchsia-800",
    badge: "Strategic Corporate VC",
  },
};

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
    const body = await req.json();
    const {
      startupId,
      persona = "tier1_vc",
      topic = "general",
      previousTurns = [],
    } = body;

    // Resolve startup context
    let startup: any = null;
    const activeId = startupId || req.headers.get("x-startup-id");
    if (activeId) {
      startup = await Startup.findById(activeId).lean();
    } else {
      startup = await Startup.findOne({ user_id: user.id || user._id }).lean();
    }

    const selectedPersona = (VC_PERSONAS as any)[persona] || VC_PERSONAS.tier1_vc;

    const startupContext = startup
      ? `
Startup Name: ${startup.company_name}
Sector: ${startup.sector || "Tech"}
Stage: ${startup.stage || startup.funding_stage || "Seed"}
Business Model: ${startup.business_model || "B2B SaaS"}
Description: ${startup.business_description || "High-growth technology startup"}
Mission: ${startup.mission || "Disrupt market sector"}
Financials: MRR $${startup.mrr || 0}, ARR $${startup.arr || 0}, Cash on hand $${startup.cash_on_hand || 0}, Monthly Burn $${startup.monthly_burn || 0}
Target Raise: $${startup.funding_amount || 1000000}
`
      : `
Startup Name: TechCorp Inc
Sector: Fintech / B2B SaaS
Stage: Seed
Target Raise: $1,500,000
`;

    const conversationHistory = previousTurns.length > 0
      ? previousTurns.map((turn: any, index: number) => 
          `${turn.role === "vc" ? "VC" : "Founder"}: "${turn.content}"`
        ).join("\n")
      : "No previous conversation. This is the opening interrogation question.";

    const systemPrompt = `You are ${selectedPersona.name}, ${selectedPersona.title} at ${selectedPersona.firm}.
Persona Style: ${selectedPersona.style}

Your mission is to stress-test this startup founder in an authentic, high-stakes pitch meeting.
You must generate a single, sharp, challenging, and realistic VC question tailored to their specific sector, financials, stage, and previous statements.

Rules:
1. Speak directly to the founder in the first person ("I see your...", "How do you explain...", "What's preventing...").
2. Don't be polite or generic. Ask specific, high-leverage questions about customer acquisition bottlenecks, defensibility, unit economics, competition, or market size.
3. If there is conversation history, challenge their previous statement or follow up aggressively on weak points.
4. Respond in strict JSON format.

JSON Schema:
{
  "question": "string (the exact question the VC asks)",
  "vcContext": "string (brief note explaining why you are asking this and what red flag you are sniffing out)",
  "suggestedTalkingPoints": ["string", "string", "string"],
  "category": "string (e.g. Unit Economics | Defensibility & Moats | Market Sizing | GTM Execution | Product Differentiation)"
}`;

    const userPrompt = `
Here is the startup's current dossier:
${startupContext}

Focus Topic: ${topic}
Conversation Transcript So Far:
${conversationHistory}

Generate the next simulated VC question now.
`;

    const aiRes = await callAI({
      systemPrompt,
      prompt: userPrompt,
      responseFormat: "json_object",
      temperature: 0.8,
    });

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiRes.content);
    } catch {
      parsedResult = {
        question: `Looking at your ${startup?.business_model || "business model"}, how do you plan to achieve sustainable unit economics while scaling past your current MRR?`,
        vcContext: "Probing scalability vs customer acquisition cost trajectory.",
        suggestedTalkingPoints: [
          "Highlight historical CAC efficiency and organic referral loops",
          "Break down gross margins and expansion revenue metrics",
          "Present enterprise contract ACV growth pipeline",
        ],
        category: "Unit Economics",
      };
    }

    return NextResponse.json({
      success: true,
      persona: selectedPersona,
      question: parsedResult.question,
      vcContext: parsedResult.vcContext,
      suggestedTalkingPoints: parsedResult.suggestedTalkingPoints || [],
      category: parsedResult.category || "General Strategy",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in pitch-simulator route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate simulated pitch question" },
      { status: 500 }
    );
  }
}
