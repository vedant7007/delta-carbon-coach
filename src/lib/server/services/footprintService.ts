import {
  computeActivityEmissions,
  dateKeysForPeriod,
  dateKey,
  periodStartIso,
  rankMarginalImpact,
  regionalAverageForPeriod,
  simulate,
  sumByCategory,
  sumTotal,
  type Adjustment,
  type Category,
  type Period,
  type RankedAction,
  type SimulationResult,
} from '@/lib/engine';
import { activityRepository } from '../repository';

export interface TrendPoint {
  date: string;
  kgCO2e: number;
}

export interface FootprintSummary {
  period: Period;
  total: number;
  byCategory: Record<Category, number>;
  trend: TrendPoint[];
  regionalAvg: number;
}

/**
 * Builds the authoritative footprint summary. Emissions are recomputed from the
 * engine for every activity, so the summary can never drift from the dataset.
 *
 * @param uid - The owning user's id.
 * @param period - The reporting window.
 * @param now - Injected clock defining the window and trend buckets.
 * @param region - Region for the per-capita comparison (defaults to India).
 * @returns Total, per-category breakdown, daily trend, and the regional average (all kg CO₂e).
 */
export async function getSummary(
  uid: string,
  period: Period,
  now: Date,
  region: 'IN' | 'GLOBAL' = 'IN',
): Promise<FootprintSummary> {
  const activities = await activityRepository.listSince(uid, periodStartIso(period, now));

  const total = sumTotal(activities);
  const byCategory = sumByCategory(activities);

  // Daily trend buckets across the window, zero-filled for empty days.
  const buckets = new Map<string, number>(dateKeysForPeriod(period, now).map((k) => [k, 0]));
  for (const activity of activities) {
    const key = dateKey(activity.loggedAt);
    const current = buckets.get(key);
    // Only fold in activities that fall inside the window's day buckets.
    if (current !== undefined) {
      buckets.set(key, current + computeActivityEmissions(activity).kgCO2e);
    }
  }
  const trend: TrendPoint[] = [...buckets.entries()].map(([date, kgCO2e]) => ({ date, kgCO2e }));

  return {
    period,
    total,
    byCategory,
    trend,
    regionalAvg: regionalAverageForPeriod(region, period),
  };
}

/**
 * Ranked, personalised actions from the user's own logged data.
 * @param uid - The owning user's id.
 * @param period - The window of activity to analyse.
 * @param now - Injected clock defining the window.
 * @returns The highest-leverage actions, sorted by annual kg CO₂e saved.
 */
export async function getInsights(
  uid: string,
  period: Period,
  now: Date,
): Promise<RankedAction[]> {
  const activities = await activityRepository.listSince(uid, periodStartIso(period, now));
  return rankMarginalImpact(activities, period);
}

/**
 * Authoritatively recomputes a what-if scenario against the user's real data.
 * Keeps the simulate route on the route → service → repository/engine path.
 *
 * @param uid - The owning user's id.
 * @param adjustments - The scenario adjustments to apply.
 * @param period - The window of baseline activity to simulate against.
 * @param now - Injected clock defining the window.
 * @returns The before/after totals and delta (kg CO₂e).
 */
export async function getSimulation(
  uid: string,
  adjustments: Adjustment[],
  period: Period,
  now: Date,
): Promise<SimulationResult> {
  const baseline = await activityRepository.listSince(uid, periodStartIso(period, now));
  return simulate(baseline, adjustments);
}
