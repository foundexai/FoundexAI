import mongoose from "mongoose";

const AIAssetSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  type: { type: String, enum: ['pitch_deck_analysis', 'competitor_scan', 'market_mapping', 'insights'], required: true },
  content: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.AIAsset || mongoose.model("AIAsset", AIAssetSchema);