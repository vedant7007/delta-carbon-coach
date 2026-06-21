import { UnknownFactorError } from './errors';
import type { Category, EmissionFactor, SwapDefinition } from './types';

/**
 * The emission-factor dataset. Every kg CO₂e in Delta resolves to one of these
 * rows. Values are credible published estimates, rounded; sources are cited so
 * the methodology page can link each number to its origin.
 *
 * Sources:
 *  - UK DEFRA/DESNZ GHG Conversion Factors 2024 (transport, energy, goods)
 *  - Poore & Nemecek 2018 / Our World in Data (food)
 *  - CEA / India grid emission factor (electricity, IN)
 */

const DEFRA = 'UK DEFRA/DESNZ GHG Conversion Factors 2024';
const DEFRA_URL =
  'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024';
const OWID = 'Poore & Nemecek (2018), via Our World in Data';
const OWID_URL = 'https://ourworldindata.org/food-choice-vs-eating-local';
const CEA = 'CEA CO2 Baseline Database for the Indian Power Sector';
const CEA_URL = 'https://cea.nic.in/cdm-co2-baseline-database/';

export const FACTORS: readonly EmissionFactor[] = [
  // --- Transport (kg CO₂e per km, per passenger where relevant) ---
  {
    id: 'transport.car.petrol',
    category: 'transport',
    label: 'Petrol car',
    unit: 'km',
    kgCO2ePerUnit: 0.17,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 10,
  },
  {
    id: 'transport.car.diesel',
    category: 'transport',
    label: 'Diesel car',
    unit: 'km',
    kgCO2ePerUnit: 0.17,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 10,
  },
  {
    id: 'transport.car.ev',
    category: 'transport',
    label: 'Electric car (IN grid)',
    unit: 'km',
    kgCO2ePerUnit: 0.09,
    source: CEA,
    sourceUrl: CEA_URL,
    uncertainty: 'medium',
    region: 'IN',
    defaultServing: 10,
  },
  {
    id: 'transport.scooter',
    category: 'transport',
    label: 'Scooter / motorbike',
    unit: 'km',
    kgCO2ePerUnit: 0.1,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 10,
  },
  {
    id: 'transport.autorickshaw',
    category: 'transport',
    label: 'Auto-rickshaw (CNG)',
    unit: 'km',
    kgCO2ePerUnit: 0.07,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'medium',
    region: 'IN',
    defaultServing: 5,
  },
  {
    id: 'transport.bus',
    category: 'transport',
    label: 'City bus (per passenger)',
    unit: 'km',
    kgCO2ePerUnit: 0.1,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 10,
  },
  {
    id: 'transport.metro',
    category: 'transport',
    label: 'Metro / train (per passenger)',
    unit: 'km',
    kgCO2ePerUnit: 0.04,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 10,
  },
  {
    id: 'transport.flight.domestic',
    category: 'transport',
    label: 'Domestic flight (per passenger)',
    unit: 'km',
    kgCO2ePerUnit: 0.24,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 700,
  },
  {
    id: 'transport.cycle',
    category: 'transport',
    label: 'Cycling / walking',
    unit: 'km',
    kgCO2ePerUnit: 0.0,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 5,
  },

  // --- Food (kg CO₂e per kg; defaultServing = typical portion in kg) ---
  {
    id: 'food.beef',
    category: 'food',
    label: 'Beef',
    unit: 'kg',
    kgCO2ePerUnit: 60,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.lamb',
    category: 'food',
    label: 'Lamb',
    unit: 'kg',
    kgCO2ePerUnit: 24,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.cheese',
    category: 'food',
    label: 'Cheese',
    unit: 'kg',
    kgCO2ePerUnit: 21,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.05,
  },
  {
    id: 'food.pork',
    category: 'food',
    label: 'Pork',
    unit: 'kg',
    kgCO2ePerUnit: 12,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.chicken',
    category: 'food',
    label: 'Chicken',
    unit: 'kg',
    kgCO2ePerUnit: 10,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.rice',
    category: 'food',
    label: 'Rice',
    unit: 'kg',
    kgCO2ePerUnit: 4.5,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.eggs',
    category: 'food',
    label: 'Eggs',
    unit: 'kg',
    kgCO2ePerUnit: 4.5,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.1,
  },
  {
    id: 'food.milk',
    category: 'food',
    label: 'Milk',
    unit: 'litre',
    kgCO2ePerUnit: 3.0,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.25,
  },
  {
    id: 'food.tofu',
    category: 'food',
    label: 'Tofu',
    unit: 'kg',
    kgCO2ePerUnit: 3.2,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.lentils',
    category: 'food',
    label: 'Lentils / pulses',
    unit: 'kg',
    kgCO2ePerUnit: 0.9,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.15,
  },
  {
    id: 'food.vegetables',
    category: 'food',
    label: 'Vegetables',
    unit: 'kg',
    kgCO2ePerUnit: 0.5,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.2,
  },
  {
    id: 'food.fruit',
    category: 'food',
    label: 'Fruit',
    unit: 'kg',
    kgCO2ePerUnit: 0.5,
    source: OWID,
    sourceUrl: OWID_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 0.2,
  },

  // --- Home Energy ---
  {
    id: 'energy.electricity.IN',
    category: 'energy',
    label: 'Grid electricity (India)',
    unit: 'kWh',
    kgCO2ePerUnit: 0.71,
    source: CEA,
    sourceUrl: CEA_URL,
    uncertainty: 'medium',
    region: 'IN',
    defaultServing: 5,
  },
  {
    id: 'energy.electricity.global',
    category: 'energy',
    label: 'Grid electricity (global avg)',
    unit: 'kWh',
    kgCO2ePerUnit: 0.45,
    source: 'IEA / Our World in Data global average',
    sourceUrl: 'https://ourworldindata.org/grapher/carbon-intensity-electricity',
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 5,
  },
  {
    id: 'energy.electricity.renewable',
    category: 'energy',
    label: 'Renewable electricity',
    unit: 'kWh',
    kgCO2ePerUnit: 0.04,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'medium',
    region: 'GLOBAL',
    defaultServing: 5,
  },
  {
    id: 'energy.gas',
    category: 'energy',
    label: 'Natural gas',
    unit: 'kWh',
    kgCO2ePerUnit: 0.18,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 5,
  },
  {
    id: 'energy.lpg',
    category: 'energy',
    label: 'LPG',
    unit: 'kg',
    kgCO2ePerUnit: 2.98,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'low',
    region: 'GLOBAL',
    defaultServing: 1,
  },

  // --- Goods (per item — high uncertainty, surfaced clearly) ---
  {
    id: 'goods.tshirt',
    category: 'goods',
    label: 'New T-shirt',
    unit: 'item',
    kgCO2ePerUnit: 7,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'high',
    region: 'GLOBAL',
    defaultServing: 1,
  },
  {
    id: 'goods.jeans',
    category: 'goods',
    label: 'New jeans',
    unit: 'item',
    kgCO2ePerUnit: 33,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'high',
    region: 'GLOBAL',
    defaultServing: 1,
  },
  {
    id: 'goods.smartphone',
    category: 'goods',
    label: 'New smartphone',
    unit: 'item',
    kgCO2ePerUnit: 70,
    source: 'Manufacturer LCA disclosures (aggregate)',
    sourceUrl: 'https://ourworldindata.org/carbon-footprint-electronics',
    uncertainty: 'high',
    region: 'GLOBAL',
    defaultServing: 1,
  },
  {
    id: 'goods.laptop',
    category: 'goods',
    label: 'New laptop',
    unit: 'item',
    kgCO2ePerUnit: 300,
    source: 'Manufacturer LCA disclosures (aggregate)',
    sourceUrl: 'https://ourworldindata.org/carbon-footprint-electronics',
    uncertainty: 'high',
    region: 'GLOBAL',
    defaultServing: 1,
  },
  {
    id: 'goods.clothing_kg',
    category: 'goods',
    label: 'New clothing (per kg)',
    unit: 'kg',
    kgCO2ePerUnit: 15,
    source: DEFRA,
    sourceUrl: DEFRA_URL,
    uncertainty: 'high',
    region: 'GLOBAL',
    defaultServing: 0.5,
  },
] as const;

