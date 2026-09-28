import mongoose from "mongoose";
import AcceleratorCohort, {
  IAcceleratorCohort,
  ICohortStartup,
  CohortStatus,
  OrganizationType,
} from "./models/AcceleratorCohort";
import Startup from "./models/Startup";

export interface CrossCohortAnalytics {
  total_cohorts: number;
  total_startups_managed: number;
  active_cohorts_count: number;
  graduated_cohorts_count: number;
  combined_portfolio_arr: number;
  combined_follow_on_funding: number;
  combined_capital_invested: number;
  average_portfolio_runway: number;
  overall_runway_distribution: {
    safe: number; // >= 12 months
    warning: number; // 6-12 months
    critical: number; // < 6 months
  };
  overall_survival_rate_pct: number;
  sector_distribution: Record<string, number>;
  cohorts_summary: Array<{
    id: string;
    organization_name: string;
    organization_type: OrganizationType;
    cohort_name: string;
    slug: string;
    year: number;
    season: string;
    status: CohortStatus;
    start_date?: string;
    demo_day_date?: string;
    startups_count: number;
    target_startups_count: number;
    total_arr: number;
    total_follow_on: number;
    total_capital_deployed: number;
    average_runway: number;
    survival_rate_pct: number;
  }>;
  all_startups_ledger: Array<{
    startup_id?: string;
    company_name: string;
    sector: string;
    stage: string;
    cohort_id: string;
    cohort_name: string;
    cohort_status: string;
    status: string;
    funding_received: number;
    equity_percentage: number;
    current_arr: number;
    monthly_burn: number;
    cash_runway_months: number;
    follow_on_raised: number;
    mentor_assigned?: string;
    demo_day_pitch_url?: string;
  }>;
}

/**
 * Computes live rollup benchmarks for a cohort
 */
export function computeCohortRollup(cohort: IAcceleratorCohort | any) {
  const startups: ICohortStartup[] = cohort.startups || [];
  const total = startups.length;
  if (total === 0) {
    return {
      average_mrr: 0,
      average_runway_months: 12,
      total_follow_on_raised: 0,
      survival_rate_pct: 100,
      total_arr: 0,
      total_capital_deployed: 0,
      runway_distribution: { safe: 0, warning: 0, critical: 0 },
    };
  }

  let sumArr = 0;
  let sumRunway = 0;
  let sumFollowOn = 0;
  let sumDeployed = 0;
  let survivingCount = 0;
  const runwayDist = { safe: 0, warning: 0, critical: 0 };

  for (const s of startups) {
    const arr = s.metrics?.current_arr || 0;
    const runway = s.metrics?.cash_runway_months ?? 12;
    const followOn = s.metrics?.follow_on_raised || 0;
    const deployed = s.funding_received || 0;

    sumArr += arr;
    sumRunway += runway;
    sumFollowOn += followOn;
    sumDeployed += deployed;

    if (s.status === "active" || s.status === "graduated" || s.status === "acquired") {
      survivingCount++;
    }

    if (runway >= 12) {
      runwayDist.safe++;
    } else if (runway >= 6) {
      runwayDist.warning++;
    } else {
      runwayDist.critical++;
    }
  }

  const avgRunway = Math.round((sumRunway / total) * 10) / 10;
  const avgMrr = Math.round(sumArr / total / 12);
  const survivalRate = Math.round((survivingCount / total) * 100);

  return {
    average_mrr: avgMrr,
    average_runway_months: avgRunway,
    total_follow_on_raised: sumFollowOn,
    survival_rate_pct: survivalRate,
    total_arr: sumArr,
    total_capital_deployed: sumDeployed,
    runway_distribution: runwayDist,
  };
}

/**
 * Returns multi-cohort master analytics across all cohorts belonging to a user/organization
 */
