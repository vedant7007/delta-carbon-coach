import { roundForDisplay } from '@/lib/engine';
import type { AiExplainInput } from '@/lib/schemas';
import { generateText } from './client';
import { AI_REQUEST_TIMEOUT_MS, MAX_PHRASING_CHARS } from './constants';

/**
 * Friendly phrasing of an ALREADY-COMPUTED insight. The number is fixed by the
 * engine and passed in; the model only chooses words. The deterministic template
 * below is the fallback and is information-identical — just less polished.
 */

export function fallbackPhrasing(insight: AiExplainInput['insight']): string {
  const kg = roundForDisplay(insight.annualKgSaved);
  return `Your biggest win: ${lowerFirst(insight.title)} to save about ${kg} kg CO₂e per year.`;
}

export function buildExplainPrompt(insight: AiExplainInput['insight']): string {
  const kg = roundForDisplay(insight.annualKgSaved);
  return [
    'Rephrase this carbon-saving tip in a warm, encouraging, non-preachy way.',
    'Keep it to 1-2 sentences. Do NOT change the number.',
    `Tip: "${insight.title}". Annual saving: ${kg} kg CO2e.`,
    'Respond with ONLY JSON: {"text":"..."}.',
  ].join('\n');
}

/** Returns AI phrasing, or throws so the caller can use the fallback template. */
export async function explainInsight(insight: AiExplainInput['insight']): Promise<string> {
  const raw = await generateText(buildExplainPrompt(insight), AI_REQUEST_TIMEOUT_MS);
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const json: unknown = JSON.parse(cleaned);
  if (typeof json === 'object' && json !== null && 'text' in json && typeof json.text === 'string') {
    const text = json.text.trim();
    if (text.length > 0 && text.length <= MAX_PHRASING_CHARS) return text;
  }
  throw new Error('AI returned an unusable phrasing');
}

function lowerFirst(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
