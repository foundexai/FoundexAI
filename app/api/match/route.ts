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
        focus: inv.focus,
        description: inv.description,
        investmentRange: inv.investmentRange || inv.investment_range,
      }),
    );

    // 2. Construct Prompt
    let prompt = "";
    if (query) {
      prompt = `
        You are an expert Venture Capital Investment Analyst.
        
        Search Query: "${query}"

        Task: 
        Analyze the list of Investors below and identify the TOP 3 best matches for this specific search query.
        You MUST ALWAYS return exactly 3 matches, even if the fit is not perfect. Pick the closest possible candidates.
        Provide a DETAILED strategic rationale for each match explaining why they fit the user's specific query.
        
        Investors List:
        ${JSON.stringify(allInvestors)}

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
        Analyze the list of Investors below and identify the TOP 3 best matches for this startup.
        You MUST ALWAYS return exactly 3 matches, even if the fit is not perfect. Pick the closest possible candidates.
        Provide a DETAILED strategic rationale for each match.
        
        Reasoning Requirements:
        - Explain WHY this investor is a good fit based on their sector focus, stage, or investment thesis.
        - Mention potential synergies or shared interest areas.
        - Write 2-3 insight sentences. Do NOT be generic.
        
        Investors List:
        ${JSON.stringify(allInvestors)}

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
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://foundex.ai",
          "X-Title": "FoundexAI",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI investment analyst. Output valid JSON only. Always return exactly 3 matches.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return NextResponse.json(
        { error: "AI Service Unavailable" },
        { status: 503 },
      );
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

    let aiResult;
    try {
      aiResult = JSON.parse(aiContent);
    } catch (e) {
      console.error("Failed to parse AI response", aiContent);
      return NextResponse.json(
        { error: "Failed to process matches" },
        { status: 500 },
      );
    }

    // 4. Map back to full investor objects to ensure frontend has all data
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
