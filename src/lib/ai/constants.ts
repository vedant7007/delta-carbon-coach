/**
 * Tunable constants for the AI layer, centralised so every limit is auditable
 * in one place rather than scattered as magic numbers across call sites.
 */

/** Hard timeout for a single Gemini request; we abort and fall back past this. */
export const AI_REQUEST_TIMEOUT_MS = 4000;

/** Upper bound on accepted AI phrasing length, to reject runaway output. */
export const MAX_PHRASING_CHARS = 400;

/**
 * Default Gemini model. `gemini-1.5-flash` is retired (404s); 2.5-flash is the
 * current fast model. Overridable via the GEMINI_MODEL env var.
 */
export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
