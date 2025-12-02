import mongoose from "mongoose";

const StartupSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company_name: { type: String, required: true },
  sector: String,
  mission: String,
  vision: String,
  business_description: { type: String, required: true },
  business_model: { type: String, enum: ['B2B', 'B2C', 'B2B2C', 'C2C', 'Other'] },
  legal_structure: { type: String, enum: ['Sole Proprietorship', 'Partnership', 'LLC', 'C-Corp', 'S-Corp'] },
  readiness_score: { type: Number, default: 0, min: 0, max: 100 },
  logo_url: String,
  website_url: String,
  pitch_deck_url: String,
  business_plan_url: String,
  funding_stage: { type: String, enum: ['Pre-seed', 'Seed', 'Series A', 'Series B+'], default: 'Pre-seed' },
  funding_amount: { type: Number },
  monthly_burn: { type: Number },
  cac: { type: Number }, // Customer Acquisition Cost
  ltv: { type: Number }, // Customer Lifetime Value
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.Startup || mongoose.model("Startup", StartupSchema);