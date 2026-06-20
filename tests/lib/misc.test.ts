import { describe, it, expect } from 'vitest';
import {
  regionalAverageForPeriod,
  REGIONAL_AVERAGES,
  periodStartIso,
  dateKeysForPeriod,
  dateKey,
  periodDays,
} from '@/lib/engine';
import { buildSeedActivities } from '@/lib/server/services/onboardingService';
import { onboardingSchema } from '@/lib/schemas';

describe('regional averages', () => {
  it('scales the annual figure to the period', () => {
    const annual = REGIONAL_AVERAGES.IN.annualKgPerCapita;
    expect(regionalAverageForPeriod('IN', 'day')).toBeCloseTo(annual / 365);
    expect(regionalAverageForPeriod('IN', 'week')).toBeCloseTo((annual / 365) * 7);
    expect(regionalAverageForPeriod('GLOBAL', 'month')).toBeCloseTo(
      (REGIONAL_AVERAGES.GLOBAL.annualKgPerCapita / 365) * 30,
    );
  });
});

describe('date helpers', () => {
  const now = new Date('2026-06-19T12:00:00.000Z');

  it('periodDays maps each period', () => {
    expect(periodDays('day')).toBe(1);
    expect(periodDays('week')).toBe(7);
    expect(periodDays('month')).toBe(30);
  });

  it('periodStartIso returns midnight at the window start', () => {
    expect(periodStartIso('day', now)).toBe('2026-06-19T00:00:00.000Z');
    expect(periodStartIso('week', now)).toBe('2026-06-13T00:00:00.000Z');
  });

  it('dateKeysForPeriod yields one ordered key per day', () => {
    const keys = dateKeysForPeriod('week', now);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-06-13');
    expect(keys[6]).toBe('2026-06-19');
  });

  it('dateKey slices the date portion', () => {
    expect(dateKey('2026-06-19T12:00:00.000Z')).toBe('2026-06-19');
  });
});

describe('onboarding seed mapping', () => {
  it('produces transport, food and energy seeds from defaults', () => {
    const input = onboardingSchema.parse({});
    const seeds = buildSeedActivities(input);
    const categories = seeds.map((s) => s.factorId.split('.')[0]);
    expect(categories).toContain('transport');
    expect(categories).toContain('food');
    expect(categories).toContain('energy');
    for (const s of seeds) expect(s.amount).toBeGreaterThan(0);
  });

  it('maps a vegan diet to lentils and meat-heavy to beef', () => {
    const vegan = buildSeedActivities(onboardingSchema.parse({ diet: 'vegan' }));
    expect(vegan.some((s) => s.factorId === 'food.lentils')).toBe(true);

    const meat = buildSeedActivities(onboardingSchema.parse({ diet: 'meat-heavy' }));
    expect(meat.some((s) => s.factorId === 'food.beef')).toBe(true);
  });

  it('scales energy with household size', () => {
    const solo = buildSeedActivities(onboardingSchema.parse({ householdSize: 1 }));
    const family = buildSeedActivities(onboardingSchema.parse({ householdSize: 4 }));
    const energy = (s: ReturnType<typeof buildSeedActivities>) =>
      s.find((a) => a.factorId.startsWith('energy'))!.amount;
    expect(energy(family)).toBeGreaterThan(energy(solo));
  });
});
