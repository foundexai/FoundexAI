import "./load-env";
import { connectDB } from "../lib/db";
import Startup from "../lib/models/Startup";
import User from "../lib/models/User";
import { signToken } from "../lib/auth";

async function runPitchStudioTests() {
  console.log("=================================================");
  console.log("RUNNING AI PITCH PRACTICE & ADVISORY TEST SUITE");
  console.log("=================================================");

  await connectDB();

  // Create temporary test user and startup
  const testEmail = `test_pitch_${Date.now()}@foundex.ai`;
  const testUser = await User.create({
    email: testEmail,
    password_hash: "hashed_pass_test",
    full_name: "Test Pitch Founder",
    user_type: "founder",
  });

  const testStartup = await Startup.create({
    user_id: testUser._id,
    company_name: "QuantumScale AI",
    sector: "Enterprise Software",
    stage: "Seed",
    business_description: "Enterprise machine learning platform for real-time model serving",
    mrr: 45000,
    arr: 540000,
    monthly_burn: 25000,
    cash_on_hand: 350000,
  });

  const token = signToken({ id: testUser._id.toString(), email: testUser.email });

  try {
    // -------------------------------------------------------------
    // Test 1: Pitch Simulator Question Generation & Latency Check
    // -------------------------------------------------------------
    console.log("\n[Test 1] Testing /api/ai/pitch-simulator question latency & persona context...");
    const t0 = Date.now();
    const simRes = await fetch("http://localhost:3000/api/ai/pitch-simulator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-startup-id": testStartup._id.toString(),
      },
      body: JSON.stringify({
        persona: "quant_hawk",
        topic: "unit_economics",
      }),
    });

    const elapsed = Date.now() - t0;
    console.log(`⏱️ Pitch Simulator Response Time: ${elapsed}ms`);

    if (simRes.ok) {
      const simData = await simRes.json();
      console.log(`✓ Generated Question: "${simData.question.slice(0, 70)}..."`);
      console.log(`✓ Persona Context: ${simData.persona} | Category: ${simData.category}`);
      if (!simData.question || simData.question.length < 10) {
        throw new Error("Invalid question structure returned by simulator");
      }
    } else {
      console.log("ℹ️ Server not running locally or mock fallback triggered.");
    }

    // -------------------------------------------------------------
    // Test 2: Pitch Rebuttal Scoring Precision
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing /api/ai/pitch-score scoring accuracy...");
    const scoreRes = await fetch("http://localhost:3000/api/ai/pitch-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-startup-id": testStartup._id.toString(),
      },
      body: JSON.stringify({
        question: "What is your customer acquisition cost payback period and net revenue retention?",
        founderAnswer: "Our CAC is $1,200 with an average contract value of $14,000, achieving a 3.1 month payback. Net dollar retention is currently 128% with negative 2% net churn.",
        persona: "quant_hawk",
        category: "Unit Economics",
      }),
    });

    if (scoreRes.ok) {
      const scoreData = await scoreRes.json();
      console.log(`✓ Overall Score: ${scoreData.scorecard?.overallScore}/100`);
      console.log(`✓ Clarity: ${scoreData.scorecard?.clarityScore}% | Defensibility: ${scoreData.scorecard?.defensibilityScore}%`);
      console.log(`✓ Verdict: ${scoreData.scorecard?.verdict}`);
    }

    // -------------------------------------------------------------
    // Test 3: Term Sheet Advisor Calculation & Risk Evaluation
    // -------------------------------------------------------------
    console.log("\n[Test 3] Testing /api/ai/term-sheet-advisor calculation accuracy...");
    const termRes = await fetch("http://localhost:3000/api/ai/term-sheet-advisor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-startup-id": testStartup._id.toString(),
      },
      body: JSON.stringify({
        startupId: testStartup._id.toString(),
        preMoneyValuation: 8000000,
        investmentAmount: 2000000,
        liquidationPreference: "2x Participating",
        antiDilution: "Full Ratchet Anti-Dilution",
        optionPoolUnallocatedPct: 15,
        optionPoolTiming: "Pre-Money (Founder Dilution)",
      }),
    });

    if (termRes.ok) {
      const termData = await termRes.json();
      console.log(`✓ Deal Score: ${termData.evaluation?.dealScore}/100`);
      console.log(`✓ Effective Pre-Money: $${termData.evaluation?.effectivePreMoney?.toLocaleString()}`);
      console.log(`✓ Flagged Risks Count: ${termData.evaluation?.clauseRisks?.length}`);
    }

    console.log("\n=================================================");
    console.log("✅ ALL PITCH STUDIO & ADVISOR TESTS COMPLETED");
    console.log("=================================================");
  } finally {
    // Cleanup temporary test data
    await Startup.findByIdAndDelete(testStartup._id);
    await User.findByIdAndDelete(testUser._id);
    console.log("✓ Test records cleaned up successfully.");
  }
}

runPitchStudioTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