/** Fast lookup map, built once at module load. */
const FACTOR_MAP: ReadonlyMap<string, EmissionFactor> = new Map(
  FACTORS.map((f) => [f.id, f]),
);

/** Returns the factor for an id, or undefined if unknown. */
export function findFactor(id: string): EmissionFactor | undefined {
  return FACTOR_MAP.get(id);
}

/**
 * Resolves a factor by id.
 * @param id - The factor id.
 * @returns The matching {@link EmissionFactor}.
 * @throws {UnknownFactorError} If the id is not in the dataset.
 */
export function getFactor(id: string): EmissionFactor {
  const factor = FACTOR_MAP.get(id);
  if (!factor) {
    throw new UnknownFactorError(id);
  }
  return factor;
}

/** True if the id maps to a known factor. */
export function isKnownFactor(id: string): boolean {
  return FACTOR_MAP.has(id);
}

/** All factor ids — used by Zod schemas and the AI prompt allow-list. */
export function allFactorIds(): string[] {
  return FACTORS.map((f) => f.id);
}

/** Factors in a category, in dataset order. */
export function factorsByCategory(category: Category): EmissionFactor[] {
  return FACTORS.filter((f) => f.category === category);
}

/**
 * The swap catalog the marginal-impact engine ranks (spec §6.4). Each swap is
 * evaluated against the user's actual logged data.
 */
