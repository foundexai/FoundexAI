import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  investor_id: { type: String, required: true },
  sender: { type: String, enum: ["founder", "investor"], required: true },
  text: { type: String },
  sharedDoc: {
    name: { type: String },
    url: { type: String }
  },
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
  subject: { type: String },
  context: {
    type: { type: String, enum: ["general", "document", "grant", "update", "captable"], default: "general" },
    ref_id: { type: String },
    title: { type: String },
    url: { type: String }
  },
  created_at: { type: Date, default: Date.now }
});

if (process.env.NODE_ENV === "development" && mongoose.models.ChatMessage) {
  delete mongoose.models.ChatMessage;
}

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);
