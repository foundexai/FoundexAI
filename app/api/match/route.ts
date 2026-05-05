import { NextResponse } from "next/server";
import { MOCK_INVESTORS } from "@/lib/data";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";

export async function POST(req: Request) {
  try {
    const { name, sector, stage, description, query } = await req.json();

    if (!description && !query) {
      return NextResponse.json(
        { error: "Description or query is required" },
        { status: 400 },
      );
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
        description: (inv.description || "").substring(0, 300), // Truncate to save tokens
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
    .slice(0, 40); // Send only top 40 most relevant to AI

    // 3. Construct Prompt
    let prompt = "";
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

    // 3. Call OpenAI/OpenRouter API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let aiResult;
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY2}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://foundex.ai",
            "X-Title": "FoundexAI",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful AI investment analyst. Output valid JSON only. Return 0-3 matches based on quality of fit. Do not force matches that do not exist.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const aiContent = data.choices[0]?.message?.content;
        aiResult = JSON.parse(aiContent);
      } else {
        const errorText = await response.text();
        console.warn("OpenRouter API Failed, using local fallback:", errorText);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn("AI Service Timeout or Error, using local fallback:", error);
    }

    // 4. Handle AI failure
    if (!aiResult) {
      return NextResponse.json(
        { error: "Our intelligence engine (Sophia) is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    // 5. Map back to full investor objects to ensure frontend has all data
    const finalMatches = (aiResult.matches || []).map((m: any) => {
      const fullInvestor = allInvestors.find(inv => inv.id === m.id);
      return {
        investor: fullInvestor || null,
        reason: m.reason
      };
    }).filter((m: any) => m.investor !== null);

    return NextResponse.json({ matches: finalMatches });
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
