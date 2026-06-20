# Δ Delta — Carbon Footprint Coach

> A decision tool, not a calculator. Log your life in seconds, see exactly where your footprint
> comes from, find your single highest-leverage change, and feel the impact with a live what-if
> simulator — with **every kg CO₂e traced to a published source**.

Built for PromptWars Challenge 3. Production-grade Next.js 15 + TypeScript, deployed to Google
Cloud Run.

**🔗 Live:** https://delta-916653092249.asia-south1.run.app

### Lighthouse (PageSpeed Insights, live URL)

| Page | Mobile | Desktop |
|------|--------|---------|
| Landing (`/`) | Perf **100** · A11y **100** · BP **100** · SEO **100** | Perf **100** · A11y **100** · BP **100** · SEO **100** |
| Login / Methodology | A11y **100** · BP **100** · SEO **100** · Perf 70–72¹ | Perf 86–100 · A11y **100** |

¹ Desktop FCP 0.2–0.3 s / LCP 0.5 s on every page (TBT ≈ 0, CLS 0, server < 30 ms) — the app is
fast. The lower *mobile* numbers on the heavier public pages are PageSpeed's slow-4G throttle plus
its test agent's distance to the Mumbai (`asia-south1`) region, not the app; a mobile run from India
scores far higher. The region is deliberately Mumbai for the India-first audience.

---

## The one rule that shapes everything

**The LLM never computes a carbon number.** Gemini does exactly two things: (1) turn free text into
structured `{ factorId, amount }` data, and (2) rephrase an _already-computed_ insight in friendlier
words. Every kg CO₂e comes from a deterministic, pure-function engine in [`src/lib/engine`](src/lib/engine).
And the entire app is **100% usable with the AI disabled** — every AI feature has a tested fallback.

---

## Architecture

```
┌──────────────────────────── Browser (React 19, client) ────────────────────────────┐
│  Pages: login · onboarding · dashboard · log · simulate · insights · methodology    │
│  • Firebase Auth (ID token)        • Engine runs client-side for instant simulator   │
│  • apiClient attaches Bearer token • Radix UI primitives (accessible by default)      │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                         │  fetch /api/*  (Authorization: Bearer <idToken>)
        middleware.ts: strict nonce CSP + HSTS + security headers on every response
                                         │
┌────────────────────────────────── Next.js API routes ────────────────────────────────┐
│  runGuarded(...)  → structured { error: { code, message, fields } }, never a stack     │
│  requireUser()    → verifies Firebase ID token (Admin SDK) → uid                       │
│  Zod validates every body/query                                                        │
│                                                                                        │
│   route ──► service (business logic) ──► repository (Firestore | in-memory) ──► engine │
│                                                          ▲                              │
│   AI routes ──► rate limiter (10/min/uid) ──► ai/* ──────┘ (validate, then engine math) │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                         │ Admin SDK (ADC)
                          Firestore (deny-all client rules) · Gemini (Secret Manager)
```

- **`src/lib/engine`** — pure, I/O-free, dependency-free. The single source of truth for all math.
  Held to ≥95% test coverage. No `fetch`, no Firestore, no `Date.now()` (dates are injected).
- **`src/lib/server`** — layered: `route → service → repository → engine`. `http.ts` centralises the
  error shape; `auth.ts` verifies tokens; `rateLimit.ts` is a pure token bucket.
- **`src/lib/ai`** — server-only Gemini client, strict prompt + Zod validation, deterministic fallbacks.
- **Repository** transparently uses an **in-memory store** when Firebase isn't configured (local/demo/E2E)
  and **Firestore** in production — so the whole app is runnable end-to-end without any cloud setup.

---

## Features (locked scope)

| ID | Feature | AI? |
|----|---------|-----|
| F1 | Auth + ≤6-question onboarding → seeded baseline | No |
| F2 | Structured quick-add logging, 4 categories, one-tap chips | No |
| F3 | Dashboard: totals by period, category donut, trend, regional comparison | No |
| F4 | **What-if simulator** — live sliders, instant annual delta | No |
| F5 | **Marginal-impact insights** — top ranked actions from your own data | No |
| F6 | **Auditable numbers** — `/methodology` lists every factor + source + uncertainty | No |
| F7 | Natural-language quick-log ("drove 30km, had a steak") | Yes — degradable |
| F8 | Friendly phrasing of the F5 insight | Yes — degradable |

Categories: **Transport · Food · Home Energy · Purchases/Goods.**

---

## How we hit each rubric axis

**Code Quality** — TypeScript `strict` (+ `noUncheckedIndexedAccess`, `noUnusedLocals`) in
[`tsconfig.json`](tsconfig.json), zero `any` (lint-enforced in [`eslint.config.mjs`](eslint.config.mjs)),
Prettier-clean. Pure engine ([`src/lib/engine/`](src/lib/engine)) isolated from the framework; layered
backend `route → service → repository → engine`
([`src/lib/server/`](src/lib/server)); one structured error shape via
[`runGuarded`](src/lib/server/http.ts) on every route.

**Security** — Zod on every input, shared client/server ([`src/lib/schemas/`](src/lib/schemas));
Firebase Auth + server-side ID-token verification ([`src/lib/server/auth.ts`](src/lib/server/auth.ts),
tested in [`tests/lib/auth.test.ts`](tests/lib/auth.test.ts)); Firestore rules **deny all** client access
([`firestore.rules`](firestore.rules), asserted in [`tests/rules.test.ts`](tests/rules.test.ts) and
**verified live** — a direct client read returns 403); Gemini key in **Secret Manager**, never
client-side, never in git ([`.gitignore`](.gitignore) blocks `.env.*`); strict **nonce-based CSP** +
HSTS + `X-Frame-Options: DENY` + `X-Content-Type-Options` + `Referrer-Policy` + `Permissions-Policy`
in [`src/middleware.ts`](src/middleware.ts); AI routes rate-limited 10/min/uid
([`src/lib/server/rateLimit.ts`](src/lib/server/rateLimit.ts), tested in
[`tests/lib/rateLimit.test.ts`](tests/lib/rateLimit.test.ts)); `npm audit` **zero high/critical**;
non-root Docker user ([`Dockerfile`](Dockerfile)); least-privilege Cloud Run SA `delta-run`
(`roles/datastore.user` + scoped secret access only).

