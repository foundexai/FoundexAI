import { callAI } from "./ai";

/**
 * Core utility for calculating the Advanced Investor Fit Score.
 * Computes an overall compatibility rating (0-100) and dimensional breakdown
 * based on Sector, Stage, Funding Amount, and Geography.
 */

export interface FitScoreBreakdown {
  overall: number;
  sector: number;
  stage: number;
  funding: number;
  geography: number;
  reasons: string[];
  feedback: string[];
}

// Helper to clean and parse monetary values (e.g. "$100k" -> 100000, "$1.5M" -> 1500000)
function parseMoneyValue(valStr: string): number {
  const cleaned = valStr.toLowerCase().replace(/[^0-9.kmb]/g, "");
  if (!cleaned) return 0;
  
  let multiplier = 1;
  if (cleaned.includes("k")) multiplier = 1000;
  else if (cleaned.includes("m")) multiplier = 1000000;
  else if (cleaned.includes("b")) multiplier = 1000000000;
  
  const numPart = parseFloat(cleaned.replace(/[kmb]/g, ""));
  return isNaN(numPart) ? 0 : numPart * multiplier;
}

// Parses investment range strings (e.g. "$100k - $500k", "Up to $1M")
function parseInvestmentRange(rangeStr: string): { min: number; max: number } {
  const result = { min: 0, max: Infinity };
  if (!rangeStr) return result;
  
  const normalized = rangeStr.toLowerCase().replace(/\s+/g, "");
  
  // E.g. "$100k-$500k"
  if (normalized.includes("-")) {
    const parts = normalized.split("-");
    if (parts[0]) result.min = parseMoneyValue(parts[0]);
    if (parts[1]) result.max = parseMoneyValue(parts[1]);
  } else if (normalized.includes("upto") || normalized.includes("under") || normalized.includes("<")) {
    result.max = parseMoneyValue(normalized);
  } else if (normalized.includes("+") || normalized.includes("over") || normalized.includes(">")) {
    result.min = parseMoneyValue(normalized);
  } else {
    // Single value representation
    const val = parseMoneyValue(normalized);
    if (val > 0) {
      result.min = val * 0.5; // Guessing range
      result.max = val * 1.5;
    }
  }
  
  return result;
}

