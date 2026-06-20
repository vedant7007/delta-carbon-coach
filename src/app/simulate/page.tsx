'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { Slider } from '@/components/ui/Slider';
import { useApi } from '@/lib/apiClient';
import type { StoredActivity } from '@/lib/dto';
import {
  SWAP_CATALOG,
  getFactor,
  projectAnnual,
  roundForDisplay,
  simulate,
  type Activity,
  type Adjustment,
} from '@/lib/engine';

export default function SimulatePage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-[var(--color-ink-soft)]">Loading simulator…</p>}>
        <SimulateContent />
      </Suspense>
    </AppShell>
  );
}

function SimulateContent() {
  const api = useApi();
  const params = useSearchParams();
  const [baseline, setBaseline] = useState<Activity[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // scale[factorId] = 0..100 (% of current kept)
  const [scales, setScales] = useState<Record<string, number>>({});
  const [swaps, setSwaps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ activities: StoredActivity[] }>('/api/activities?period=week');
        // Collapse to one entry per factor with summed amount.
        const byFactor = new Map<string, Activity>();
        for (const a of res.activities) {
          const existing = byFactor.get(a.factorId);
          if (existing) existing.amount += a.amount;
          else byFactor.set(a.factorId, { ...a });
        }
        setBaseline([...byFactor.values()]);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    })();
  }, [api]);

  // Hydrate from ?action=<swapId> ("Simulate this" from insights).
  useEffect(() => {
    const action = params.get('action');
    if (action) setSwaps((s) => ({ ...s, [action]: true }));
  }, [params]);

  const sliderFactorIds = useMemo(() => baseline.map((a) => a.factorId), [baseline]);

  // Build adjustments from sliders + active swaps.
  const adjustments = useMemo<Adjustment[]>(() => {
    const list: Adjustment[] = [];
    for (const a of baseline) {
      const pct = scales[a.factorId];
      if (pct !== undefined && pct !== 100) {
        list.push({ factorId: a.factorId, scale: pct / 100 });
      }
    }
    for (const swap of SWAP_CATALOG) {
      if (swaps[swap.id] && baseline.some((a) => a.factorId === swap.fromFactorId)) {
        list.push({
          factorId: swap.fromFactorId,
          scale: 1 - swap.fraction,
          ...(swap.toFactorId ? { swapToFactorId: swap.toFactorId } : {}),
        });
      }
    }
    return list;
  }, [baseline, scales, swaps]);

  const result = useMemo(() => simulate(baseline, adjustments), [baseline, adjustments]);
  const annualAfter = projectAnnual(result.after, 'week');
  const annualBefore = projectAnnual(result.before, 'week');
  const annualSaved = annualBefore - annualAfter;

  const reset = useCallback(() => {
    setScales({});
    setSwaps({});
  }, []);

  const applicableSwaps = SWAP_CATALOG.filter((s) =>
    baseline.some((a) => a.factorId === s.fromFactorId),
  );

  if (status === 'loading') {
    return <p className="text-[var(--color-ink-soft)]">Loading your data…</p>;
  }
  if (status === 'error') {
    return (
      <Card role="alert">
        <p className="text-[var(--color-danger)]">Couldn&apos;t load your data for the simulator.</p>
      </Card>
    );
  }
  if (baseline.length === 0) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">What-if simulator</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Log a few activities first, then come back to play with the levers.{' '}
          <Link href="/log" className="font-semibold text-[var(--color-primary)] underline">
            Go to logging
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">What-if simulator</h1>
        <p className="text-[var(--color-ink-soft)]">
          Drag the levers and watch your projected annual footprint change instantly.
        </p>
      </div>

      <Card className="bg-[var(--color-primary)] text-[var(--color-on-primary)]">
        <p className="text-sm opacity-90">Projected annual footprint</p>
        <p className="mt-1 text-5xl font-bold tabular-nums">
          <CountUp value={annualAfter} /> <span className="text-2xl font-medium">kg CO₂e/yr</span>
        </p>
        <p className="mt-2 text-sm">
          {annualSaved > 0.5 ? (
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 font-semibold">
              Saving ~{roundForDisplay(annualSaved)} kg CO₂e/year
            </span>
          ) : (
            <span className="opacity-90">Move a lever to see your potential saving.</span>
          )}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reduce by category</h2>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
        <div className="mt-4 space-y-5">
          {sliderFactorIds.map((factorId) => {
            const pct = scales[factorId] ?? 100;
            return (
              <Slider
                key={factorId}
                id={`slider-${factorId}`}
                label={getFactor(factorId).label}
                value={pct}
                onValueChange={(v) => setScales((s) => ({ ...s, [factorId]: v }))}
                valueText={`${pct}% of current`}
              />
            );
          })}
        </div>
      </Card>

      {applicableSwaps.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Try a swap</h2>
          <ul className="mt-3 space-y-2">
            {applicableSwaps.map((swap) => (
              <li key={swap.id}>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(swaps[swap.id])}
                    onChange={(e) => setSwaps((s) => ({ ...s, [swap.id]: e.target.checked }))}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span>{swap.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
