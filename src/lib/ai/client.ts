import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_REQUEST_TIMEOUT_MS, GEMINI_DEFAULT_MODEL } from './constants';

/**
 * Server-only Gemini access. The key lives in Secret Manager and is never
 * exposed to the client. AI is strictly optional: if it's disabled or the key
 * is absent, callers fall back to deterministic behaviour.
 */

/** True only when AI is not force-disabled AND an API key is configured. */
export function isAiEnabled(): boolean {
  return process.env.AI_DISABLED !== '1' && Boolean(process.env.GEMINI_API_KEY);
}

const MODEL = process.env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL;

/**
 * Runs a prompt against Gemini with a hard timeout.
 * @param prompt - The fully-formed prompt text.
 * @param timeoutMs - Abort budget in milliseconds (defaults to {@link AI_REQUEST_TIMEOUT_MS}).
 * @returns The model's raw text response.
 * @throws If AI is not configured, the request errors, or it exceeds the timeout.
 */
export async function generateText(
  prompt: string,
  timeoutMs: number = AI_REQUEST_TIMEOUT_MS,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await model.generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: controller.signal },
    );
    return result.response.text();
  } finally {
    clearTimeout(timer);
  }
}
