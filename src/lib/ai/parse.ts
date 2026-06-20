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

/** Strips code fences and parses+validates the model output. Throws on mismatch. */
export function extractAndValidate(raw: string): ParsedActivity[] {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const json: unknown = JSON.parse(cleaned);
  const result = aiParseOutputSchema.parse(json);
  return result.activities;
}

/** Full pipeline: prompt the model, extract, validate. Throws on any failure. */
export async function parseActivitiesFromText(text: string): Promise<ParsedActivity[]> {
  const raw = await generateText(buildParsePrompt(text));
  return extractAndValidate(raw);
}
