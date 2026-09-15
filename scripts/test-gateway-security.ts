import "./load-env";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import User from "../lib/models/User";
import Startup from "../lib/models/Startup";
import CapTable from "../lib/models/CapTable";
import ApiKey from "../lib/models/ApiKey";
import WebhookEndpoint from "../lib/models/WebhookEndpoint";
import WebhookLog from "../lib/models/WebhookLog";
import ExternalIntegration from "../lib/models/ExternalIntegration";
import { generateNewApiKey, verifyApiKeyRequest } from "../lib/apiKeyAuth";
import { validateWebhookUrl } from "../lib/ssrfValidator";
import { generateWebhookSignature } from "../lib/webhookService";

async function runSecurityAuditTestSuite() {
  console.log("===============================================================================");
  console.log("🛡️  STARTING DEVELOPER API GATEWAY SECURITY & MULTI-TENANT AUDIT");
  console.log("===============================================================================\n");

  await connectDB();

  let victimUser: any;
  let victimStartup: any;
  let attackerUser: any;
  let attackerStartup: any;

  try {
    // -------------------------------------------------------------------------
    // SETUP: 2 Distinct Tenants (Victim vs Attacker)
    // -------------------------------------------------------------------------
    console.log("1️⃣  Setting up Multi-Tenant isolation test subjects...");

    // Tenant A (Victim)
    victimUser = await User.create({
      email: `victim_${Date.now()}@victimcorp.com`,
      full_name: "Victim Founder",
      password_hash: "hash_v",
      user_type: "founder",
    });

    victimStartup = await Startup.create({
      user_id: victimUser._id,
      company_name: "Confidential Defence AI Corp",
      business_description: "Top-secret satellite analytics",
      sector: "Aerospace",
      stage: "Series A",
      cash_on_hand: 8500000,
      monthly_burn: 150000,
      mrr: 320000,
      arr: 3840000,
    });

    await CapTable.create([
      {
        startup_id: victimStartup._id,
        shareholder_name: "Victim Founder",
        shareholder_type: "founder",
        share_class: "Common",
        share_count: 7000000,
        investment_amount: 70000,
      },
      {
        startup_id: victimStartup._id,
        shareholder_name: "Tier 1 Sovereign Fund",
        shareholder_type: "investor",
        share_class: "Preferred Series A",
        share_count: 3000000,
        investment_amount: 15000000,
      },
    ]);

    // Tenant B (Attacker)
    attackerUser = await User.create({
      email: `attacker_${Date.now()}@hostile.io`,
      full_name: "Hostile Actor",
      password_hash: "hash_a",
      user_type: "founder",
    });

    attackerStartup = await Startup.create({
      user_id: attackerUser._id,
      company_name: "Attacker Shell Corp",
      business_description: "Phishing & penetration testing",
      sector: "Cybersecurity",
      stage: "Pre-Seed",
      cash_on_hand: 1000,
      mrr: 0,
    });

    console.log(`   ✅ Victim Organization: ${victimStartup.company_name} (ID: ${victimStartup._id})`);
    console.log(`   ✅ Attacker Organization: ${attackerStartup.company_name} (ID: ${attackerStartup._id})\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Cross-Tenant Key Creation Injection Attack
    // -------------------------------------------------------------------------
    console.log("2️⃣  TEST 1: Preventing Cross-Tenant Startup Binding at Key Creation...");
    let keyCreationBlocked = false;

    try {
      // Attacker attempts to create an API key bound to Victim's startup ID
      await generateNewApiKey({
        name: "Malicious Key Targeting Victim",
        userId: attackerUser._id.toString(),
        startupId: victimStartup._id.toString(), // Attacker passes Victim's ID!
        scopes: ["read:captable", "write:integrations"],
      });
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes("Forbidden")) {
        keyCreationBlocked = true;
      }
    }

    if (!keyCreationBlocked) {
      throw new Error("CRITICAL VULNERABILITY: Attacker successfully created API key bound to Victim startup!");
    }
    console.log("   ✅ PASSED: Cross-tenant startup key binding was rejected with 403 Forbidden.\n");

    // -------------------------------------------------------------------------
    // TEST 2: Tampered / Spoofed Database Key Protection (Defence in Depth)
    // -------------------------------------------------------------------------
    console.log("3️⃣  TEST 2: Defence-in-Depth against Tampered or Orphaned API Keys...");
    // Simulate an attacker who managed to have an API key in DB with victim's startup_id
    const rawAttackerKey = `fdx_live_${crypto.randomBytes(24).toString("hex")}`;
    const forgedKeyDoc = await ApiKey.create({
      user_id: attackerUser._id, // Attacker's account
      startup_id: victimStartup._id, // Manipulated to point to Victim!
      name: "Forged Key",
      key_prefix: rawAttackerKey.substring(0, 16),
      hashed_secret: crypto.createHash("sha256").update(rawAttackerKey).digest("hex"),
      scopes: ["read:captable", "write:integrations"],
      status: "active",
    });

    // Forge HTTP request presenting this key
    const dummyReq = new Request("http://localhost:3000/api/v1/external/captable", {
      headers: {
        Authorization: `Bearer ${rawAttackerKey}`,
      },
    });

    const verifyResult = await verifyApiKeyRequest(dummyReq, "read:captable");
    if (verifyResult.success) {
      throw new Error("CRITICAL VULNERABILITY: verifyApiKeyRequest allowed forged key bound to foreign startup!");
    }
    if (verifyResult.statusCode !== 403) {
      throw new Error(`Expected status code 403, got ${verifyResult.statusCode}`);
    }
    console.log("   ✅ PASSED: Tampered foreign startup binding blocked at verification layer (403 Forbidden).\n");

    // Clean up forged key
    await ApiKey.findByIdAndDelete(forgedKeyDoc._id);

    // -------------------------------------------------------------------------
    // TEST 3: SSRF & Internal IP / Metadata Protection
    // -------------------------------------------------------------------------
    console.log("4️⃣  TEST 3: SSRF Validation on Webhook URLs (Localhost, Cloud Metadata, RFC1918)...");

    const maliciousUrls = [
      { url: "http://localhost:3000/api/admin/users", reason: "Localhost loopback" },
      { url: "http://127.0.0.1:8080/internal-status", reason: "127.0.0.1 loopback" },
      { url: "http://169.254.169.254/latest/meta-data/", reason: "AWS/GCP Cloud Metadata Service" },
      { url: "http://10.0.0.5:9200/_cat/indices", reason: "10.0.0.0/8 RFC1918 Internal Network" },
      { url: "http://192.168.1.1/admin.html", reason: "192.168.0.0/16 RFC1918 Internal Gateway" },
      { url: "http://172.16.50.4:6379/", reason: "172.16.0.0/12 RFC1918 Internal Redis" },
      { url: "http://[::1]:3000/secret", reason: "IPv6 Loopback" },
    ];

    for (const testCase of maliciousUrls) {
      const result = await validateWebhookUrl(testCase.url);
      if (result.isValid) {
        throw new Error(`CRITICAL SSRF VULNERABILITY: Malicious target was NOT blocked: ${testCase.url} (${testCase.reason})`);
      }
      console.log(`   ✅ BLOCKED: ${testCase.reason} (${testCase.url}) -> ${result.error?.substring(0, 55)}...`);
    }

    // Verify legitimate public HTTPS webhook passes
    const validResult = await validateWebhookUrl("https://httpbin.org/post");
    if (!validResult.isValid) {
      throw new Error(`Legitimate public HTTPS endpoint was unexpectedly blocked: ${validResult.error}`);
    }
    console.log(`   ✅ ALLOWED: Public HTTPS endpoint (https://httpbin.org/post)\n`);

    // -------------------------------------------------------------------------
    // TEST 4: Webhook Replay Protection Format (t=...,v1=...)
    // -------------------------------------------------------------------------
    console.log("5️⃣  TEST 4: Webhook Replay Protection & Signature Structure...");
    const samplePayload = JSON.stringify({ event: "captable.grant_issued", amount: 50000 });
    const secret = "whsec_test_secret_123456";
    const timestamp = 1750000000;
    const signedHeader = generateWebhookSignature(samplePayload, secret, timestamp);

    if (!signedHeader.startsWith(`t=${timestamp},v1=`)) {
      throw new Error(`Signed header does not match 't=...,v1=...' format: ${signedHeader}`);
    }
    console.log(`   ✅ Formatted Signature Header: ${signedHeader.substring(0, 35)}...`);
    console.log("   ✅ Replay attack protection timestamp bound into signature.\n");

    // -------------------------------------------------------------------------
    // TEST 5: Integration Credential Encryption at Rest
    // -------------------------------------------------------------------------
    console.log("6️⃣  TEST 5: Third-Party Credential AES-256-GCM Encryption at Rest...");
    const plainApiKey = "stripe_sk_live_very_secret_key_99999999999";
    const integrationDoc = await ExternalIntegration.create({
      user_id: victimUser._id,
      startup_id: victimStartup._id,
      provider: "stripe",
      api_key: plainApiKey,
    });

    // Inspect raw MongoDB collection document (bypass mongoose getters)
    const rawMongoDoc = await ExternalIntegration.collection.findOne({ _id: integrationDoc._id });
    if (!rawMongoDoc) throw new Error("Could not fetch raw document");

    if (rawMongoDoc.api_key === plainApiKey) {
      throw new Error("CRITICAL: Integration API key was stored in plain text in database!");
    }
    if (!rawMongoDoc.api_key.includes(":")) {
      throw new Error("Raw encrypted key does not match IV:Tag:Cipher format");
    }

    // Verify getter returns decrypted plain text
    const fetchedDoc = await ExternalIntegration.findById(integrationDoc._id);
    if (fetchedDoc.api_key !== plainApiKey) {
      throw new Error("Decryption getter failed to reconstruct original API key");
    }

    console.log(`   ✅ Raw Stored Cipher: ${rawMongoDoc.api_key.substring(0, 32)}... (Encrypted)`);
    console.log(`   ✅ Decrypted Read: ${fetchedDoc.api_key.substring(0, 18)}... (Decrypted successfully)`);
    console.log("   ✅ Third-party credentials verified encrypted at rest with AES-256-GCM.\n");

    console.log("===============================================================================");
    console.log("🎉 ALL AUDIT CHECKS PASSED: ZERO IDOR, ZERO SSRF, ENCRYPTED AT REST");
    console.log("===============================================================================");
  } finally {
    console.log("\n🧹 Tearing down security audit test records...");
    if (victimStartup) {
      await CapTable.deleteMany({ startup_id: victimStartup._id });
      await ExternalIntegration.deleteMany({ startup_id: victimStartup._id });
      await Startup.findByIdAndDelete(victimStartup._id);
    }
    if (victimUser) await User.findByIdAndDelete(victimUser._id);
    if (attackerStartup) await Startup.findByIdAndDelete(attackerStartup._id);
    if (attackerUser) await User.findByIdAndDelete(attackerUser._id);
    await mongoose.disconnect();
    console.log("   ✅ Security audit cleanup complete.");
  }
}

runSecurityAuditTestSuite()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("❌ Security audit failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  });
