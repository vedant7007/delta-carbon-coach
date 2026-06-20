import { describe, it, expect } from 'vitest';
import {
  FACTORS,
  SWAP_CATALOG,
  findFactor,
  getFactor,
  isKnownFactor,
  allFactorIds,
  factorsByCategory,
} from '@/lib/engine';

describe('factors dataset', () => {
  it('has unique factor ids', () => {
    const ids = FACTORS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every factor has a non-empty source and a valid https url', () => {
    for (const f of FACTORS) {
      expect(f.source.length).toBeGreaterThan(0);
      expect(f.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('every factor has a non-negative emission value', () => {
    for (const f of FACTORS) {
      expect(f.kgCO2ePerUnit).toBeGreaterThanOrEqual(0);
    }
  });

  it('all goods are marked high uncertainty (per spec)', () => {
    for (const f of factorsByCategory('goods')) {
      expect(f.uncertainty).toBe('high');
    }
  });

  it('covers all four categories', () => {
    expect(factorsByCategory('transport').length).toBeGreaterThan(0);
    expect(factorsByCategory('food').length).toBeGreaterThan(0);
    expect(factorsByCategory('energy').length).toBeGreaterThan(0);
    expect(factorsByCategory('goods').length).toBeGreaterThan(0);
  });

  it('cycling has a zero factor', () => {
    expect(getFactor('transport.cycle').kgCO2ePerUnit).toBe(0);
  });
});

describe('factor lookups', () => {
  it('getFactor returns a known factor', () => {
    expect(getFactor('food.beef').label).toBe('Beef');
  });

  it('getFactor throws on unknown id', () => {
    expect(() => getFactor('nope.nope')).toThrow(/Unknown emission factor/);
  });

  it('findFactor returns undefined on unknown id', () => {
    expect(findFactor('nope.nope')).toBeUndefined();
  });

  it('isKnownFactor distinguishes known from unknown', () => {
    expect(isKnownFactor('food.beef')).toBe(true);
    expect(isKnownFactor('food.unicorn')).toBe(false);
  });

  it('allFactorIds matches the dataset size', () => {
    expect(allFactorIds()).toHaveLength(FACTORS.length);
  });
});

describe('swap catalog', () => {
  it('has unique swap ids', () => {
    const ids = SWAP_CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every swap references known factors', () => {
    for (const s of SWAP_CATALOG) {
      expect(isKnownFactor(s.fromFactorId)).toBe(true);
      if (s.toFactorId) expect(isKnownFactor(s.toFactorId)).toBe(true);
    }
  });

  it('every swap fraction is within (0, 1]', () => {
    for (const s of SWAP_CATALOG) {
      expect(s.fraction).toBeGreaterThan(0);
      expect(s.fraction).toBeLessThanOrEqual(1);
    }
  });
});
