import Link from 'next/link';

const PILLARS = [
  {
    title: 'Understand',
    body: 'A clear breakdown of where your footprint actually comes from — every number traced to a published source.',
  },
  {
    title: 'Track',
    body: 'Log your day in seconds with one-tap chips or plain English. No 40-field forms, no guilt.',
  },
  {
    title: 'Reduce',
    body: 'See your single highest-leverage change, then drag a slider and watch the impact in real time.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight text-[var(--color-primary)]">
          Δ Delta
        </span>
        <Link
          href="/login"
          className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
        >
          Sign in
        </Link>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-6">
        <section className="py-16 sm:py-24">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[var(--color-ink-faint)]">
            Carbon footprint coach
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            A decision tool for your carbon footprint — not another guilt machine.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-ink-soft)]">
            Most carbon apps make you fill 40 fields, show a pie chart, and make you feel bad.
            Delta lets you log your life in seconds, shows exactly where your footprint comes from,
            and tells you the single highest-leverage change you can make — sourced and honest.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/methodology"
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-base font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              See our methodology
            </Link>
          </div>
        </section>

        <section aria-labelledby="pillars-heading" className="pb-24">
          <h2 id="pillars-heading" className="sr-only">
            What Delta does
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <li
                key={p.title}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">{p.title}</h3>
                <p className="mt-2 text-[var(--color-ink-soft)]">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-[var(--color-ink-faint)]">
          Delta · Every kg CO₂e is computed by a deterministic engine and traced to a published
          emission factor. The AI never invents a number.
        </div>
      </footer>
    </div>
  );
}
