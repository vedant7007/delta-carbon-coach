import { getFactor } from './factors';
import type {
  Activity,
  Category,
  EmissionFactor,
  EmissionResult,
  Period,
} from './types';

const CATEGORIES: readonly Category[] = ['transport', 'food', 'energy', 'goods'];

/** Days each period represents, used to annualise. */
const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

/**
 * The authoritative kg CO₂e for a single activity: `amount * factor`.
 * Throws on invalid input — callers (the server) validate first, so reaching
 * here with bad data is a programming error, not user error.
 */
export function computeActivityEmissions(
  activity: Pick<Activity, 'factorId' | 'amount'>,
  factor?: EmissionFactor,
): EmissionResult {
  const resolved = factor ?? getFactor(activity.factorId);

  if (factor && factor.id !== activity.factorId) {
    throw new Error(
      `Factor mismatch: activity references "${activity.factorId}" but factor is "${factor.id}"`,
    );
  }
  if (!Number.isFinite(activity.amount)) {
    throw new Error(`Activity amount must be a finite number, got ${activity.amount}`);
  }
  if (activity.amount < 0) {
    throw new Error(`Activity amount cannot be negative, got ${activity.amount}`);
  }

  return {
    kgCO2e: activity.amount * resolved.kgCO2ePerUnit,
    factor: resolved,
  };
}

/** Total kg CO₂e summed by category. Categories with no activity report 0. */
export function sumByCategory(activities: Activity[]): Record<Category, number> {
  const totals: Record<Category, number> = {
    transport: 0,
    food: 0,
    energy: 0,
    goods: 0,
  };

  for (const activity of activities) {
    const { kgCO2e, factor } = computeActivityEmissions(activity);
    totals[factor.category] += kgCO2e;
  }

  return totals;
}

/** Total kg CO₂e across all activities. */
export function sumTotal(activities: Activity[]): number {
  return activities.reduce(
    (total, activity) => total + computeActivityEmissions(activity).kgCO2e,
    0,
  );
}

/**
 * Projects a period's total to an annual figure. A `month` is treated as 30
 * days for a stable, explainable projection (documented on the methodology page).
 */
export function projectAnnual(periodTotalKg: number, period: Period): number {
  if (periodTotalKg < 0) {
    throw new Error(`Period total cannot be negative, got ${periodTotalKg}`);
  }
  return (periodTotalKg / PERIOD_DAYS[period]) * 365;
}

/**
 * Display rounding: 1 decimal place under 100 kg, whole numbers above —
 * spurious precision erodes trust, especially for high-uncertainty figures.
 */
export function roundForDisplay(kg: number): number {
  if (kg >= 100) return Math.round(kg);
  return Math.round(kg * 10) / 10;
}

export { CATEGORIES };
