import { describe, it, expect } from 'vitest';
import {
  simulate,
  roundForDisplay,
  periodStartIso,
  dateKeysForPeriod,
  regionalAverageForPeriod,
  type Activity,
} from '@/lib/engine';

function activity(factorId: string, amount: number): Activity {
  return { id: factorId, factorId, amount, loggedAt: '2026-01-01T00:00:00.000Z', source: 'manual' };
}

describe('engine branch coverage', () => {
  it('simulate defaults scale to 1 when omitted', () => {
    // Only a swap target, no scale -> scale=1 means nothing is moved.
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', swapToFactorId: 'transport.metro' },
    ]);
    expect(result.after).toBeCloseTo(result.before);
  });

  it('roundForDisplay treats exactly 100 as whole-number', () => {
    expect(roundForDisplay(100)).toBe(100);
    expect(roundForDisplay(99.94)).toBe(99.9);
  });

  it('periodStartIso handles the month window', () => {
    const now = new Date('2026-06-19T12:00:00.000Z');
    expect(periodStartIso('month', now)).toBe('2026-05-21T00:00:00.000Z');
  });

  it('dateKeysForPeriod handles a single-day window', () => {
    const now = new Date('2026-06-19T12:00:00.000Z');
    expect(dateKeysForPeriod('day', now)).toEqual(['2026-06-19']);
  });

  it('regionalAverageForPeriod handles both regions and all periods', () => {
    expect(regionalAverageForPeriod('IN', 'month')).toBeGreaterThan(0);
    expect(regionalAverageForPeriod('GLOBAL', 'day')).toBeGreaterThan(0);
    expect(regionalAverageForPeriod('GLOBAL', 'week')).toBeGreaterThan(0);
  });
});
