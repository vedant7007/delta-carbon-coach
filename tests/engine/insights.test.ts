import { describe, it, expect } from 'vitest';
import { rankMarginalImpact, type Activity, type SwapDefinition } from '@/lib/engine';

function activity(factorId: string, amount: number, id = factorId): Activity {
  return { id, factorId, amount, loggedAt: '2026-01-01T00:00:00.000Z', source: 'manual' };
}

describe('rankMarginalImpact', () => {
  it('returns an empty list when there is no data', () => {
    expect(rankMarginalImpact([], 'week')).toEqual([]);
  });

  it('ranks the highest-saving action first', () => {
    // Daily: beef 0.2kg (12kg), petrol car 20km (3.4kg).
    const actions = rankMarginalImpact(
      [activity('food.beef', 0.2, 'a'), activity('transport.car.petrol', 20, 'b')],
      'day',
    );
    expect(actions.length).toBeGreaterThan(0);
    // beef->plant saves the most; it should top the list.
    expect(actions[0]?.category).toBe('food');
    // sorted descending
    for (let i = 1; i < actions.length; i += 1) {
      expect(actions[i - 1]!.annualKgSaved).toBeGreaterThanOrEqual(actions[i]!.annualKgSaved);
    }
  });

  it('only includes actions that apply to the logged data', () => {
    const actions = rankMarginalImpact([activity('food.beef', 0.2)], 'day');
    for (const a of actions) {
      expect(a.sourceFactorIds).toContain('food.beef');
    }
  });

  it('annualises the saving (weekly beef swap)', () => {
    // Top swap for beef is beef->plant (lentils): weekly saving = (60-0.9)*1 = 59.1 kg.
    // annual = 59.1/7*365. (beef->chicken saves less, so it ranks lower.)
    const [top] = rankMarginalImpact([activity('food.beef', 1)], 'week', undefined, 1);
    expect(top?.id).toBe('swap.beef-to-plant');
    expect(top?.annualKgSaved).toBeCloseTo((59.1 / 7) * 365, 0);
  });

  it('respects the limit', () => {
    const actions = rankMarginalImpact(
      [activity('food.beef', 0.2, 'a'), activity('transport.car.petrol', 20, 'b')],
      'day',
      undefined,
      2,
    );
    expect(actions.length).toBeLessThanOrEqual(2);
  });

  it('includes hydration adjustments and a source link', () => {
    const [top] = rankMarginalImpact([activity('food.beef', 1)], 'week', undefined, 1);
    expect(top?.adjustments.length).toBeGreaterThan(0);
    expect(top?.adjustments[0]?.factorId).toBe('food.beef');
    expect(top?.description).toMatch(/kg CO₂e\/year/);
  });

  it('drops swaps that produce no saving', () => {
    // A swap that increases emissions should never appear.
    const increasing: SwapDefinition[] = [
      {
        id: 'swap.bad',
        title: 'Chicken to beef (worse)',
        category: 'food',
        fromFactorId: 'food.chicken',
        toFactorId: 'food.beef',
        fraction: 1,
      },
    ];
    expect(rankMarginalImpact([activity('food.chicken', 1)], 'week', increasing)).toEqual([]);
  });

  it('handles a pure-reduction swap (no toFactor)', () => {
    const reduceOnly: SwapDefinition[] = [
      {
        id: 'swap.cut-car',
        title: 'Cut car by 20%',
        category: 'transport',
        fromFactorId: 'transport.car.petrol',
        fraction: 0.2,
      },
    ];
    const [top] = rankMarginalImpact([activity('transport.car.petrol', 100)], 'week', reduceOnly);
    expect(top?.sourceFactorIds).toEqual(['transport.car.petrol']);
    expect(top?.description).toMatch(/Reducing/);
  });
});
