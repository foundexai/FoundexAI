import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import Grant from "@/lib/models/Grant";
import GrantDraft from "@/lib/models/GrantDraft";
import { callAI } from "@/lib/ai";

async function getUserId(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startup_id");
    const grantId = searchParams.get("grant_id");

    if (!startupId || !grantId) {
      return NextResponse.json({ error: "Missing startup_id or grant_id" }, { status: 400 });
    }

    // Verify startup ownership
    const startup = await Startup.findOne({
      _id: startupId,
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup not found or unauthorized" }, { status: 404 });
    }

    const draft = await GrantDraft.findOne({
      startup_id: new mongoose.Types.ObjectId(startupId),
      grant_id: new mongoose.Types.ObjectId(grantId),
    });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("GET /api/grants/draft error:", err);
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const { startup_id, grant_id, regenerate = false } = body;

    if (!startup_id || !grant_id) {
      return NextResponse.json({ error: "Missing startup_id or grant_id" }, { status: 400 });
    }

    // Verify startup ownership
    const startup = await Startup.findOne({
      _id: startup_id,
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup not found or unauthorized" }, { status: 404 });
    }

    // Fetch grant details
    const grant = await Grant.findById(grant_id);
    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    // Check if draft already exists
    let existingDraft = await GrantDraft.findOne({
      startup_id: new mongoose.Types.ObjectId(startup_id),
      grant_id: new mongoose.Types.ObjectId(grant_id),
    });

    if (existingDraft && !regenerate) {
      return NextResponse.json({ draft: existingDraft });
    }

    // AI Assisted Draft Generation Prompt
    const systemPrompt = `You are an expert grant proposal writer specializing in federal (NSF, NIH, SBIR/STTR) and private research grants for high-growth tech startups.
Your goal is to write a highly professional, technically thorough, and persuasive application draft proposal.
Follow these rules:
- Present the draft in clean, well-formatted markdown.
- Tailor the proposal specifically to the startup's stage, sector, and business description.
- Align the startup's technology with the grant's goals.
- Do not use placeholders; write concrete, realistic details.`;

    const prompt = `Write a comprehensive, professional grant application proposal draft for the following startup applying for the specified grant.

STARTUP PROFILE:
- Company Name: ${startup.company_name}
- Sector/Industry: ${startup.sector || "Tech"}
- Stage: ${startup.stage || "Early-stage"}
- Location: ${startup.location || "United States"}
- Business Description: ${startup.business_description}

GRANT DETAILS:
- Title: ${grant.title}
- Agency: ${grant.agency}
- Description: ${grant.description}
- Eligibility Criteria (Sectors): ${grant.eligibility_criteria?.sectors?.join(", ") || "All Tech Sectors"}

Structure the proposal with these exact sections:
1. Executive Summary (Brief summary of the company mission and how it fits this grant opportunity).
2. Problem Statement & Market Need (Explain the industry bottleneck or challenge).
3. Technical Innovation & Solution (Describe the startup's proprietary solution, stage of R&D, and why it is innovative).
4. Project Plan & Use of Funds (Outline how the grant funds will be spent, milestones, and project timeline).
5. Commercialization & Societal Impact (Market mapping, target customer base, and wider socioeconomic benefits).`;

    // Call AI helper
    const aiResult = await callAI({
      prompt,
      systemPrompt,
      temperature: 0.7,
    });

    const content = aiResult.content;

    if (existingDraft) {
      existingDraft.content = content;
      existingDraft.created_at = new Date();
      await existingDraft.save();
    } else {
      existingDraft = await GrantDraft.create({
        startup_id: new mongoose.Types.ObjectId(startup_id),
        grant_id: new mongoose.Types.ObjectId(grant_id),
        content,
      });
    }

    return NextResponse.json({ draft: existingDraft });
  } catch (err) {
    console.error("POST /api/grants/draft error:", err);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
