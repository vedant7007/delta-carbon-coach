'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApi } from '@/lib/apiClient';
import type { OnboardingInput } from '@/lib/schemas';

/** Onboarding form state — every field is concrete (the API schema makes most optional). */
interface FormState {
  region: NonNullable<OnboardingInput['region']>;
  householdSize: number;
  mainTransport: NonNullable<OnboardingInput['mainTransport']>;
  diet: NonNullable<OnboardingInput['diet']>;
  energySource: NonNullable<OnboardingInput['energySource']>;
  monthlyKm: number;
}

const REGION_OPTIONS = [
  { value: 'IN', label: 'India' },
  { value: 'GLOBAL', label: 'Elsewhere' },
] as const satisfies readonly { value: FormState['region']; label: string }[];

const TRANSPORT_OPTIONS = [
  { value: 'transport.car.petrol', label: 'Car' },
  { value: 'transport.scooter', label: 'Scooter / motorbike' },
  { value: 'transport.bus', label: 'Bus' },
  { value: 'transport.metro', label: 'Metro / train' },
] as const satisfies readonly { value: FormState['mainTransport']; label: string }[];

const DIET_OPTIONS = [
  { value: 'meat-heavy', label: 'Meat with most meals' },
  { value: 'average', label: 'Mixed / average' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
] as const satisfies readonly { value: FormState['diet']; label: string }[];

const ENERGY_OPTIONS = [
  { value: 'energy.electricity.IN', label: 'Grid (India)' },
  { value: 'energy.electricity.global', label: 'Grid (elsewhere)' },
  { value: 'energy.electricity.renewable', label: 'Mostly renewable' },
] as const satisfies readonly { value: FormState['energySource']; label: string }[];

const DEFAULT_FORM: FormState = {
  region: 'IN',
  householdSize: 1,
  mainTransport: 'transport.car.petrol',
  diet: 'average',
  energySource: 'energy.electricity.IN',
  monthlyKm: 300,
};

const selectCls =
  'mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2';

/** Returns `value` when it's one of the allowed options, else `fallback` (no cast). */
function pick<T extends string>(value: string, options: readonly { value: T }[], fallback: T): T {
  return options.find((o) => o.value === value)?.value ?? fallback;
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api('/api/onboarding', { method: 'POST', body: JSON.stringify(form) });
      router.replace('/dashboard');
    } catch {
      setError('Could not save your baseline. You can skip and log activities directly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <main id="main" className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-3xl font-bold">Let&apos;s set your baseline</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Six quick questions so your dashboard isn&apos;t empty. Skip any — you can always log
          properly later.
        </p>

        <Card className="mt-6 space-y-5">
          <Field label="Where are you?" htmlFor="region">
            <EnumSelect
              id="region"
              value={form.region}
              options={REGION_OPTIONS}
              onChange={(v) => set('region', v)}
            />
          </Field>

          <Field label="People in your household" htmlFor="household">
            <input
              id="household"
              type="number"
              min={1}
              max={20}
              value={form.householdSize}
              onChange={(e) => set('householdSize', Number(e.target.value))}
              className={selectCls}
            />
          </Field>

          <Field label="Main way you get around" htmlFor="transport">
            <EnumSelect
              id="transport"
              value={form.mainTransport}
              options={TRANSPORT_OPTIONS}
              onChange={(v) => set('mainTransport', v)}
            />
          </Field>

          <Field label="Roughly how many km per month?" htmlFor="km">
            <input
              id="km"
              type="number"
              min={0}
              value={form.monthlyKm}
              onChange={(e) => set('monthlyKm', Number(e.target.value))}
              className={selectCls}
            />
          </Field>

          <Field label="Your diet" htmlFor="diet">
            <EnumSelect
              id="diet"
              value={form.diet}
              options={DIET_OPTIONS}
              onChange={(v) => set('diet', v)}
            />
          </Field>

          <Field label="Home electricity" htmlFor="energy">
            <EnumSelect
              id="energy"
              value={form.energySource}
              options={ENERGY_OPTIONS}
              onChange={(v) => set('energySource', v)}
            />
          </Field>

          <p aria-live="assertive" className="min-h-5 text-sm text-[var(--color-danger)]">
            {error}
          </p>

          <div className="flex gap-3">
            <Button className="flex-1" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Saving…' : 'Create my baseline'}
            </Button>
            <Button variant="ghost" onClick={() => router.replace('/dashboard')}>
              Skip
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

/** A `<select>` whose value is narrowed to the option union without a type cast. */
function EnumSelect<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(pick(e.target.value, options, value))}
      className={selectCls}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
