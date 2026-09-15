"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Calculator,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Clock,
  Download,
  ArrowRight,
  ShieldCheck,
  CircleNotch,
} from "@phosphor-icons/react";
import {
  calculateUSResearchCredit,
  calculateUKResearchCredit,
  USCalculationResult,
  UKCalculationResult,
} from "@/lib/taxCalculator";

interface RDCalculatorProps {
  startupId: string;
  token: string;
  companyName?: string;
}

export default function RDCalculator({ startupId, token, companyName = "Enterprise" }: RDCalculatorProps) {
  const [country, setCountry] = useState<"US" | "UK">("US");
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  // US Inputs
  const [usWages, setUsWages] = useState<number>(380000);
  const [usSupplies, setUsSupplies] = useState<number>(25000);
  const [usContractors, setUsContractors] = useState<number>(140000);
  const [usCloud, setUsCloud] = useState<number>(65000);
  const [usGrossReceipts, setUsGrossReceipts] = useState<number>(600000);
  const [usYearsRevenue, setUsYearsRevenue] = useState<number>(2);

  // UK Inputs
  const [ukStaff, setUkStaff] = useState<number>(320000);
  const [ukSubcontractors, setUkSubcontractors] = useState<number>(110000);
  const [ukSoftware, setUkSoftware] = useState<number>(45000);
  const [ukTotalSpend, setUkTotalSpend] = useState<number>(580000);
  const [ukIsLossMaking, setUkIsLossMaking] = useState<boolean>(true);

  // Live Instant Reactive Calculations
  const usResult: USCalculationResult = useMemo(() => {
    return calculateUSResearchCredit({
      wages_qre: usWages,
      supplies_qre: usSupplies,
      contractor_qre: usContractors,
      cloud_hosting_qre: usCloud,
      gross_receipts: usGrossReceipts,
      years_with_revenue: usYearsRevenue,
      credit_rate_pct: 10,
    });
  }, [usWages, usSupplies, usContractors, usCloud, usGrossReceipts, usYearsRevenue]);

  const ukResult: UKCalculationResult = useMemo(() => {
    return calculateUKResearchCredit({
      staff_costs: ukStaff,
      subcontractor_costs: ukSubcontractors,
      consumables_software: ukSoftware,
      total_company_expenditure: ukTotalSpend,
      is_loss_making: ukIsLossMaking,
    });
  }, [ukStaff, ukSubcontractors, ukSoftware, ukTotalSpend, ukIsLossMaking]);

  // Load existing saved claim on mount
  useEffect(() => {
    if (startupId && token) {
      fetchExistingClaim();
    }
  }, [startupId, token, country, taxYear]);

  const fetchExistingClaim = async () => {
    try {
      const res = await fetch(
        `/api/compliance/rd-calculator?startup_id=${startupId}&country=${country}&tax_year=${taxYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.claims && data.claims.length > 0) {
          const claim = data.claims[0];
          if (country === "US" && claim.us_details) {
            setUsWages(claim.us_details.wages_qre || 380000);
            setUsSupplies(claim.us_details.supplies_qre || 25000);
            setUsContractors(claim.us_details.contractor_qre || 140000);
            setUsCloud(claim.us_details.cloud_hosting_qre || 65000);
            setUsGrossReceipts(claim.us_details.gross_receipts || 600000);
            setUsYearsRevenue(claim.us_details.years_with_revenue || 2);
          } else if (country === "UK" && claim.uk_details) {
            setUkStaff(claim.uk_details.staff_costs || 320000);
            setUkSubcontractors(claim.uk_details.subcontractor_costs || 110000);
            setUkSoftware(claim.uk_details.consumables_software || 45000);
            setUkTotalSpend(claim.uk_details.total_company_expenditure || 580000);
            setUkIsLossMaking(claim.uk_details.is_loss_making !== false);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load saved R&D tax claim:", e);
    }
  };

  const handleSaveClaim = async () => {
    if (!startupId) {
      toast.error("No active startup selected");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        startup_id: startupId,
        country,
        tax_year: taxYear,
        us_input: country === "US" ? {
          wages_qre: usWages,
          supplies_qre: usSupplies,
          contractor_qre: usContractors,
          cloud_hosting_qre: usCloud,
          gross_receipts: usGrossReceipts,
          years_with_revenue: usYearsRevenue,
          credit_rate_pct: 10,
        } : undefined,
        uk_input: country === "UK" ? {
          staff_costs: ukStaff,
          subcontractor_costs: ukSubcontractors,
          consumables_software: ukSoftware,
          total_company_expenditure: ukTotalSpend,
          is_loss_making: ukIsLossMaking,
        } : undefined,
      };

      const res = await fetch("/api/compliance/rd-calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`${country} R&D Tax Credit Claim estimate saved successfully.`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save R&D claim");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error connecting to tax calculator service");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDossier = () => {
    const isUS = country === "US";
    const title = `${companyName} ${country} R&D Tax Credit Study ${taxYear}`;
    const content = isUS
      ? `# ${title}
Generated under IRS IRC Section 41 & Section 3111(f) Guidelines

## 1. Executive Summary
- **Qualified Research Expenses (QRE):** $${usResult.total_qre.toLocaleString()} USD
- **Total Gross Research Credit (10%):** $${usResult.gross_credit_amount.toLocaleString()} USD
- **Qualified Small Business (QSB) Status:** ${usResult.is_qsb_eligible ? "ELIGIBLE" : "INELIGIBLE"}
- **Applicable Annual Payroll Tax Offset:** $${usResult.payroll_offset_amount.toLocaleString()} USD
- **Quarterly FICA Cash Burn Reduction:** $${usResult.quarterly_burn_reduction.toLocaleString()} USD/quarter

## 2. Qualifying Expense Breakdown
- **Technical Engineering Wages (100%):** $${usResult.eligible_wages.toLocaleString()} USD
- **Contractor Research (65% Haircut Applied):** $${usResult.eligible_contractors.toLocaleString()} USD (from $${usContractors.toLocaleString()} gross)
- **Supplies & Materials (100%):** $${usResult.eligible_supplies.toLocaleString()} USD
- **Cloud Hosting & Software Leasing (100%):** $${usResult.eligible_cloud.toLocaleString()} USD

## 3. Statutory Criteria
- **Gross Receipts Reported:** $${usGrossReceipts.toLocaleString()} USD (Limit: $5,000,000)
- **Years with Gross Receipts:** ${usYearsRevenue} Years (Limit: 5 Years)
- **Statutory Annual Payroll Offset Ceiling:** $500,000 USD (Form 8974 / Form 6765)`
      : `# ${title}
Generated under UK HMRC Post-April 2024 Guidelines

## 1. Executive Summary
- **Total Qualifying R&D Expenditure (QRE):** £${ukResult.total_qualifying_expenditure.toLocaleString()} GBP
- **Total Company Expenditure:** £${ukResult.total_company_expenditure.toLocaleString()} GBP
- **R&D Intensity Ratio:** ${ukResult.rd_intensity_pct}% (Threshold: 30%)
- **Scheme Applied:** ${ukResult.scheme_applied} (${ukResult.is_eris_eligible ? "Enhanced R&D Intensive Support" : "Merged Scheme"})
- **Net Cash Payable from HMRC:** £${ukResult.payable_tax_credit_amount.toLocaleString()} GBP (${ukResult.effective_benefit_pct}%)

## 2. Qualifying Cost Breakdown
- **Qualifying Staff Costs (100%):** £${ukResult.qualifying_staff.toLocaleString()} GBP
- **Qualifying Subcontractors (65% Statutory Rate):** £${ukResult.qualifying_subcontractors.toLocaleString()} GBP (from £${ukSubcontractors.toLocaleString()} gross)
- **Qualifying Software & Cloud Licenses:** £${ukResult.qualifying_software.toLocaleString()} GBP

## 3. Scheme Analysis
${ukResult.explanation}`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rd_tax_credit_dossier_${country.toLowerCase()}_${taxYear}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("R&D Tax Study Dossier exported!");
  };

  return (
    <div className="space-y-8">
      {/* Top Controller Bar (Apple Segmented Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" weight="bold" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              R&D Tax Credit Estimation Engine
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Calculate non-dilutive payroll tax offsets (US) and cash refunds (UK).
            </p>
          </div>
        </div>

        {/* Segmented Region Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-black/5 dark:border-white/5 shrink-0">
            <button
              onClick={() => setCountry("US")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap ${
                country === "US"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              <span>🇺🇸 United States</span>
              <span className="text-[10px] font-mono opacity-70">Sec 41</span>
            </button>
            <button
              onClick={() => setCountry("UK")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap ${
                country === "UK"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              <span>🇬🇧 United Kingdom</span>
              <span className="text-[10px] font-mono opacity-70">HMRC ERIS</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 shrink-0">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Tax Year:</span>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-white dark:bg-zinc-900">2026</option>
              <option value={2025} className="bg-white dark:bg-zinc-900">2025</option>
              <option value={2024} className="bg-white dark:bg-zinc-900">2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) and Live Metrics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Column */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                {country === "US" ? "Qualifying Research Expenses (IRS § 41)" : "Qualifying R&D Expenditures (HMRC)"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Adjust technical expenditure parameters to recalculate offsets instantly.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
              {country === "US" ? "USD ($)" : "GBP (£)"}
            </span>
          </div>

          {country === "US" ? (
            /* US Form Inputs */
            <div className="space-y-5">
              {/* Technical Wages */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>W-2 Technical Engineering Wages (100% Eligible)</span>
                  <span className="font-mono font-bold">${usWages.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000000}
                  step={10000}
                  value={usWages}
                  onChange={(e) => setUsWages(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Contractors */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>US-Based 1099 Contractors (65% Statutory Limit)</span>
                  <span className="font-mono font-bold">
                    ${usContractors.toLocaleString()} <span className="text-[10px] text-zinc-400 font-normal">(${usResult.eligible_contractors.toLocaleString()} eligible)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={800000}
                  step={5000}
                  value={usContractors}
                  onChange={(e) => setUsContractors(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Cloud Compute */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>R&D Cloud Compute & Software Leasing (AWS/GCP/Azure)</span>
                  <span className="font-mono font-bold">${usCloud.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={400000}
                  step={5000}
                  value={usCloud}
                  onChange={(e) => setUsCloud(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Supplies */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Physical Supplies & Testing Hardware</span>
                  <span className="font-mono font-bold">${usSupplies.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={2500}
                  value={usSupplies}
                  onChange={(e) => setUsSupplies(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                    Gross Commercial Receipts ($5M QSB Cap)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-zinc-400">$</span>
                    <input
                      type="number"
                      value={usGrossReceipts}
                      onChange={(e) => setUsGrossReceipts(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                    Years with Commercial Revenue (Max 5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={usYearsRevenue}
                    onChange={(e) => setUsYearsRevenue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* UK Form Inputs */
            <div className="space-y-5">
              {/* Technical Staff */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Qualifying R&D Staff Costs (100% Eligible)</span>
                  <span className="font-mono font-bold">£{ukStaff.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000000}
                  step={10000}
                  value={ukStaff}
                  onChange={(e) => setUkStaff(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Subcontractors */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Subcontractors & External Workers (65% Qualifying)</span>
                  <span className="font-mono font-bold">
                    £{ukSubcontractors.toLocaleString()} <span className="text-[10px] text-zinc-400 font-normal">(£{ukResult.qualifying_subcontractors.toLocaleString()} qualifying)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={600000}
                  step={5000}
                  value={ukSubcontractors}
                  onChange={(e) => setUkSubcontractors(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Consumables & Software */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Software, Cloud & Consumables (100%)</span>
                  <span className="font-mono font-bold">£{ukSoftware.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300000}
                  step={2500}
                  value={ukSoftware}
                  onChange={(e) => setUkSoftware(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Total Company Spend */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Total Company Operating Expenditure (Determines 30% ERIS Ratio)</span>
                  <span className="font-mono font-bold">£{ukTotalSpend.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(100000, ukResult.total_qualifying_expenditure)}
                  max={3000000}
                  step={20000}
                  value={ukTotalSpend}
                  onChange={(e) => setUkTotalSpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">Loss-Making SME Status</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Loss-making R&D intensive SMEs surrender tax losses for direct HMRC cash payments.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUkIsLossMaking(!ukIsLossMaking)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    ukIsLossMaking ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <div
                    className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      ukIsLossMaking ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleExportDossier}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export R&D Study Dossier
            </button>

            <button
              onClick={handleSaveClaim}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {saving ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" weight="bold" />}
              Save Claim Estimate
            </button>
          </div>
        </div>

        {/* Live Calculation Output Column */}
        <div className="lg:col-span-5 space-y-4">
          {country === "US" ? (
            /* US Results Card */
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Estimated Federal Benefit (Tax Year {taxYear})
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                    ${usResult.payroll_offset_amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase">Payroll Offset</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Reduces employer FICA (Social Security & Medicare) tax liability without taxable income.
                </p>
              </div>

              {/* Metric Pill Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">Total QRE</span>
                  <span className="text-base font-black text-zinc-900 dark:text-white block mt-0.5">
                    ${usResult.total_qre.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Eligible Research Spend</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">Quarterly Relief</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    ${usResult.quarterly_burn_reduction.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Cash Burn Offset</span>
                </div>
              </div>

              {/* QSB Eligibility Status */}
              <div className={`p-4 rounded-2xl border ${
                usResult.is_qsb_eligible
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-300"
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {usResult.is_qsb_eligible ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" weight="fill" />
                  ) : (
                    <Warning className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" weight="fill" />
                  )}
                  <span>
                    {usResult.is_qsb_eligible
                      ? "Qualified Small Business (QSB) Verified"
                      : "Standard Income Tax Credit Only (Non-QSB)"}
                  </span>
                </div>
                <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                  {usResult.is_qsb_eligible
                    ? "Your startup qualifies for the $500,000 payroll tax offset under Section 3111(f). File IRS Form 8974 alongside Form 941 to claim quarterly credits."
                    : usResult.qsb_ineligibility_reasons.join(" ")}
                </p>
              </div>

              {/* Statutory Ceiling Callout */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  The Inflation Reduction Act raised the statutory payroll offset cap to <strong>$500,000 per year</strong> for up to 5 consecutive tax years.
                </span>
              </div>
            </div>
          ) : (
            /* UK Results Card */
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Payable Cash Refund from HMRC
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                    £{ukResult.payable_tax_credit_amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase">{ukResult.effective_benefit_pct}% Net</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Cash payout disbursed directly into your business bank account post-filing.
                </p>
              </div>

              {/* Metric Pill Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">Qualifying Spend</span>
                  <span className="text-base font-black text-zinc-900 dark:text-white block mt-0.5">
                    £{ukResult.total_qualifying_expenditure.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Total QRE</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">R&D Intensity</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {ukResult.rd_intensity_pct}%
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Threshold: ≥30% ERIS</span>
                </div>
              </div>

              {/* Scheme Status */}
              <div className={`p-4 rounded-2xl border ${
                ukResult.is_eris_eligible
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                  : "bg-blue-500/5 border-blue-500/20 text-blue-900 dark:text-blue-300"
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" weight="fill" />
                  <span>
                    {ukResult.is_eris_eligible
                      ? "Enhanced R&D Intensive Support (ERIS) Approved"
                      : "HMRC Merged R&D Scheme (RDEC Style)"}
                  </span>
                </div>
                <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                  {ukResult.explanation}
                </p>
              </div>

              {/* Post-April 2024 Guidance */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Under HMRC's April 2024 reform, R&D intensity threshold was lowered from 40% to <strong>30%</strong>, qualifying loss-making tech startups for the enhanced 26.97% cash surrender rate.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
