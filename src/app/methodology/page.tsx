import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FACTORS,
  REGIONAL_AVERAGES,
  factorsByCategory,
  type Category,
  type Uncertainty,
} from '@/lib/engine';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'Every emission factor Delta uses, with its value, source, and uncertainty. The number behind every figure in the app.',
};

const CATEGORY_LABELS: Record<Category, string> = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Home energy',
  goods: 'Purchases & goods',
};

const UNCERTAINTY_COPY: Record<Uncertainty, string> = {
  low: 'Low — well-established figure',
  medium: 'Medium — varies by source/region',
  high: 'High — rough estimate, treat as indicative',
};

export default function MethodologyPage() {
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-[var(--color-primary)]">
            Δ Delta
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--color-primary)] underline">
            Back to app
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Methodology</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Delta never lets the AI invent a number. Every kg CO₂e is{' '}
          <code className="rounded bg-[var(--color-surface-2)] px-1">amount × emission factor</code>,
          computed by a deterministic engine. Here is every factor we use, where it comes from, and
          how confident we are in it.
        </p>

        <section aria-labelledby="how" className="mt-8">
          <h2 id="how" className="text-xl font-semibold">
            How projections work
          </h2>
          <p className="mt-2 text-[var(--color-ink-soft)]">
            We annualise a period&apos;s total as{' '}
            <code className="rounded bg-[var(--color-surface-2)] px-1">
              (period total ÷ period days) × 365
            </code>
            , treating a month as 30 days for a stable, explainable figure. The regional comparison
            uses published per-capita averages:{' '}
            {Object.values(REGIONAL_AVERAGES).map((r, i) => (
              <span key={r.region}>
                {i > 0 && '; '}
                <a href={r.sourceUrl} className="text-[var(--color-primary)] underline">
                  {r.label}
                </a>{' '}
                ≈ {r.annualKgPerCapita} kg/yr
              </span>
            ))}
            .
          </p>
        </section>

        {categories.map((category) => (
          <section key={category} aria-labelledby={`cat-${category}`} className="mt-10">
            <h2 id={`cat-${category}`} className="text-xl font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left">
                    <th scope="col" className="py-2 pr-4">
                      Factor
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Value
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Source
                    </th>
                    <th scope="col" className="py-2">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {factorsByCategory(category).map((f) => (
                    <tr
                      key={f.id}
                      id={f.id}
                      className="border-b border-[var(--color-border)] align-top target:bg-[var(--color-primary-soft)]"
                    >
                      <th scope="row" className="py-2 pr-4 text-left font-medium">
                        {f.label}
                        <span className="block font-mono text-xs text-[var(--color-ink-faint)]">
                          {f.id}
                        </span>
                      </th>
                      <td className="py-2 pr-4 tabular-nums">
                        {f.kgCO2ePerUnit} kg / {f.unit}
                      </td>
                      <td className="py-2 pr-4">
                        <a href={f.sourceUrl} className="text-[var(--color-primary)] underline">
                          {f.source}
                        </a>
                      </td>
                      <td className="py-2">{UNCERTAINTY_COPY[f.uncertainty]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <p className="mt-10 text-sm text-[var(--color-ink-faint)]">
          {FACTORS.length} factors in total. Values are rounded from published figures and are
          estimates, not precise measurements — especially those marked high confidence-uncertainty.
        </p>
      </main>
    </div>
  );
}