export async function getCrossCohortPartnerAnalytics(userId: string): Promise<CrossCohortAnalytics> {
  let cohorts = await AcceleratorCohort.find({
    program_director_id: new mongoose.Types.ObjectId(userId),
  })
    .sort({ year: -1, created_at: -1 })
    .lean();

  // If the user has no cohorts yet, seed sample cohorts so the dashboard is immediately functional
  if (!cohorts || cohorts.length === 0) {
    await seedSampleAcceleratorsAndCohorts(userId);
    cohorts = await AcceleratorCohort.find({
      program_director_id: new mongoose.Types.ObjectId(userId),
    })
      .sort({ year: -1, created_at: -1 })
      .lean();
  }

  let totalStartupsCount = 0;
  let activeCohortsCount = 0;
  let graduatedCohortsCount = 0;
  let totalArr = 0;
  let totalFollowOn = 0;
  let totalCapitalInvested = 0;
  let totalRunwaySum = 0;

  const overallRunway = { safe: 0, warning: 0, critical: 0 };
  const sectorDist: Record<string, number> = {};
  const cohortsSummary: CrossCohortAnalytics["cohorts_summary"] = [];
  const startupsLedger: CrossCohortAnalytics["all_startups_ledger"] = [];

  for (const c of cohorts) {
    if (c.status === "active") activeCohortsCount++;
    if (c.status === "graduated") graduatedCohortsCount++;

    const rollup = computeCohortRollup(c);

    cohortsSummary.push({
      id: c._id.toString(),
      organization_name: c.organization_name,
      organization_type: c.organization_type,
      cohort_name: c.cohort_name,
      slug: c.slug,
      year: c.year,
      season: c.season,
      status: c.status,
      start_date: c.start_date ? new Date(c.start_date).toISOString().split("T")[0] : undefined,
      demo_day_date: c.demo_day_date ? new Date(c.demo_day_date).toISOString().split("T")[0] : undefined,
      startups_count: c.startups?.length || 0,
      target_startups_count: c.target_startups_count || 20,
      total_arr: rollup.total_arr,
      total_follow_on: rollup.total_follow_on_raised,
      total_capital_deployed: rollup.total_capital_deployed,
      average_runway: rollup.average_runway_months,
      survival_rate_pct: rollup.survival_rate_pct,
    });

    for (const s of c.startups || []) {
      totalStartupsCount++;
      const arr = s.metrics?.current_arr || 0;
      const runway = s.metrics?.cash_runway_months ?? 12;
      const followOn = s.metrics?.follow_on_raised || 0;
      const deployed = s.funding_received || 0;

      totalArr += arr;
      totalFollowOn += followOn;
      totalCapitalInvested += deployed;
      totalRunwaySum += runway;

      if (runway >= 12) overallRunway.safe++;
      else if (runway >= 6) overallRunway.warning++;
      else overallRunway.critical++;

      const sector = s.sector || "Other";
      sectorDist[sector] = (sectorDist[sector] || 0) + 1;

      startupsLedger.push({
        startup_id: s.startup_id?.toString(),
        company_name: s.company_name,
        sector: s.sector,
        stage: s.stage || "Seed",
        cohort_id: c._id.toString(),
        cohort_name: c.cohort_name,
        cohort_status: c.status,
        status: s.status,
        funding_received: deployed,
        equity_percentage: s.equity_percentage || 0,
        current_arr: arr,
        monthly_burn: s.metrics?.monthly_burn || 0,
        cash_runway_months: runway,
        follow_on_raised: followOn,
        mentor_assigned: s.mentor_assigned,
        demo_day_pitch_url: s.demo_day_pitch_url,
      });
    }
  }

  const avgPortfolioRunway =
    totalStartupsCount > 0 ? Math.round((totalRunwaySum / totalStartupsCount) * 10) / 10 : 12;

  let totalSurvivingStartups = 0;
  for (const item of startupsLedger) {
    if (item.status === "active" || item.status === "graduated" || item.status === "acquired") {
      totalSurvivingStartups++;
    }
  }
  const overallSurvival =
    totalStartupsCount > 0 ? Math.round((totalSurvivingStartups / totalStartupsCount) * 100) : 100;

  return {
    total_cohorts: cohorts.length,
    total_startups_managed: totalStartupsCount,
    active_cohorts_count: activeCohortsCount,
    graduated_cohorts_count: graduatedCohortsCount,
    combined_portfolio_arr: totalArr,
    combined_follow_on_funding: totalFollowOn,
    combined_capital_invested: totalCapitalInvested,
    average_portfolio_runway: avgPortfolioRunway,
    overall_runway_distribution: overallRunway,
    overall_survival_rate_pct: overallSurvival,
    sector_distribution: sectorDist,
    cohorts_summary: cohortsSummary,
    all_startups_ledger: startupsLedger,
  };
}

