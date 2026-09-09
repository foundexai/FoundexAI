import mongoose from "mongoose";

export const WEBHOOK_EVENTS = [
  "pipeline.deal_created",
  "pipeline.stage_changed",
  "captable.grant_issued",
  "document.viewed",
  "update.published",
  "integration.synced",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const WebhookEndpointSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
  url: { type: String, required: true },
  description: { type: String },
  secret: { type: String, required: true }, // Signing secret for HMAC SHA-256
  events: [{ type: String, enum: WEBHOOK_EVENTS }],
  status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
  consecutive_failures: { type: Number, default: 0 },
  last_delivery_at: { type: Date },
  last_delivery_status: { type: Number },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

WebhookEndpointSchema.index({ user_id: 1, status: 1 });

export default mongoose.models.WebhookEndpoint || mongoose.model("WebhookEndpoint", WebhookEndpointSchema);
