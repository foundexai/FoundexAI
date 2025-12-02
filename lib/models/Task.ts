import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  ai_asset_id: { type: mongoose.Schema.Types.ObjectId, ref: "AIAsset" }, // Optional link to AI-generated task
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["Finance","Market","Legal","Operations"], default: "Operations" },
  status: { type: String, enum:["pending","completed"], default: "pending" },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  due_date: Date,
  ai_suggestions: [{ type: String }], // AI-generated suggestions for completing the task
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);