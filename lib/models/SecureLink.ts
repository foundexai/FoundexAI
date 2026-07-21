import mongoose from "mongoose";

const AccessLogSchema = new mongoose.Schema({
  viewer_email: { type: String, required: true },
  viewer_ip: { type: String, default: "127.0.0.1" },
  user_agent: { type: String },
  viewed_at: { type: Date, default: Date.now },
  duration_seconds: { type: Number, default: 0 }
});

const OTPRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expires_at: { type: Date, required: true },
  verified: { type: Boolean, default: false }
});

const SecureLinkSchema = new mongoose.Schema({
  share_token: { type: String, required: true, unique: true, index: true },
  founder_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
  doc_name: { type: String, required: true },
  doc_url: { type: String, required: true },
  doc_type: { type: String, default: "deck" },
  
  // Security Gate Config
  access_type: {
    type: String,
    enum: ["public", "passcode", "email_otp", "domain_restricted"],
    default: "public"
  },
  passcode: { type: String },
  allowed_domains: [{ type: String }],
  expires_at: { type: Date },
  max_views: { type: Number },
  view_count: { type: Number, default: 0 },
  allow_download: { type: Boolean, default: false },
  
  // Watermarking Config
  watermark_enabled: { type: Boolean, default: true },
  watermark_text: { type: String, default: "CONFIDENTIAL • {email} • {date}" },
  watermark_opacity: { type: Number, default: 0.18 },
  watermark_style: { type: String, enum: ["diagonal", "center", "banner"], default: "diagonal" },
  
  // Status & Logs
  is_revoked: { type: Boolean, default: false },
  access_logs: [AccessLogSchema],
  otp_requests: [OTPRequestSchema],
  created_at: { type: Date, default: Date.now }
});

if (process.env.NODE_ENV === "development" && mongoose.models.SecureLink) {
  delete mongoose.models.SecureLink;
}

export default mongoose.models.SecureLink || mongoose.model("SecureLink", SecureLinkSchema);
