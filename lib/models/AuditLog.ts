import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // "create" | "update" | "delete"
  entity: { type: String, required: true }, // e.g. "CapTable"
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
