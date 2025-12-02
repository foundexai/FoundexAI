import mongoose from "mongoose";

const InvestorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  full_name: { type: String, required: true },
  company_name: String,
  website_url: String,
  stage_focus: { type: String, enum: ['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Growth'], default: 'Seed' },
  thesis: { type: String }, // Investment thesis
  geography: { type: String }, // Preferred geographies
  phone_number: String,
  company_type: { type: String, enum: ['VC', 'Angel', 'Family Office', 'Corporate', 'Other'] },
  linkedin_url: String,
  official_email: String,
  profile_image_url: String,
  investment_range_min: Number,
  investment_range_max: Number,
  portfolio_companies: [{
    name: String,
    sector: String,
    investment_date: Date,
    exit_status: String
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.InvestorProfile || mongoose.model("InvestorProfile", InvestorProfileSchema);