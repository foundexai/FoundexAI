import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // e.g. Fintech, Macro, AI
  summary: { type: String, required: true },
  content: { type: String }, // Markdown or JSON content
  author: { type: String, default: "Foundex Research" },
  image_url: { type: String },
  read_time: { type: String },
  is_premium: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published"], default: "published" },
  views: { type: Number, default: 0 },
  charts: [
    {
      title: { type: String },
      type: { type: String, enum: ["line", "bar", "pie"] },
      data: { type: mongoose.Schema.Types.Mixed }, // Flexible chart data
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
