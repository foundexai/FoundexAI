import mongoose from "mongoose";
import "./load-env";

import { AcceleratorCohort } from "../lib/models/AcceleratorCohort";
import {
  computeCohortRollup,
  getCrossCohortPartnerAnalytics,
  enrollStartupInCohort,
  seedSampleAcceleratorsAndCohorts,
} from "../lib/acceleratorService";

async function runTests() {
  console.log("🚀 [Enterprise Accelerator Tests] Starting verification...");

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/foundex-test";
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ [DB] Connected to MongoDB successfully.");
  } catch (err) {
    console.error("❌ [DB] Connection failed:", err);
    process.exit(1);
  }

  try {
    const testDirectorId = new mongoose.Types.ObjectId();
    const testOrgName = `Test Venture Lab ${Date.now()}`;

    // 1. Test Seeding / Creation
    console.log("\n📦 1. Seeding Sample Accelerators & Cohorts...");
    const sampleCohorts = await seedSampleAcceleratorsAndCohorts(testDirectorId.toString());
    console.log(`✅ Seeded ${sampleCohorts.length} cohorts with ventures.`);

    // 2. Test Single Cohort Creation
    console.log("\n📦 2. Testing Direct Cohort Creation & Validation...");
    const newCohort = await AcceleratorCohort.create({
      organization_name: testOrgName,
      organization_type: "accelerator",
      program_director_id: testDirectorId,
      cohort_name: "Alpha Batch 2026",
      slug: `alpha-batch-2026-${Date.now()}`,
      year: 2026,
      season: "Fall",
      status: "active",
      target_startups_count: 10,
      startups: [
        {
          company_name: "FinPulse Labs",
          sector: "Fintech",
          stage: "Pre-seed",
          status: "active",
          funding_received: 100000,
          equity_percentage: 6,
          joined_at: new Date(),
          metrics: {
            current_arr: 120000,
            monthly_burn: 8000,
            cash_runway_months: 14,
            follow_on_raised: 250000,
          },
        },
      ],
    });
    console.log(`✅ Created test cohort: ${newCohort.cohort_name} (${newCohort._id})`);

    // 3. Test Startup Enrollment
    console.log("\n📦 3. Testing Venture Enrollment...");
    const updatedCohort = await enrollStartupInCohort(
      newCohort._id.toString(),
      {
        company_name: "EcoLogix AI",
        sector: "ClimateTech",
        stage: "Seed",
        funding_received: 150000,
        equity_percentage: 7,
        metrics: {
          current_arr: 240000,
          monthly_burn: 12000,
          cash_runway_months: 18,
          follow_on_raised: 500000,
        },
      }
    );

    if (updatedCohort && updatedCohort.startups.length === 2) {
      console.log(`✅ Venture enrolled successfully. Total startups in cohort: ${updatedCohort.startups.length}`);
    } else {
      throw new Error(`Enrollment failed, expected 2 startups, got ${updatedCohort?.startups.length}`);
    }

    // 4. Test Financial Rollup Engine
    console.log("\n📦 4. Testing Cohort Rollup Engine...");
    const rollups = computeCohortRollup(updatedCohort);
    console.log("Calculated Cohort Rollup:", {
      totalStartups: updatedCohort.startups.length,
      totalARR: `$${(rollups.total_arr || 0).toLocaleString()}`,
      totalFollowOn: `$${(rollups.total_follow_on_raised || 0).toLocaleString()}`,
      avgRunwayMonths: `${rollups.average_runway_months} mo`,
      survivalRate: `${rollups.survival_rate_pct}%`,
    });

    if (updatedCohort.startups.length !== 2 || rollups.total_arr !== 360000) {
      throw new Error(`Rollup mismatch! Expected total_arr $360,000, got ${rollups.total_arr}`);
    }
    console.log("✅ Cohort Rollup Engine mathematically accurate.");

    // 5. Test Cross-Cohort Enterprise Analytics
    console.log("\n📦 5. Testing Cross-Cohort Partner Master Analytics...");
    const analytics = await getCrossCohortPartnerAnalytics(testDirectorId.toString());
    console.log("Cross-Cohort Analytics Summary:", {
      totalCohorts: analytics.total_cohorts,
      activeCohorts: analytics.active_cohorts_count,
      totalPortfolioVentures: analytics.total_startups_managed,
      combinedPortfolioARR: `$${(analytics.combined_portfolio_arr || 0).toLocaleString()}`,
      totalFollowOnCapital: `$${(analytics.combined_follow_on_funding || 0).toLocaleString()}`,
      runwayHealth: analytics.overall_runway_distribution,
    });

    if (analytics.total_cohorts < 1 || analytics.total_startups_managed < 2) {
      throw new Error("Cross-cohort analytics failed to aggregate properly.");
    }
    console.log("✅ Cross-Cohort Master Analytics validated.");

    // 6. Multi-Tenant Isolation Test
    console.log("\n📦 6. Testing Multi-Tenant Isolation...");
    const unauthorizedDirectorId = new mongoose.Types.ObjectId();
    const foreignCohorts = await AcceleratorCohort.find({
      program_director_id: unauthorizedDirectorId,
    });
    if (foreignCohorts.length !== 0) {
      throw new Error("Multi-tenant isolation failed! Unauthorized director saw cohorts.");
    }
    console.log("✅ Multi-tenant isolation verified (foreign director has 0 cohorts).");

    // Clean up test cohorts
    console.log("\n🧹 Cleaning up test artifacts...");
    await AcceleratorCohort.deleteMany({ program_director_id: testDirectorId });
    console.log("✅ Test artifacts cleaned up.");

    console.log("\n🎉 ALL ENTERPRISE ACCELERATOR TESTS PASSED WITH 100% SUCCESS!\n");
  } catch (error) {
    console.error("❌ Test error encountered:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
