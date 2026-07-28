import mongoose from "mongoose";

const InvestorUpdateSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  month: { type: String, required: true }, // Format: YYYY-MM (e.g. "2026-07")
  title: { type: String, required: true },
  metrics: {
    mrr: { type: Number, default: 0 },
    cash_in_bank: { type: Number, default: 0 },
    runway_months: { type: Number, default: 0 },
  },
  kpis: {
    highlights: { type: String, default: "" },
    lowlights: { type: String, default: "" },
    help_needed: { type: String, default: "" },
  },
  body: { type: String, default: "" },
  attachments: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.InvestorUpdate || mongoose.model("InvestorUpdate", InvestorUpdateSchema);
