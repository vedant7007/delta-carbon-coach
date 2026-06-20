'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApi } from '@/lib/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { OnboardingInput } from '@/lib/schemas';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OnboardingInput>({
    region: 'IN',
    householdSize: 1,
    mainTransport: 'transport.car.petrol',
    diet: 'average',
    energySource: 'energy.electricity.IN',
    monthlyKm: 300,
  });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

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

  function set<K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
            <select
              id="region"
              value={form.region}
              onChange={(e) => set('region', e.target.value as OnboardingInput['region'])}
              className={selectCls}
            >
              <option value="IN">India</option>
              <option value="GLOBAL">Elsewhere</option>
            </select>
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
            <select
              id="transport"
              value={form.mainTransport}
              onChange={(e) =>
                set('mainTransport', e.target.value as OnboardingInput['mainTransport'])
              }
              className={selectCls}
            >
              <option value="transport.car.petrol">Car</option>
              <option value="transport.scooter">Scooter / motorbike</option>
              <option value="transport.bus">Bus</option>
              <option value="transport.metro">Metro / train</option>
            </select>
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
            <select
              id="diet"
              value={form.diet}
              onChange={(e) => set('diet', e.target.value as OnboardingInput['diet'])}
              className={selectCls}
            >
              <option value="meat-heavy">Meat with most meals</option>
              <option value="average">Mixed / average</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </Field>

          <Field label="Home electricity" htmlFor="energy">
            <select
              id="energy"
              value={form.energySource}
              onChange={(e) =>
                set('energySource', e.target.value as OnboardingInput['energySource'])
              }
              className={selectCls}
            >
              <option value="energy.electricity.IN">Grid (India)</option>
              <option value="energy.electricity.global">Grid (elsewhere)</option>
              <option value="energy.electricity.renewable">Mostly renewable</option>
            </select>
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

const selectCls =
  'mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
