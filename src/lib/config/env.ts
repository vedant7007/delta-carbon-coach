import { z } from 'zod';
import { GEMINI_DEFAULT_MODEL } from '@/lib/ai/constants';

/**
 * Single, validated source of truth for SERVER-side environment variables.
 *
 * Read lazily (per call) rather than snapshotted at import, because tests and
 * some runtimes mutate `process.env` between calls. Every field is optional with
 * a documented fallback, so a missing var degrades gracefully instead of failing
 * the build — the app is designed to run with nothing provisioned (demo mode).
 *
 * This module must only be imported by server code; it never reaches the client.
 */
/** A non-empty string env var: missing OR empty (common in CI) both resolve to undefined. */
const optionalNonEmpty = z.string().min(1).optional().catch(undefined);

const serverEnvSchema = z.object({
  GEMINI_API_KEY: optionalNonEmpty,
  GEMINI_MODEL: optionalNonEmpty,
  FIREBASE_PROJECT_ID: optionalNonEmpty,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: optionalNonEmpty,
  FIREBASE_SERVICE_ACCOUNT: optionalNonEmpty,
  AI_DISABLED: z.string().optional(),
  DELTA_E2E: z.string().optional(),
});

const ENV_FLAG_ON = '1';

export interface ServerConfig {
  /** Gemini API key, or undefined when AI is unconfigured. */
  geminiApiKey: string | undefined;
  /** Gemini model id (defaults to {@link GEMINI_DEFAULT_MODEL}). */
  geminiModel: string;
  /** GCP/Firebase project id used by the Admin SDK; undefined → demo mode. */
  firebaseProjectId: string | undefined;
  /** Inline service-account JSON for local dev, if provided. */
  firebaseServiceAccount: string | undefined;
  /** True when AI is explicitly force-disabled. */
  aiDisabled: boolean;
  /** True in the E2E/test harness (stubs auth, forces the in-memory store). */
  isE2E: boolean;
}

/** Parses and returns the validated server config from the current environment. */
export function getServerConfig(): ServerConfig {
  // All fields optional → parse never throws; unknown env keys are stripped.
  const env = serverEnvSchema.parse(process.env);
  return {
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL,
    firebaseProjectId: env.FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseServiceAccount: env.FIREBASE_SERVICE_ACCOUNT,
    aiDisabled: env.AI_DISABLED === ENV_FLAG_ON,
    isE2E: env.DELTA_E2E === ENV_FLAG_ON,
  };
}

/** True only when AI is not force-disabled AND an API key is configured. */
export function isAiEnabled(): boolean {
  const config = getServerConfig();
  return !config.aiDisabled && Boolean(config.geminiApiKey);
}

/**
 * True when there is no Firestore to talk to (no project id) or we're in the E2E
 * harness — in either case the app uses the in-memory repository implementation.
 */
export function shouldUseInMemoryStore(): boolean {
  const config = getServerConfig();
  return config.isE2E || !config.firebaseProjectId;
}
