import mongoose from "mongoose";

export const API_KEY_SCOPES = [
  "read:startup",
  "write:startup",
  "read:captable",
  "write:captable",
  "read:pipeline",
  "write:pipeline",
  "read:financials",
  "write:integrations",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

const ApiKeySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
  name: { type: String, required: true },
  key_prefix: { type: String, required: true, index: true }, // e.g., "fdx_live_a1b2c3"
  hashed_secret: { type: String, required: true, unique: true, index: true }, // SHA-256 hash of the full token
  scopes: [{ type: String, enum: API_KEY_SCOPES }],
  rate_limit_per_min: { type: Number, default: 120 }, // Default 120 req/min
  status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
  last_used_at: { type: Date },
  last_used_ip: { type: String },
  expires_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

ApiKeySchema.index({ user_id: 1, status: 1 });
ApiKeySchema.index({ key_prefix: 1, status: 1 });

export default mongoose.models.ApiKey || mongoose.model("ApiKey", ApiKeySchema);
