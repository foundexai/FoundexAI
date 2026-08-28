import InvestorUpdate from "./models/InvestorUpdate";
import Startup from "./models/Startup";
import { eventBus } from "./eventBus";

/**
 * Cash Runway Burn Rate Anomaly Detection Service
 * Analyzes startup metrics changes or historical updates to find implied burn rate surges or runway drops.
 */
export async function checkStartupAnomaly(startupId: string) {
  try {
    const startup = await Startup.findById(startupId);
    if (!startup) return null;

    // Fetch the two latest investor updates to perform month-over-month (MoM) calculations
    const updates = await InvestorUpdate.find({ startup_id: startup._id }).sort({ month: -1 }).limit(2);

    if (updates.length >= 2) {
      const latest = updates[0];
      const prev = updates[1];

      // Calculate implied monthly burn rate = cash / runway
      const burnLatest = latest.metrics.runway_months > 0 
        ? (latest.metrics.cash_in_bank / latest.metrics.runway_months) 
        : 0;

      const burnPrev = prev.metrics.runway_months > 0 
        ? (prev.metrics.cash_in_bank / prev.metrics.runway_months) 
        : 0;

      // Check if implied monthly burn rate surged by >= 50% MoM
      if (burnPrev > 0) {
        const percentageIncrease = (burnLatest - burnPrev) / burnPrev;
        if (percentageIncrease >= 0.50) {
          // Fire the anomaly event via eventBus
          eventBus.safeEmit("anomaly:surged", {
            startupId: startup._id.toString(),
            startupName: startup.company_name,
            userId: startup.user_id,
            burnLatest,
            burnPrev,
            runwayLatest: latest.metrics.runway_months,
            percentageIncrease: Math.round(percentageIncrease * 100)
          });
          return { type: "burn_rate_surge", percentageIncrease };
        }
      }
    }

    // Fallback static runway check: if the startup cash Runway is low (< 6 months)
    const currentBurn = startup.monthly_burn || 0;
    const currentCash = startup.cash_on_hand || 0;
    const runway = currentBurn > 0 ? (currentCash / currentBurn) : 999;
    
    if (runway < 6 && currentBurn > 0 && startup.user_id) {
      eventBus.safeEmit("anomaly:surged", {
        startupId: startup._id.toString(),
        startupName: startup.company_name,
        userId: startup.user_id,
        burnLatest: currentBurn,
        burnPrev: currentBurn, // no comparison baseline for MoM
        runwayLatest: Math.round(runway),
        percentageIncrease: 0,
        lowRunwayOnly: true
      });
      return { type: "low_runway_warning" };
    }

    return null;
  } catch (err) {
    console.error("[AnomalyService] Error analyzing runway metrics:", err);
    return null;
  }
}
