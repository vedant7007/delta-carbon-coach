'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/apiClient';
import type { AiExplainResponse, InsightsResponse } from '@/lib/dto';
import type { RankedAction } from '@/lib/engine';
import type { AsyncStatus } from './types';

export interface UseInsights {
  actions: RankedAction[] | null;
  status: AsyncStatus;
  /** Warm AI phrasing of the top action; null until it resolves (self-heals on failure). */
  phrasing: string | null;
}

/**
 * Loads ranked insights, then requests warm AI phrasing for the top action.
 * The phrasing request degrades silently — the deterministic description is
 * always shown regardless.
 */
export function useInsights(): UseInsights {
  const api = useApi();
  const [actions, setActions] = useState<RankedAction[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [phrasing, setPhrasing] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPhrasing = async (top: RankedAction): Promise<void> => {
      try {
        const explained = await api<AiExplainResponse>('/api/ai/explain', {
          method: 'POST',
          body: JSON.stringify({
            insight: { title: top.title, annualKgSaved: top.annualKgSaved },
          }),
        });
        if (active) setPhrasing(explained.text);
      } catch {
        /* explain endpoint already self-heals server-side; ignore here */
      }
    };

    void (async () => {
      try {
        const res = await api<InsightsResponse>('/api/insights?period=week');
        if (!active) return;
        setActions(res.actions);
        setStatus('ready');
        if (res.actions[0]) await loadPhrasing(res.actions[0]);
      } catch {
        if (active) setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [api]);

  return { actions, status, phrasing };
}
