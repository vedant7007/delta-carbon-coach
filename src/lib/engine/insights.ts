import { projectAnnual, roundForDisplay } from './compute';
import { getFactor, SWAP_CATALOG } from './factors';
import { simulate } from './simulate';
import type {
  Activity,
  Adjustment,
  Period,
  RankedAction,
  SwapDefinition,
} from './types';

const DEFAULT_LIMIT = 3;

/**
 * Ranks the highest-leverage actions for THIS user, from THEIR logged data.
 *
 * For each applicable swap we compute the annualised kg CO₂e saved by applying
 * it to the user's matching activities, then return the top `limit` sorted
 * descending. Swaps that don't apply (no matching activity) or don't save
 * anything are dropped — we never invent a recommendation the data can't back.
 */
export function rankMarginalImpact(
  activities: Activity[],
  period: Period,
  swapCatalog: readonly SwapDefinition[] = SWAP_CATALOG,
  limit: number = DEFAULT_LIMIT,
): RankedAction[] {
  const ranked: RankedAction[] = [];

  for (const swap of swapCatalog) {
    const matching = activities.filter((a) => a.factorId === swap.fromFactorId);
    if (matching.length === 0) continue;

    const adjustment: Adjustment = {
      factorId: swap.fromFactorId,
      scale: 1 - swap.fraction,
      ...(swap.toFactorId ? { swapToFactorId: swap.toFactorId } : {}),
    };

    const { deltaKg } = simulate(matching, [adjustment]);
    const periodSaving = -deltaKg; // negative delta is a saving
    if (periodSaving <= 0) continue;

    const annualKgSaved = projectAnnual(periodSaving, period);

    ranked.push({
      id: swap.id,
      title: swap.title,
      description: describeSwap(swap, annualKgSaved),
      annualKgSaved,
      category: swap.category,
      sourceFactorIds: swap.toFactorId
        ? [swap.fromFactorId, swap.toFactorId]
        : [swap.fromFactorId],
      adjustments: [adjustment],
    });
  }

  ranked.sort((a, b) => b.annualKgSaved - a.annualKgSaved);
  return ranked.slice(0, limit);
}

/** Deterministic, non-preachy phrasing. The AI may later re-phrase this; the number never changes. */
function describeSwap(swap: SwapDefinition, annualKgSaved: number): string {
  const amount = `${roundForDisplay(annualKgSaved)} kg CO₂e/year`;
  const from = getFactor(swap.fromFactorId).label.toLowerCase();

  if (!swap.toFactorId) {
    const pct = Math.round(swap.fraction * 100);
    return `Reducing ${from} by ${pct}% would save about ${amount}.`;
  }
  const to = getFactor(swap.toFactorId).label.toLowerCase();
  return `Switching from ${from} to ${to} would save about ${amount}.`;
}
