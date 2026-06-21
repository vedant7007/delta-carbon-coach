/* eslint-disable no-console -- this module is the single sanctioned console boundary */

/**
 * Minimal structured logger for server code. Emits one JSON line per event
 * (level, message, optional context, ISO timestamp) so entries are queryable in
 * Cloud Logging. Centralised so call sites never touch `console` directly and
 * error context is captured consistently.
 */

type LogLevel = 'warn' | 'error';

export type LogContext = Record<string, unknown>;

/** Normalises an unknown thrown value to a safe, loggable string. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    level,
    message,
    ...(context ? { context } : {}),
    time: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.warn(line);
}

export const logger = {
  warn: (message: string, context?: LogContext): void => emit('warn', message, context),
  error: (message: string, context?: LogContext): void => emit('error', message, context),
};
