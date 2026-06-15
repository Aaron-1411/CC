# SignalDesk

Single-user web app that ingests trading signals from a Discord channel, parses
each freeform message into a structured **trade card**, charts the proposed
entry / stop / target levels, and lets you log your own execution against the
signal to track personal performance.

> **Not financial advice.** SignalDesk records and charts signals you already
> receive; it never auto-executes anything. You place every trade yourself.

---

## Stack

| Layer       | Choice                                                                 |
|-------------|------------------------------------------------------------------------|
| Frontend    | React + TypeScript + Vite + TailwindCSS                                |
| Charts      | TradingView Lightweight Charts (`lightweight-charts`)                  |
| Backend     | Cloudflare Pages Functions (`/functions/api/*`)                        |
| Database    | Cloudflare D1 (SQLite)                                                  |
| Parsing     | Anthropic Messages API (`claude-haiku-4-5-20251001`), heuristic fallback |
| Candles     | Twelve Data (stocks/forex) · keyless Binance (crypto) — **never Finnhub** |

All secrets live **server-side** in Pages Functions env vars. The frontend
holds none. Every dependency is optional: the app boots and runs with **zero
backend config**, degrading gracefully (see the matrix below).

---

## Quick start (local, demo mode — no config needed)

```bash
bun install
bun run dev            # http://localhost:5190
```

With no backend bound, the API client falls back to bundled **demo data** and
the UI shows a "demo data" badge. This is enough to see the whole interface.

To run the **real** Functions + D1 locally:

```bash
cp .dev.vars.example .dev.vars   # then fill in whatever keys you have
bun run build                    # produce dist/
bun run d1:init                  # apply schema.sql to the LOCAL D1
bun run pages:dev                # wrangler pages dev with D1 bound as DB
```

Useful scripts (`package.json`):

| Script               | Does                                            |
|----------------------|-------------------------------------------------|
| `bun run dev`        | Vite dev server on :5190 (frontend, demo mode)  |
| `bun run build`      | `tsc -b && vite build` → `dist/`                |
| `bun run typecheck`  | Type-check app + functions, no emit             |
| `bun run pages:dev`  | `wrangler pages dev dist --d1 DB`               |
| `bun run d1:init`    | Apply `schema.sql` to the **local** D1          |

---

## Degradation matrix

The app never hard-fails on a missing var. Each one unlocks a capability:

| Env var               | When set                                  | When **unset**                                                              |
|-----------------------|-------------------------------------------|-----------------------------------------------------------------------------|
| *(none — DB unbound)* | —                                         | Frontend serves bundled demo signals; API routes that need D1 return 503.   |
| `DB` (D1 binding)     | Signals/trades/journal persist            | `requireDB` returns 503; candle cache is skipped (provider still fetched).  |
| `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID` | `/api/discord/sync` pulls new messages | Sync returns `source:'disabled'`; use the **Paste a signal** modal instead. |
| `ANTHROPIC_API_KEY`   | LLM parses messages into trade cards      | `parse.ts` falls back to a local **heuristic** parser.                      |
| `TWELVEDATA_API_KEY`  | Live candles for **stocks/forex**         | `/api/candles` returns `provider:'none', fallbackToImage:true` → UI shows the signal's chart screenshot. |
| *(crypto candles)*    | Always on via keyless Binance             | n/a — no key required.                                                      |
| `FINNHUB_API_KEY`     | Live quote + symbol search only           | Those extras are hidden. **Never used for candles** (403 on free tier).     |
| `APP_SHARED_SECRET`   | Gate checks `x-app-key` (constant-time)   | Gate is **open on localhost**, **closed (401) in production**.              |

---

## Full setup runbook (hand-off — these need you)

Everything below requires your own accounts, secrets, or Cloudflare infra, so
it is **not** done automatically. Work top-to-bottom; each step is independent
and the app keeps working with whatever you've completed so far.

### 1. Discord bot (signal ingestion)

1. <https://discord.com/developers/applications> → **New Application**.
2. **Bot** tab → **Add Bot** → **Reset Token** → copy it → this is
   `DISCORD_BOT_TOKEN`.
3. Under **Privileged Gateway Intents**, enable **Message Content Intent**.
4. **OAuth2 → URL Generator**: scope `bot`; permissions **View Channel** +
   **Read Message History**. Open the generated URL and add the bot to your
   server.
