import mongoose from "mongoose";

const NotificationLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
  type: { type: String, enum: ['new_investor_match', 'task_reminder', 'ai_analysis_complete', 'weekly_digest', 'system_update'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data like task_id, opportunity_id, etc.
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.NotificationLog || mongoose.model("NotificationLog", NotificationLogSchema);