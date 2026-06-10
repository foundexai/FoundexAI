import { NextResponse } from "next/server";
import { MOCK_INVESTORS } from "@/lib/data";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { callAI } from "@/lib/ai";
import { getCache, setCache } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { name, sector, stage, description, query } = await req.json();

    if (!description && !query) {
      return NextResponse.json(
        { error: "Description or query is required" },
        { status: 400 },
      );
    }

    const cacheKey = `match:${query || ""}:${sector || ""}:${stage || ""}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ matches: cached });
    }

    // 1. Fetch all available investors (Mock + Real)
    await connectDB();
    const realInvestorsDocs = await Investor.find({ isApproved: true });
    const realInvestors = realInvestorsDocs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      focus: doc.focus,
      location: doc.location,
      description: doc.description,
      investmentRange: doc.investment_range,
    }));

    const allInvestors = [...realInvestors, ...MOCK_INVESTORS].map(
      (inv: any) => ({
        id: inv.id,
        name: inv.name,
        type: inv.type,
        focus: inv.focus || [],
        description: (inv.description || "").substring(0, 300),
        investmentRange: inv.investmentRange || inv.investment_range,
      }),
    );

    // 2. Pre-Rank and Limit (Prevents Context Limit Errors)
    const searchText = (query || description || "").toLowerCase();
    const keywords = searchText.split(/\W+/).filter((k: string) => k.length > 2);
    
    const preRanked = allInvestors.map(inv => {
      let score = 0;
      const invText = `${inv.name} ${inv.type} ${(inv.focus || []).join(" ")} ${inv.description}`.toLowerCase();
      
      if (query && invText.includes(query.toLowerCase())) score += 20;
      keywords.forEach((word: string) => {
        if (invText.includes(word)) score += 5;
      });
      if (sector && invText.includes(sector.toLowerCase())) score += 10;
      if (stage && invText.includes(stage.toLowerCase())) score += 10;
      
      return { ...inv, rankScore: score };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 40);

    // 3. Construct Prompt
    let prompt = "";
    let systemPrompt = "You are a helpful AI investment analyst. Output valid JSON only. Return 0-3 matches based on quality of fit. Do not force matches that do not exist.";
    
    if (query) {
      prompt = `
        You are an expert Venture Capital Investment Analyst.
        
        Search Query: "${query}"

        Task: 
        Analyze the list of Investors below and identify the BEST matches for this specific search query.
        Return 0 to 3 matches. Only return an investor if there is a CLEAR strategic alignment with the query. 
        Provide a DETAILED strategic rationale for each match explaining why they fit.
        
        Investors List:
        ${JSON.stringify(preRanked)}

        Output JSON format ONLY:
        {
          "matches": [
            {
              "id": "investor_id",
              "reason": "Detailed strategic rationale explaining connection to the search query."
            }
          ]
        }
      `;
    } else {
      prompt = `
        You are an expert Venture Capital matchmaker and Investment Analyst.
        
        Startup Profile:
        - Name: ${name}
        - Sector: ${sector}
        - Stage: ${stage}
        - Description: ${description}

        Task: 
        Analyze the list of Investors below and identify the BEST matches for this startup.
        Return 0 to 3 matches. Only return an investor if there is a CLEAR strategic alignment between their investment thesis and this startup's profile.
        Provide a DETAILED strategic rationale for each match.
        
        Reasoning Requirements:
        - Explain WHY this investor is a good fit based on their sector focus, stage, or investment thesis.
        - Mention potential synergies or shared interest areas.
        
        Investors List:
        ${JSON.stringify(preRanked)}

        Output JSON format ONLY:
        {
          "matches": [
            {
              "id": "investor_id",
              "reason": "Detailed strategic rationale here."
            }
          ]
        }
      `;
    }

    // 3. Call AI with multi-provider fallback + Redis caching
    let aiResult;
    try {
      const result = await callAI({
        prompt,
        systemPrompt,
        responseFormat: "json_object",
        timeout: 15000,
        cacheTtl: 0,
      });
      aiResult = JSON.parse(result.content);
    } catch (error) {
      console.warn("AI Service Error, using fallback:", error);
    }

    // 4. Handle AI failure
    if (!aiResult) {
      return NextResponse.json(
        { error: "Our intelligence engine (Sophia) is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    // 5. Map back to full investor objects
    const finalMatches = (aiResult.matches || []).map((m: any) => {
      const fullInvestor = allInvestors.find(inv => inv.id === m.id);
      return {
        investor: fullInvestor || null,
        reason: m.reason
      };
    }).filter((m: any) => m.investor !== null);

    // Non-blocking cache write to avoid adding write latency on matching response
    setCache(cacheKey, finalMatches, 1800).catch(() => {});

    return NextResponse.json({ matches: finalMatches });
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
