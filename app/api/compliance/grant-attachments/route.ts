import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Startup from "@/lib/models/Startup";
import Grant from "@/lib/models/Grant";
import GrantDraft from "@/lib/models/GrantDraft";
import GrantAttachment, { AttachmentType, GrantProgramType } from "@/lib/models/GrantAttachment";
import { generateGrantAttachment } from "@/lib/grantAttachmentGenerator";

async function getUserId(req: Request): Promise<string> {
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
    const draftId = searchParams.get("draft_id");

    if (!startupId) {
      return NextResponse.json({ error: "Missing startup_id parameter" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startupId),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    const query: any = { startup_id: new mongoose.Types.ObjectId(startupId) };
    if (grantId) query.grant_id = new mongoose.Types.ObjectId(grantId);
    if (draftId) query.draft_id = new mongoose.Types.ObjectId(draftId);

    const attachments = await GrantAttachment.find(query).sort({ updated_at: -1 });

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error("GET /api/compliance/grant-attachments error:", error);
    return NextResponse.json({ error: "Failed to fetch grant attachments" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);

    const body = await req.json();
    const {
      startup_id,
      grant_id,
      draft_id,
      program = "SBIR",
      attachment_type = "commercialization_plan",
      requested_amount,
      project_duration_months,
      pi_name,
      target_trl,
      custom_notes,
    } = body;

    if (!startup_id || !["SBIR", "EIC"].includes(program)) {
      return NextResponse.json({ error: "Invalid startup_id or program ('SBIR' | 'EIC')" }, { status: 400 });
    }

    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startup_id),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!startup) {
      return NextResponse.json({ error: "Unauthorized or startup not found" }, { status: 404 });
    }

    let grantDetails: any = null;
    if (grant_id) {
      grantDetails = await Grant.findById(grant_id);
    }

    const generated = generateGrantAttachment(
      {
        company_name: startup.company_name,
        sector: startup.sector,
        stage: startup.stage,
        location: startup.location,
        business_description: startup.business_description,
        mrr: startup.mrr,
        cash_on_hand: startup.cash_on_hand,
      },
      {
        program: program as GrantProgramType,
        attachment_type: attachment_type as AttachmentType,
        grant_title: grantDetails?.title,
        grant_agency: grantDetails?.agency,
        requested_amount: requested_amount || grantDetails?.amount,
        project_duration_months,
        pi_name,
        target_trl,
      }
    );

    // Save attachment record
    const attachmentDoc = await GrantAttachment.findOneAndUpdate(
      {
        startup_id: new mongoose.Types.ObjectId(startup_id),
        program,
        attachment_type,
      },
      {
        $set: {
          grant_id: grant_id ? new mongoose.Types.ObjectId(grant_id) : undefined,
          draft_id: draft_id ? new mongoose.Types.ObjectId(draft_id) : undefined,
          title: generated.title,
          form_data: {
            requested_amount: requested_amount || grantDetails?.amount,
            project_duration_months,
            pi_name,
            target_trl,
            custom_notes,
          },
          generated_document: generated.document_content,
          updated_at: new Date(),
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      attachment: attachmentDoc,
      meta_summary: generated.meta_summary,
    });
  } catch (error: any) {
    console.error("POST /api/compliance/grant-attachments error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate grant attachment" }, { status: 500 });
  }
}
