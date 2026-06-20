import type { Period } from './types';

const DAY_MS = 86_400_000;
const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

/** Number of days a period spans (used for trend bucketing). */
export function periodDays(period: Period): number {
  return PERIOD_DAYS[period];
}

/** ISO timestamp marking the start of the window, `now` injected for purity. */
export function periodStartIso(period: Period, now: Date): string {
  const start = new Date(now.getTime() - (PERIOD_DAYS[period] - 1) * DAY_MS);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

/** The UTC date key (YYYY-MM-DD) for an ISO timestamp. */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Ordered list of YYYY-MM-DD keys for the window ending at `now`. */
export function dateKeysForPeriod(period: Period, now: Date): string[] {
  const days = PERIOD_DAYS[period];
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10));
  }
  return keys;
}
