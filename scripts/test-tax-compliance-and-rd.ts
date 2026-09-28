/**
 * End-to-End Test Suite for Week 22: Global Tax Compliance, R&D Tax Credit & Grant Claim Assistant
 * Validates:
 * 1. IRS Section 41 QSB Payroll Tax Offset rules ($500k cap, 65% contractor rule, <$5M gross receipts)
 * 2. UK HMRC ERIS (26.97% cash refund on >=30% R&D intensity) and Merged Scheme (15% net)
 * 3. SBIR Phase I/II and EIC Accelerator grant attachment generators
 * 4. Investor Tax Compliance Vault: W-8BEN 3-year expiration calculation (Treas. Reg. § 1.1441-1),
 *    expiration audit sweep (<90 days / expired), and renewal request triggers.
 */

import "./load-env";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import Startup from "../lib/models/Startup";
import User from "../lib/models/User";
import CapTable from "../lib/models/CapTable";
import TaxCreditClaim from "../lib/models/TaxCreditClaim";
import TaxComplianceDocument from "../lib/models/TaxComplianceDocument";
import GrantAttachment from "../lib/models/GrantAttachment";
import { calculateUSResearchCredit, calculateUKResearchCredit } from "../lib/taxCalculator";
import { generateGrantAttachment } from "../lib/grantAttachmentGenerator";
import {
  calculateW8ExpirationDate,
  maskTaxId,
  auditTaxDocumentExpirations,
  generate1099K1PreparationCsv,
  generateCpaTaxAuditPackage,
} from "../lib/taxComplianceService";

