import mongoose from "mongoose";

const GrantSchema = new mongoose.Schema({
  title: { type: String, required: true },
  agency: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  eligibility_criteria: {
    stages: [{ type: String }], // e.g. ["Pre-Seed", "Seed", "Series A"]
    sectors: [{ type: String }], // e.g. ["AI", "Fintech", "Bio", "Deeptech"]
    locations: [{ type: String }], // e.g. ["United States", "Canada", "Europe"]
  },
  deadline: { type: Date },
  url: { type: String },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Grant || mongoose.model("Grant", GrantSchema);
