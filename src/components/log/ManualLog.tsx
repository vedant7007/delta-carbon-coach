'use client';

import { forwardRef, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CATEGORIES,
  factorsByCategory,
  getFactor,
  roundForDisplay,
  type Category,
} from '@/lib/engine';

const CATEGORY_LABELS: Record<Category, string> = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Home energy',
  goods: 'Purchases',
};

interface Props {
  onAdd: (factorId: string, amount: number) => Promise<void>;
}

/** Manual quick-add: category → type → amount, with one-tap serving chips. */
export const ManualLog = forwardRef<HTMLSelectElement, Props>(function ManualLog({ onAdd }, ref) {
  const [category, setCategory] = useState<Category>('transport');
  const factors = useMemo(() => factorsByCategory(category), [category]);
  const [factorId, setFactorId] = useState(factors[0]?.id ?? '');
  const [amount, setAmount] = useState<string>('');

  const factor = factorId ? getFactor(factorId) : factors[0];
  const numericAmount = Number(amount);
  const previewKg =
    factor && Number.isFinite(numericAmount) && numericAmount > 0
      ? roundForDisplay(factor.kgCO2ePerUnit * numericAmount)
      : null;

  function onCategoryChange(next: Category) {
    setCategory(next);
    const first = factorsByCategory(next)[0];
    setFactorId(first?.id ?? '');
    setAmount('');
  }

  const chipFactors = factors.filter((f) => f.defaultServing);

  return (
    <Card>
      <h2 className="text-lg font-semibold">Add manually</h2>

      {/* One-tap chips for common items. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {chipFactors.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => void onAdd(f.id, f.defaultServing!)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-sm hover:border-[var(--color-primary)]"
          >
            + {f.label}{' '}
            <span className="text-[var(--color-ink-faint)]">
              ({f.defaultServing} {f.unit})
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="cat" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="cat"
            ref={ref}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as Category)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="factor" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="factor"
            value={factorId}
            onChange={(e) => setFactorId(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            {factors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount {factor && <span className="text-[var(--color-ink-faint)]">({factor.unit})</span>}
          </label>
          <input
            id="amount"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-ink-soft)]" aria-live="polite">
          {previewKg !== null ? `≈ ${previewKg} kg CO₂e` : 'Enter an amount to preview.'}
        </p>
        <Button
          disabled={!factor || !(numericAmount > 0)}
          onClick={async () => {
            if (factor && numericAmount > 0) {
              await onAdd(factor.id, numericAmount);
              setAmount('');
            }
          }}
        >
          Add entry
        </Button>
      </div>
    </Card>
  );
});
