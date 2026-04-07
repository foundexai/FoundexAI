import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // Correctly type params
) {
  try {
    const { id } = await params; // Await params (Next.js 15+ requirement or good practice)
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    // Auth check
    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requireSubscription } = await import("@/lib/subscription");
    const guard = await requireSubscription(decoded.user.id || decoded.user._id, decoded.user.email);
    if (guard.blocked) return guard.response as NextResponse;

    const { description, company_name } = await req.json();

    const prompt = `
      Act as a startup consultant and copywriter.
      Rewrite the following business description for a startup named "${company_name}" to be more concise, compelling, professional, and investor-ready.
      Focus on value proposition, problem/solution, and market potential.
      Keep it under 3-4 sentences.

      Current Description: "${description}"

      Return ONLY the improved string. Do not add quotes or "Here is the improved version".
    `;

    // Call OpenRouter
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY2}`,
        "HTTP-Referer": "https://foundex.ai",
        "X-Title": "Foundex MVP",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      throw new Error("AI Service Failed");
    }

    const data = await aiRes.json();
    const improved = data.choices[0]?.message?.content?.trim() || description;

    return NextResponse.json({ improved });
  } catch (error) {
    console.error("Improvement Error:", error);
    // Fallback if AI fails: Return the original description
    return NextResponse.json(
      {
        improved: "Unable to improve description automatically right now. Keeping original text.",
      },
      { status: 200 }, // Change to 200 so UI doesn't break
    );
  }
}
