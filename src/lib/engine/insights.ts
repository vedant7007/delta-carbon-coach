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
const PERCENT = 100;

/**
 * Evaluates a single swap against the user's matching activities.
 *
 * @param activities - The user's logged activities.
 * @param swap - The candidate swap to evaluate.
 * @param period - The period the activities cover (used to annualise the saving).
 * @returns A {@link RankedAction} with the annualised kg CO₂e saved, or `null` if
 *   the swap doesn't apply (no matching activity) or wouldn't save anything.
 */
function evaluateSwap(
  activities: Activity[],
  swap: SwapDefinition,
  period: Period,
): RankedAction | null {
  const matching = activities.filter((a) => a.factorId === swap.fromFactorId);
  if (matching.length === 0) return null;

  const adjustment: Adjustment = {
    factorId: swap.fromFactorId,
    scale: 1 - swap.fraction,
    ...(swap.toFactorId ? { swapToFactorId: swap.toFactorId } : {}),
  };

  const periodSaving = -simulate(matching, [adjustment]).deltaKg; // negative delta = a saving
  if (periodSaving <= 0) return null;

  const annualKgSaved = projectAnnual(periodSaving, period);
  return {
    id: swap.id,
    title: swap.title,
    description: describeSwap(swap, annualKgSaved),
    annualKgSaved,
    category: swap.category,
    sourceFactorIds: swap.toFactorId ? [swap.fromFactorId, swap.toFactorId] : [swap.fromFactorId],
    adjustments: [adjustment],
  };
}

/**
 * Ranks the highest-leverage actions for THIS user, from THEIR logged data.
 * Swaps that don't apply or don't save anything are dropped — we never invent a
 * recommendation the data can't back.
 *
 * @param activities - The user's logged activities.
 * @param period - The period the activities cover.
 * @param swapCatalog - Candidate swaps to consider (defaults to the full {@link SWAP_CATALOG}).
 * @param limit - Maximum number of actions to return.
 * @returns Applicable actions sorted by annual kg CO₂e saved, descending.
 */
export function rankMarginalImpact(
  activities: Activity[],
  period: Period,
  swapCatalog: readonly SwapDefinition[] = SWAP_CATALOG,
  limit: number = DEFAULT_LIMIT,
): RankedAction[] {
  return swapCatalog
    .map((swap) => evaluateSwap(activities, swap, period))
    .filter((action): action is RankedAction => action !== null)
    .sort((a, b) => b.annualKgSaved - a.annualKgSaved)
    .slice(0, limit);
}

/** Deterministic, non-preachy phrasing. The AI may re-phrase this; the number never changes. */
function describeSwap(swap: SwapDefinition, annualKgSaved: number): string {
  const amount = `${roundForDisplay(annualKgSaved)} kg CO₂e/year`;
  const from = getFactor(swap.fromFactorId).label.toLowerCase();

  if (!swap.toFactorId) {
    const pct = Math.round(swap.fraction * PERCENT);
    return `Reducing ${from} by ${pct}% would save about ${amount}.`;
  }
  const to = getFactor(swap.toFactorId).label.toLowerCase();
  return `Switching from ${from} to ${to} would save about ${amount}.`;
}
