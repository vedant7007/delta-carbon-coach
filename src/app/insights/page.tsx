'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { roundForDisplay } from '@/lib/engine';
import { useInsights } from '@/lib/hooks/useInsights';

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsContent />
    </AppShell>
  );
}

function InsightsContent() {
  const { actions, status, phrasing } = useInsights();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your biggest levers</h1>
        <p className="text-[var(--color-ink-soft)]">
          Ranked by how much each change would save per year, computed from your own logged data.
        </p>
      </div>

      {status === 'loading' && <Card>Finding your highest-impact actions…</Card>}

      {status === 'error' && (
        <Card role="alert">
          <p className="text-[var(--color-danger)]">Couldn&apos;t load your insights right now.</p>
        </Card>
      )}

      {status === 'ready' && actions && actions.length === 0 && (
        <Card>
          <p className="text-[var(--color-ink-soft)]">
            We need a bit more data to rank your levers.{' '}
            <Link href="/log" className="font-semibold text-[var(--color-primary)] underline">
              Log a few activities
            </Link>{' '}
            and check back.
          </p>
        </Card>
      )}

      {status === 'ready' && actions && actions.length > 0 && (
        <>
          {phrasing && (
            <Card className="bg-[var(--color-accent-soft)]">
              <p className="text-lg font-medium text-[var(--color-ink)]">{phrasing}</p>
            </Card>
          )}

          <ol className="space-y-4">
            {actions.map((action, i) => (
              <li key={action.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink-faint)]">
                        #{i + 1}
                      </p>
                      <h2 className="text-xl font-semibold">{action.title}</h2>
                      <p className="mt-1 text-[var(--color-ink-soft)]">{action.description}</p>
                      <p className="mt-3 text-sm">
                        Sources:{' '}
                        {action.sourceFactorIds.map((id, idx) => (
                          <span key={id}>
                            {idx > 0 && ', '}
                            <Link
                              href={`/methodology#${id}`}
                              className="text-[var(--color-primary)] underline"
                            >
                              {id}
                            </Link>
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold tabular-nums text-[var(--color-accent)]">
                        {roundForDisplay(action.annualKgSaved)}
                      </p>
                      <p className="text-xs text-[var(--color-ink-faint)]">kg CO₂e / year</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link href={`/simulate?action=${action.id}`}>Simulate this</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
