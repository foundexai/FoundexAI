import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  user_type: { type: String, enum: ["founder", "investor"], required: true },
  saved_investors: [{ type: String }],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
