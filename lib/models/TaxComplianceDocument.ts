import mongoose from "mongoose";

export type TaxFormType = "W-9" | "W-8BEN" | "W-8BEN-E";
export type ComplianceStatus = "requested" | "submitted" | "verified" | "expiring_soon" | "expired";

export interface ITaxComplianceDocument extends mongoose.Document {
  startup_id: mongoose.Types.ObjectId;
  shareholder_id?: mongoose.Types.ObjectId;
  shareholder_name: string;
  shareholder_email?: string;
  form_type: TaxFormType;
  tax_id_number?: string; // Masked or encrypted TIN/SSN/EIN or Foreign TIN
  country_of_tax_residence: string;
  is_us_person: boolean;
  treaty_benefits_claimed: boolean;
  treaty_country?: string;
  treaty_rate_pct?: number;
  status: ComplianceStatus;
  date_signed?: Date;
  expires_at?: Date;
  last_reminder_sent_at?: Date;
  document_url?: string;
  certified_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const TaxComplianceDocumentSchema = new mongoose.Schema<ITaxComplianceDocument>(
  {
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    shareholder_id: { type: mongoose.Schema.Types.ObjectId, ref: "CapTable" },
    shareholder_name: { type: String, required: true },
    shareholder_email: { type: String },
    form_type: {
      type: String,
      enum: ["W-9", "W-8BEN", "W-8BEN-E"],
      required: true,
      default: "W-9",
    },
    tax_id_number: { type: String },
    country_of_tax_residence: { type: String, required: true, default: "United States" },
    is_us_person: { type: Boolean, default: true },
    treaty_benefits_claimed: { type: Boolean, default: false },
    treaty_country: { type: String },
    treaty_rate_pct: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["requested", "submitted", "verified", "expiring_soon", "expired"],
      default: "requested",
    },
    date_signed: { type: Date },
    expires_at: { type: Date },
    last_reminder_sent_at: { type: Date },
    document_url: { type: String },
    certified_by: { type: String },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

TaxComplianceDocumentSchema.index({ startup_id: 1, status: 1, expires_at: 1 });
TaxComplianceDocumentSchema.index({ startup_id: 1, shareholder_id: 1 });

export default mongoose.models.TaxComplianceDocument ||
  mongoose.model<ITaxComplianceDocument>("TaxComplianceDocument", TaxComplianceDocumentSchema);
