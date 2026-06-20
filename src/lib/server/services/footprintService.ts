import {
  computeActivityEmissions,
  dateKeysForPeriod,
  dateKey,
  periodStartIso,
  rankMarginalImpact,
  regionalAverageForPeriod,
  sumByCategory,
  sumTotal,
  type Category,
  type Period,
  type RankedAction,
} from '@/lib/engine';
import { listActivitiesSince } from '../repository/activityRepository';

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
 * Authoritative footprint summary. Emissions are recomputed from the engine for
 * every activity, so the summary can never drift from the factor dataset.
 */
export async function getSummary(
  uid: string,
  period: Period,
  now: Date,
  region: 'IN' | 'GLOBAL' = 'IN',
): Promise<FootprintSummary> {
  const activities = await listActivitiesSince(uid, periodStartIso(period, now));

  const total = sumTotal(activities);
  const byCategory = sumByCategory(activities);

  // Daily trend buckets across the window, zero-filled for empty days.
  const buckets = new Map<string, number>(dateKeysForPeriod(period, now).map((k) => [k, 0]));
  for (const activity of activities) {
    const key = dateKey(activity.loggedAt);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + computeActivityEmissions(activity).kgCO2e);
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

/** Ranked, personalised actions from the user's own logged data. */
export async function getInsights(
  uid: string,
  period: Period,
  now: Date,
): Promise<RankedAction[]> {
  const activities = await listActivitiesSince(uid, periodStartIso(period, now));
  return rankMarginalImpact(activities, period);
}
