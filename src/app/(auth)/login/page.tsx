'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { user, loading, demoMode, signInEmail, signInGoogle, signInDemo } = useAuth();
  const router = useRouter();
  const [isNew, setIsNew] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInEmail(email, password, isNew);
      router.replace(isNew ? '/onboarding' : '/dashboard');
    } catch {
      setError('Sign-in failed. Check your email and password and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleProvider(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      router.replace('/dashboard');
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto max-w-md px-6 py-6">
        <Link href="/" className="text-lg font-semibold text-[var(--color-primary)]">
          Δ Delta
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-md px-6 py-8">
        <Card>
          <h1 className="text-2xl font-bold">{isNew ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {isNew ? 'Start tracking in under a minute.' : 'Sign in to see your footprint.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isNew ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
              />
            </div>

            <p aria-live="assertive" className="min-h-5 text-sm text-[var(--color-danger)]">
              {error}
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {isNew ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-ink-faint)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => void handleProvider(signInGoogle)}
            >
              Continue with Google
            </Button>
            {demoMode && (
              <Button
                variant="ghost"
                className="w-full"
                disabled={busy}
                onClick={() => void handleProvider(signInDemo)}
              >
                Explore the demo (no account needed)
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
            {isNew ? 'Already have an account?' : 'New to Delta?'}{' '}
            <button
              type="button"
              onClick={() => setIsNew((v) => !v)}
              className="font-semibold text-[var(--color-primary)] underline"
            >
              {isNew ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </Card>
      </main>
    </div>
  );
}
