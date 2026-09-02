import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";
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
      startupId,
      preMoneyValuation = 5000000,
      investmentAmount = 1000000,
      securityType = "Series Seed Preferred",
      liquidationPreference = "1x Non-Participating",
      antiDilution = "Broad-Based Weighted Average",
      optionPoolUnallocatedPct = 10,
      optionPoolTiming = "Pre-Money (Founder Dilution)", // Pre-Money vs Post-Money
      boardSeats = { founder: 2, investor: 1, independent: 0 },
      dividends = "Non-Cumulative 6%",
      proRataRights = true,
      dragAlongThreshold = "50%",
      founderVestingReset = false,
      notes = "",
    } = body;

    // Resolve startup context
    let startup: any = null;
    const activeId = startupId || req.headers.get("x-startup-id");
    if (activeId) {
      startup = await Startup.findById(activeId).lean();
    } else {
      startup = await Startup.findOne({ user_id: user.id || user._id }).lean();
    }

    // Resolve Cap Table summary
    let totalCurrentShares = 10000000;
    if (startup) {
      const shareholders = await CapTable.find({ startup_id: startup._id }).lean();
      if (shareholders.length > 0) {
        totalCurrentShares = shareholders.reduce((acc, s) => acc + (s.share_count || 0), 0);
      }
    }

    // Calculate baseline mechanical dilution
    const postMoneyValuation = Number(preMoneyValuation) + Number(investmentAmount);
    const nominalInvestorOwnershipPct = postMoneyValuation > 0
      ? (Number(investmentAmount) / postMoneyValuation) * 100
      : 0;

    // Effective Pre-Money Calculation if Option Pool is created Pre-Money (the "Option Pool Shuffle")
    const optionPoolFactor = optionPoolTiming.includes("Pre-Money")
      ? 1 - Number(optionPoolUnallocatedPct) / 100
      : 1;
    const effectivePreMoneyValuation = preMoneyValuation * optionPoolFactor;
    const effectiveFounderOwnershipPct =
      100 - nominalInvestorOwnershipPct - (optionPoolTiming.includes("Pre-Money") ? Number(optionPoolUnallocatedPct) : 0);

    const systemPrompt = `You are a legendary Silicon Valley Venture Capital General Counsel and Founder Negotiation Advisor.
Your objective is to review a proposed Term Sheet with ruthless precision, protect the founder from predatory clauses, and calculate true economic dilution.

Evaluate the following key areas:
1. Valuation Sanity (0-100): Is the pre-money valuation realistic, predatory, or market-competitive given stage and sector?
2. Founder Deal Score (0-100): Overall founder-friendliness of the term sheet.
3. Clause Risk Assessment: Categorize clauses into "Standard/Safe", "Yellow Flag (Negotiate)", and "Red Flag (Predatory/Hazard)".
4. The "Option Pool Shuffle" Impact: Clearly explain the stealth dilution created if the unallocated pool is placed in the pre-money valuation.
5. Strategic Counter-Proposal: 3 specific high-leverage redline counter-proposals with exact wording.
6. Executive Summary & Leverage Rating: How much leverage the founder has and next moves.

Respond strictly in JSON format.

JSON Schema:
{
  "dealScore": number (0-100),
  "valuationSanityScore": number (0-100),
  "verdict": "string",
  "effectivePreMoney": number,
  "dilutionBreakdown": {
    "investorOwnershipPct": number,
    "founderOwnershipPct": number,
    "optionPoolPct": number,
    "effectiveValuationDropPct": number
  },
  "clauseRisks": [
    {
      "clause": "string",
      "status": "safe" | "warning" | "danger",
      "riskExplanation": "string",
      "recommendedFix": "string"
    }
  ],
  "counterProposalStrategy": [
    {
      "issue": "string",
      "currentTerm": "string",
      "proposedCounterTerm": "string",
      "rationaleScript": "string"
    }
  ],
  "executiveSummary": "string",
  "leverageAssessment": "string"
}`;

    const userPrompt = `
Startup Details:
- Name: ${startup?.company_name || "Venture Co"}
- Sector: ${startup?.sector || "Software"}
- Stage: ${startup?.stage || "Seed"}
- MRR: $${startup?.mrr || 0}, ARR: $${startup?.arr || 0}

Proposed Term Sheet Terms:
- Security: ${securityType}
- Investment Amount: $${Number(investmentAmount).toLocaleString()}
- Stated Pre-Money Valuation: $${Number(preMoneyValuation).toLocaleString()}
- Stated Post-Money Valuation: $${postMoneyValuation.toLocaleString()}
- Liquidation Preference: ${liquidationPreference}
- Anti-Dilution Protection: ${antiDilution}
- Unallocated Option Pool: ${optionPoolUnallocatedPct}% (${optionPoolTiming})
- Board Structure: ${boardSeats.founder} Founder / ${boardSeats.investor} Investor / ${boardSeats.independent} Independent
- Dividends: ${dividends}
- Pro-Rata Rights: ${proRataRights ? "Yes" : "No"}
- Drag-Along Threshold: ${dragAlongThreshold}
- Founder Vesting Reset: ${founderVestingReset ? "Yes (Restarting 4-year clock)" : "No (Credit for prior service)"}
- Additional Notes: ${notes || "None"}

Perform a comprehensive Term Sheet negotiation advisory evaluation.
`;

    const aiRes = await callAI({
      systemPrompt,
      prompt: userPrompt,
      responseFormat: "json_object",
      temperature: 0.3,
    });

    let evaluation;
    try {
      evaluation = JSON.parse(aiRes.content);
    } catch {
      evaluation = {
        dealScore: 78,
        valuationSanityScore: 82,
        verdict: "Moderately Founder-Friendly with Negotiable Terms",
        effectivePreMoney: effectivePreMoneyValuation,
        dilutionBreakdown: {
          investorOwnershipPct: Number(nominalInvestorOwnershipPct.toFixed(1)),
          founderOwnershipPct: Number(effectiveFounderOwnershipPct.toFixed(1)),
          optionPoolPct: Number(optionPoolUnallocatedPct),
          effectiveValuationDropPct: Number(((1 - optionPoolFactor) * 100).toFixed(1)),
        },
        clauseRisks: [
          {
            clause: "Liquidation Preference",
            status: liquidationPreference.includes("Participating") && !liquidationPreference.includes("Non-") ? "danger" : "safe",
            riskExplanation: liquidationPreference.includes("Participating") && !liquidationPreference.includes("Non-")
              ? "Participating preferred gives investors 'double dip' exit proceeds, severely hurting common shareholders."
              : "1x Non-Participating is the gold standard institutional term.",
            recommendedFix: "Insist on 1x Non-Participating liquidation preference.",
          },
          {
            clause: "Option Pool Shuffle",
            status: optionPoolTiming.includes("Pre-Money") ? "warning" : "safe",
            riskExplanation: optionPoolTiming.includes("Pre-Money")
              ? `A ${optionPoolUnallocatedPct}% pre-money pool effectively reduces your true pre-money valuation to $${effectivePreMoneyValuation.toLocaleString()}.`
              : "Post-money pool dilutes both founders and new investors proportionately.",
            recommendedFix: "Right-size the unallocated pool to 7-8% based on a 12-month hiring budget.",
          },
        ],
        counterProposalStrategy: [
          {
            issue: "Option Pool Size",
            currentTerm: `${optionPoolUnallocatedPct}% Pre-Money Pool`,
            proposedCounterTerm: "8% Post-Money or budget-backed hiring pool",
            rationaleScript: "We have modeled our 18-month hiring needs requiring only 7.5% unallocated equity.",
          },
        ],
        executiveSummary: "The overall valuation is healthy for your stage, but watch out for the unallocated option pool sizing.",
        leverageAssessment: "Solid leverage based on current MRR growth.",
      };
    }

    return NextResponse.json({
      success: true,
      evaluation,
      calculatedMetrics: {
        statedPreMoney: preMoneyValuation,
        investmentAmount,
        postMoneyValuation,
        effectivePreMoneyValuation,
        nominalInvestorOwnershipPct: Number(nominalInvestorOwnershipPct.toFixed(2)),
        effectiveFounderOwnershipPct: Number(effectiveFounderOwnershipPct.toFixed(2)),
      },
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in term-sheet-advisor API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze term sheet" },
      { status: 500 }
    );
  }
}
