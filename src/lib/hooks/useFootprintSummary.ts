'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/lib/apiClient';
import type { FootprintSummary } from '@/lib/dto';
import type { Period } from '@/lib/engine';
import type { AsyncStatus } from './types';

export interface UseFootprintSummary {
  data: FootprintSummary | null;
  status: AsyncStatus;
  /** Re-fetches the summary (used by the retry affordance). */
  reload: () => void;
}

/**
 * Loads the footprint summary for a period, tracking loading/ready/error.
 * @param period - The reporting window to fetch.
 */
export function useFootprintSummary(period: Period): UseFootprintSummary {
  const api = useApi();
  const [data, setData] = useState<FootprintSummary | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      setData(await api<FootprintSummary>(`/api/footprint/summary?period=${period}`));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [api, period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, status, reload: () => void reload() };
}
