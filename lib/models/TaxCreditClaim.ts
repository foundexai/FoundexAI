import mongoose from "mongoose";

export interface IUSDetails {
  wages_qre: number;
  supplies_qre: number;
  contractor_qre: number;
  cloud_hosting_qre: number;
  total_qre: number;
  gross_receipts: number;
  years_with_revenue: number;
  payroll_tax_offset_eligible: boolean;
  credit_rate_pct: number;
  claimed_credit_amount: number;
  payroll_offset_amount: number;
  quarterly_burn_reduction: number;
}

export interface IUKDetails {
  staff_costs: number;
  subcontractor_costs: number;
  consumables_software: number;
  total_qualifying_expenditure: number;
  total_company_expenditure: number;
  rd_intensity_pct: number;
  scheme_type: "ERIS" | "Merged";
  is_loss_making: boolean;
  payable_tax_credit_amount: number;
  effective_benefit_pct: number;
}

export interface ITaxCreditClaim extends mongoose.Document {
  startup_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  country: "US" | "UK";
  tax_year: number;
  us_details?: IUSDetails;
  uk_details?: IUKDetails;
  status: "draft" | "calculated" | "filed" | "approved";
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const TaxCreditClaimSchema = new mongoose.Schema<ITaxCreditClaim>(
  {
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    country: { type: String, enum: ["US", "UK"], required: true },
    tax_year: { type: Number, required: true, default: () => new Date().getFullYear() },
    us_details: {
      wages_qre: { type: Number, default: 0 },
      supplies_qre: { type: Number, default: 0 },
      contractor_qre: { type: Number, default: 0 },
      cloud_hosting_qre: { type: Number, default: 0 },
      total_qre: { type: Number, default: 0 },
      gross_receipts: { type: Number, default: 0 },
      years_with_revenue: { type: Number, default: 1 },
      payroll_tax_offset_eligible: { type: Boolean, default: true },
      credit_rate_pct: { type: Number, default: 10 },
      claimed_credit_amount: { type: Number, default: 0 },
      payroll_offset_amount: { type: Number, default: 0 },
      quarterly_burn_reduction: { type: Number, default: 0 },
    },
    uk_details: {
      staff_costs: { type: Number, default: 0 },
      subcontractor_costs: { type: Number, default: 0 },
      consumables_software: { type: Number, default: 0 },
      total_qualifying_expenditure: { type: Number, default: 0 },
      total_company_expenditure: { type: Number, default: 0 },
      rd_intensity_pct: { type: Number, default: 0 },
      scheme_type: { type: String, enum: ["ERIS", "Merged"], default: "ERIS" },
      is_loss_making: { type: Boolean, default: true },
      payable_tax_credit_amount: { type: Number, default: 0 },
      effective_benefit_pct: { type: Number, default: 26.97 },
    },
    status: {
      type: String,
      enum: ["draft", "calculated", "filed", "approved"],
      default: "calculated",
    },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

TaxCreditClaimSchema.index({ startup_id: 1, country: 1, tax_year: -1 });

export default mongoose.models.TaxCreditClaim ||
  mongoose.model<ITaxCreditClaim>("TaxCreditClaim", TaxCreditClaimSchema);
