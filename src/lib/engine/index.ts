/**
 * Public surface of the carbon engine. Import from `@/lib/engine`, never from
 * deep paths, so the engine boundary stays clean and swappable.
 */
export * from './types';
export {
  EngineError,
  UnknownFactorError,
  FactorMismatchError,
  InvalidValueError,
} from './errors';
export {
  FACTORS,
  SWAP_CATALOG,
  findFactor,
  getFactor,
  isKnownFactor,
  allFactorIds,
  factorsByCategory,
} from './factors';
export {
  CATEGORIES,
  computeActivityEmissions,
  sumByCategory,
  sumTotal,
  projectAnnual,
  roundForDisplay,
} from './compute';
export { simulate } from './simulate';
export { rankMarginalImpact } from './insights';
export {
  REGIONAL_AVERAGES,
  regionalAverageForPeriod,
  type RegionalAverage,
} from './reference';
export {
  periodDays,
  periodStartIso,
  dateKey,
  dateKeysForPeriod,
} from './dates';
