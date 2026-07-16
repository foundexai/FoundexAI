import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import Investor from "@/lib/models/Investor";
import { MOCK_INVESTORS } from "@/lib/data";
import { callAI } from "@/lib/ai";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startupId, investorId, channel = "email", tone = "professional" } = body;

    if (!startupId || !investorId) {
      return NextResponse.json(
        { error: "Startup ID and Investor ID are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Startup
    const startup = await Startup.findOne({
      _id: startupId,
      user_id: decoded.user._id,
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // 2. Fetch Investor (either DB or Mock)
    let investor: any = null;
    if (mongoose.Types.ObjectId.isValid(investorId)) {
      const dbInv = await Investor.findById(investorId);
      if (dbInv) {
        investor = {
          id: dbInv._id.toString(),
          name: dbInv.name,
          type: dbInv.type,
          focus: dbInv.focus || [],
          location: dbInv.location,
          investmentRange: dbInv.investmentRange || dbInv.investment_range,
          stage: dbInv.stage,
        };
      }
    }

    if (!investor) {
      const mockInv = MOCK_INVESTORS.find((inv) => inv.id === investorId);
      if (mockInv) {
        investor = mockInv;
      }
    }

    if (!investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 });
    }

    // 3. Construct prompt
    const prompt = `
      You are an expert venture capital advisor writing a warm introduction/outreach message to a venture capitalist/angel investor on behalf of a startup founder.

      Outreach Details:
      - Channel: ${channel} (email or linkedin)
      - Tone: ${tone} (visionary, professional, casual)

      Startup Profile:
      - Company Name: ${startup.company_name}
      - Value Proposition: ${startup.business_description}
      - Sector: ${startup.sector || "Technology"}
      - Current Stage: ${startup.stage || "Pre-Seed"}
      - Target Funding: $${(startup.funding_amount || 0).toLocaleString()}
      - Business Model: ${startup.business_model || "B2B"}

      Investor Profile:
      - Investor Name: ${investor.name}
      - Type: ${investor.type}
      - Focus Sectors: ${investor.focus?.join(", ") || "Technology"}
      - Typical Ticket Size: ${investor.investmentRange || "standard checks"}

      Writing Guidelines:
      - Keep the draft short, punchy, and highly customized to this investor's thesis.
      ${channel === 'linkedin' ? '- For LinkedIn: Output ONLY the message body, keep it under 280 characters, and do NOT include any subject line.' : '- For Email: Provide a clear "Subject:" line, then the email body. Keep the body under 150 words.'}
      - Use the values provided (e.g. ${investor.name}, ${startup.company_name}) directly. Do not use generic placeholders like "[Investor Name]" or "[Your Name]" in the final output; sign off as the founder of ${startup.company_name}.
      - Explicitly highlight the alignment between their investment thesis (sector/stage) and your business.
      - End with a low-friction call to action asking for a brief introductory call.

      Return ONLY the finished text copy.
    `;

    let content = "";
    try {
      const result = await callAI({
        prompt,
        systemPrompt: "You are Sophia, an AI fundraising copilot for startup founders. You draft high-converting, personalized outreach messages.",
        timeout: 20000,
        cacheTtl: 0,
      });
      content = result.content.trim();
    } catch (aiErr) {
      console.error("AI Generation failed, using fallback template:", aiErr);
      
      // Fallback template builder if callAI fails
      if (channel === "linkedin") {
        content = `Hi ${investor.name} team, noticed your focus on ${investor.focus?.[0] || 'tech'}. I'm the founder of ${startup.company_name}—we are building a ${startup.business_model || 'B2B'} platform in ${startup.sector || 'the tech space'}. Raising a $${(startup.funding_amount || 0).toLocaleString()} round. Would love to share our deck. Are you open to a brief chat?`;
      } else {
        content = `Subject: Strategic Fit: ${startup.company_name} & ${investor.name}\n\nDear ${investor.name} Team,\n\nI hope this email finds you well.\n\nI am the founder of ${startup.company_name}, and we are currently raising a $${(startup.funding_amount || 0).toLocaleString()} round. We noticed that ${investor.name} is active in ${investor.focus?.join(", ") || "our space"} at the ${startup.stage || "early"} stage, which aligns perfectly with our vision.\n\nWe are building a ${startup.business_description.slice(0, 100)}...\n\nWould you be open to a 10-minute introductory call next week to share our deck?\n\nBest regards,\nFounder\n${startup.company_name}`;
      }
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Outreach generation API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
