# BaziSage 🌟

> *"Your Grandmaster in Your Pocket"*

An AI-powered Bazi (Four Pillars of Destiny) advisor — combining a hardened deterministic calculation engine with a persistent Claude AI Grandmaster persona, proactive monthly briefings, and personal day alerts.

## What makes this different

- **Not a calculator, a relationship** — persistent AI advisor with cross-session memory
- **Accuracy moat** — True Solar Time correction, LiChun year boundary, validated against 100 golden fixtures
- **Proactive** — monthly briefings and chart-triggered clash alerts reach out to you
- **Pedagogical** — teaches you to read your own chart via inline "💡 Learn" panels

## Project Structure

```
bazisage/
├── apps/
│   └── web/              # Next.js 15 App Router + PWA
├── packages/
│   ├── bazi-core/        # Deterministic calculation engine (tyme4ts-backed)
│   ├── shared/           # Types, hooks, permissions
│   ├── ui/               # Radix UI + Tailwind primitives
│   └── ai-client/        # Claude AI wrapper, MCP tools, prompts
└── supabase/             # DB schema + migrations
```

## Status

| Component | Status |
|---|---|
| `bazi-core` engine | ✅ Complete — 33 golden tests passing |
| Next.js web app | 🔨 In progress |
| Supabase schema | ⏳ Pending |
| Grandmaster chat | ⏳ Pending |
| Notifications | ⏳ Pending |
| Monetization (Stripe) | ⏳ Pending |

## Tech Stack

- **Monorepo**: Turborepo
- **Web**: Next.js 15, Tailwind CSS, Framer Motion, Radix UI
- **Bazi engine**: `tyme4ts` + custom TypeScript
- **Auth + DB**: Supabase (Postgres + pgvector)
- **AI**: Claude Sonnet (readings/chat) + Claude Haiku (daily advice/alerts)
- **Payments**: Stripe
- **Deployment**: Vercel

## Getting Started

```bash
npm install
npm run dev         # Start web app at localhost:3000
cd packages/bazi-core && npm test   # Run engine tests
```

## Environment Variables

Copy `.env.example` → `.env.local` in `apps/web/` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

Built with [Antigravity](https://antigravity.dev) — AI pair programming.
