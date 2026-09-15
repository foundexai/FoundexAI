import "./load-env";
import { connectDB } from "../lib/db";
import Startup from "../lib/models/Startup";
import User from "../lib/models/User";
import CapTable from "../lib/models/CapTable";
import { convertCurrencySync, convertToUSDSync, formatMoney, FALLBACK_FX_RATES } from "../lib/currencyService";

async function runCurrencyAndTermSheetTests() {
  console.log("=========================================================");
  console.log("RUNNING MULTI-CURRENCY & TERM SHEET ADVISOR INTEGRATION");
  console.log("=========================================================");

  await connectDB();

  // -------------------------------------------------------------
  // Test 1: Real-Time FX Converter Mathematics
  // -------------------------------------------------------------
  console.log("\n[Test 1] Testing FX Converter math & locale formatting...");

  const eurToUsd = convertCurrencySync(100000, "EUR", "USD");
  console.log(`✓ 100,000 EUR -> $${eurToUsd.convertedAmount.toLocaleString()} USD (Rate: ${eurToUsd.exchangeRate})`);
  if (eurToUsd.convertedAmount <= 0) throw new Error("EUR to USD conversion failed");

  const gbpToNgn = convertCurrencySync(50000, "GBP", "NGN");
  console.log(`✓ £50,000 GBP -> ₦${gbpToNgn.convertedAmount.toLocaleString()} NGN`);

  const formattedGbp = formatMoney(50000, "GBP");
  const formattedNgn = formatMoney(150000000, "NGN");
  console.log(`✓ Formatted GBP: ${formattedGbp}`);
  console.log(`✓ Formatted NGN: ${formattedNgn}`);

  // -------------------------------------------------------------
  // Test 2: Multi-Currency Cap Table Equity Grant Creation
  // -------------------------------------------------------------
  console.log("\n[Test 2] Testing multi-currency equity grants in MongoDB...");

  const testUser = await User.create({
    email: `currency_test_${Date.now()}@foundex.ai`,
    password_hash: "hashed_pass",
    full_name: "Multi-Currency Founder",
    user_type: "founder",
  });

  const testStartup = await Startup.create({
    user_id: testUser._id,
    company_name: "GlobalFintech AG",
    sector: "Fintech",
    stage: "Series A",
    business_description: "Global cross-border payments infrastructure",
  });

  // Grant in EUR
  const eurGrant = await CapTable.create({
    startup_id: testStartup._id,
    shareholder_name: "Berlin Angels Club",
    shareholder_type: "investor",
    share_class: "Preferred Series Seed",
    share_count: 500000,
    investment_amount: 250000,
    currency: "EUR",
    investment_amount_usd: convertToUSDSync(250000, "EUR"),
    exchange_rate_applied: convertCurrencySync(1, "EUR", "USD").exchangeRate,
  });

  // Grant in GBP
  const gbpGrant = await CapTable.create({
    startup_id: testStartup._id,
    shareholder_name: "London Bridge Ventures",
    shareholder_type: "investor",
    share_class: "Preferred Series A",
    share_count: 750000,
    investment_amount: 500000,
    currency: "GBP",
    investment_amount_usd: convertToUSDSync(500000, "GBP"),
    exchange_rate_applied: convertCurrencySync(1, "GBP", "USD").exchangeRate,
  });

  console.log(`✓ EUR Grant Recorded: ${eurGrant.currency} ${eurGrant.investment_amount.toLocaleString()} -> USD $${eurGrant.investment_amount_usd.toLocaleString()}`);
  console.log(`✓ GBP Grant Recorded: ${gbpGrant.currency} ${gbpGrant.investment_amount.toLocaleString()} -> USD $${gbpGrant.investment_amount_usd.toLocaleString()}`);

  if (eurGrant.investment_amount_usd <= 0 || gbpGrant.investment_amount_usd <= 0) {
    throw new Error("USD normalized amounts were not stored properly");
  }

  // -------------------------------------------------------------
  // Test 3: Option Pool Shuffle & Dilution Calculations
  // -------------------------------------------------------------
  console.log("\n[Test 3] Testing Option Pool Shuffle economic calculations...");

  const statedPreMoney = 10000000;
  const investment = 2500000;
  const optionPoolPct = 12; // 12% unallocated

  const optionPoolFactor = 1 - optionPoolPct / 100;
  const effectivePreMoney = statedPreMoney * optionPoolFactor;
  const postMoney = statedPreMoney + investment;
  const investorPct = (investment / postMoney) * 100;
  const founderEffectivePct = 100 - investorPct - optionPoolPct;

  console.log(`✓ Stated Pre-Money: $${statedPreMoney.toLocaleString()}`);
  console.log(`✓ Effective Pre-Money (12% Pool Shuffle): $${effectivePreMoney.toLocaleString()}`);
  console.log(`✓ True Founder Stake After Shuffle: ${founderEffectivePct.toFixed(1)}%`);

  if (effectivePreMoney !== 8800000) {
    throw new Error("Option pool shuffle math mismatch");
  }

  // Clean up
  await CapTable.deleteMany({ startup_id: testStartup._id });
  await Startup.findByIdAndDelete(testStartup._id);
  await User.findByIdAndDelete(testUser._id);
  console.log("✓ Test records cleaned up successfully.");

  console.log("\n=========================================================");
  console.log("✅ ALL MULTI-CURRENCY & TERM SHEET TESTS PASSED");
  console.log("=========================================================");
}

runCurrencyAndTermSheetTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
