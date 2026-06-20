'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { useApi } from '@/lib/apiClient';
import { roundForDisplay, type Period } from '@/lib/engine';
import type { FootprintSummary } from '@/lib/dto';

const CategoryDonut = dynamic(() => import('@/components/charts/CategoryDonut'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const TrendChart = dynamic(() => import('@/components/charts/TrendChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return <div aria-hidden className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />;
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const api = useApi();
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<FootprintSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(
    async (p: Period) => {
      setStatus('loading');
      try {
        const summary = await api<FootprintSummary>(`/api/footprint/summary?period=${p}`);
        setData(summary);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    },
    [api],
  );

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const uncertain = (data?.byCategory.goods ?? 0) > 0;
  const vsRegional =
    data && data.regionalAvg > 0 ? Math.round((data.total / data.regionalAvg) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Your footprint</h1>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {status === 'error' && (
        <Card role="alert">
          <p className="text-[var(--color-danger)]">
            We couldn&apos;t load your footprint. Please refresh to try again.
          </p>
          <Button className="mt-3" size="sm" onClick={() => void load(period)}>
            Retry
          </Button>
        </Card>
      )}

      {status === 'loading' && (
        <Card>
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </Card>
      )}

      {status === 'ready' && data && (
        <>
          <Card className="bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <p className="text-sm opacity-90">Total this {period}</p>
            <p className="mt-1 text-5xl font-bold tabular-nums">
              {uncertain && <span aria-hidden>~</span>}
              {roundForDisplay(data.total)}{' '}
              <span className="text-2xl font-medium opacity-90">kg CO₂e</span>
            </p>
            {vsRegional !== null && (
              <p className="mt-2 text-sm opacity-90">
                That&apos;s {vsRegional}% of the average person&apos;s footprint for the same period.
              </p>
            )}
            {uncertain && (
              <p className="mt-2 text-xs opacity-80">
                ~ indicates included high-uncertainty estimates (e.g. purchases). See{' '}
                <Link href="/methodology" className="underline">
                  methodology
                </Link>
                .
              </p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold">By category</h2>
              <div className="mt-4">
                <CategoryDonut byCategory={data.byCategory} />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">Daily trend</h2>
              <div className="mt-4">
                <TrendChart trend={data.trend} />
              </div>
            </Card>
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Find your biggest lever</h2>
              <p className="text-sm text-[var(--color-ink-soft)]">
                See your highest-impact changes, or play with the simulator.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary">
                <Link href="/insights">View insights</Link>
              </Button>
              <Button asChild>
                <Link href="/simulate">Open simulator</Link>
              </Button>
            </div>
          </Card>

          {data.total === 0 && (
            <Card>
              <p className="text-[var(--color-ink-soft)]">
                Nothing logged for this period yet.{' '}
                <Link href="/log" className="font-semibold text-[var(--color-primary)] underline">
                  Log your first activity
                </Link>
                .
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
