import type { Period, Region } from './types';

/**
 * Reference per-capita footprints for the regional comparison on the dashboard.
 * Annual kg CO₂e per person, from published national/global averages.
 */
export interface RegionalAverage {
  region: Region;
  label: string;
  annualKgPerCapita: number;
  source: string;
  sourceUrl: string;
}

export const REGIONAL_AVERAGES: Record<'IN' | 'GLOBAL', RegionalAverage> = {
  IN: {
    region: 'IN',
    label: 'India average',
    annualKgPerCapita: 1900,
    source: 'Our World in Data — per-capita CO₂ (India)',
    sourceUrl: 'https://ourworldindata.org/co2/country/india',
  },
  GLOBAL: {
    region: 'GLOBAL',
    label: 'World average',
    annualKgPerCapita: 4700,
    source: 'Our World in Data — per-capita CO₂ (World)',
    sourceUrl: 'https://ourworldindata.org/co2-emissions',
  },
};

const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

/** The regional average expressed for a given period (annual / 365 * period days). */
export function regionalAverageForPeriod(region: 'IN' | 'GLOBAL', period: Period): number {
  return (REGIONAL_AVERAGES[region].annualKgPerCapita / 365) * PERIOD_DAYS[period];
}
