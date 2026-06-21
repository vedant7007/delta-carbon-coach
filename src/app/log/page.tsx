'use client';

import { useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ManualLog } from '@/components/log/ManualLog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/apiClient';
import type { AiParseResponse } from '@/lib/dto';
import { getFactor, roundForDisplay } from '@/lib/engine';
import { useActivityLog } from '@/lib/hooks/useActivityLog';

export default function LogPage() {
  return (
    <AppShell>
      <LogContent />
    </AppShell>
  );
}

function LogContent() {
  const { notify } = useToast();
  const { recent, addActivity, removeActivity } = useActivityLog();
  const manualRef = useRef<HTMLSelectElement>(null);

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
