import { computeActivityEmissions } from './compute';
import { getFactor } from './factors';
import type { Activity, Adjustment, SimulationResult } from './types';

/**
 * The what-if engine. Given baseline activities and a set of adjustments,
 * returns the before/after totals and the delta.
 *
 * Adjustment semantics:
 *  - `scale` multiplies the matched activity's amount (1 = unchanged,
 *    0.8 = cut 20%, 0 = eliminate). Defaults to 1.
 *  - `swapToFactorId` redirects the removed portion `amount * (1 - scale)`
 *    onto another factor (e.g. the car km you stop driving becomes metro km).
 *
 * Pure: no clock, no I/O. The same inputs always yield the same output, which
 * is what lets the client run it live on every slider drag.
 */
export function simulate(
  baseline: Activity[],
  adjustments: Adjustment[],
): SimulationResult {
  // Last adjustment for a given factor wins, so the simulator UI can keep one
  // control per factor without worrying about ordering.
  const byFactor = new Map<string, Adjustment>();
  for (const adj of adjustments) {
    byFactor.set(adj.factorId, adj);
  }

  let before = 0;
  let after = 0;

  for (const activity of baseline) {
    const baseEmissions = computeActivityEmissions(activity).kgCO2e;
    before += baseEmissions;

    const adj = byFactor.get(activity.factorId);
    if (!adj) {
      after += baseEmissions;
      continue;
    }

    const scale = adj.scale ?? 1;
    if (!Number.isFinite(scale) || scale < 0) {
      throw new Error(`Adjustment scale must be a non-negative number, got ${scale}`);
    }

    const keptAmount = activity.amount * scale;
    after += computeActivityEmissions({
      factorId: activity.factorId,
      amount: keptAmount,
    }).kgCO2e;

    if (adj.swapToFactorId) {
      const swapFactor = getFactor(adj.swapToFactorId);
      const movedAmount = activity.amount * (1 - scale);
      after += movedAmount * swapFactor.kgCO2ePerUnit;
    }
  }

  const deltaKg = after - before;
  const deltaPct = before === 0 ? 0 : (deltaKg / before) * 100;

  return { before, after, deltaKg, deltaPct };
}
