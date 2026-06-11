import mongoose from "mongoose";

const DocumentShareSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
  founder_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  investor_id: { type: String }, // Can link to an investor user if they exist
  investor_name: { type: String, required: true },
  doc_name: { type: String, required: true },
  doc_url: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

if (process.env.NODE_ENV === "development" && mongoose.models.DocumentShare) {
  delete mongoose.models.DocumentShare;
}

export default mongoose.models.DocumentShare || mongoose.model("DocumentShare", DocumentShareSchema);
