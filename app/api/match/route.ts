import { NextResponse } from "next/server";
import { MOCK_INVESTORS } from "@/lib/data";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";

export async function POST(req: Request) {
  try {
    const { name, sector, stage, description } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    // 1. Fetch all available investors (Mock + Real)
    // In a real app with thousands of investors, we would do a first pass filter (vector search or keyword)
    // For MVP, we pass the "active" investors to the LLM to pick the best ones.

    // Get real investors from DB
    await connectDB();
    const realInvestorsDocs = await Investor.find({ isApproved: true });
    const realInvestors = realInvestorsDocs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      focus: doc.focus, // array of strings
      location: doc.location,
      description: doc.description,
      investmentRange: doc.investment_range,
    }));

    // Combine with Mocks
    // We only send relevant fields to save context window
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
    const prompt = `
      You are an expert Venture Capital matchmaker. 
      
      Startup Profile:
      - Name: ${name}
      - Sector: ${sector}
      - Stage: ${stage}
      - Description: ${description}

      Task: 
      Analyze the list of Investors below and identify the TOP 3 best matches for this startup.
      Focus on sector alignment, investment stage compatibility, and description relevance.
      
      Investors List:
      ${JSON.stringify(allInvestors)}

      Output JSON format ONLY (no markdown):
      {
        "matches": [
          {
            "id": "investor_id",
            "reason": "One sentence explaining why this is a good match."
          }
        ]
      }
    `;

    // 3. Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://foundex.ai", // Required by OpenRouter
          "X-Title": "FoundexAI", // Optional
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI investment analyst. Output valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
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

    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (e) {
      console.error("Failed to parse AI response", aiContent);
      return NextResponse.json(
        { error: "Failed to process matches" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
