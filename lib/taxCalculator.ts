/**
 * Global R&D Tax Credit Calculation Engine
 * Formulated under:
 * - US Internal Revenue Code (IRC) Section 41, Section 3111(f) & Inflation Reduction Act ($500k QSB Payroll Offset)
 * - UK HM Revenue & Customs (HMRC) Post-April 2024 Merged R&D Scheme & Enhanced R&D Intensive Support (ERIS)
 */

export interface USCalculationInput {
  wages_qre: number;
  supplies_qre: number;
  contractor_qre: number;
  cloud_hosting_qre: number;
  gross_receipts?: number;
  years_with_revenue?: number;
  credit_rate_pct?: number; // default 10%
}

export interface USCalculationResult {
  eligible_wages: number;
  eligible_supplies: number;
  eligible_contractors: number; // 65% statutory limitation applied
  eligible_cloud: number;
  total_qre: number;
  is_qsb_eligible: boolean;
  qsb_ineligibility_reasons: string[];
  max_statutory_payroll_offset: number; // $500,000 statutory cap
  gross_credit_amount: number;
  payroll_offset_amount: number;
  quarterly_burn_reduction: number;
  effective_credit_rate_pct: number;
}

export interface UKCalculationInput {
  staff_costs: number;
  subcontractor_costs: number;
  consumables_software: number;
  total_company_expenditure: number;
  is_loss_making?: boolean;
}

export interface UKCalculationResult {
  qualifying_staff: number;
  qualifying_subcontractors: number; // 65% statutory cap
  qualifying_software: number;
  total_qualifying_expenditure: number;
  total_company_expenditure: number;
  rd_intensity_pct: number;
  is_eris_eligible: boolean; // R&D intensity >= 30% and loss-making
  scheme_applied: "ERIS" | "Merged";
  effective_benefit_pct: number; // 26.97% for ERIS, 15.0% for Merged
  payable_tax_credit_amount: number; // Cash refund from HMRC
  explanation: string;
}

/**
 * Calculates US Federal R&D Tax Credit & QSB Payroll Tax Offset
 */
export function calculateUSResearchCredit(input: USCalculationInput): USCalculationResult {
  const wages = Math.max(0, Number(input.wages_qre) || 0);
  const supplies = Math.max(0, Number(input.supplies_qre) || 0);
  const rawContractors = Math.max(0, Number(input.contractor_qre) || 0);
  const cloud = Math.max(0, Number(input.cloud_hosting_qre) || 0);
  const grossReceipts = Math.max(0, Number(input.gross_receipts) || 0);
  const yearsWithRevenue = Math.max(1, Number(input.years_with_revenue) || 1);
  const creditRate = Math.min(20, Math.max(1, Number(input.credit_rate_pct) || 10));

  // IRC § 41(b)(3): 65% haircut on contractor research expenses
  const eligibleContractors = Math.round(rawContractors * 0.65 * 100) / 100;

  const totalQRE = Math.round((wages + supplies + eligibleContractors + cloud) * 100) / 100;

  // Qualified Small Business (QSB) Test for Payroll Tax Offset (Form 8974):
  // 1. Gross receipts for the tax year must be less than $5,000,000
  // 2. No gross receipts for any tax year before the 5-tax-year period ending with the tax year
  const ineligibilityReasons: string[] = [];
  if (grossReceipts >= 5000000) {
    ineligibilityReasons.push("Gross receipts exceed the $5,000,000 threshold for Qualified Small Businesses.");
  }
  if (yearsWithRevenue > 5) {
    ineligibilityReasons.push("Company has generated commercial revenue for more than 5 consecutive tax years.");
  }

  const isQSb = ineligibilityReasons.length === 0;

  // Gross credit calculated at effective ASC or regular rate
  const grossCredit = Math.round((totalQRE * (creditRate / 100)) * 100) / 100;

  // Inflation Reduction Act (IRA) statutory payroll tax offset cap: $500,000 / year
  const STATUTORY_PAYROLL_CAP = 500000;
  const payrollOffset = isQSb ? Math.min(grossCredit, STATUTORY_PAYROLL_CAP) : 0;
  const quarterlyBurnReduction = Math.round((payrollOffset / 4) * 100) / 100;

  return {
    eligible_wages: wages,
    eligible_supplies: supplies,
    eligible_contractors: eligibleContractors,
    eligible_cloud: cloud,
    total_qre: totalQRE,
    is_qsb_eligible: isQSb,
    qsb_ineligibility_reasons: ineligibilityReasons,
    max_statutory_payroll_offset: STATUTORY_PAYROLL_CAP,
    gross_credit_amount: grossCredit,
    payroll_offset_amount: payrollOffset,
    quarterly_burn_reduction: quarterlyBurnReduction,
    effective_credit_rate_pct: creditRate,
  };
}

