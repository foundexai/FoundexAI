export interface ShareholderInput {
  _id?: string;
  shareholder_name: string;
  shareholder_type: "founder" | "investor" | "employee" | "advisor";
  share_class: string;
  share_count: number;
  investment_amount: number;
}

export interface WaterfallOptions {
  exitValuation: number; // Exit sale price in USD
  liquidationMultiple?: number; // e.g. 1.0x or 2.0x
  newInvestment?: number; // Future investment round amount ($)
  preMoneyValuation?: number; // Future investment pre-money valuation ($)
  newOptionPoolPct?: number; // ESOP expansion % (e.g., 10%)
}

export interface ShareholderWaterfallResult {
  _id?: string;
  shareholder_name: string;
  shareholder_type: string;
  share_class: string;
  initial_shares: number;
  diluted_shares: number;
  initial_ownership_pct: number;
  effective_ownership_pct: number;
  investment_amount: number;
  preference_payout: number;
  common_payout: number;
  total_exit_payout: number;
  moic: number; // Return multiple (x)
}

export interface WaterfallSimulationOutput {
  exitValuation: number;
  liquidationMultiple: number;
  totalIssuedShares: number;
  dilutedTotalShares: number;
  totalPreferredPreferencePaid: number;
  totalCommonProceedsPaid: number;
  founderTotalPayout: number;
  investorTotalPayout: number;
  investorAverageMoic: number;
  shareholders: ShareholderWaterfallResult[];
  dilutionSummary?: {
    newCapitalRaised: number;
    preMoneyValuation: number;
    postMoneyValuation: number;
    newInvestorOwnershipPct: number;
    dilutionFactor: number;
  };
}

export function runWaterfallSimulation(
  shareholders: ShareholderInput[],
  options: WaterfallOptions
): WaterfallSimulationOutput {
  const {
    exitValuation = 10000000,
    liquidationMultiple = 1.0,
    newInvestment = 0,
    preMoneyValuation = 0,
    newOptionPoolPct = 0,
  } = options;

  const totalIssuedShares = shareholders.reduce((sum, s) => sum + (s.share_count || 0), 0);

  // 1. Dilution Factor calculation if future round is modeled
  let dilutionFactor = 1.0;
  let newInvestorOwnershipPct = 0;
  let postMoneyValuation = 0;

  if (newInvestment > 0 && preMoneyValuation > 0) {
    postMoneyValuation = preMoneyValuation + newInvestment;
    newInvestorOwnershipPct = newInvestment / postMoneyValuation;
    const esopDilution = (newOptionPoolPct || 0) / 100;
    dilutionFactor = Math.max(0, 1 - newInvestorOwnershipPct - esopDilution);
  }

  // 2. Identify Preferred vs Common Holders
  const isPreferredClass = (shareClass: string) => {
    return (
      shareClass.includes("Preferred") ||
      shareClass.includes("SAFE") ||
      shareClass.includes("Convertible")
    );
  };

  // Calculate liquidation preferences for preferred entries
  let totalLiquidationPreferenceClaims = 0;
  const preferencesMap = new Map<string, number>();

  shareholders.forEach((s, idx) => {
    const key = s._id || `${s.shareholder_name}_${idx}`;
    if (isPreferredClass(s.share_class)) {
      const claim = (s.investment_amount || 0) * liquidationMultiple;
      preferencesMap.set(key, claim);
      totalLiquidationPreferenceClaims += claim;
    } else {
      preferencesMap.set(key, 0);
    }
  });

  // 3. Step 1: Liquidation Preference Payout
  let preferredPayoutPool = 0;
  let remainingExitPool = 0;

  if (exitValuation <= totalLiquidationPreferenceClaims) {
    // Exit price is lower than total preference claims -> Preferred gets 100% of proceeds pro-rata
    preferredPayoutPool = exitValuation;
    remainingExitPool = 0;
  } else {
    // Preferred claims satisfied in full; rest goes to Common pool
    preferredPayoutPool = totalLiquidationPreferenceClaims;
    remainingExitPool = exitValuation - totalLiquidationPreferenceClaims;
  }

  // 4. Step 2: Pro-Rata Common Distribution
  let totalFounderPayout = 0;
  let totalInvestorPayout = 0;
  let totalInvestorInvested = 0;

  const results: ShareholderWaterfallResult[] = shareholders.map((s, idx) => {
    const key = s._id || `${s.shareholder_name}_${idx}`;
    const initialShares = s.share_count || 0;
    const initialPct = totalIssuedShares > 0 ? (initialShares / totalIssuedShares) * 100 : 0;

    // Apply dilution factor to effective ownership
    const effectivePct = initialPct * dilutionFactor;
    const dilutedShares = Math.round(initialShares * dilutionFactor);

    // Preference payout logic
    let prefPayout = 0;
    if (isPreferredClass(s.share_class)) {
      const claim = preferencesMap.get(key) || 0;
      if (totalLiquidationPreferenceClaims > 0) {
        prefPayout = (claim / totalLiquidationPreferenceClaims) * preferredPayoutPool;
      }
    }

    // Common pro-rata payout logic
    let commonPayout = 0;
    if (remainingExitPool > 0 && totalIssuedShares > 0) {
      commonPayout = (initialShares / totalIssuedShares) * remainingExitPool;
    }

    const totalExitPayout = prefPayout + commonPayout;
    const moic =
      s.investment_amount && s.investment_amount > 0
        ? Number((totalExitPayout / s.investment_amount).toFixed(2))
        : 0;

    if (s.shareholder_type === "founder") {
      totalFounderPayout += totalExitPayout;
    } else if (s.shareholder_type === "investor") {
      totalInvestorPayout += totalExitPayout;
      totalInvestorInvested += s.investment_amount || 0;
    }

    return {
      _id: s._id,
      shareholder_name: s.shareholder_name,
      shareholder_type: s.shareholder_type,
      share_class: s.share_class,
      initial_shares: initialShares,
      diluted_shares: dilutedShares,
      initial_ownership_pct: Number(initialPct.toFixed(2)),
      effective_ownership_pct: Number(effectivePct.toFixed(2)),
      investment_amount: s.investment_amount || 0,
      preference_payout: Math.round(prefPayout),
      common_payout: Math.round(commonPayout),
      total_exit_payout: Math.round(totalExitPayout),
      moic,
    };
  });

  const investorAverageMoic =
    totalInvestorInvested > 0 ? Number((totalInvestorPayout / totalInvestorInvested).toFixed(2)) : 0;

  return {
    exitValuation,
    liquidationMultiple,
    totalIssuedShares,
    dilutedTotalShares: Math.round(totalIssuedShares * dilutionFactor),
    totalPreferredPreferencePaid: Math.round(preferredPayoutPool),
    totalCommonProceedsPaid: Math.round(remainingExitPool),
    founderTotalPayout: Math.round(totalFounderPayout),
    investorTotalPayout: Math.round(totalInvestorPayout),
    investorAverageMoic,
    shareholders: results,
    dilutionSummary:
      newInvestment > 0
        ? {
            newCapitalRaised: newInvestment,
            preMoneyValuation,
            postMoneyValuation,
            newInvestorOwnershipPct: Number((newInvestorOwnershipPct * 100).toFixed(2)),
            dilutionFactor: Number(dilutionFactor.toFixed(4)),
          }
        : undefined,
  };
}
