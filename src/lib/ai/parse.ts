import { FACTORS } from '@/lib/engine';
import { aiParseOutputSchema, type ParsedActivity } from '@/lib/schemas';
import { generateText } from './client';

/**
 * Natural-language → structured activities. The model's ONLY job is to map free
 * text to `{ factorId, amount }` using the known factor list. It returns no CO₂
 * numbers — the engine computes those. Output is strictly validated; anything
 * off-list or malformed is rejected and the caller falls back to manual entry.
 */

function factorMenu(): string {
  return FACTORS.map((f) => `- ${f.id} (${f.label}, unit: ${f.unit})`).join('\n');
}

/**
 * Builds the strict extraction prompt, embedding the allowed factor list.
 * @param text - The user's free-text description of their day.
 * @returns The full prompt instructing the model to emit only `{ factorId, amount }` JSON.
 */
export function buildParsePrompt(text: string): string {
  return [
    'You convert a short description of someone\'s day into structured activity data.',
    'Map each activity to exactly one factor id from this list and the quantity in that factor\'s unit:',
    factorMenu(),
    '',
    'Rules:',
    '- Use ONLY factor ids from the list above. If something has no match, skip it.',
    '- "amount" is the quantity in the factor\'s unit (km, kg, kWh, litre, item). For a meal portion, use a sensible weight in kg.',
    '- Do NOT compute or include any CO2 numbers. Only factorId and amount.',
    '- Respond with ONLY minified JSON of the form {"activities":[{"factorId":"...","amount":<number>}]}.',
    '',
    `Description: "${text}"`,
  ].join('\n');
}

/**
 * Strips code fences, parses, and strictly validates the model output against
 * the known-factor allow-list — the anti-hallucination guard.
 * @param raw - The model's raw text response.
 * @returns The validated activities (`factorId` is guaranteed to be a known factor).
 * @throws If the text isn't valid JSON or contains an unknown factor / bad amount.
 */
export function extractAndValidate(raw: string): ParsedActivity[] {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const json: unknown = JSON.parse(cleaned);
  const result = aiParseOutputSchema.parse(json);
  return result.activities;
}

/**
 * Full pipeline: prompt the model, extract, validate.
 * @param text - The user's free-text description.
 * @returns The validated parsed activities for the user to confirm before saving.
 * @throws If the model errors/times out or returns unusable output (caller falls back to manual).
 */
export async function parseActivitiesFromText(text: string): Promise<ParsedActivity[]> {
  const raw = await generateText(buildParsePrompt(text));
  return extractAndValidate(raw);
}
