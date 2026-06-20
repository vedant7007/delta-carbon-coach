import { describe, it, expect } from 'vitest';
import {
  computeActivityEmissions,
  sumByCategory,
  sumTotal,
  projectAnnual,
  roundForDisplay,
  getFactor,
  type Activity,
} from '@/lib/engine';

function activity(factorId: string, amount: number, id = factorId): Activity {
  return { id, factorId, amount, loggedAt: '2026-01-01T00:00:00.000Z', source: 'manual' };
}

describe('computeActivityEmissions', () => {
  it('computes amount * factor for transport', () => {
    const { kgCO2e } = computeActivityEmissions({ factorId: 'transport.car.petrol', amount: 30 });
    expect(kgCO2e).toBeCloseTo(30 * 0.17);
  });

  it('computes for food using per-kg factors', () => {
    const { kgCO2e } = computeActivityEmissions({ factorId: 'food.beef', amount: 0.15 });
    expect(kgCO2e).toBeCloseTo(9);
  });

  it('computes for energy', () => {
    const { kgCO2e } = computeActivityEmissions({ factorId: 'energy.electricity.IN', amount: 10 });
    expect(kgCO2e).toBeCloseTo(7.1);
  });

  it('computes for goods', () => {
    const { kgCO2e } = computeActivityEmissions({ factorId: 'goods.laptop', amount: 1 });
    expect(kgCO2e).toBe(300);
  });

  it('returns 0 for a zero amount', () => {
    expect(computeActivityEmissions({ factorId: 'food.beef', amount: 0 }).kgCO2e).toBe(0);
  });

  it('returns 0 for a zero-factor activity (cycling)', () => {
    expect(computeActivityEmissions({ factorId: 'transport.cycle', amount: 50 }).kgCO2e).toBe(0);
  });

  it('returns the resolved factor alongside the number', () => {
    const result = computeActivityEmissions({ factorId: 'food.beef', amount: 1 });
    expect(result.factor.id).toBe('food.beef');
  });

  it('accepts a pre-resolved factor to avoid a second lookup', () => {
    const factor = getFactor('food.chicken');
    const result = computeActivityEmissions({ factorId: 'food.chicken', amount: 2 }, factor);
    expect(result.kgCO2e).toBeCloseTo(20);
  });

  it('throws when a passed factor does not match the activity', () => {
    const factor = getFactor('food.chicken');
    expect(() =>
      computeActivityEmissions({ factorId: 'food.beef', amount: 1 }, factor),
    ).toThrow(/Factor mismatch/);
  });

  it('throws on a negative amount', () => {
    expect(() => computeActivityEmissions({ factorId: 'food.beef', amount: -1 })).toThrow(
      /cannot be negative/,
    );
  });

  it('throws on a non-finite amount', () => {
    expect(() =>
      computeActivityEmissions({ factorId: 'food.beef', amount: Number.NaN }),
    ).toThrow(/finite number/);
  });

  it('throws on an unknown factor id', () => {
    expect(() => computeActivityEmissions({ factorId: 'food.dragon', amount: 1 })).toThrow(
      /Unknown emission factor/,
    );
  });
});

describe('sumByCategory', () => {
  it('groups totals by category and zero-fills the rest', () => {
    const result = sumByCategory([
      activity('transport.car.petrol', 100, 'a'),
      activity('food.beef', 1, 'b'),
      activity('food.chicken', 1, 'c'),
    ]);
    expect(result.transport).toBeCloseTo(17);
    expect(result.food).toBeCloseTo(70);
    expect(result.energy).toBe(0);
    expect(result.goods).toBe(0);
  });

  it('returns all zeros for no activities', () => {
    expect(sumByCategory([])).toEqual({ transport: 0, food: 0, energy: 0, goods: 0 });
  });
});

describe('sumTotal', () => {
  it('sums across categories', () => {
    const total = sumTotal([
      activity('transport.car.petrol', 100, 'a'),
      activity('food.beef', 1, 'b'),
    ]);
    expect(total).toBeCloseTo(77);
  });

  it('is 0 for no activities', () => {
    expect(sumTotal([])).toBe(0);
  });
});

describe('projectAnnual', () => {
  it('annualises a daily total', () => {
    expect(projectAnnual(10, 'day')).toBeCloseTo(3650);
  });

  it('annualises a weekly total', () => {
    expect(projectAnnual(70, 'week')).toBeCloseTo(3650);
  });

  it('annualises a monthly total using a 30-day month', () => {
    expect(projectAnnual(300, 'month')).toBeCloseTo((300 / 30) * 365);
  });

  it('throws on a negative period total', () => {
    expect(() => projectAnnual(-1, 'day')).toThrow(/cannot be negative/);
  });
});

describe('roundForDisplay', () => {
  it('keeps one decimal below 100', () => {
    expect(roundForDisplay(12.345)).toBe(12.3);
  });

  it('rounds to whole numbers at/above 100', () => {
    expect(roundForDisplay(123.7)).toBe(124);
  });

  it('handles zero', () => {
    expect(roundForDisplay(0)).toBe(0);
  });
});