/**
 * Calculates UK HMRC R&D Tax Relief under post-April 2024 rules (ERIS vs Merged Scheme)
 */
export function calculateUKResearchCredit(input: UKCalculationInput): UKCalculationResult {
  const staff = Math.max(0, Number(input.staff_costs) || 0);
  const rawSubcontractors = Math.max(0, Number(input.subcontractor_costs) || 0);
  const software = Math.max(0, Number(input.consumables_software) || 0);
  const totalCompanySpend = Math.max(0, Number(input.total_company_expenditure) || 0);
  const isLossMaking = input.is_loss_making !== false;

  // HMRC statutory 65% qualifying rate for standard externally provided workers & subcontractors
  const qualifyingSubcontractors = Math.round(rawSubcontractors * 0.65 * 100) / 100;

  const totalQRE = Math.round((staff + qualifyingSubcontractors + software) * 100) / 100;

  // R&D Intensity calculation: R&D Expenditure / Total Expenditure
  // Starting April 2024, the threshold for Enhanced R&D Intensive Support (ERIS) is 30%
  const effectiveTotalSpend = Math.max(totalCompanySpend, totalQRE);
  const rdIntensity = effectiveTotalSpend > 0 ? (totalQRE / effectiveTotalSpend) * 100 : 0;
  const isErisEligible = rdIntensity >= 30 && isLossMaking;

  let schemeApplied: "ERIS" | "Merged" = "Merged";
  let effectiveBenefitPct = 15.0; // Standard Merged RDEC net benefit (20% gross - 25% CT = 15% net)
  let payableAmount = 0;
  let explanation = "";

  if (isErisEligible) {
    schemeApplied = "ERIS";
    // ERIS calculation: 86% enhancement on 100% cost = 186% total relief.
    // 14.5% cash surrender rate: 186% * 14.5% = 26.97% net cash refund.
    effectiveBenefitPct = 26.97;
    payableAmount = Math.round((totalQRE * 0.2697) * 100) / 100;
    explanation = `Qualified for Enhanced R&D Intensive Support (ERIS) with ${rdIntensity.toFixed(1)}% R&D intensity (threshold ≥30%). Net cash refund payable by HMRC is 26.97% of qualifying expenditure.`;
  } else {
    schemeApplied = "Merged";
    // Merged Scheme: 20% taxable credit, net cash value 15.0% after 25% main rate corporation tax.
    effectiveBenefitPct = 15.0;
    payableAmount = Math.round((totalQRE * 0.15) * 100) / 100;
    explanation = isLossMaking
      ? `Subject to HMRC Merged R&D Scheme (R&D intensity was ${rdIntensity.toFixed(1)}%, below the 30% ERIS threshold). Net payable tax benefit is 15.0% of qualifying expenditure.`
      : `Subject to HMRC Merged R&D Scheme as a profitable entity. Tax credit reduces corporation tax liability by 15.0% net.`;
  }

  return {
    qualifying_staff: staff,
    qualifying_subcontractors: qualifyingSubcontractors,
    qualifying_software: software,
    total_qualifying_expenditure: totalQRE,
    total_company_expenditure: effectiveTotalSpend,
    rd_intensity_pct: Math.round(rdIntensity * 10) / 10,
    is_eris_eligible: isErisEligible,
    scheme_applied: schemeApplied,
    effective_benefit_pct: effectiveBenefitPct,
    payable_tax_credit_amount: payableAmount,
    explanation,
  };
}
