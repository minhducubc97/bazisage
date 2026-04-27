# BaziSage ☯

> **Your AI Grandmaster in Your Pocket.** Authentic Bazi (Four Pillars of Destiny) readings with True Solar Time precision — and a persistent AI advisor who knows your chart, remembers your life, and reaches out *before* critical moments arrive.

[![CI](https://github.com/minhducubc97/bazisage/actions/workflows/ci.yml/badge.svg)](https://github.com/minhducubc97/bazisage/actions)

---

## What Makes BaziSage Different

| Feature | Typical Bazi App | BaziSage |
|---|---|---|
| Solar time correction | ❌ Uses wrong birth time | ✅ True Solar Time via Equation of Time |
| AI model | Static text blocks | ✅ Context-aware Grandmaster (24h clean slate) |
| Proactive guidance | ❌ You ask, it answers | ✅ Monthly briefings, clash alerts |
| Accuracy validation | ❌ No test suite | ✅ 33 golden-file fixtures, CI enforced |
| Four Pillars source | Questionable | ✅ `tyme4ts` — professional-grade astronomy |

---

## Project Structure

```
bazisage/
├── apps/
│   └── web/                     # Next.js 15 web app
│       ├── app/
│       │   ├── page.tsx          # Landing page
│       │   ├── onboarding/       # 6-step birth data wizard
│       │   ├── chart/demo/       # Demo chart (no login needed)
│       │   ├── chat/             # Grandmaster chat (streaming)
│       │   ├── dashboard/        # User home — saved charts
│       │   ├── auth/             # Login + OAuth callback
│       │   └── api/              # API routes
│       │       ├── chart/compute # Compute + save chart
│       │       └── chat          # Streaming AI chat
│       └── lib/supabase/         # Supabase SSR client
│
├── packages/
│   ├── bazi-core/               # Deterministic Bazi engine
│   │   ├── src/
│   │   │   ├── pillars.ts        # Year/Month/Day/Hour pillars
│   │   │   ├── solar-time.ts     # True Solar Time correction
│   │   │   ├── ten-gods.ts       # Ten Gods (十神)
│   │   │   ├── day-master.ts     # Day Master strength analysis
│   │   │   ├── luck-pillars.ts   # Luck Pillar timeline
│   │   │   └── index.ts          # computeChart() entrypoint
│   │   └── tests/
│   │       └── golden.test.ts    # 33 validated fixtures
│   │
│   └── ai-client/               # Provider-agnostic AI wrapper
│       └── src/
│           ├── providers.ts      # DeepSeek/Claude/Grok factory
│           └── system-prompt.ts  # Grandmaster persona builder
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # 14 tables + RLS policies
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript 5.9 |
| **Monorepo** | Turborepo |
| **Database** | Supabase (PostgreSQL + pgvector + RLS) |
| **Auth** | Supabase Auth (magic link + Google OAuth) |
| **AI** | Vercel AI SDK — DeepSeek V3 (default), Claude, Grok supported |
| **Bazi Engine** | `tyme4ts` — True Solar Time + 60-cycle calculations |
| **Styling** | Vanilla CSS — dark luxury design system |
| **CI** | GitHub Actions |

---

## Getting Started (Local Dev)

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [DeepSeek](https://platform.deepseek.com) API key (or Claude/Grok)

### 1. Clone & install
```bash
git clone https://github.com/minhducubc97/bazisage.git
cd bazisage
npm install
```

### 2. Environment
```bash
cp apps/web/.env.example apps/web/.env.local
# Fill in Supabase + AI keys
```

Required keys in `apps/web/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI — choose one:
AI_PROVIDER=deepseek          # or: claude | grok
DEEPSEEK_API_KEY=sk-...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database
Go to your Supabase project → **SQL Editor** → paste and run:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Run
```bash
npm run dev --filter=web
# → http://localhost:3000
```

### 5. Test the engine
```bash
cd packages/bazi-core
npm test
# → 33 tests passing
```

---

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/chart/demo` | Demo chart — no login needed |
| `/onboarding` | 6-step birth data wizard |
| `/auth/login` | Magic link + Google sign-in |
| `/dashboard` | Your saved charts |
| `/chat` | Grandmaster AI chat (streaming) |

---

## AI Provider

The Grandmaster chat is provider-agnostic. Switch with one env var:

```bash
AI_PROVIDER=deepseek   # DeepSeek V3 — default, ~$0.14/M tokens
AI_PROVIDER=claude     # Claude Sonnet — best persona maintenance  
AI_PROVIDER=grok       # Grok 3 via xAI
```

---

## Roadmap

### ✅ Weeks 1–4 (Done)
- [x] `bazi-core` engine — 33/33 golden tests, True Solar Time
- [x] Turborepo monorepo + GitHub Actions CI
- [x] Supabase schema — 14 tables, full RLS, pgvector ready
- [x] Landing page — dark luxury design system
- [x] 6-step onboarding — geocoder, 3/4 Pillar mode
- [x] Demo chart page — real engine output
- [x] Auth — magic link + Google OAuth
- [x] dashboard + chart persistence
- [x] Grandmaster chat — DeepSeek V3 streaming, chart context injection, 24-hour clean slate memory
- [x] Chart Editing — Edit date/time inputs without cloning chart profiles

### 🔜 Week 5
- [ ] Monthly briefing generator
- [ ] Current year/month overlay on chart
- [ ] "Explain this pillar" expandable panels
- [ ] User memory — Grandmaster remembers key life events

### 🔜 Week 6+
- [ ] Stripe integration — Free / Pro / Premium tiers
- [ ] Push notifications — clash alerts
- [ ] Birth time rectification
- [ ] Relationship compatibility chart

---

## Accuracy Philosophy

> "A reading is only as trustworthy as its calculation."

Every chart uses:
- **True Solar Time** — longitude-based correction + Equation of Time
- **LiChun boundary** (立春, ~Feb 4) for the Bazi year, not Jan 1
- **`tyme4ts`** for all astronomical calculations
- **33 golden fixtures** — validated against known reference charts, CI-enforced

---

## License

Private — all rights reserved. © 2025 BaziSage.