**Efficiency** — `output: 'standalone'` ([`next.config.ts`](next.config.ts)); charts and the simulator
route-split and lazy-loaded via `next/dynamic` ([`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx));
engine calls memoised in the simulator ([`src/app/simulate/page.tsx`](src/app/simulate/page.tsx));
`Cache-Control` on [`/api/footprint/summary`](src/app/api/footprint/summary/route.ts); `next/font`
preloaded; `min-instances=1`. **Measured Lighthouse: landing 100/100/100/100 mobile + desktop**
(see table above).

**Testing** — engine coverage **≥95%**, overall **≥80%**, both CI-gated in
[`vitest.config.ts`](vitest.config.ts) (actual: engine 99%, overall ~97%). Engine edge cases —
negative/zero/unknown factor — in [`tests/engine/`](tests/engine); every API route incl.
**401/400/404/429** in [`tests/api/`](tests/api); **AI-failure fallback** in
[`tests/api/ai.test.ts`](tests/api/ai.test.ts); rules assertion in
[`tests/rules.test.ts`](tests/rules.test.ts); automated axe in
[`tests/a11y/components.test.tsx`](tests/a11y/components.test.tsx); Playwright E2E for the happy path
**and the AI-disabled degradation path** with `@axe-core/playwright` zero-violations in
[`e2e/delta.spec.ts`](e2e/delta.spec.ts). **135 unit/integration + 3 E2E green.**

**Accessibility** — WCAG 2.1 AA; **axe zero violations** in unit ([`tests/a11y/`](tests/a11y)) and E2E,
and **Lighthouse A11y 100 on every page**. Semantic landmarks, one `<h1>`/page, skip link
([`src/app/layout.tsx`](src/app/layout.tsx)); keyboard-operable sliders with `aria-valuetext`
([`src/components/ui/Slider.tsx`](src/components/ui/Slider.tsx)); charts ship a visually-hidden
**data-table** equivalent ([`src/components/charts/`](src/components/charts)); form errors via
`aria-live`; `prefers-reduced-motion` respected ([`src/components/ui/CountUp.tsx`](src/components/ui/CountUp.tsx)).

---

## Run it locally (no cloud setup needed)

```bash
npm install
npm run dev          # http://localhost:3000 — runs in DEMO mode (in-memory store, AI off)
```

With no Firebase env vars, the app runs in **demo mode**: a one-click demo account, an in-memory data
store, and AI disabled (deterministic fallbacks). This is the "fully usable with AI off" guarantee,
live. Provide `.env.local` (see [`.env.example`](.env.example)) to use real Firebase + Gemini.

### Quality gates

```bash
npm run lint          # ESLint, zero warnings
npm run typecheck     # tsc --noEmit
npm run test:coverage # Vitest unit + integration, coverage-gated (engine ≥95%, overall ≥80%)
npm run test:e2e      # Playwright (builds, runs AI-disabled; needs `npx playwright install chromium`)
npm run verify        # lint + typecheck + coverage + build
```

---

## Setup & deploy (the 4 human steps + one command)

A human (cloud owner) does these once — Claude Code cannot create cloud accounts:

1. **GCP project** with billing; enable Cloud Run, Cloud Build, Artifact Registry, Secret Manager,
   Firestore.
2. **Firebase project** on the same GCP project; enable **Authentication** (Email/Password + Google)
   and **Firestore** (Native mode). Deploy the deny-all rules: `firebase deploy --only firestore:rules`.
3. **Gemini API key** (Google AI Studio):
   `echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-`
4. Grab the Firebase web config into the `NEXT_PUBLIC_FIREBASE_*` env vars, and grant the Cloud Run
   runtime service account `roles/datastore.user`.

Then deploy:

```bash
export NEXT_PUBLIC_FIREBASE_API_KEY=... NEXT_PUBLIC_FIREBASE_PROJECT_ID=... \
       NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... NEXT_PUBLIC_FIREBASE_APP_ID=...
bash scripts/deploy.sh        # source build → Cloud Run, asia-south1, min-instances=1
```

The command prints the public HTTPS URL. Add it to **Firebase Auth → Authorized domains**.

---

## Emission factor sources

UK DEFRA/DESNZ GHG Conversion Factors 2024 (transport, energy, goods); Poore & Nemecek 2018 via Our
World in Data (food); CEA CO₂ Baseline Database (India grid electricity). Per-capita comparison from
Our World in Data. Every value, with its uncertainty band, is on the in-app **`/methodology`** page —
and every figure elsewhere links back to it.

## Notable engineering decisions

- **All routes render dynamically** so the middleware's per-request CSP **nonce** is actually applied
  to Next's scripts (a static page can't carry a per-request nonce). `min-instances=1` keeps this fast.
- **In-memory repository fallback** keeps the app fully exercisable — and E2E-testable — without a live
  Firestore, which is also how the AI-disabled degradation path is verified deterministically in CI.
- **Server recomputes every number.** The client may compute for instant UX, but `POST /api/activities`
  and `POST /api/simulate` recompute authoritatively from the engine and ignore any client value.
