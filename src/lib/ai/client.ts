import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerConfig } from '@/lib/config/env';
import { AI_REQUEST_TIMEOUT_MS } from './constants';

/**
 * Server-only Gemini access. The key lives in Secret Manager and is never
 * exposed to the client. AI is strictly optional: if it's disabled or the key
 * is absent, callers fall back to deterministic behaviour.
 */

// Re-exported from the central config so callers keep a single import surface.
export { isAiEnabled } from '@/lib/config/env';

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
  const { geminiApiKey, geminiModel } = getServerConfig();
  if (!geminiApiKey) throw new Error('AI not configured');

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: geminiModel,
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