5. In Discord, enable Developer Mode (Settings → Advanced), right-click the
   signal channel → **Copy Channel ID** → this is `DISCORD_CHANNEL_ID`.

Without these, ingest still works via the **Paste a signal** modal.

### 2. API keys

- **Twelve Data** (stock/forex candles) — <https://twelvedata.com> free tier
  (~800 calls/day; the 60s D1 cache keeps you well under). → `TWELVEDATA_API_KEY`.
- **Anthropic** (LLM parsing) — <https://console.anthropic.com> → API key →
  `ANTHROPIC_API_KEY`. Optional; heuristic parser runs without it.
- **Finnhub** (optional quote/search only) — <https://finnhub.io> → `FINNHUB_API_KEY`.

### 3. Create D1 and apply the schema

```bash
wrangler d1 create signaldesk
```

Paste the returned `database_id` into `wrangler.toml` (replace
`PLACEHOLDER_RUN_wrangler_d1_create_signaldesk`). Then apply the schema to the
**remote** DB:

```bash
wrangler d1 execute signaldesk --remote --file=./schema.sql
```

(`bun run d1:init` does the same against the **local** DB for `pages:dev`.)

Schema (`schema.sql`) creates: `signals`, `trades`, `sync_state`,
`candle_cache`, plus indexes on `signals(signal_time)` and `trades(signal_id)`.

### 4. Configure env vars (production + preview)

Cloudflare dashboard → **Pages → signaldesk → Settings → Environment variables**.
Add, for **both** Production and Preview, whichever of these you have:

```
APP_SHARED_SECRET     (long random string — see step 5)
DISCORD_BOT_TOKEN
DISCORD_CHANNEL_ID
ANTHROPIC_API_KEY
TWELVEDATA_API_KEY
FINNHUB_API_KEY       (optional)
```

Mark the tokens/keys as **encrypted**. The D1 binding (`DB`) comes from
`wrangler.toml`, not here.

### 5. Lock the access gate

`functions/_middleware.ts` gates everything under `/api/` (except
`/api/health`). Pick **one**:

- **Cloudflare Access** (recommended): Zero Trust → Access → Application over the
  Pages domain. The middleware lets authenticated Access requests through
  automatically — no app config needed.
- **Shared secret**: set `APP_SHARED_SECRET` and send the same value as an
  `x-app-key` header on requests (compared constant-time). If unset, the gate is
  **open on localhost** and **closed (401) in production**, so set this before
  going live if you're not using Access.

### 6. Onboard to the CC monorepo + deploy

SignalDesk is self-contained in `~/signaldesk`. To ship it through the standard
GitHub → CI/CD → Cloudflare Pages pipeline, drop it into the monorepo and wire a
Pages project pointing at this directory with build output `dist/`
(`pages_build_output_dir` is already set in `wrangler.toml`). Build command:
`bun run build`.

> Onboarding into the monorepo, creating the Cloudflare Pages project, creating
> D1, setting env vars, and deploying are **your** calls — confirm before any of
> these run.

---

## API endpoints

All under `/api` and gated by `_middleware.ts` (health is public).

| Method | Path                  | Purpose                                            |
|--------|-----------------------|----------------------------------------------------|
| GET    | `/health`             | Liveness + which capabilities are configured.      |
| GET    | `/signals`            | List parsed signals (newest first).                |
| GET    | `/signals/:id`        | One signal with its logged trades.                 |
| POST   | `/discord/sync`       | Pull new Discord messages → parse → store.         |
| POST   | `/parse`              | Parse a pasted `{ content }` into a trade card.    |
| GET    | `/candles`            | `?symbol&assetClass&interval[&from&to]` OHLC data. |
| POST   | `/trades`             | Create/update your execution log for a signal.     |
| DELETE | `/trades/:id`         | Remove a logged trade.                             |
| GET    | `/journal`            | Aggregate personal performance stats.              |

---

## Project layout

```
functions/
  _middleware.ts        access gate
  _lib/                 http, db, parse, stats (import-only; not routes)
  api/                  one file per route (see table above)
src/
  types/contract.ts     single source of truth for all shared types
  ...                   React app (components, api client, demo data)
schema.sql              D1 tables + indexes
wrangler.toml           Pages + D1 binding (paste database_id here)
.dev.vars.example       copy to .dev.vars for local wrangler dev
```
