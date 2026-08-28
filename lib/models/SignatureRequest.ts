import mongoose from "mongoose";

const SignerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  role: {
    type: String,
    enum: ["founder", "investor", "counsel", "other"],
    default: "investor"
  },
  status: {
    type: String,
    enum: ["pending", "signed", "declined"],
    default: "pending"
  },
  signed_at: { type: Date },
  ip_address: { type: String },
  signature_type: { type: String, enum: ["drawn", "typed"] },
  signature_data: { type: String }, // Base64 signature image or typed cursive name
  signature_hash: { type: String }, // Cryptographic sha256 stamp for auditing
});

const SignatureRequestSchema = new mongoose.Schema({
  doc_name: { type: String, required: true },
  doc_url: { type: String, required: true },
  signed_doc_url: { type: String }, // Holds URL of signed document PDF once completed
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  founder_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  signers: [SignerSchema],
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending"
  },
  require_nda: { type: Boolean, default: false },
  nda_text: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

if (process.env.NODE_ENV === "development" && mongoose.models.SignatureRequest) {
  delete mongoose.models.SignatureRequest;
}

export default mongoose.models.SignatureRequest || mongoose.model("SignatureRequest", SignatureRequestSchema);