export const SWAP_CATALOG: readonly SwapDefinition[] = [
  {
    id: 'swap.beef-to-chicken',
    title: 'Swap beef for chicken',
    category: 'food',
    fromFactorId: 'food.beef',
    toFactorId: 'food.chicken',
    fraction: 1,
  },
  {
    id: 'swap.beef-to-plant',
    title: 'Swap beef for plant-based (lentils)',
    category: 'food',
    fromFactorId: 'food.beef',
    toFactorId: 'food.lentils',
    fraction: 1,
  },
  {
    id: 'swap.lamb-to-chicken',
    title: 'Swap lamb for chicken',
    category: 'food',
    fromFactorId: 'food.lamb',
    toFactorId: 'food.chicken',
    fraction: 1,
  },
  {
    id: 'swap.car-petrol-to-metro',
    title: 'Take the metro instead of the car',
    category: 'transport',
    fromFactorId: 'transport.car.petrol',
    toFactorId: 'transport.metro',
    fraction: 1,
  },
  {
    id: 'swap.car-diesel-to-metro',
    title: 'Take the metro instead of the diesel car',
    category: 'transport',
    fromFactorId: 'transport.car.diesel',
    toFactorId: 'transport.metro',
    fraction: 1,
  },
  {
    id: 'swap.short-car-to-cycle',
    title: 'Cycle your short car trips',
    category: 'transport',
    fromFactorId: 'transport.car.petrol',
    toFactorId: 'transport.cycle',
    fraction: 0.25,
  },
  {
    id: 'swap.cut-car-20',
    title: 'Cut car kilometres by 20%',
    category: 'transport',
    fromFactorId: 'transport.car.petrol',
    fraction: 0.2,
  },
  {
    id: 'swap.grid-to-renewable',
    title: 'Switch to renewable electricity',
    category: 'energy',
    fromFactorId: 'energy.electricity.IN',
    toFactorId: 'energy.electricity.renewable',
    fraction: 1,
  },
  {
    id: 'swap.grid-global-to-renewable',
    title: 'Switch to renewable electricity',
    category: 'energy',
    fromFactorId: 'energy.electricity.global',
    toFactorId: 'energy.electricity.renewable',
    fraction: 1,
  },
  {
    id: 'swap.reduce-electricity-10',
    title: 'Cut AC/heating use by ~10%',
    category: 'energy',
    fromFactorId: 'energy.electricity.IN',
    fraction: 0.1,
  },
] as const;
