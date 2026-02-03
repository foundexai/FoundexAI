import mongoose from "mongoose";

const InvestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "VC",
      "Angel",
      "Accelerator",
      "PE",
      "Family Office",
      "Corporate",
      "Other",
    ],
    required: true,
  },
  focus: [{ type: String }], // Array of strings e.g. ["Fintech", "Healthtech"]
  location: { type: String, required: true }, // Primary Focus Locations
  hq_country: { type: String },
  active_status: { type: String, default: "Active" },

  logoInitial: { type: String, required: true },
  logoColor: { type: String, required: true }, // Tailwind class string
  
  description: { type: String, required: true },
  thesis: { type: String },
  notes: { type: String },
  
  investmentRange: { type: String }, // Ticket Size
  stage: { type: String }, // Seed, Angel
  
  website: { type: String },
  linkedin: { type: String },
  email: { type: String },

  isApproved: { type: Boolean, default: false },
  submittedBy: { type: String }, // User ID of the submitter
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Investor ||
  mongoose.model("Investor", InvestorSchema);
