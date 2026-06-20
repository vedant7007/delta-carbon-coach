import { computeActivityEmissions, getFactor } from '@/lib/engine';
import type { ActivityInput, OnboardingInput } from '@/lib/schemas';
import { createActivity } from '../repository/activityRepository';
import { upsertUserProfile } from '../repository/userRepository';

/** Representative defaults used to seed a baseline when an answer is skipped. */
const DAYS_PER_MONTH = 30;
const DEFAULT_DAILY_KM = 15;
const FALLBACK_FOOD_SERVING_KG = 0.15;
const RICE_SERVING_KG = 0.15;
const VEGETABLE_SERVING_KG = 0.2;
const DAILY_KWH_PER_PERSON = 3;
const DEFAULT_TRANSPORT = 'transport.car.petrol';
const DEFAULT_ENERGY = 'energy.electricity.IN';

/**
 * Converts ≤6 onboarding answers into a representative single day's seed
 * activities so the dashboard isn't empty. Pure mapping — no I/O — so it's unit-tested.
 *
 * @param input - The onboarding answers (any field may be absent → a default is used).
 * @returns Seed activities (amounts in each factor's unit) for one representative day.
 */
export function buildSeedActivities(input: OnboardingInput): ActivityInput[] {
  const seeds: ActivityInput[] = [];

  // Transport: spread monthly km across the chosen mode.
  const mode = input.mainTransport ?? DEFAULT_TRANSPORT;
  const dailyKm = input.monthlyKm ? input.monthlyKm / DAYS_PER_MONTH : DEFAULT_DAILY_KM;
  if (dailyKm > 0) seeds.push({ factorId: mode, amount: round(dailyKm) });

  // Food: one representative main meal by diet, plus a staple (rice) and vegetables.
  const dietFactor = dietToFactor(input.diet);
  seeds.push({
    factorId: dietFactor,
    amount: getFactor(dietFactor).defaultServing ?? FALLBACK_FOOD_SERVING_KG,
  });
  seeds.push({ factorId: 'food.rice', amount: RICE_SERVING_KG });
  seeds.push({ factorId: 'food.vegetables', amount: VEGETABLE_SERVING_KG });

  // Home energy: per-person daily electricity.
  const energyFactor = input.energySource ?? DEFAULT_ENERGY;
  seeds.push({ factorId: energyFactor, amount: round(DAILY_KWH_PER_PERSON * input.householdSize) });

  return seeds;
}

function dietToFactor(diet: OnboardingInput['diet']): string {
  switch (diet) {
    case 'meat-heavy':
      return 'food.beef';
    case 'vegetarian':
      return 'food.cheese';
    case 'vegan':
      return 'food.lentils';
    case 'average':
    default:
      return 'food.chicken';
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Persists a seeded baseline (one representative day) and the user's profile.
 * @param uid - The owning user's id.
 * @param email - The user's email (stored on the profile), or null.
 * @param input - The onboarding answers.
 * @param now - Injected clock for the seed timestamps.
 * @returns The number of seed activities created.
 */
export async function seedBaseline(
  uid: string,
  email: string | null,
  input: OnboardingInput,
  now: Date,
): Promise<number> {
  const seeds = buildSeedActivities(input);
  await Promise.all(
    seeds.map((seed) =>
      createActivity(uid, {
        factorId: seed.factorId,
        amount: seed.amount,
        kgCO2e: computeActivityEmissions(seed).kgCO2e,
        loggedAt: now.toISOString(),
        source: 'manual',
      }),
    ),
  );

  await upsertUserProfile({
    uid,
    email,
    onboarding: input,
    createdAt: now.toISOString(),
  });

  return seeds.length;
}
