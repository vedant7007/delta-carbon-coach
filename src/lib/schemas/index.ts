import { z } from 'zod';
import { isKnownFactor } from '@/lib/engine';

/**
 * Zod schemas shared across the client and server. Every API boundary parses
 * input through one of these; the same schemas power instant client-side form
 * validation, so the rules never drift.
 */

/** A factor id that must exist in the engine dataset. */
export const factorIdSchema = z
  .string()
  .min(1)
  .refine(isKnownFactor, { message: 'Unknown emission factor' });

export const periodSchema = z.enum(['day', 'week', 'month']);
export type PeriodInput = z.infer<typeof periodSchema>;

/** Logging a single activity. Amount is positive and bounded to a sane range. */
export const activityInputSchema = z.object({
  factorId: factorIdSchema,
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(1_000_000, 'Amount is implausibly large'),
});
export type ActivityInput = z.infer<typeof activityInputSchema>;

/** A single what-if adjustment. */
export const adjustmentSchema = z.object({
  factorId: factorIdSchema,
  scale: z.number().min(0).max(10).optional(),
  swapToFactorId: factorIdSchema.optional(),
});
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const simulateInputSchema = z.object({
  adjustments: z.array(adjustmentSchema).max(50),
});
export type SimulateInput = z.infer<typeof simulateInputSchema>;

/** Onboarding answers seed a baseline; all fields optional (skippable). */
export const onboardingSchema = z.object({
  region: z.enum(['IN', 'GLOBAL']).default('IN'),
  householdSize: z.number().int().min(1).max(20).default(1),
  mainTransport: z
    .enum(['transport.car.petrol', 'transport.scooter', 'transport.metro', 'transport.bus'])
    .optional(),
  diet: z.enum(['meat-heavy', 'average', 'vegetarian', 'vegan']).optional(),
  energySource: z
    .enum(['energy.electricity.IN', 'energy.electricity.global', 'energy.electricity.renewable'])
    .optional(),
  monthlyKm: z.number().min(0).max(100_000).optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** AI parse request. */
export const aiParseInputSchema = z.object({
  text: z.string().min(1, 'Describe your day first').max(500, 'Keep it under 500 characters'),
});
export type AiParseInput = z.infer<typeof aiParseInputSchema>;

/** The strict shape we force the model to return: NO numbers it computed itself. */
export const parsedActivitySchema = z.object({
  factorId: factorIdSchema,
  amount: z.number().positive().max(1_000_000),
});
export const aiParseOutputSchema = z.object({
  activities: z.array(parsedActivitySchema).max(20),
});
export type ParsedActivity = z.infer<typeof parsedActivitySchema>;

/** AI explain request — the already-computed insight to re-phrase. */
export const aiExplainInputSchema = z.object({
  insight: z.object({
    title: z.string().min(1).max(200),
    annualKgSaved: z.number().nonnegative(),
  }),
});
export type AiExplainInput = z.infer<typeof aiExplainInputSchema>;
