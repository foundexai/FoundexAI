import mongoose from "mongoose";

const OpportunitySchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['investment', 'partnership', 'grant', 'loan'], default: 'investment' },
  status: { type: String, enum: ['identified', 'contacted', 'meeting_scheduled', 'negotiating', 'closed', 'rejected'], default: 'identified' },
  amount: { type: Number },
  currency: { type: String, default: 'USD' },
  source: { type: String }, // How this opportunity was found
  deadline: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.Opportunity || mongoose.model("Opportunity", OpportunitySchema);