export function calculateFitScore(startup: any, investor: any): FitScoreBreakdown {
  const reasons: string[] = [];
  const feedback: string[] = [];
  
  // 1. Sector Compatibility (30% weight)
  let sectorScore = 30; // default baseline for general investment
  const startupSector = (startup.sector || "").trim().toLowerCase();
  const investorFocus = (investor.focus || []).map((f: string) => f.trim().toLowerCase());
  
  if (startupSector && investorFocus.length > 0) {
    const isDirectMatch = investorFocus.some((focus: string) => 
      focus === startupSector || focus.includes(startupSector) || startupSector.includes(focus)
    );
    
    if (isDirectMatch) {
      sectorScore = 100;
      reasons.push(`Perfect sector alignment: The investor focuses on "${startup.sector}", which matches your industry.`);
    } else {
      // Check partial matches or synonyms (e.g., tech, web3, software)
      const hasPartialMatch = investorFocus.some((focus: string) => {
        const words = focus.split(/\s+/);
        return words.some(w => w.length > 3 && startupSector.includes(w));
      });
      
      if (hasPartialMatch) {
        sectorScore = 75;
        reasons.push(`Partial industry alignment: Your sector ("${startup.sector}") overlaps with the investor's focus area.`);
      } else {
        sectorScore = 30;
        reasons.push(`Low sector alignment: The investor specializes in other sectors (e.g. ${investor.focus.slice(0, 3).join(", ")}).`);
        feedback.push(`Verify if ${investor.name} has recently updated their investment thesis or handles sector-agnostic deals.`);
      }
    }
  } else {
    reasons.push("Sector alignment: Insufficient data to determine precise sector fit.");
  }

  // 2. Stage Compatibility (30% weight)
  let stageScore = 50; // default medium
  const startupStage = (startup.stage || startup.funding_stage || "Pre-Seed").trim().toLowerCase().replace(/[-_]/g, " ");
  const investorStageStr = (investor.stage || "").trim().toLowerCase().replace(/[-_]/g, " ");
  
  if (startupStage && investorStageStr) {
    const isDirectStageMatch = investorStageStr.includes(startupStage) || startupStage.includes(investorStageStr);
    
    if (isDirectStageMatch) {
      stageScore = 100;
      reasons.push(`Optimal Stage Fit: The investor targets "${startup.stage || "Pre-Seed"}" stage companies, aligning with your round.`);
    } else {
      // Check adjacent stages (e.g. Pre-Seed vs Seed, Seed vs Series A)
      const stagesList = ["pre seed", "seed", "series a", "series b", "growth"];
      const startIdx = stagesList.indexOf(startupStage);
      
      let isAdjacent = false;
      if (startIdx !== -1) {
        // Look for any stage mentioned by investor
        stagesList.forEach((stg, idx) => {
          if (investorStageStr.includes(stg) && Math.abs(idx - startIdx) === 1) {
            isAdjacent = true;
          }
        });
      }
      
      if (isAdjacent) {
        stageScore = 70;
        reasons.push(`Adjacent Stage Fit: The investor targets adjacent stages (${investor.stage}), indicating close compatibility.`);
        feedback.push(`Prepare to justify your growth velocity to bridge the stage gap from ${startup.stage} to ${investor.stage}.`);
      } else {
        stageScore = 20;
        reasons.push(`Stage Mismatch: The investor is focused on "${investor.stage}" which differs from your current stage "${startup.stage}".`);
        feedback.push(`Re-evaluate whether targeting a ${investor.stage} investor is timely for your ${startup.stage} round.`);
      }
    }
  } else {
    reasons.push("Stage Fit: Investor or startup funding stage details are incomplete.");
  }

  // 3. Funding Check Size Compatibility (20% weight)
  let fundingScore = 70; // default baseline
  const targetFunding = startup.funding_amount || 0;
  const investorRangeStr = investor.investmentRange || investor.investment_range || "";
  
  if (targetFunding > 0 && investorRangeStr) {
    const { min, max } = parseInvestmentRange(investorRangeStr);
    
    if (targetFunding >= min && targetFunding <= max) {
      fundingScore = 100;
      reasons.push(`Perfect Ticket Size: Your funding goal ($${(targetFunding / 1000).toFixed(0)}k) lies within the investor's range of ${investorRangeStr}.`);
    } else if (targetFunding < min) {
      // Startup wants less than investor minimum
      const ratio = targetFunding / min;
      if (ratio >= 0.6) {
        fundingScore = 80;
        reasons.push(`Ticket Size: Your ask is slightly below their typical check sizes, but potentially negotiable.`);
        feedback.push(`Consider syndicating the round or asking if they participate in smaller tickets.`);
      } else {
        fundingScore = 40;
        reasons.push(`Ask Too Small: Your target round size ($${(targetFunding / 1000).toFixed(0)}k) is significantly below their min check size ($${(min / 1000).toFixed(0)}k).`);
        feedback.push(`Consider co-investors or a syndicate structure so they can meet their deployment minimum.`);
      }
    } else {
      // Startup wants more than investor maximum
      const ratio = max / targetFunding;
      if (ratio >= 0.6) {
        fundingScore = 80;
        reasons.push(`Ticket Size: Your ask is slightly higher than their typical max, but they could lead or co-invest.`);
      } else {
        fundingScore = 30;
        reasons.push(`Ask Too Large: Your round ($${(targetFunding / 1000000).toFixed(1)}M) exceeds their typical maximum check size (${investorRangeStr}).`);
        feedback.push(`Propose a co-investment structure or split-round where this investor fills a portion of the round.`);
      }
    }
  } else {
    reasons.push("Funding Compatibility: Complete your startup's funding amount to evaluate ticket size compatibility.");
    if (targetFunding === 0) {
      feedback.push("Add a target funding amount on your profile page to check round fit.");
    }
  }

  // 4. Geographic Compatibility (20% weight)
  let geoScore = 60; // baseline
  const startupLocation = (startup.location || "").trim().toLowerCase();
  const investorLocation = (investor.location || "").trim().toLowerCase();
  
  if (startupLocation && investorLocation) {
    const isDirectGeoMatch = startupLocation.includes(investorLocation) || investorLocation.includes(startupLocation);
    
    // Check broad regions
    const isAfricaStartup = startupLocation.includes("nigeria") || startupLocation.includes("kenya") || startupLocation.includes("ghana") || startupLocation.includes("south africa") || startupLocation.includes("egypt") || startupLocation.includes("africa");
    const isAfricaInvestor = investorLocation.includes("africa") || investorLocation.includes("sub-saharan") || investorLocation.includes("pan-african") || investorLocation.includes("nigeria") || investorLocation.includes("lagos");
    
    const isGlobalInvestor = investorLocation.includes("global") || investorLocation.includes("worldwide");

    if (isDirectGeoMatch) {
      geoScore = 100;
      reasons.push(`Optimal Geo Fit: The investor is active in your primary location ("${investor.location}").`);
    } else if (isAfricaStartup && isAfricaInvestor) {
      geoScore = 95;
      reasons.push(`Strong Regional Fit: You are located in Africa and the investor focuses on African and emerging markets.`);
    } else if (isGlobalInvestor) {
      geoScore = 85;
      reasons.push(`Global Thesis Fit: The investor holds a global mandate, covering your location ("${startup.location}").`);
    } else {
      geoScore = 40;
      reasons.push(`Low Geo Alignment: Your location ("${startup.location}") does not directly match the investor's focus region ("${investor.location}").`);
      feedback.push(`Verify if they invest in your jurisdiction via off-shore parent entities (e.g. Delaware flip).`);
    }
  } else {
    reasons.push("Geographic Fit: Location details are incomplete for scoring.");
  }

  // Calculate Weighted Overall Score
  const overall = Math.round(
    (sectorScore * 0.3) +
    (stageScore * 0.3) +
    (fundingScore * 0.2) +
    (geoScore * 0.2)
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    sector: sectorScore,
    stage: stageScore,
    funding: fundingScore,
    geography: geoScore,
    reasons,
    feedback
  };
}

