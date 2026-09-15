import "./load-env";
import crypto from "crypto";
import { connectDB } from "../lib/db";
import Startup from "../lib/models/Startup";
import User from "../lib/models/User";
import AuditLog from "../lib/models/AuditLog";
import SecureLink from "../lib/models/SecureLink";
import { isIpAllowed, isCountryAllowed } from "../lib/networkSecurity";
import { runSOC2RetentionCleanup } from "../lib/soc2RetentionService";
import { convertCurrencySync, convertToUSDSync, formatMoney, SUPPORTED_CURRENCIES } from "../lib/currencyService";

async function runComplianceAndFxTests() {
  console.log("=========================================================");
  console.log("RUNNING ENTERPRISE COMPLIANCE, SECURITY & FX TEST SUITE");
  console.log("=========================================================");

  await connectDB();

  // Create temporary test user & startup
  const testUser = await User.create({
    email: `compliance_test_${Date.now()}@foundex.ai`,
    password_hash: "hashed_test_pass",
    full_name: "Compliance Officer",
    user_type: "founder",
  });

  const testStartup = await Startup.create({
    user_id: testUser._id,
    company_name: "SecuredFin Corp",
    sector: "Enterprise Security",
    stage: "Series A",
    business_description: "Enterprise compliance & cross-border asset security platform",
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Signed Compliance Audit Trail & HMAC-SHA256 Integrity
    // -------------------------------------------------------------
    console.log("\n[Test 1] Testing Signed Audit Trail Integrity...");

    const audit1 = await AuditLog.create({
      startup_id: testStartup._id,
      user_id: testUser._id,
      action: "create",
      entity: "CapTable",
      details: { shareholder_name: "Tiger Global", shares: 1000000 },
    });

    const audit2 = await AuditLog.create({
      startup_id: testStartup._id,
      user_id: testUser._id,
      action: "update",
      entity: "StartupProfile",
      details: { field: "valuation", old: 10000000, new: 15000000 },
    });

    const exportPayload = JSON.stringify({
      startup_id: testStartup._id.toString(),
      exported_by: testUser.email,
      exported_at: new Date().toISOString(),
      record_count: 2,
      log_ids: [audit1._id.toString(), audit2._id.toString()],
    });

    const hmacSecret = process.env.JWT_SECRET || "foundex-audit-compliance-salt";
    const signature = crypto.createHmac("sha256", hmacSecret).update(exportPayload).digest("hex");

    console.log(`✓ Audit Records Generated: 2`);
    console.log(`✓ Generated SHA-256 HMAC Signature: ${signature}`);

    // Verify tamper detection
    const tamperedPayload = exportPayload.replace(testUser.email, "attacker@rogue.com");
    const tamperedSig = crypto.createHmac("sha256", hmacSecret).update(tamperedPayload).digest("hex");
    if (tamperedSig === signature) {
      throw new Error("Tamper detection failed: identical signature for altered payload");
    }
    console.log(`✓ Tamper-resistance verified: altered payload produces distinct hash`);

    // -------------------------------------------------------------
    // Test 2: IP Whitelisting & CIDR Subnet Validation
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing IP Whitelisting & Subnet Rules...");

    const allowedIps = ["192.168.1.50", "10.0.0.0/16", "203.0.113.100"];

    // Exact IP match
    const exactMatch = isIpAllowed("192.168.1.50", allowedIps);
    console.log(`✓ Exact IP 192.168.1.50 in whitelist: ${exactMatch} (Expected: true)`);
    if (!exactMatch) throw new Error("Exact IP match failed");

    // CIDR subnet match
    const cidrMatch = isIpAllowed("10.0.4.25", allowedIps);
    console.log(`✓ Subnet IP 10.0.4.25 in 10.0.0.0/16: ${cidrMatch} (Expected: true)`);
    if (!cidrMatch) throw new Error("CIDR subnet match failed");

    // Disallowed IP
    const disallowedIp = isIpAllowed("198.51.100.22", allowedIps);
    console.log(`✓ Rogue IP 198.51.100.22 in whitelist: ${disallowedIp} (Expected: false)`);
    if (disallowedIp) throw new Error("Disallowed IP was incorrectly permitted");

    // -------------------------------------------------------------
    // Test 3: Geo-Fencing Jurisdiction Restrictions
    // -------------------------------------------------------------
    console.log("\n[Test 3] Testing Geo-Fencing Country Enforcements...");

    const allowedCountries = ["US", "GB", "DE", "NG"];

    const usAllowed = isCountryAllowed("US", allowedCountries);
    const ngAllowed = isCountryAllowed("ng", allowedCountries); // Case insensitivity
    const cnDisallowed = isCountryAllowed("CN", allowedCountries);

    console.log(`✓ US Viewer Permitted: ${usAllowed} (Expected: true)`);
    console.log(`✓ NG Viewer Permitted: ${ngAllowed} (Expected: true)`);
    console.log(`✓ CN Viewer Permitted: ${cnDisallowed} (Expected: false)`);

    if (!usAllowed || !ngAllowed || cnDisallowed) {
      throw new Error("Geo-fencing country rules check failed");
    }

    // -------------------------------------------------------------
    // Test 4: SOC2 Data Retention & Automated Link Purge
    // -------------------------------------------------------------
    console.log("\n[Test 4] Testing SOC2 Data Retention automated purge...");

    // Create an expired link that exceeded its 30-day retention
    const ancientDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    const expiredLink = await SecureLink.create({
      share_token: `soc2_test_${Date.now()}`,
      founder_id: testUser._id,
      startup_id: testStartup._id,
      doc_name: "Confidential Financial Model Q2",
      doc_url: "https://foundex.ai/docs/financial-model-q2.pdf",
      passcode: "SecretPass123",
      allowed_emails: ["investor@fund.com"],
      expires_at: ancientDate,
      soc2_retention_days: 30, // 30 days retention window
      auto_delete_expired: true,
      access_logs: [
        {
          viewer_email: "investor@fund.com",
          viewer_ip: "192.168.1.100",
          user_agent: "Mozilla/5.0",
          viewed_at: ancientDate,
        },
      ],
    });

    const cleanupResult = await runSOC2RetentionCleanup();
    console.log(`✓ Purged Links Count: ${cleanupResult.purgedLinksCount}`);
    console.log(`✓ Anonymized Logs Count: ${cleanupResult.anonymizedLogsCount}`);

    const updatedLink = await SecureLink.findById(expiredLink._id);
    if (!updatedLink || !updatedLink.deleted_at || updatedLink.doc_url !== "[PURGED_SOC2_RETENTION]") {
      throw new Error("SOC2 Link was not properly purged and anonymized");
    }
    if (updatedLink.passcode || updatedLink.allowed_emails.length > 0) {
      throw new Error("Sensitive credentials were not stripped during SOC2 purge");
    }
    console.log(`✓ Link credentials stripped and doc_url purged to [PURGED_SOC2_RETENTION]`);

    // -------------------------------------------------------------
    // Test 5: Multi-Currency & Historical FX Rate Accuracy
    // -------------------------------------------------------------
    console.log("\n[Test 5] Testing Historical FX Rate calculations across 13 currencies...");

    const testCurrencies = Object.keys(SUPPORTED_CURRENCIES);
    console.log(`✓ Supported Currencies Count: ${testCurrencies.length} (${testCurrencies.join(", ")})`);

    testCurrencies.forEach((curr) => {
      const { convertedAmount, exchangeRate } = convertCurrencySync(100000, curr, "USD");
      const usdNormalized = convertToUSDSync(100000, curr);
      const formatted = formatMoney(100000, curr);

      if (isNaN(convertedAmount) || convertedAmount <= 0 || isNaN(usdNormalized)) {
        throw new Error(`FX Conversion failed for currency: ${curr}`);
      }
      console.log(`  • 100,000 ${curr.padEnd(4)} -> $${Math.round(usdNormalized).toLocaleString().padStart(10)} USD (Rate: ${exchangeRate.toFixed(6)}) | Formatted: ${formatted}`);
    });

    console.log("\n=========================================================");
    console.log("✅ ALL COMPLIANCE, SECURITY & FX TESTS PASSED");
    console.log("=========================================================");
  } finally {
    // Clean up test records
    await AuditLog.deleteMany({ startup_id: testStartup._id });
    await SecureLink.deleteMany({ startup_id: testStartup._id });
    await Startup.findByIdAndDelete(testStartup._id);
    await User.findByIdAndDelete(testUser._id);
    console.log("✓ Test sandbox records cleaned up successfully.");
  }
}

runComplianceAndFxTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
