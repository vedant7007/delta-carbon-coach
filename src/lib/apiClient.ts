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

/**
 * Hook returning an authenticated fetch helper. Attaches the bearer token,
 * parses the structured error shape, and throws ApiClientError so callers can
 * surface field-level messages without leaking internals.
 */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      headers.set('content-type', 'application/json');
      if (token) headers.set('authorization', `Bearer ${token}`);

      const res = await fetch(path, { ...init, headers });
      const text = await res.text();
      const data: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const body = data as ApiErrorBody | null;
        throw new ApiClientError(
          res.status,
          body?.error?.code ?? 'internal',
          body?.error?.message ?? 'Request failed',
          body?.error?.fields,
        );
      }
      return data as T;
    },
    [getToken],
  );
}