export async function calculateFitScoreAI(startup: any, investor: any): Promise<FitScoreBreakdown> {
  const localFallback = calculateFitScore(startup, investor);
  
  try {
    const prompt = `
      You are Sophia, an expert AI venture capitalist and investment analyst.
      
      Analyze the compatibility between the following Startup and Investor.
      
      Startup Profile:
      - Name: ${startup.company_name}
      - Sector: ${startup.sector || "Unspecified"}
      - Stage: ${startup.stage || "Pre-Seed"}
      - Target Funding: $${(startup.funding_amount || 0).toLocaleString()}
      - Location: ${startup.location || "Unspecified"}
      - Business Models: ${startup.business_models?.join(", ") || "Unspecified"}
      
      Investor Profile:
      - Name: ${investor.name}
      - Type: ${investor.type} (e.g. VC, Angel, PE)
      - Focus Sectors: ${investor.focus?.join(", ") || "Unspecified"}
      - Location/HQ: ${investor.location || "Unspecified"}
      - Typical Check Size Range: ${investor.investmentRange || "Unspecified"}
      - Investment Stage Focus: ${investor.stage || "Unspecified"}
      
      Evaluate compatibility across 4 dimensions:
      1. Sector Match (30% weight): How well the startup's sector aligns with the investor's focus.
      2. Stage Match (30% weight): How well the startup's current funding stage aligns with the investor's target stage.
      3. Funding Range Match (20% weight): How well the startup's target funding amount aligns with the investor's check size range.
      4. Geographic Match (20% weight): How well the startup's location aligns with the investor's geographic mandate.
      
      Calculate a score (0 to 100) for each dimension and an overall compatibility score (0 to 100).
      Provide 2-3 specific reasons for the alignment (Key Alignments) and 1-2 actionable tips (Recommendations) to improve compatibility or prepare for pitch.
      
      Return ONLY a valid JSON object in this format:
      {
        "overall": number,
        "sector": number,
        "stage": number,
        "funding": number,
        "geography": number,
        "reasons": ["Reason 1", "Reason 2"],
        "feedback": ["Tip 1", "Tip 2"]
      }
    `;

    const result = await callAI({
      prompt,
      systemPrompt: "You are an expert investment analyst returning JSON only. Do not wrap the JSON in markdown blocks or backticks. Return the JSON object directly.",
      responseFormat: "json_object",
      cacheTtl: 86400, // Cache for 24h
      timeout: 12000,
    });

    const parsed = JSON.parse(result.content);
    return {
      overall: typeof parsed.overall === "number" ? parsed.overall : localFallback.overall,
      sector: typeof parsed.sector === "number" ? parsed.sector : localFallback.sector,
      stage: typeof parsed.stage === "number" ? parsed.stage : localFallback.stage,
      funding: typeof parsed.funding === "number" ? parsed.funding : localFallback.funding,
      geography: typeof parsed.geography === "number" ? parsed.geography : localFallback.geography,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : localFallback.reasons,
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : localFallback.feedback,
    };
  } catch (error) {
    console.warn("AI fit-score calculation failed, using fallback:", error);
    return localFallback;
  }
}
