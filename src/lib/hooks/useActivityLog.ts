'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useApi, ApiClientError } from '@/lib/apiClient';
import type { StoredActivity } from '@/lib/dto';
import { getFactor } from '@/lib/engine';

export interface UseActivityLog {
  recent: StoredActivity[];
  /** Logs an activity (the server recomputes emissions) and prepends it. */
  addActivity: (factorId: string, amount: number) => Promise<void>;
  /** Optimistically removes an activity, rolling back on failure. */
  removeActivity: (id: string) => Promise<void>;
}

/** Owns the recent-activity list and its create/delete flows, with toasts. */
export function useActivityLog(): UseActivityLog {
  const api = useApi();
  const { notify } = useToast();
  const [recent, setRecent] = useState<StoredActivity[]>([]);

  const loadRecent = useCallback(async () => {
    try {
      const res = await api<{ activities: StoredActivity[] }>('/api/activities?period=week');
      setRecent(res.activities);
    } catch {
      /* non-fatal: the list simply stays as-is */
    }
  }, [api]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const addActivity = useCallback(
    async (factorId: string, amount: number) => {
      try {
        const res = await api<{ activity: StoredActivity }>('/api/activities', {
          method: 'POST',
          body: JSON.stringify({ factorId, amount }),
        });
        setRecent((prev) => [res.activity, ...prev]);
        notify(`Logged ${getFactor(factorId).label}`, 'success');
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Could not save — try again.';
        notify(message, 'warning');
      }
    },
    [api, notify],
  );

  const removeActivity = useCallback(
    async (id: string) => {
      const previous = recent;
      setRecent((list) => list.filter((a) => a.id !== id)); // optimistic
      try {
        await api(`/api/activities/${id}`, { method: 'DELETE' });
      } catch {
        setRecent(previous); // rollback
        notify('Could not delete — restored.', 'warning');
      }
    },
    [api, notify, recent],
  );

  return { recent, addActivity, removeActivity };
}
