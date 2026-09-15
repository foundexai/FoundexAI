import mongoose from "mongoose";
import { encryptSecret, decryptSecret } from "@/lib/cryptoUtils";

export const INTEGRATION_PROVIDERS = ["hubspot", "quickbooks", "stripe"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

const ExternalIntegrationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true, index: true },
  provider: { type: String, enum: INTEGRATION_PROVIDERS, required: true },
  status: { type: String, enum: ["connected", "disconnected", "error"], default: "connected", index: true },
  access_token: { type: String, set: encryptSecret, get: decryptSecret },
  refresh_token: { type: String, set: encryptSecret, get: decryptSecret },
  api_key: { type: String, set: encryptSecret, get: decryptSecret },
  external_account_id: { type: String },
  sync_frequency_hours: { type: Number, default: 24 },
  last_sync_at: { type: Date },
  last_sync_status: { type: String, enum: ["success", "failed", "pending"] },
  last_sync_message: { type: String },
  sync_stats: {
    contacts_synced: { type: Number, default: 0 },
    deals_synced: { type: Number, default: 0 },
    invoices_synced: { type: Number, default: 0 },
    revenue_synced_usd: { type: Number, default: 0 },
    mrr_usd: { type: Number, default: 0 },
    arr_usd: { type: Number, default: 0 },
  },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

ExternalIntegrationSchema.index({ startup_id: 1, provider: 1 }, { unique: true });
ExternalIntegrationSchema.index({ user_id: 1, provider: 1 });

export default mongoose.models.ExternalIntegration || mongoose.model("ExternalIntegration", ExternalIntegrationSchema);
