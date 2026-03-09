import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["submission", "approval", "rejection", "system"],
    default: "system"
  },
  link: { type: String }, // Optional link to the resource (e.g., /admin/startups)
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

NotificationSchema.index({ recipient_id: 1, created_at: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
