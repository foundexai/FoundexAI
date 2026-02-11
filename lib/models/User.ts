import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  user_type: { type: String, enum: ["founder", "investor"], required: true },
  saved_investors: [{ type: String }],
  reset_code: { type: String },
  reset_code_expires: { type: Date },
  created_at: { type: Date, default: Date.now },
});

// In development, the model might be cached with an old schema.
// Deleting it from mongoose.models ensures the updated schema is used.
if (process.env.NODE_ENV === "development" && mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model("User", UserSchema);
