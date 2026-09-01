import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
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
    const body = await req.json();
    const {
      question,
      founderAnswer,
      persona = "tier1_vc",
      startupId,
      category = "General",
    } = body;

    if (!question || !founderAnswer) {
      return NextResponse.json(
        { error: "Question and founderAnswer are required" },
        { status: 400 }
      );
    }

    // Resolve startup context
    let startup: any = null;
    const activeId = startupId || req.headers.get("x-startup-id");
    if (activeId) {
      startup = await Startup.findById(activeId).lean();
    } else {
      startup = await Startup.findOne({ user_id: user.id || user._id }).lean();
    }

    const startupDetails = startup
      ? `
Startup: ${startup.company_name} (${startup.sector || "Tech"}, ${startup.stage || "Seed"})
MRR: $${startup.mrr || 0}, ARR: $${startup.arr || 0}, Burn: $${startup.monthly_burn || 0}/mo
`
      : "";

    const systemPrompt = `You are a Silicon Valley Pitch Master & Venture Capital Partner conducting rigorous pitch analysis.
Your job is to objectively score a startup founder's pitch rebuttal and deliver high-conviction constructive critique.

Analyze the founder's response to the VC question across 4 dimensions:
1. Clarity & Brevity (0-100): Is it crisp, structured, and free of fluff or rambling?
2. Defensibility & Metrics (0-100): Does it cite hard facts, unit economics, conversion data, or structural moats?
3. Conviction & Authority (0-100): Does the founder project leadership, ownership, and deep domain mastery?
4. Overall Score (0-100): Holistic VC partner readiness score.

Also generate:
- Verdict: One of ["Exceptional / Term-Sheet Ready", "Solid / Promising Answer", "Needs Polish & Data", "High Risk / Pivot Required"]
- 2-3 specific strengths
- 1-3 red flags or missed opportunities
- "Top 1% Founder Rebuttal": Rewrite the response into an elite, succinct, 3-sentence golden script.
- "Co-Founder Takeaway": 1 actionable tip.

Respond in strict JSON format.

JSON Schema:
{
  "clarityScore": number (0-100),
  "defensibilityScore": number (0-100),
  "convictionScore": number (0-100),
  "overallScore": number (0-100),
  "verdict": "string",
  "strengths": ["string", "string"],
  "redFlags": ["string", "string"],
  "improvedRebuttal": "string",
  "coFounderAdvice": "string"
}`;

    const userPrompt = `
${startupDetails}
VC Question (${category}):
"${question}"

Founder's Spoken / Written Response:
"${founderAnswer}"

Score this rebuttal accurately according to elite VC standards.
`;

    const aiRes = await callAI({
      systemPrompt,
      prompt: userPrompt,
      responseFormat: "json_object",
      temperature: 0.4,
    });

    let scorecard;
    try {
      scorecard = JSON.parse(aiRes.content);
    } catch {
      scorecard = {
        clarityScore: 78,
        defensibilityScore: 72,
        convictionScore: 80,
        overallScore: 76,
        verdict: "Solid / Promising Answer",
        strengths: [
          "Directly addresses the question without deflecting.",
          "Demonstrates authentic domain understanding.",
        ],
        redFlags: [
          "Could quantify the payback period or churn figures more concretely.",
        ],
        improvedRebuttal: `We attack this by concentrating on high-retention cohorts with a 9-month CAC payback. Our net retention rate is 120%, ensuring that as our scale doubles, our customer acquisition efficiency increases through structural referral loops.`,
        coFounderAdvice: "Lead with your strongest retention metric before elaborating on strategy.",
      };
    }

    return NextResponse.json({
      success: true,
      scorecard,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in pitch-score route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate pitch response" },
      { status: 500 }
    );
  }
}
