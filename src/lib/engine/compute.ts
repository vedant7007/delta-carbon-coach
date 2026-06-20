import { getFactor } from './factors';
import type {
  Activity,
  Category,
  EmissionFactor,
  EmissionResult,
  Period,
} from './types';

const CATEGORIES: readonly Category[] = ['transport', 'food', 'energy', 'goods'];

/** Days each period represents, used to annualise. A month is a flat 30 days. */
const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

/** Days per year used for annual projection. */
const DAYS_PER_YEAR = 365;

/** At/above this many kg, display drops decimals (precision implies false accuracy). */
const WHOLE_NUMBER_THRESHOLD_KG = 100;

/**
 * The authoritative kg CO₂e for a single activity: `amount × factor`.
 *
 * Throws on invalid input — callers (the server) validate first, so reaching
 * here with bad data is a programming error, not user error.
 *
 * @param activity - The activity's `factorId` and `amount` (amount is in the factor's unit, e.g. km/kg/kWh).
 * @param factor - Optional pre-resolved factor, to avoid a second lookup; must match `activity.factorId`.
 * @returns The emissions in `kgCO2e` plus the resolved {@link EmissionFactor}.
 * @throws If the factor is unknown, mismatched, or the amount is negative/non-finite.
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

/**
 * Sums emissions by category.
 * @param activities - Activities to total.
 * @returns kg CO₂e per category; categories with no activity report 0.
 */
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

/**
 * @param activities - Activities to total.
 * @returns Total kg CO₂e across all activities (0 for an empty list).
 */
export function sumTotal(activities: Activity[]): number {
  return activities.reduce(
    (total, activity) => total + computeActivityEmissions(activity).kgCO2e,
    0,
  );
}

/**
 * Projects a period's total to an annual figure. A `month` is treated as a flat
 * 30 days for a stable, explainable projection (documented on the methodology page).
 *
 * @param periodTotalKg - The period's total emissions in kg CO₂e (must be ≥ 0).
 * @param period - The period the total covers.
 * @returns The annualised emissions in kg CO₂e/year.
 * @throws If `periodTotalKg` is negative.
 */
export function projectAnnual(periodTotalKg: number, period: Period): number {
  if (periodTotalKg < 0) {
    throw new Error(`Period total cannot be negative, got ${periodTotalKg}`);
  }
  return (periodTotalKg / PERIOD_DAYS[period]) * DAYS_PER_YEAR;
}

/**
 * Rounds a kg CO₂e value for display: 1 decimal below 100 kg, whole numbers
 * at/above — spurious precision erodes trust, especially for high-uncertainty figures.
 *
 * @param kg - The raw kg CO₂e value.
 * @returns The value rounded for display.
 */
export function roundForDisplay(kg: number): number {
  if (kg >= WHOLE_NUMBER_THRESHOLD_KG) return Math.round(kg);
  return Math.round(kg * 10) / 10;
}

export { CATEGORIES };
