import mongoose from "mongoose";

const InvestorCRMSchema = new mongoose.Schema({
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
  investor_name: { type: String, required: true },
  investor_company: { type: String },
  investor_title: { type: String },
  contact_email: { type: String },
  contact_phone: { type: String },
  linkedin_url: { type: String },
  notes: { type: String },
  last_contact: { type: Date },
  next_followup: { type: Date },
  communication_log: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['email', 'call', 'meeting', 'note'], required: true },
    summary: { type: String, required: true },
    outcome: { type: String }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.InvestorCRM || mongoose.model("InvestorCRM", InvestorCRMSchema);