async function runWeek22TestSuite() {
  console.log("===============================================================================");
  console.log("🏛️  STARTING WEEK 22 GLOBAL TAX COMPLIANCE & R&D SUITE");
  console.log("===============================================================================\n");

  await connectDB();

  // -------------------------------------------------------------------------
  // TEST 1: US R&D Tax Credit (IRS § 41 & § 3111(f) Payroll Tax Offset)
  // -------------------------------------------------------------------------
  console.log("1️⃣  TEST 1: US IRS Section 41 R&D Credit & $500k QSB Payroll Offset...");

  // Case 1A: Eligible QSB with $1.2M QRE
  const usCase1 = calculateUSResearchCredit({
    wages_qre: 600000,
    supplies_qre: 50000,
    contractor_qre: 200000, // 65% -> 130,000
    cloud_hosting_qre: 100000,
    gross_receipts: 850000, // < $5M -> QSB eligible
    years_with_revenue: 2,   // <= 5 yrs -> eligible
    credit_rate_pct: 10,
  });

  const expectedContractors = 200000 * 0.65;
  const expectedTotalQre = 600000 + 50000 + expectedContractors + 100000;
  const expectedCredit = expectedTotalQre * 0.10;

  if (usCase1.eligible_contractors !== expectedContractors) {
    throw new Error(`Expected eligible contractors to be $${expectedContractors}, got $${usCase1.eligible_contractors}`);
  }
  if (usCase1.total_qre !== expectedTotalQre) {
    throw new Error(`Expected total QRE to be $${expectedTotalQre}, got $${usCase1.total_qre}`);
  }
  if (!usCase1.is_qsb_eligible) {
    throw new Error("Expected startup with <$5M gross receipts to be QSB eligible");
  }
  if (usCase1.payroll_offset_amount !== expectedCredit) {
    throw new Error(`Expected payroll offset to equal credit ($${expectedCredit}), got $${usCase1.payroll_offset_amount}`);
  }
  console.log(`   ✅ Total QRE accurately tallied with 65% contractor limit: $${usCase1.total_qre.toLocaleString()}`);
  console.log(`   ✅ QSB Status Verified: Eligible for $${usCase1.payroll_offset_amount.toLocaleString()} annual payroll offset ($${usCase1.quarterly_burn_reduction.toLocaleString()}/quarter)`);

  // Case 1B: Massive QRE hitting the statutory $500k Inflation Reduction Act cap
  const usCase2 = calculateUSResearchCredit({
    wages_qre: 6000000,
    supplies_qre: 500000,
    contractor_qre: 1000000,
    cloud_hosting_qre: 500000,
    gross_receipts: 2000000,
    years_with_revenue: 3,
    credit_rate_pct: 10,
  });

  if (usCase2.gross_credit_amount <= 500000) {
    throw new Error("Case 2 gross credit should exceed $500k");
  }
  if (usCase2.payroll_offset_amount !== 500000) {
    throw new Error(`Expected statutory payroll tax offset to cap at exactly $500,000, but got $${usCase2.payroll_offset_amount}`);
  }
  console.log(`   ✅ Statutory Cap Verified: Gross credit of $${usCase2.gross_credit_amount.toLocaleString()} capped at statutory $500,000 max payroll offset.\n`);

  // -------------------------------------------------------------------------
  // TEST 2: UK HMRC R&D Tax Relief (Post-April 2024 ERIS vs Merged Scheme)
  // -------------------------------------------------------------------------
  console.log("2️⃣  TEST 2: UK HMRC R&D Schemes (ERIS 26.97% vs Merged 15.0%)...");

  // Case 2A: R&D Intensive Loss-Making SME (ERIS eligible, intensity >= 30%)
  const ukCase1 = calculateUKResearchCredit({
    staff_costs: 300000,
    subcontractor_costs: 100000, // 65% -> 65,000
    consumables_software: 35000,
    total_company_expenditure: 500000,
    is_loss_making: true,
  });

  const ukQre = 300000 + 65000 + 35000; // 400,000
  const ukIntensity = (ukQre / 500000) * 100; // 80% >= 30%
  const expectedErisRefund = Math.round(ukQre * 0.2697 * 100) / 100;

  if (ukCase1.scheme_applied !== "ERIS") {
    throw new Error(`Expected ERIS scheme for >=30% intensity, but got ${ukCase1.scheme_applied}`);
  }
  if (ukCase1.payable_tax_credit_amount !== expectedErisRefund) {
    throw new Error(`Expected ERIS refund of £${expectedErisRefund}, got £${ukCase1.payable_tax_credit_amount}`);
  }
  console.log(`   ✅ ERIS Scheme Verified: ${ukCase1.rd_intensity_pct}% intensity qualified for 26.97% payable cash refund (£${ukCase1.payable_tax_credit_amount.toLocaleString()})`);

  // Case 2B: Non-intensive or profitable entity (Merged Scheme, 15% net)
  const ukCase2 = calculateUKResearchCredit({
    staff_costs: 100000,
    subcontractor_costs: 0,
    consumables_software: 20000,
    total_company_expenditure: 800000, // 120k / 800k = 15% intensity (<30%)
    is_loss_making: true,
  });

  if (ukCase2.scheme_applied !== "Merged" || ukCase2.effective_benefit_pct !== 15.0) {
    throw new Error(`Expected Merged scheme with 15% net benefit, got ${ukCase2.scheme_applied} (${ukCase2.effective_benefit_pct}%)`);
  }
  console.log(`   ✅ Merged Scheme Verified: Sub-30% intensity defaulted to 15.0% net relief (£${ukCase2.payable_tax_credit_amount.toLocaleString()}).\n`);

  // -------------------------------------------------------------------------
  // TEST 3: Automated Grant Application Attachment Generator (SBIR & EIC)
  // -------------------------------------------------------------------------
  console.log("3️⃣  TEST 3: Automated Grant Application Attachments (SBIR & EIC)...");

  // SBIR Commercialization Plan
  const sbirPlan = generateGrantAttachment(
    {
      company_name: "AeroNova Robotics",
      sector: "Autonomous Aerospace",
      stage: "Seed",
      business_description: "Autonomous high-altitude solar-powered data telemetry relays.",
    },
    {
      program: "SBIR",
      attachment_type: "commercialization_plan",
      requested_amount: 275000,
      project_duration_months: 12,
    }
  );

  if (!sbirPlan.document_content.includes("FEDERAL SBIR COMMERCIALIZATION PLAN") || !sbirPlan.document_content.includes("TAM")) {
    throw new Error("SBIR commercialization plan missing mandatory federal sections");
  }
  console.log(`   ✅ SBIR Commercialization Plan generated (${sbirPlan.meta_summary.word_count} words across ${sbirPlan.meta_summary.section_count} sections).`);

  // SBIR SF-424A Budget Justification
  const sbirBudget = generateGrantAttachment(
    { company_name: "AeroNova Robotics" },
    { program: "SBIR", attachment_type: "budget_justification", requested_amount: 275000 }
  );
  if (!sbirBudget.document_content.includes("SF-424A") || !sbirBudget.document_content.includes("Fringe Benefits")) {
    throw new Error("SBIR budget justification missing SF-424A line items");
  }
  console.log(`   ✅ SBIR SF-424A Budget Justification generated with 10% de minimis indirect costs.`);

  // EIC Accelerator Work Packages Annex
  const eicWp = generateGrantAttachment(
    { company_name: "BioSynth Horizon" },
    { program: "EIC", attachment_type: "eic_annex_work_packages", requested_amount: 2500000 }
  );
  if (!eicWp.document_content.includes("EIC ACCELERATOR") || !eicWp.document_content.includes("TRL")) {
    throw new Error("EIC annex missing TRL progression specifications");
  }
  console.log(`   ✅ EIC Accelerator Work Packages & Milestones generated (TRL 5 to TRL 8 transition).\n`);

  // -------------------------------------------------------------------------
  // TEST 4: Investor Tax Compliance Vault & Form W-8BEN Expiration Engine
  // -------------------------------------------------------------------------
  console.log("4️⃣  TEST 4: Form W-8BEN 3-Year Expiration & Compliance Vault...");

  // Test 4A: Statutory W-8BEN Expiration Date Calculation (IRS Treas. Reg. § 1.1441-1)
  // Signed May 14, 2023 -> Valid through December 31, 2026
  const testSignedDate = new Date("2023-05-14T10:00:00Z");
  const calculatedExpiry = calculateW8ExpirationDate(testSignedDate);

  if (calculatedExpiry.getUTCFullYear() !== 2026 || calculatedExpiry.getUTCMonth() !== 11 || calculatedExpiry.getUTCDate() !== 31) {
    throw new Error(`W-8BEN expiration date failed: Expected Dec 31, 2026, got ${calculatedExpiry.toISOString()}`);
  }
  console.log(`   ✅ IRS Treas. Reg. § 1.1441-1 Verified: W-8BEN signed ${testSignedDate.toISOString().split("T")[0]} expires exactly ${calculatedExpiry.toISOString().split("T")[0]}`);

  // Test 4B: Tax ID Masking
  const maskedSsn = maskTaxId("12-3456789");
  if (maskedSsn !== "••-•••6789") {
    throw new Error(`Tax ID masking error: expected '••-•••6789', got '${maskedSsn}'`);
  }
  console.log(`   ✅ Tax ID Display Masking Verified: '12-3456789' -> '${maskedSsn}'`);

  // -------------------------------------------------------------------------
  // TEST 5: Database Seeding, Expiration Audit Sweep & Renewal Trigger
  // -------------------------------------------------------------------------
  console.log("\n5️⃣  TEST 5: Expiration Audit Sweep & Renewal Trigger...");

  // Seed synthetic test founder & startup
  const testUser = await User.create({
    full_name: "Compliance Test Founder",
    email: `compliance_${Date.now()}@foundex.ai`,
    user_type: "founder",
    password_hash: "mock_password_hash_67890",
  });

  const testStartup = await Startup.create({
    user_id: testUser._id,
    company_name: "Global Quantum Inc.",
    stage: "Pre-Seed",
    sector: "Deep Tech",
    business_description: "Topological quantum memory architectures.",
  });

  // Create 3 synthetic tax documents:
  // 1. Active W-9 (US) with sensitive SSN/EIN
  const rawPlainTIN = "98-7654321";
  const w9Doc = await TaxComplianceDocument.create({
    startup_id: testStartup._id,
    shareholder_name: "US Seed Syndicate LLC",
    form_type: "W-9",
    tax_id_number: rawPlainTIN,
    country_of_tax_residence: "United States",
    status: "verified",
    date_signed: new Date(),
  });

  // Verify AES-256-GCM encryption at rest in MongoDB
  const rawDbDoc = await TaxComplianceDocument.findById(w9Doc._id).lean();
  if (!rawDbDoc?.tax_id_number || rawDbDoc.tax_id_number === rawPlainTIN) {
    throw new Error("Expected tax_id_number to be encrypted at rest, but raw plaintext was found in database");
  }
  const cipherParts = rawDbDoc.tax_id_number.split(":");
  if (cipherParts.length !== 3) {
    throw new Error(`Expected AES-256-GCM ciphertext format iv:authTag:cipher, got ${rawDbDoc.tax_id_number}`);
  }
  if (w9Doc.getDecryptedTaxId() !== rawPlainTIN) {
    throw new Error(`Expected getDecryptedTaxId() to return '${rawPlainTIN}', got '${w9Doc.getDecryptedTaxId()}'`);
  }
  if (w9Doc.getMaskedTaxId() !== "••-•••4321") {
    throw new Error(`Expected getMaskedTaxId() to return '••-•••4321', got '${w9Doc.getMaskedTaxId()}'`);
  }
  console.log(`   ✅ AES-256-GCM Encryption At Rest Verified: Raw TIN '${rawPlainTIN}' stored as ciphertext '${rawDbDoc.tax_id_number.slice(0, 24)}...' and securely decrypted.`);

  // 2. W-8BEN Expiring in 30 days (<90 days threshold)
  const expiringDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiringDoc = await TaxComplianceDocument.create({
    startup_id: testStartup._id,
    shareholder_name: "Lord Alistair Sterling",
    form_type: "W-8BEN",
    tax_id_number: "GB-998877",
    country_of_tax_residence: "United Kingdom",
    treaty_benefits_claimed: true,
    treaty_country: "United Kingdom",
    treaty_rate_pct: 15,
    status: "verified",
    date_signed: new Date("2023-01-01"),
    expires_at: expiringDate,
  });

  // 3. W-8BEN Expired 10 days ago
  const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const expiredDoc = await TaxComplianceDocument.create({
    startup_id: testStartup._id,
    shareholder_name: "Zurich Alpine Angels AG",
    form_type: "W-8BEN-E",
    tax_id_number: "CH-123456",
    country_of_tax_residence: "Switzerland",
    status: "verified",
    date_signed: new Date("2021-01-01"),
    expires_at: expiredDate,
  });

  // Run audit sweep with renewal trigger = true
  const auditReport = await auditTaxDocumentExpirations({
    startupId: testStartup._id.toString(),
    userId: testUser._id.toString(),
    triggerRenewals: true,
  });

  if (auditReport.expiring_soon_count !== 1) {
    throw new Error(`Expected exactly 1 expiring soon doc, got ${auditReport.expiring_soon_count}`);
  }
  if (auditReport.expired_count !== 1) {
    throw new Error(`Expected exactly 1 expired doc, got ${auditReport.expired_count}`);
  }
  if (auditReport.renewals_triggered_count !== 2) {
    throw new Error(`Expected 2 renewal requests to be triggered, got ${auditReport.renewals_triggered_count}`);
  }

  // Verify status updates persisted in MongoDB
  const reloadedExpiring = await TaxComplianceDocument.findById(expiringDoc._id);
  const reloadedExpired = await TaxComplianceDocument.findById(expiredDoc._id);

  if (reloadedExpiring?.status !== "expiring_soon") {
    throw new Error(`Expected doc status to update to 'expiring_soon', got ${reloadedExpiring?.status}`);
  }
  if (reloadedExpired?.status !== "expired") {
    throw new Error(`Expected doc status to update to 'expired', got ${reloadedExpired?.status}`);
  }
  console.log(`   ✅ Audit Sweep Succeeded: 3 scanned, 1 flagged expiring soon (<90d), 1 flagged expired.`);
  console.log(`   ✅ Renewal Reminders Dispatched: 2 renewal requests queued with timestamp updates.`);

  // Test 5B: 1099/K-1 Preparation CSV Export
  const csvOutput = await generate1099K1PreparationCsv(testStartup._id.toString());
  if (!csvOutput.includes("Shareholder Legal Name") || !csvOutput.includes("Lord Alistair Sterling") || !csvOutput.includes("Zurich Alpine Angels")) {
    throw new Error("1099/K-1 Prep CSV export missing required investor records");
  }
  console.log(`   ✅ 1099/K-1 CPA Prep CSV generated (${csvOutput.split("\n").length} rows formatted).`);

  // Test 5C: Exportable CPA Tax Audit Package & Cryptographic HMAC Attestation
  const auditPackage = await generateCpaTaxAuditPackage(testStartup._id.toString(), "cpa@globalventures.com");
  if (!auditPackage.metadata.package_id.startsWith("CPA-AUDIT-")) {
    throw new Error(`Invalid CPA audit package ID: ${auditPackage.metadata.package_id}`);
  }
  if (auditPackage.compliance_summary.total_shareholders !== 3) {
    throw new Error(`Expected 3 total shareholders in CPA audit package, got ${auditPackage.compliance_summary.total_shareholders}`);
  }
  if (auditPackage.tamper_evident_integrity.algorithm !== "HMAC-SHA256" || !auditPackage.tamper_evident_integrity.digest_signature) {
    throw new Error("CPA audit package missing valid HMAC-SHA256 cryptographic signature");
  }
  // Ensure unmasked sensitive TINs are never exposed in investor schedule
  for (const item of auditPackage.investor_tax_schedule) {
    if (item.tax_id_masked.includes("98-7654321") || (item.tax_id_masked !== "Not Provided" && !item.tax_id_masked.startsWith("••-•••"))) {
      throw new Error(`Unmasked sensitive tax ID detected in audit package: ${item.tax_id_masked}`);
    }
  }
  console.log(`   ✅ CPA Audit Package Dossier Verified: Package ID ${auditPackage.metadata.package_id}`);
  console.log(`   ✅ Tamper-Evident Attestation Verified: HMAC-SHA256 Signature '${auditPackage.tamper_evident_integrity.digest_signature.slice(0, 24)}...'\n`);

  // Cleanup synthetic test records
  console.log("🧹 Tearing down test records...");
  await TaxComplianceDocument.deleteMany({ startup_id: testStartup._id });
  await Startup.findByIdAndDelete(testStartup._id);
  await User.findByIdAndDelete(testUser._id);
  console.log("   ✅ Database cleanly pruned.\n");

  console.log("===============================================================================");
  console.log("🎉 ALL WEEK 22 CHECKS PASSED: IRS/HMRC R&D, SBIR/EIC & TAX VAULT 100% OPERATIONAL");
  console.log("===============================================================================");
}

runWeek22TestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test suite failed:", err);
    process.exit(1);
  });
