# MoneyMind UK

A free, gamified course on UK money and your rights — pay, benefits, work rights,
debt, savings, renting/buying, pensions and tax — in plain English, with
interactive tools and an AI tutor. No accounts, no ads, no database: progress is
saved in the browser (`localStorage`) and the only server code is a thin proxy
for the AI tutor.

**Stack:** React + TypeScript + Vite + TailwindCSS, deployed to Cloudflare Pages.
The AI tutor runs in a single Cloudflare Pages Function (`functions/api/chat.ts`).

---

## Local development

```bash
bun install
bun run dev          # Vite dev server (UI only) → http://localhost:5173
```

The AI tutor calls `POST /api/chat`, which only exists when the Pages Function
runs. To test the tutor locally, run the full Pages stack:

```bash
echo 'ANTHROPIC_API_KEY = "sk-ant-..."' > .dev.vars   # git-ignored
bun run pages:dev    # builds, then serves dist + functions via Wrangler
```

`.dev.vars` is git-ignored — never commit a key.

Other scripts:

```bash
bun run build        # type-check (app + functions) then production build → dist/
bun run typecheck    # type-check only
```

---

## The AI tutor proxy

- Route: `POST /api/chat`
- Request: `{ moduleId: number, messages: { role: 'user' | 'assistant', content: string }[] }`
- Response: `{ reply: string, error?: string }`

The client sends only a `moduleId` and the chat history. The function looks up
that module's vetted `tutorSystemPrompt` from `src/content/modules.ts`
**server-side** and injects it, so the guardrails (UK-only, no regulated advice,
on-topic) can't be tampered with from the browser. It calls the Anthropic
Messages API with `claude-sonnet-4-20250514`.

`ANTHROPIC_API_KEY` is read from `context.env` and never reaches the client.
Basic per-isolate IP rate limiting is in place (best-effort; see the TODO in the
function about moving to KV/Durable Objects for durable limits).

---

## Deployment (Cloudflare Pages)

This project lives in the `Aaron-1411/CC` monorepo and deploys automatically on
push to `master` via `.github/workflows/deploy.yml` (job `deploy-moneymind-uk`).

- **Build command:** `bun install && bun run build`
- **Output directory:** `dist`
- **Functions:** the `functions/` directory is auto-detected by Wrangler and
  routed at `/api/*`; the `_redirects` SPA fallback handles every other path.
- **CF Pages project:** `moneymind-uk-app` → https://moneymind-uk-app.pages.dev

### Required environment variable

The tutor needs one secret on the Pages project:

| Variable            | Where it lives                         | Notes                          |
| ------------------- | -------------------------------------- | ------------------------------ |
| `ANTHROPIC_API_KEY` | Cloudflare Pages → project → env vars  | Set as **secret** (encrypted). |

In CI this is injected from the GitHub Actions secret `ANTHROPIC_API_KEY` (the
deploy job PATCHes it onto the Pages project, matching the pattern used by other
monorepo projects). **Add that GitHub secret once** for the tutor to work in
production:

```bash
gh secret set ANTHROPIC_API_KEY --repo Aaron-1411/CC   # paste a real sk-ant-... key
```

Until the key is set, the whole app works; the tutor returns a friendly
"not switched on yet" message instead of crashing.

---

## Project layout

```
functions/api/chat.ts   AI tutor proxy (Pages Function)
src/content/            modules.ts · rights.ts · help.ts · constants.ts (verified UK figures)
src/lib/                types.ts (shared contract) · storage.ts (progress) · gamification.ts (XP/badges)
src/features/           dashboard · module · quiz · tools · tutor
src/components/          reusable UI
```

All course content and every figure live in `src/content/` — components never
hardcode lesson text, quiz questions, or numbers.
