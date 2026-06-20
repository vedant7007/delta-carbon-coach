import { computeActivityEmissions } from './compute';
import { getFactor } from './factors';
import type { Activity, Adjustment, SimulationResult } from './types';

const NO_CHANGE_SCALE = 1;
const PERCENT = 100;

/**
 * Emissions (kg CO₂e) for one activity after applying an adjustment: the kept
 * portion (`amount × scale`) plus, if swapping, the removed portion redirected
 * onto the swap factor.
 *
 * @param activity - The baseline activity.
 * @param adj - The adjustment to apply.
 * @returns The activity's post-adjustment emissions in kg CO₂e.
 * @throws If `scale` is negative or non-finite.
 */
function adjustedEmissions(activity: Activity, adj: Adjustment): number {
  const scale = adj.scale ?? NO_CHANGE_SCALE;
  if (!Number.isFinite(scale) || scale < 0) {
    throw new Error(`Adjustment scale must be a non-negative number, got ${scale}`);
  }

  const keptAmount = activity.amount * scale;
  let kg = computeActivityEmissions({ factorId: activity.factorId, amount: keptAmount }).kgCO2e;

  if (adj.swapToFactorId) {
    const movedAmount = activity.amount * (NO_CHANGE_SCALE - scale);
    kg += movedAmount * getFactor(adj.swapToFactorId).kgCO2ePerUnit;
  }
  return kg;
}

/**
 * The what-if engine: given baseline activities and adjustments, returns the
 * before/after totals and the delta.
 *
 * Adjustment semantics — `scale` multiplies the matched activity's amount
 * (1 = unchanged, 0.8 = cut 20%, 0 = eliminate; default 1); `swapToFactorId`
 * redirects the removed portion onto another factor (the car km you stop
 * driving becomes metro km).
 *
 * Pure: no clock, no I/O — identical inputs always yield identical output, which
 * is what lets the client run it live on every slider drag.
 *
 * @param baseline - The user's current activities.
 * @param adjustments - Changes to apply; the last adjustment per factor wins.
 * @returns `before`/`after` totals (kg CO₂e), `deltaKg`, and `deltaPct` (negative = a saving).
 */
export function simulate(baseline: Activity[], adjustments: Adjustment[]): SimulationResult {
  // Last adjustment per factor wins, so the UI can keep one control per factor.
  const byFactor = new Map<string, Adjustment>();
  for (const adj of adjustments) {
    byFactor.set(adj.factorId, adj);
  }

  let before = 0;
  let after = 0;
  for (const activity of baseline) {
    before += computeActivityEmissions(activity).kgCO2e;
    const adj = byFactor.get(activity.factorId);
    after += adj ? adjustedEmissions(activity, adj) : computeActivityEmissions(activity).kgCO2e;
  }

  const deltaKg = after - before;
  const deltaPct = before === 0 ? 0 : (deltaKg / before) * PERCENT;
  return { before, after, deltaKg, deltaPct };
}
