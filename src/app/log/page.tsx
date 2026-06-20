'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useApi, ApiClientError } from '@/lib/apiClient';
import { getFactor, roundForDisplay } from '@/lib/engine';
import { ManualLog } from '@/components/log/ManualLog';
import type { AiParseResponse, StoredActivity } from '@/lib/dto';

export default function LogPage() {
  return (
    <AppShell>
      <LogContent />
    </AppShell>
  );
}

function LogContent() {
  const api = useApi();
  const { notify } = useToast();
  const [recent, setRecent] = useState<StoredActivity[]>([]);
  const manualRef = useRef<HTMLSelectElement>(null);

  const loadRecent = useCallback(async () => {
    try {
      const res = await api<{ activities: StoredActivity[] }>('/api/activities?period=week');
      setRecent(res.activities);
    } catch {
      /* non-fatal: list just stays as-is */
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
        const msg = err instanceof ApiClientError ? err.message : 'Could not save — try again.';
        notify(msg, 'warning');
      }
    },
    [api, notify],
  );

  const removeActivity = useCallback(
    async (id: string) => {
      const prev = recent;
      setRecent((r) => r.filter((a) => a.id !== id)); // optimistic
      try {
        await api(`/api/activities/${id}`, { method: 'DELETE' });
      } catch {
        setRecent(prev); // rollback
        notify('Could not delete — restored.', 'warning');
      }
    },
    [api, notify, recent],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Log your day</h1>

      <NaturalLanguageBox
        onParsed={addActivity}
        onUnavailable={() => {
          notify('Quick-type unavailable — add it manually.', 'warning');
          manualRef.current?.focus();
        }}
      />

      <ManualLog ref={manualRef} onAdd={addActivity} />

      <Card>
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Nothing logged yet this week. Add something above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  <span className="font-medium">{getFactor(a.factorId).label}</span>{' '}
                  <span className="text-sm text-[var(--color-ink-faint)]">
                    {a.amount} {getFactor(a.factorId).unit} · {roundForDisplay(a.kgCO2e)} kg CO₂e
                    {a.source === 'ai' && ' · via quick-type'}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void removeActivity(a.id)}
                  aria-label={`Delete ${getFactor(a.factorId).label}`}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NaturalLanguageBox({
  onParsed,
  onUnavailable,
}: {
  onParsed: (factorId: string, amount: number) => Promise<void>;
  onUnavailable: () => void;
}) {
  const api = useApi();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; amount: number }[]>([]);

  async function parse() {
    if (!text.trim()) return;
    setBusy(true);
    setPending([]);
    try {
      const res = await api<AiParseResponse>('/api/ai/parse', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res.degraded || res.activities.length === 0) {
        onUnavailable();
      } else {
        setPending(res.activities);
      }
    } catch {
      // Any failure (incl. rate-limit 429) falls back to manual entry.
      onUnavailable();
    } finally {
      setBusy(false);
    }
  }

  async function confirmAll() {
    for (const a of pending) {
      await onParsed(a.factorId, a.amount);
    }
    setPending([]);
    setText('');
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Describe your day</h2>
      <p className="text-sm text-[var(--color-ink-soft)]">
        e.g. &ldquo;drove 30km and had a steak&rdquo;. We&apos;ll turn it into entries you confirm —
        the numbers are always computed by Delta, never the AI.
      </p>
      <div className="mt-3 flex gap-2">
        <label htmlFor="nl" className="sr-only">
          Describe your day
        </label>
        <input
          id="nl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="drove 30km, had a steak…"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2"
        />
        <Button onClick={() => void parse()} disabled={busy || !text.trim()}>
          {busy ? 'Reading…' : 'Quick-type'}
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          <p className="text-sm font-medium">Confirm these entries:</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pending.map((a, i) => (
              <li key={`${a.factorId}-${i}`} className="flex items-center justify-between">
                <span>
                  {getFactor(a.factorId).label} — {a.amount} {getFactor(a.factorId).unit}
                </span>
                <span className="text-[var(--color-ink-faint)] tabular-nums">
                  {roundForDisplay(getFactor(a.factorId).kgCO2ePerUnit * a.amount)} kg
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void confirmAll()}>
              Save all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending([])}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
