import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // Optional link to task
  ai_asset_id: { type: mongoose.Schema.Types.ObjectId, ref: "AIAsset" }, // Optional link to AI-generated content
  title: String,
  content: { type: String, required: true },
  tags: [String],
  type: { type: String, enum: ['manual', 'ai_generated', 'system'], default: 'manual' },
  is_system_generated: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);