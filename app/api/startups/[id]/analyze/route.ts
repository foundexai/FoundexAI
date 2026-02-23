import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import Task from "@/lib/models/Task";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const startup = await Startup.findOne({
      _id: id,
      user_id: decoded.user.id,
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    // Construct Prompt
    const prompt = `
      Analyze the following startup profile and provide an Investment Readiness Score (0-100).
      
      Company: ${startup.company_name}
      Description: ${startup.business_description}
      Sector: ${startup.sector || "Unspecified"}
      Stage: ${startup.stage || "Pre-Seed"}
      Legal Structure: ${startup.legal_structure || "Not defined"} (${startup.legal_structure_details ? "Drafted" : "None"})
      Business Models: ${startup.business_models?.join(", ") || "None"}
      Documents Count: ${startup.documents?.length || 0}
      
      Criteria:
      - 0-30: Idea stage, missing key details (legal, models, docs).
      - 31-60: Early stage, some structure, needs more validation/docs.
      - 61-80: Solid foundation, key docs present, clear model.
      - 81-100: Investor ready, comprehensive.

      Return ONLY a JSON object: { 
        "score": number, 
        "reason": "short explanation", 
        "feedback": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"] 
      }.
    `;

    // Call OpenRouter with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    let aiRes;
    try {
      aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://foundex.ai", // Required by OpenRouter
          "X-Title": "Foundex MVP",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini", // Cost effective
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("AI Fetch Error:", error);
      // Fallback will be handled below by checking aiRes
    }

    if (!aiRes || !aiRes.ok) {
      // Fallback mock if AI fails or no key
      console.warn("AI Call failed or timed out, using mock score");
      const mockScore = Math.min(
        100,
        Math.max(10, (startup.documents?.length || 0) * 10 + 20),
      );
      startup.readiness_score = mockScore;
      startup.readiness_feedback = [
        "Upload a Pitch Deck to increase score",
        "Define your Business Model clearly",
        "Complete your Legal Structure details",
      ];
      await startup.save();

      // Create Tasks for each feedback item (Fallback)
      try {
        const existingTasks = await Task.find({ startup_id: startup._id, status: "pending" });
        const existingTitles = new Set(existingTasks.map(t => t.title));
        for (const tip of startup.readiness_feedback) {
          if (!existingTitles.has(tip)) {
            await Task.create({
              startup_id: startup._id,
              title: tip,
              category: "Operations",
              status: "pending",
              priority: "medium"
            });
          }
        }
      } catch (e) {}

      return NextResponse.json({
        score: mockScore,
        reason: "AI unavailable, calculated based on completeness.",
        feedback: startup.readiness_feedback,
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Fallback parsing
      const match = content.match(/(\d+)/);
      result = {
        score: match ? parseInt(match[0]) : 50,
        reason: "Parsed from text",
        feedback: ["Enhance your description", "Add key documents"],
      };
    }

    startup.readiness_score = result.score;
    startup.readiness_feedback = result.feedback || [
      "Add more details to improve your score.",
    ];
    await startup.save();

    // Create Tasks for each feedback item
    try {
      const existingTasks = await Task.find({ 
        startup_id: startup._id,
        status: "pending"
      });
      const existingTitles = new Set(existingTasks.map(t => t.title));

      for (const tip of startup.readiness_feedback) {
        if (!existingTitles.has(tip)) {
          await Task.create({
            startup_id: startup._id,
            title: tip,
            category: "Operations",
            status: "pending",
            priority: "medium"
          });
        }
      }
    } catch (taskErr) {
      console.error("Error creating tasks from analysis:", taskErr);
    }

    return NextResponse.json({
      score: result.score,
      reason: result.reason,
      feedback: startup.readiness_feedback,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