/**
 * Enrolls a startup into an accelerator cohort and recalculates benchmarks
 */
export async function enrollStartupInCohort(cohortId: string, startupData: Partial<ICohortStartup>) {
  const cohort = await AcceleratorCohort.findById(cohortId);
  if (!cohort) throw new Error("Cohort not found");

  cohort.startups.push({
    startup_id: startupData.startup_id,
    company_name: startupData.company_name || "New Venture",
    sector: startupData.sector || "Fintech",
    stage: startupData.stage || "Pre-Seed",
    status: startupData.status || "active",
    funding_received: startupData.funding_received || 125000,
    equity_percentage: startupData.equity_percentage || 7,
    mentor_assigned: startupData.mentor_assigned,
    demo_day_pitch_url: startupData.demo_day_pitch_url,
    joined_at: new Date(),
    metrics: {
      current_arr: startupData.metrics?.current_arr || 0,
      monthly_burn: startupData.metrics?.monthly_burn || 15000,
      cash_runway_months: startupData.metrics?.cash_runway_months || 14,
      follow_on_raised: startupData.metrics?.follow_on_raised || 0,
    },
  });

  const rollups = computeCohortRollup(cohort);
  cohort.benchmarks = {
    average_mrr: rollups.average_mrr,
    average_runway_months: rollups.average_runway_months,
    total_follow_on_raised: rollups.total_follow_on_raised,
    survival_rate_pct: rollups.survival_rate_pct,
  };

  await cohort.save();
  return cohort;
}

/**
 * Seeds sample accelerator batches for instant institutional demonstration
 */
