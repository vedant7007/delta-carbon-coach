import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-only Gemini access. The key lives in Secret Manager and is never
 * exposed to the client. AI is strictly optional: if it's disabled or the key
 * is absent, callers fall back to deterministic behaviour.
 */

export function isAiEnabled(): boolean {
  return process.env.AI_DISABLED !== '1' && Boolean(process.env.GEMINI_API_KEY);
}

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

/** Runs a prompt with a hard timeout. Resolves to the raw text, or throws. */
export async function generateText(prompt: string, timeoutMs = 4000): Promise<string> {
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
