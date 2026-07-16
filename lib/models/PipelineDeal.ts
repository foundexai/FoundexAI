import mongoose from "mongoose";

const PipelineDealSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  investor_id: { type: String, required: true }, // MongoDB ID or Mock Investor ID (string)
  investor_name: { type: String, required: true },
  stage: {
    type: String,
    enum: [
      "shortlisted",
      "outreach_sent",
      "intro_meeting",
      "due_diligence",
      "term_sheet",
      "closed_won",
      "closed_lost",
    ],
    default: "shortlisted",
  },
  deal_amount: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  next_followup: { type: Date },
  activity_log: [
    {
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ["stage_change", "note", "outreach", "reminder", "system"], default: "system" },
      description: { type: String, required: true },
    },
  ],
  reminders: [
    {
      id: { type: String, required: true },
      description: { type: String, required: true },
      due_date: { type: Date, required: true },
      is_completed: { type: Boolean, default: false },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Ensure a user can only have one pipeline entry per investor
PipelineDealSchema.index({ user_id: 1, investor_id: 1 }, { unique: true });
PipelineDealSchema.index({ user_id: 1, stage: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.PipelineDeal) {
  delete mongoose.models.PipelineDeal;
}

export default mongoose.models.PipelineDeal || mongoose.model("PipelineDeal", PipelineDealSchema);
