import mongoose from "mongoose";

export type OrganizationType = "accelerator" | "incubator" | "venture_studio" | "angel_network";
export type CohortSeason = "Spring" | "Summer" | "Fall" | "Winter" | "Year-Round";
export type CohortStatus = "upcoming" | "active" | "graduated";
export type StartupCohortStatus = "active" | "graduated" | "dropped_out" | "acquired";

export interface ICohortStartup {
  startup_id?: mongoose.Types.ObjectId;
  company_name: string;
  sector: string;
  stage?: string;
  status: StartupCohortStatus;
  funding_received: number; // e.g. $125,000 cheque
  equity_percentage: number; // e.g. 7%
  mentor_assigned?: string;
  demo_day_pitch_url?: string;
  joined_at: Date;
  metrics: {
    current_arr: number;
    monthly_burn: number;
    cash_runway_months: number;
    follow_on_raised: number;
  };
}

export interface IAcceleratorCohort extends mongoose.Document {
  organization_name: string;
  organization_type: OrganizationType;
  program_director_id: mongoose.Types.ObjectId;
  cohort_name: string;
  slug: string;
  year: number;
  season: CohortSeason;
  status: CohortStatus;
  start_date?: Date;
  end_date?: Date;
  demo_day_date?: Date;
  target_startups_count: number;
  notes?: string;
  startups: ICohortStartup[];
  benchmarks: {
    average_mrr: number;
    average_runway_months: number;
    total_follow_on_raised: number;
    survival_rate_pct: number;
  };
  created_at: Date;
  updated_at: Date;
}

const CohortStartupSchema = new mongoose.Schema({
  startup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
  company_name: { type: String, required: true },
  sector: { type: String, required: true, default: "Fintech" },
  stage: { type: String, default: "Seed" },
  status: {
    type: String,
    enum: ["active", "graduated", "dropped_out", "acquired"],
    default: "active",
  },
  funding_received: { type: Number, default: 0 },
  equity_percentage: { type: Number, default: 0 },
  mentor_assigned: { type: String },
  demo_day_pitch_url: { type: String },
  joined_at: { type: Date, default: Date.now },
  metrics: {
    current_arr: { type: Number, default: 0 },
    monthly_burn: { type: Number, default: 0 },
    cash_runway_months: { type: Number, default: 12 },
    follow_on_raised: { type: Number, default: 0 },
  },
});

const AcceleratorCohortSchema = new mongoose.Schema<IAcceleratorCohort>(
  {
    organization_name: { type: String, required: true, trim: true },
    organization_type: {
      type: String,
      enum: ["accelerator", "incubator", "venture_studio", "angel_network"],
      default: "accelerator",
    },
    program_director_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cohort_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    year: { type: Number, required: true, default: () => new Date().getFullYear() },
    season: {
      type: String,
      enum: ["Spring", "Summer", "Fall", "Winter", "Year-Round"],
      default: "Summer",
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "graduated"],
      default: "active",
    },
    start_date: { type: Date },
    end_date: { type: Date },
    demo_day_date: { type: Date },
    target_startups_count: { type: Number, default: 20 },
    notes: { type: String },
    startups: [CohortStartupSchema],
    benchmarks: {
      average_mrr: { type: Number, default: 0 },
      average_runway_months: { type: Number, default: 12 },
      total_follow_on_raised: { type: Number, default: 0 },
      survival_rate_pct: { type: Number, default: 100 },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for high-concurrency lookups
AcceleratorCohortSchema.index({ program_director_id: 1, status: 1 });
AcceleratorCohortSchema.index({ organization_name: 1, year: -1 });
AcceleratorCohortSchema.index({ slug: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.AcceleratorCohort) {
  delete mongoose.models.AcceleratorCohort;
}

export const AcceleratorCohort =
  mongoose.models.AcceleratorCohort ||
  mongoose.model<IAcceleratorCohort>("AcceleratorCohort", AcceleratorCohortSchema);

export default AcceleratorCohort;
