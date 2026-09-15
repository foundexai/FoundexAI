import mongoose from "mongoose";

const CapTableSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  shareholder_name: { type: String, required: true },
  shareholder_type: {
    type: String,
    enum: ["founder", "investor", "employee", "advisor"],
    default: "investor",
  },
  email: { type: String },
  share_class: {
    type: String,
    enum: [
      "Common",
      "Preferred Series Seed",
      "Preferred Series A",
      "Options / ESOP",
      "SAFE / Convertible",
    ],
    default: "Common",
  },
  share_count: { type: Number, required: true, default: 0 },
  investment_amount: { type: Number, default: 0 },
  currency: { type: String, default: "USD", uppercase: true },
  investment_amount_usd: { type: Number, default: 0 },
  exchange_rate_applied: { type: Number, default: 1 },
  price_per_share: { type: Number, default: 0 },
  grant_date: { type: Date, default: Date.now },
  esop_vesting: {
    is_vesting: { type: Boolean, default: false },
    total_months: { type: Number, default: 48 }, // 4 years default
    cliff_months: { type: Number, default: 12 }, // 1 year cliff default
    start_date: { type: Date, default: Date.now },
    vested_shares: { type: Number, default: 0 },
  },
  notes: { type: String },
  tax_status: {
    type: String,
    enum: ["pending", "w9_verified", "w8_verified", "expiring_soon", "expired", "exempt"],
    default: "pending",
  },
  tax_form_id: { type: mongoose.Schema.Types.ObjectId, ref: "TaxComplianceDocument" },
  tax_residence_country: { type: String, default: "United States" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.CapTable || mongoose.model("CapTable", CapTableSchema);
