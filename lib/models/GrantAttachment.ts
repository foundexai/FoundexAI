import mongoose from "mongoose";

export type GrantProgramType = "SBIR" | "EIC";
export type AttachmentType =
  | "commercialization_plan"
  | "budget_justification"
  | "key_personnel"
  | "facilities_equipment"
  | "eic_annex_work_packages"
  | "eic_budget_breakdown"
  | "eic_ipr_freedom_to_operate";

export interface IGrantAttachment extends mongoose.Document {
  startup_id: mongoose.Types.ObjectId;
  grant_id?: mongoose.Types.ObjectId;
  draft_id?: mongoose.Types.ObjectId;
  program: GrantProgramType;
  attachment_type: AttachmentType;
  title: string;
  form_data: Record<string, any>;
  generated_document: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

const GrantAttachmentSchema = new mongoose.Schema<IGrantAttachment>(
  {
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    grant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grant" },
    draft_id: { type: mongoose.Schema.Types.ObjectId, ref: "GrantDraft" },
    program: { type: String, enum: ["SBIR", "EIC"], required: true },
    attachment_type: {
      type: String,
      required: true,
      enum: [
        "commercialization_plan",
        "budget_justification",
        "key_personnel",
        "facilities_equipment",
        "eic_annex_work_packages",
        "eic_budget_breakdown",
        "eic_ipr_freedom_to_operate",
      ],
    },
    title: { type: String, required: true },
    form_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    generated_document: { type: String, required: true },
    version: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

GrantAttachmentSchema.index({ startup_id: 1, program: 1, attachment_type: 1 });

export default mongoose.models.GrantAttachment ||
  mongoose.model<IGrantAttachment>("GrantAttachment", GrantAttachmentSchema);
