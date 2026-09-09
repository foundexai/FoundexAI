import mongoose from "mongoose";

const WebhookLogSchema = new mongoose.Schema({
  endpoint_id: { type: mongoose.Schema.Types.ObjectId, ref: "WebhookEndpoint", required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  event: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  url: { type: String, required: true },
  http_status: { type: Number },
  response_body: { type: String },
  error_message: { type: String },
  duration_ms: { type: Number, default: 0 },
  attempt: { type: Number, default: 1 },
  delivered_at: { type: Date, default: Date.now, index: true },
});

WebhookLogSchema.index({ endpoint_id: 1, delivered_at: -1 });
WebhookLogSchema.index({ user_id: 1, delivered_at: -1 });

export default mongoose.models.WebhookLog || mongoose.model("WebhookLog", WebhookLogSchema);
