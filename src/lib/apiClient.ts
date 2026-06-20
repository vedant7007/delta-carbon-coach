'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { ApiErrorBody } from '@/lib/server/http';

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Narrows an unknown JSON body to the structured API error shape. */
function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null
  );
}

/** Builds a client error from a failed response and its parsed body. */
function toClientError(status: number, body: unknown): ApiClientError {
  if (isApiErrorBody(body)) {
    const { code, message, fields } = body.error;
    return new ApiClientError(status, code, message, fields);
  }
  return new ApiClientError(status, 'internal', 'Request failed');
}

/**
 * Hook returning an authenticated fetch helper. Attaches the bearer token,
 * parses the structured error shape, and throws {@link ApiClientError} so
 * callers can surface field-level messages without leaking internals.
 *
 * @returns A typed `fetch` wrapper: `<T>(path, init?) => Promise<T>`.
 */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers);
      headers.set('content-type', 'application/json');
      const token = await getToken();
      if (token) headers.set('authorization', `Bearer ${token}`);

      const res = await fetch(path, { ...init, headers });
      const text = await res.text();
      const data: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) throw toClientError(res.status, data);
      // Trust boundary: the caller declares the expected success shape.
      return data as T;
    },
    [getToken],
  );
}
