'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/apiClient';
import type { StoredActivity } from '@/lib/dto';
import type { Activity } from '@/lib/engine';
import type { AsyncStatus } from './types';

export interface UseSimulationBaseline {
  /** One entry per factor (amounts summed), suitable for the engine simulate(). */
  baseline: Activity[];
  status: AsyncStatus;
}

/**
 * Loads the week's activities and collapses them to one entry per factor (with
 * summed amounts) — the baseline the what-if simulator runs against client-side.
 */
export function useSimulationBaseline(): UseSimulationBaseline {
  const api = useApi();
  const [baseline, setBaseline] = useState<Activity[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await api<{ activities: StoredActivity[] }>('/api/activities?period=week');
        const byFactor = new Map<string, Activity>();
        for (const activity of res.activities) {
          const existing = byFactor.get(activity.factorId);
          if (existing) existing.amount += activity.amount;
          else byFactor.set(activity.factorId, { ...activity });
        }
        if (active) {
          setBaseline([...byFactor.values()]);
          setStatus('ready');
        }
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [api]);

  return { baseline, status };
}
