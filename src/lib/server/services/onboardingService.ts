import { computeActivityEmissions, getFactor } from '@/lib/engine';
import type { ActivityInput, OnboardingInput } from '@/lib/schemas';
import { createActivity } from '../repository/activityRepository';
import { upsertUserProfile } from '../repository/userRepository';

/**
 * Converts ≤6 onboarding answers into a representative day's worth of seed
 * activities so the dashboard isn't empty. Pure mapping (testable) + persistence.
 */
export function buildSeedActivities(input: OnboardingInput): ActivityInput[] {
  const seeds: ActivityInput[] = [];

  // Transport: spread monthly km across the chosen mode (default 15 km/day petrol car).
  const mode = input.mainTransport ?? 'transport.car.petrol';
  const dailyKm = input.monthlyKm ? input.monthlyKm / 30 : 15;
  if (dailyKm > 0) seeds.push({ factorId: mode, amount: round(dailyKm) });

  // Food: one representative main meal by diet.
  const dietFactor = dietToFactor(input.diet);
  seeds.push({ factorId: dietFactor, amount: getFactor(dietFactor).defaultServing ?? 0.15 });
  // Everyone gets a staple (rice) + vegetables.
  seeds.push({ factorId: 'food.rice', amount: 0.15 });
  seeds.push({ factorId: 'food.vegetables', amount: 0.2 });

  // Home energy: per-person daily electricity.
  const energyFactor = input.energySource ?? 'energy.electricity.IN';
  seeds.push({ factorId: energyFactor, amount: round(3 * input.householdSize) });

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
