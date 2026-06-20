'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/log', label: 'Log' },
  { href: '/simulate', label: 'Simulate' },
  { href: '/insights', label: 'Insights' },
  { href: '/methodology', label: 'Methodology' },
] as const;

/** Authenticated app frame: nav landmark, auth guard, main content region. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut, demoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <output className="flex min-h-dvh items-center justify-center text-[var(--color-ink-soft)]">
        Loading your dashboard…
      </output>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-lg font-semibold text-[var(--color-primary)]">
            Δ Delta
          </Link>
          <nav aria-label="Primary" className="flex-1 overflow-x-auto">
            <ul className="flex gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium',
                        active
                          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
        {demoMode && (
          <p className="bg-[var(--color-warn-soft)] px-4 py-1.5 text-center text-xs text-[var(--color-warn)]">
            Demo mode — data is per-browser. Connect Firebase for real accounts.
          </p>
        )}
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