export async function seedSampleAcceleratorsAndCohorts(userId: string) {
  const existing = await AcceleratorCohort.findOne({
    program_director_id: new mongoose.Types.ObjectId(userId),
  });
  if (existing) {
    return await AcceleratorCohort.find({
      program_director_id: new mongoose.Types.ObjectId(userId),
    });
  }

  // Fetch any actual startups belonging to user to link them if available
  const userStartups = await Startup.find({ user_id: new mongoose.Types.ObjectId(userId) })
    .limit(4)
    .lean();

  const now = new Date();
  const demoDayActive = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days in future
  const startDateActive = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

  // Cohort 1: Active 2026 Batch
  const activeCohort = new AcceleratorCohort({
    organization_name: "Foundex Accelerator",
    organization_type: "accelerator",
    program_director_id: new mongoose.Types.ObjectId(userId),
    cohort_name: "Cohort 9 - Africa DeepTech & AI",
    slug: `foundex-cohort-9-${Date.now().toString(36)}`,
    year: now.getFullYear(),
    season: "Summer",
    status: "active",
    start_date: startDateActive,
    end_date: demoDayActive,
    demo_day_date: demoDayActive,
    target_startups_count: 12,
    notes: "Focused on high-impact scalable AI, climate infrastructure, and cross-border fintech.",
    startups: [
      {
        startup_id: userStartups[0]?._id,
        company_name: userStartups[0]?.company_name || "AuraPay Global",
        sector: "Fintech",
        stage: "Seed",
        status: "active",
        funding_received: 150000,
        equity_percentage: 7.0,
        mentor_assigned: "Dr. Amara Okafor (Partner, Sequoia Heritage)",
        joined_at: startDateActive,
        metrics: {
          current_arr: 420000,
          monthly_burn: 28000,
          cash_runway_months: 16,
          follow_on_raised: 850000,
        },
      },
      {
        startup_id: userStartups[1]?._id,
        company_name: userStartups[1]?.company_name || "Helios Agritech",
        sector: "Agritech",
        stage: "Pre-Seed",
        status: "active",
        funding_received: 125000,
        equity_percentage: 6.5,
        mentor_assigned: "Marcus Vance (ex-Y Combinator EIR)",
        joined_at: startDateActive,
        metrics: {
          current_arr: 180000,
          monthly_burn: 18000,
          cash_runway_months: 11,
          follow_on_raised: 400000,
        },
      },
      {
        company_name: "NeuroPulse Health",
        sector: "Healthtech",
        stage: "Seed",
        status: "active",
        funding_received: 150000,
        equity_percentage: 7.0,
        mentor_assigned: "Elena Rostova (BioVentures Capital)",
        joined_at: startDateActive,
        metrics: {
          current_arr: 290000,
          monthly_burn: 34000,
          cash_runway_months: 8,
          follow_on_raised: 600000,
        },
      },
      {
        company_name: "Kyoto Solar Mesh",
        sector: "Cleantech",
        stage: "Pre-Seed",
        status: "active",
        funding_received: 125000,
        equity_percentage: 7.0,
        mentor_assigned: "Tariq Mansoor (Energy Transition Ventures)",
        joined_at: startDateActive,
        metrics: {
          current_arr: 95000,
          monthly_burn: 12000,
          cash_runway_months: 14,
          follow_on_raised: 250000,
        },
      },
    ],
  });

  const roll1 = computeCohortRollup(activeCohort);
  activeCohort.benchmarks = {
    average_mrr: roll1.average_mrr,
    average_runway_months: roll1.average_runway_months,
    total_follow_on_raised: roll1.total_follow_on_raised,
    survival_rate_pct: roll1.survival_rate_pct,
  };
  await activeCohort.save();

  // Cohort 2: Graduated Alumni 2025 Batch
  const gradStartDate = new Date(now.getFullYear() - 1, 1, 15);
  const gradEndDate = new Date(now.getFullYear() - 1, 5, 20);
  const gradCohort = new AcceleratorCohort({
    organization_name: "Foundex Accelerator",
    organization_type: "accelerator",
    program_director_id: new mongoose.Types.ObjectId(userId),
    cohort_name: "Cohort 8 - Scaled B2B SaaS Alumni",
    slug: `foundex-cohort-8-${Date.now().toString(36)}`,
    year: now.getFullYear() - 1,
    season: "Spring",
    status: "graduated",
    start_date: gradStartDate,
    end_date: gradEndDate,
    demo_day_date: gradEndDate,
    target_startups_count: 10,
    notes: "Alumni batch with 100% Demo Day completion and institutional Series A follow-on traction.",
    startups: [
      {
        company_name: "OmniLogix Freight",
        sector: "Logistics",
        stage: "Series A",
        status: "graduated",
        funding_received: 125000,
        equity_percentage: 7.0,
        mentor_assigned: "Claire Dupont (SupplyChain Angels)",
        joined_at: gradStartDate,
        metrics: {
          current_arr: 1450000,
          monthly_burn: 65000,
          cash_runway_months: 22,
          follow_on_raised: 3800000,
        },
      },
      {
        company_name: "Kauri Cloud Security",
        sector: "Cybersecurity",
        stage: "Series A",
        status: "graduated",
        funding_received: 125000,
        equity_percentage: 7.0,
        mentor_assigned: "David Chen (Sentinel Syndicate)",
        joined_at: gradStartDate,
        metrics: {
          current_arr: 980000,
          monthly_burn: 48000,
          cash_runway_months: 18,
          follow_on_raised: 2200000,
        },
      },
      {
        company_name: "Zeno API Gateway",
        sector: "SaaS",
        stage: "Acquired",
        status: "acquired",
        funding_received: 125000,
        equity_percentage: 7.0,
        mentor_assigned: "Sarah Jenkins (Venture Builder)",
        joined_at: gradStartDate,
        metrics: {
          current_arr: 750000,
          monthly_burn: 0,
          cash_runway_months: 36,
          follow_on_raised: 1500000,
        },
      },
    ],
  });

  const roll2 = computeCohortRollup(gradCohort);
  gradCohort.benchmarks = {
    average_mrr: roll2.average_mrr,
    average_runway_months: roll2.average_runway_months,
    total_follow_on_raised: roll2.total_follow_on_raised,
    survival_rate_pct: roll2.survival_rate_pct,
  };
  await gradCohort.save();
  return [activeCohort, gradCohort];
}
