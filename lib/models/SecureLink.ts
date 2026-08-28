import mongoose from "mongoose";

const PageViewSchema = new mongoose.Schema({
  page_number: { type: Number, required: true },
  duration_seconds: { type: Number, default: 0 }
});

const AccessLogSchema = new mongoose.Schema({
  viewer_email: { type: String, required: true },
  viewer_ip: { type: String, default: "127.0.0.1" },
  user_agent: { type: String },
  viewed_at: { type: Date, default: Date.now },
  duration_seconds: { type: Number, default: 0 },
  page_views: [PageViewSchema]
});

const OTPRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expires_at: { type: Date, required: true },
  verified: { type: Boolean, default: false }
});

const DealRoomMemberSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  role: {
    type: String,
    enum: ["founder", "co-founder", "counsel", "lead_investor", "lp", "investor"],
    default: "investor"
  },
  status: {
    type: String,
    enum: ["invited", "active", "revoked"],
    default: "invited"
  },
  invited_at: { type: Date, default: Date.now },
  joined_at: { type: Date }
});

const NDASignatureSchema = new mongoose.Schema({
  email: { type: String, required: true },
  signer_name: { type: String },
  signed_at: { type: Date, default: Date.now },
  ip_address: { type: String, default: "127.0.0.1" },
  nda_version: { type: String, default: "v1.0" }
});

const SecureLinkSchema = new mongoose.Schema({
  share_token: { type: String, required: true, unique: true, index: true },
  founder_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
  doc_name: { type: String, required: true },
  doc_url: { type: String, required: true },
  doc_type: { type: String, default: "deck" },
  
  // Deal Room Multi-Party Extensions
  is_deal_room: { type: Boolean, default: false },
  deal_room_name: { type: String },
  allowed_tiers: [{
    type: String,
    enum: ["founder", "co-founder", "counsel", "lead_investor", "lp", "investor"],
  }],
  deal_room_members: [DealRoomMemberSchema],
  require_nda: { type: Boolean, default: false },
  nda_text: { type: String },
  nda_signatures: [NDASignatureSchema],

  // Security Gate Config
  access_type: {
    type: String,
    enum: ["public", "passcode", "email_otp", "domain_restricted", "tier_restricted"],
    default: "public"
  },
  passcode: { type: String },
  allowed_domains: [{ type: String }],
  allowed_emails: [{ type: String }],
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
