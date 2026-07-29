import mongoose from "mongoose";

const GrantDraftSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  grant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grant", required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.GrantDraft || mongoose.model("GrantDraft", GrantDraftSchema);
