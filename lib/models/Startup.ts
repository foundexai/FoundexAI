import mongoose from "mongoose";

const StartupSchema = new mongoose.Schema({
  // Existing fields (user-centric)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  }, // Optional now as we might have mock/public startups? No, mocks are just client side.
  // Actually, for the directory, we might have startups submitted by users.
  // I will keep user_id but maybe make it optional if we allow admin-seeded startups without users?
  // For now, let's just extend the schema.

  company_name: { type: String, required: true },
  business_description: { type: String, required: true },

  // New "Directory" Style Fields (to match Investor card style)
  sector: { type: String }, // e.g. Fintech
  stage: {
    type: String,
    enum: ["Pre-Seed", "Seed", "Series A", "Series B+", "Growth", "Unknown"],
    default: "Unknown",
  },
  location: { type: String },
  logoInitial: { type: String },
  logoColor: { type: String },

  // Existing fields extended
  mission: String,
  vision: String,
  business_model: {
    type: String,
    enum: ["B2B", "B2C", "B2B2C", "C2C", "Other"],
  },
  legal_structure: {
    type: String,
    enum: ["Sole Proprietorship", "Partnership", "LLC", "C-Corp", "S-Corp"],
  },
  readiness_score: { type: Number, default: 0, min: 0, max: 100 },
  logo_url: String,
  website_url: String,
  pitch_deck_url: String,
  business_plan_url: String,
  funding_stage: {
    type: String,
    enum: ["Pre-seed", "Seed", "Series A", "Series B+"],
    default: "Pre-seed",
  }, // Overlap with 'stage' above? I should unify.
  // I will deprecate 'funding_stage' in favor of 'stage' or map them.
  // Let's keep 'funding_stage' as the source of truth for the user dashboard and map 'stage' for the directory or just use 'funding_stage'.
  // I'll stick to 'stage' for the directory view consistency.

  funding_amount: { type: Number },
  monthly_burn: { type: Number },
  cac: { type: Number },
  ltv: { type: Number },

  // Approval fields
  isApproved: { type: Boolean, default: false },
  submittedBy: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Helper to ensure stage consistency
// Helper to ensure stage consistency
StartupSchema.pre("save", function (next: any) {
  if (this.funding_stage && !this.stage) {
    this.stage =
      this.funding_stage === "Pre-seed" ? "Pre-Seed" : this.funding_stage;
  }
  next();
});

export default mongoose.models.Startup ||
  mongoose.model("Startup", StartupSchema);
