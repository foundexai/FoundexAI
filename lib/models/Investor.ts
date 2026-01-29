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
  location: { type: String, required: true },
  logoInitial: { type: String, required: true },
  logoColor: { type: String, required: true }, // Tailwind class string
  description: { type: String, required: true },
  investmentRange: { type: String }, // e.g. "$50k - $500k"
  website: { type: String },
  isApproved: { type: Boolean, default: false },
  submittedBy: { type: String }, // User ID of the submitter
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Investor ||
  mongoose.model("Investor", InvestorSchema);
