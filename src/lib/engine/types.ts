/**
 * Core domain types for the carbon engine.
 *
 * Everything in `src/lib/engine` is a pure function over these types: no I/O,
 * no `fetch`, no `Date.now()`. Dates are injected by callers. This is what
 * makes the engine fully unit-testable and the single source of truth for
 * every kg CO₂e the app ever shows.
 */

export type Category = 'transport' | 'food' | 'energy' | 'goods';

export type Uncertainty = 'low' | 'medium' | 'high';

export type Unit = 'km' | 'kg' | 'kWh' | 'item' | 'meal' | 'litre';

export type Region = 'GLOBAL' | 'IN' | 'UK' | 'US';

export type Period = 'day' | 'week' | 'month';

export interface EmissionFactor {
  id: string;
  category: Category;
  label: string;
  unit: Unit;
  kgCO2ePerUnit: number;
  source: string;
  sourceUrl: string;
  uncertainty: Uncertainty;
  region: Region;
  /** Typical portion in the factor's unit, used to power one-tap chips. */
  defaultServing?: number;
}

export interface Activity {
  id: string;
  factorId: string;
  /** Quantity expressed in the factor's `unit`. */
  amount: number;
  /** ISO 8601 timestamp. */
  loggedAt: string;
  source: 'manual' | 'ai';
}

export interface EmissionResult {
  kgCO2e: number;
  factor: EmissionFactor;
}

/** A single change applied in the what-if simulator. */
export interface Adjustment {
  /** The factor being adjusted (e.g. reduce car km, swap grid -> renewable). */
  factorId: string;
  /**
   * Multiplier applied to the current amount for this factor.
   * 1 = no change, 0.8 = cut 20%, 0 = eliminate.
   */
  scale?: number;
  /** Optionally redirect the scaled-away amount onto another factor. */
  swapToFactorId?: string;
}

export interface SimulationResult {
  before: number;
  after: number;
  deltaKg: number;
  /** Negative means a reduction (a saving). */
  deltaPct: number;
}

/** A ranked, actionable swap produced by the marginal-impact engine. */
export interface RankedAction {
  id: string;
  title: string;
  description: string;
  /** Annualised kg CO₂e saved by adopting this action, given the user's data. */
  annualKgSaved: number;
  category: Category;
  /** Factor ids backing the number, for the methodology link. */
  sourceFactorIds: string[];
  /** Pre-set adjustments so "Simulate this" can hydrate the simulator. */
  adjustments: Adjustment[];
}

/** A candidate swap definition the ranking engine evaluates. */
export interface SwapDefinition {
  id: string;
  title: string;
  category: Category;
  /** Factor whose logged activity this swap applies to. */
  fromFactorId: string;
  /** Optional replacement factor (omitted for pure reductions). */
  toFactorId?: string;
  /** Fraction of the from-activity affected (0..1). */
  fraction: number;
}
