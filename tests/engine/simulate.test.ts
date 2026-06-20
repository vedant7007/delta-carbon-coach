import { describe, it, expect } from 'vitest';
import { simulate, type Activity } from '@/lib/engine';

function activity(factorId: string, amount: number, id = factorId): Activity {
  return { id, factorId, amount, loggedAt: '2026-01-01T00:00:00.000Z', source: 'manual' };
}

describe('simulate', () => {
  it('returns identical before/after with no adjustments', () => {
    const baseline = [activity('transport.car.petrol', 100)];
    const result = simulate(baseline, []);
    expect(result.before).toBeCloseTo(17);
    expect(result.after).toBeCloseTo(17);
    expect(result.deltaKg).toBeCloseTo(0);
    expect(result.deltaPct).toBeCloseTo(0);
  });

  it('eliminates emissions when scaled to zero', () => {
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', scale: 0 },
    ]);
    expect(result.after).toBeCloseTo(0);
    expect(result.deltaKg).toBeCloseTo(-17);
    expect(result.deltaPct).toBeCloseTo(-100);
  });

  it('cuts a portion when scaled down', () => {
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', scale: 0.8 },
    ]);
    expect(result.after).toBeCloseTo(13.6);
    expect(result.deltaPct).toBeCloseTo(-20);
  });

  it('redirects the removed portion to a swap factor', () => {
    // 100 km petrol car (17 kg) fully swapped to metro (0.04/km => 4 kg).
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', scale: 0, swapToFactorId: 'transport.metro' },
    ]);
    expect(result.before).toBeCloseTo(17);
    expect(result.after).toBeCloseTo(4);
    expect(result.deltaKg).toBeCloseTo(-13);
  });

  it('leaves unmatched activities untouched', () => {
    const result = simulate(
      [activity('transport.car.petrol', 100, 'a'), activity('food.beef', 1, 'b')],
      [{ factorId: 'transport.car.petrol', scale: 0 }],
    );
    // car removed (-17), beef (60) untouched.
    expect(result.before).toBeCloseTo(77);
    expect(result.after).toBeCloseTo(60);
  });

  it('applies the last adjustment when a factor is targeted twice', () => {
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', scale: 0.5 },
      { factorId: 'transport.car.petrol', scale: 0 },
    ]);
    expect(result.after).toBeCloseTo(0);
  });

  it('reports deltaPct of 0 when baseline is empty', () => {
    const result = simulate([], [{ factorId: 'transport.car.petrol', scale: 0 }]);
    expect(result.before).toBe(0);
    expect(result.after).toBe(0);
    expect(result.deltaPct).toBe(0);
  });

  it('can increase emissions if scaled above 1', () => {
    const result = simulate([activity('transport.car.petrol', 100)], [
      { factorId: 'transport.car.petrol', scale: 2 },
    ]);
    expect(result.after).toBeCloseTo(34);
    expect(result.deltaKg).toBeCloseTo(17);
    expect(result.deltaPct).toBeCloseTo(100);
  });

  it('throws on a negative scale', () => {
    expect(() =>
      simulate([activity('transport.car.petrol', 100)], [
        { factorId: 'transport.car.petrol', scale: -1 },
      ]),
    ).toThrow(/non-negative/);
  });

  it('throws on a swap to an unknown factor', () => {
    expect(() =>
      simulate([activity('transport.car.petrol', 100)], [
        { factorId: 'transport.car.petrol', scale: 0, swapToFactorId: 'transport.teleporter' },
      ]),
    ).toThrow(/Unknown emission factor/);
  });
});
