<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ISA Wealth Platform — Agent Briefing

## Project context

This is a Next.js platform for a self-directed UK investor managing a **concentrated £20k/year Stocks & Shares ISA**. This is not a passive index tracker. £20k/year tax-free + uncapped tax-free capital gains is the most asymmetrically powerful wealth-building vehicle available to UK retail investors.

**User persona:** A serious self-directed investor running a 5–15-position concentrated book inside a £20k/year ISA wrapper, balancing risk and return with conviction-sized positions, who needs to defend every position to themselves on fundamentals, technicals, and seasonality before increasing exposure. Needs decision-grade data — not vibes.

**Repo:** `aaron-1411/claude-code`  
**Base branch:** `claude/isa-investment-platform-hd4xu`

**Stack (preserve):** Next.js App Router, TypeScript strict, Tailwind dark terminal theme, Zustand, TanStack Table, Recharts, Framer Motion, Prisma + SQLite, Yahoo Finance v8 chart endpoint + SSE for live prices.

**Existing API routes:**
- `app/api/history/[ticker]`
- `app/api/analytics/{returns,risk,correlation}`
- `app/api/news/[ticker]`
- `app/api/stream/{prices,analysis}`
- `app/api/macro`
- `app/api/etf-holdings/[ticker]`

---

## Operational rules (apply to every PR)

1. **Use TodoWrite** at the start of each PR branch to track that PR's tasks.
2. **Spawn subagents** for parallel research and independent verification — keep heavy comparisons out of main context.
3. **After every commit:** run `npm run typecheck && npm run lint`. Fix failures before moving on.
4. **One PR per work item** — no monster bundles.
5. **Open each PR as draft**, attach desktop and mobile (iPhone 14 Pro viewport = 430px) screenshots to the PR body, then mark ready.
6. **Don't proceed to PR N+1** until PR N is merged or explicitly approved by the user.
7. **Pure functions** for all maths in `lib/analytics/*.ts`. Input: arrays of returns/prices. Output: numbers/objects. No I/O, no React. Unit-test in `__tests__/analytics.test.ts` using Vitest.
8. **No new heavy deps.** No talib, no mathjs, no pandas-js. Hand-rolled stats ≤50 lines each.
9. **Preserve dark terminal theme.** No light-mode regressions.
10. **Re-seed after schema changes.** `npx prisma db push && npx tsx prisma/seed.ts` must produce a fully working demo state including 2+ years of synthetic history per holding plus benchmark.
11. **Don't break the SSE stream.** Add new derived metrics as separate endpoints.

---

## PR sequence

Ship in this order. Each PR must independently typecheck, lint, build, and pass a smoke test of its affected pages.

---

### PR 0 — Dev-infra hardening
**Branch:** `claude/dev-infra-hardening`

Replace the fragile `nohup npm run dev` setup with PM2 + bootstrap scripts.

**Tasks:**

1. Replace `.devcontainer/devcontainer.json` with:
```json
{
  "name": "ISA Investment Platform",
  "image": "mcr.microsoft.com/devcontainers/universal:2-linux",
  "forwardPorts": [3000],
  "portsAttributes": {
    "3000": { "label": "Next.js Dev Server", "onAutoForward": "notify" }
  },
  "postCreateCommand": ".devcontainer/post-create.sh",
  "postStartCommand": ".devcontainer/post-start.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "Prisma.prisma",
        "bradlc.vscode-tailwindcss",
        "dbaeumer.vscode-eslint",
        "yoavbls.pretty-ts-errors",
        "eamodio.gitlens"
      ]
    }
  }
}
```

2. Create `.devcontainer/post-create.sh` (executable):
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "[post-create] npm ci..."
npm ci
echo "[post-create] inotify watcher limit..."
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf >/dev/null
sudo sysctl -p >/dev/null
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then cp .env.example .env.local;
  else printf 'DATABASE_URL=file:./dev.db\nNEXT_PUBLIC_REFRESH_INTERVAL=15000\n' > .env.local; fi
  echo "[post-create] Created .env.local. Add ANTHROPIC_API_KEY for AI features."
fi
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm install -g pm2
```

3. Create `.devcontainer/post-start.sh` (executable):
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pm2 delete nextdev >/dev/null 2>&1 || true
pm2 start npm --name nextdev --max-memory-restart 1500M -- run dev
pm2 save >/dev/null 2>&1 || true
echo "[post-start] Stream logs: pm2 logs nextdev | Restart: pm2 restart nextdev"
```

4. Create `.env.example`:
```
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_REFRESH_INTERVAL=15000
ANTHROPIC_API_KEY=
FMP_API_KEY=
```

5. Add Codespaces badge to top of `README.md`:
```
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Aaron-1411/claude-code?ref=claude/isa-investment-platform-hd4xu)
```

6. Create `scripts/dev.md` operator playbook: live logs (`pm2 logs nextdev`), restart, stop, DB reset, manual boot, Yahoo health check.

7. PR description must include manual checklist: enable Codespaces prebuild on base branch; add `ANTHROPIC_API_KEY` as Codespaces secret.

**Acceptance:** Fresh codespace boots, `.env.local` auto-creates, DB seeds, PM2 runs `nextdev`, port 3000 forwards, `/performance` returns HTTP 200, all five extensions auto-installed. Killing Node process triggers PM2 auto-restart within 2s. Both shell scripts pass `shellcheck`.

---

### PR 1 — Data layer fix + position reconciliation
**Branch:** `claude/data-layer-fix`

**Part A — Yahoo gateway hardening**

Build `lib/yahoo/client.ts` as the **single Yahoo gateway**. Every Yahoo call routes through it:
- User-Agent injection: `Mozilla/5.0 (compatible; ISA-Platform/1.0)` on every request.
- Cookie + crumb dance for quoteSummary v10: GET `https://fc.yahoo.com/` for cookies, GET `https://query2.finance.yahoo.com/v1/test/getcrumb` for crumb. Append `?crumb=<crumb>` to every v10 call. Cache 1h in memory.
- Rate limit: token bucket, 10 req/s ceiling.
- Retry: exponential backoff on 429/5xx — 250ms, 500ms, 1s, 2s, max 3 retries.
- LRU cache keyed by URL+params: 60s live quotes, 6h fundamentals, 24h daily history.
- Zod-validated parsing per endpoint. On failure: log `[yahoo] schema drift <url>`, return null.
- Structured logging: `[yahoo] GET <url> → 200 in 142ms (cache miss)`.
- FMP fallback behind feature flag: when Yahoo returns empty 3× consecutively AND `FMP_API_KEY` is set, fall back to FMP. Surface "Limited data" badge in affected widget.

Refactor every Yahoo call site to use the gateway. Delete duplicated fetch logic.

**Part B — LSE / GBp price handling**

LSE tickers need `.L` suffix. LSE prices return in pence (GBp). Add:
- `currency` and `priceCurrency` fields to `Holding` Prisma model.
- `lib/money.ts`: `toGBP(value, priceCurrency, fxRate?)` — GBp→GBP via ÷100, USD/EUR→GBP via FX. `formatGBP(value, opts?)` — single source for formatting.
- `lib/fx.ts`: intraday FX from Yahoo (`GBPUSD=X`, `GBPEUR=X`) via gateway, 5min cache.
- Audit every price display / return computation — wrap in `toGBP`.

**Part C — Reconcile seed against Trading 212 export**

**Stop and ask the user for their Trading 212 export (CSV) before starting this part.** Then:
1. Parse T212 CSV (Action, Time, ISIN, Ticker, Name, Number of shares, Price/share, Currency, Total, etc.).
2. Aggregate to position level: net qty = buys − sells; VWAP = (Σ buy_qty × buy_price) / Σ buy_qty.
3. Map T212 tickers → Yahoo tickers via `lib/t212-to-yahoo.ts`.
4. Generate corrected `prisma/seed.ts` with real positions, quantities, average costs, currencies.
5. Generate `docs/reconciliation-report.md`: was-in-seed / is-in-T212 / qty / avg-price / action-taken for every holding.

**Part D — SSE singleton fix**

- Server: ensure EventSource closes cleanly on abort in `app/api/stream/prices/route.ts`.
- Client: make SSE subscription a singleton keyed by `tickers.sort().join(',')`. 250ms debounce on subscribe. Close only when listener count hits 0.

**Part E — Audit doc**

Create `docs/data-layer-audit.md` with before/after HTTP status + payload size for every endpoint. Also document the Yahoo crumb refresh flow.

**Acceptance:** Every endpoint returns HTTP 200 with non-empty data for all real holdings. No `[yahoo]` warnings during a 60s SSE stream. Reconciliation report matches T212 export. Both docs committed.

---

### PR 2 — Per-stock historical seasonality
**Branch:** `claude/seasonality`

The headline feature. Every stock detail page shows — since data began (Yahoo max history) — average historical performance grouped by day-of-week and month-of-year.

**Tasks:**

1. **Prisma schema:** add `PriceHistory` table with `ticker`, `date`, `open`, `high`, `low`, `close`, `adjClose`, `volume BigInt`, `@@unique([ticker, date])`, `@@index([ticker])`. Migration: `npx prisma migrate dev --name add_price_history`.

2. **Seed history:** extend `prisma/seed.ts` to fetch `range=max&interval=1d&events=div,split` for each holding via gateway. Apply split adjustments. Insert into `PriceHistory`.

3. **Incremental refresh:** `lib/jobs/refresh-history.ts` exports `refreshHistory(ticker)` — fetches only since last cached date. Wire into `app/api/jobs/refresh-history/route.ts`.

4. **Calculations:** `lib/analytics/seasonality.ts` exports:
   - `dayOfWeekSeasonality(prices: PriceRow[]): Bucket[]`
   - `monthOfYearSeasonality(prices: PriceRow[]): Bucket[]`
   - `Bucket` type with: `label`, `mean` (log return), `median`, `stdev`, `count`, `hitRate`, `best`, `worst`, `tStat` (mean / stdev / sqrt(count)), `pValue` (two-tailed Student-t), `cumulative`, `sampleFirstDate`, `sampleLastDate`.
   - DoW: daily log returns `ln(close[t]/close[t-1])`, skip weekends.
   - MoY: monthly compounded returns in log space.
   - Two-tailed Student-t p-value via Lentz's continued fraction for regularised incomplete beta (no mathjs).

5. **API:** `app/api/seasonality/[ticker]/route.ts` returns `{ dow: Bucket[], moy: Bucket[] }`. Cache 24h.

6. **Component:** `components/seasonality/SeasonalitySection.tsx`:
   - Headline bar chart: bucket on x, mean on y, ±1σ ErrorBar. Bars green if mean > 0 else red; opacity = `1 - pValue`. Tooltip: mean, hit rate, count, p-value.
   - Auto-generated one-sentence callout below chart.
   - Cumulative-contribution sparkline.
   - Full metric table (TanStack, sortable). Highlight `|tStat| > 2` rows with `border-l-2 border-emerald-500` (or `border-rose-500` if mean negative).
   - Caveat band: *"Seasonality reflects historical patterns, not predictions. Market regimes change. p-values assume i.i.d. returns — equity returns rarely are. Use as one input among many."*

7. Mount on `/holdings/[ticker]` between price chart and tabs.

8. Mount on `/performance` as new section. Portfolio aggregate = weighted mean across holdings. Add "Per-stock comparison heatmap" subtab (Y=tickers × X=weekday, cell = mean weekday return).

9. **Verification script** `scripts/verify-seasonality.py`: pulls AAPL max history, computes mean Monday log-return and Jan monthly return to 6 d.p. Commit script + output. Page must match to 4 d.p.

**Acceptance:** Seasonality renders for all holdings. AAPL Monday mean and Jan monthly mean match verification script to 4 d.p. Heatmap colour-codes correctly. Mobile stacks cleanly. No console errors.

---

### PR 3 — Enhanced stock profile pages
**Branch:** `claude/stock-profiles`

Replace `/holdings/[ticker]` with full tabbed layout.

**Page structure:**
- Sticky header: ticker, name, live SSE price, day change £+%, market cap, sector, exchange, currency.
- Always-visible thin band: "ISA allowance used £X of £20,000 — £Y remaining — N days to 5 April".
- Price chart: 1D / 5D / 1M / 3M / YTD / 1Y / 5Y / Max. Toggleable 50/200 SMA + volume histogram.
- Seasonality section (from PR 2).
- Tabs: **Fundamentals | Technicals | Catalysts | Position Risk | News**

**Fundamentals tab** — quoteSummary modules: `defaultKeyStatistics`, `financialData`, `summaryDetail`, `incomeStatementHistory`, `cashflowStatementHistory`, `balanceSheetHistory`, `earningsHistory`, `recommendationTrend`, `upgradeDowngradeHistory`, `price`, `assetProfile`. Four blocks:
- Valuation: Trailing P/E, Forward P/E, P/B, P/S, EV/EBITDA, P/FCF, PEG, Dividend Yield, Payout Ratio, FCF Yield. Each with 5-year sparkline.
- Quality: ROE, ROIC, Gross/Operating/Net Margin, Asset Turnover.
- Leverage: Net Debt/EBITDA, Debt/Equity, Interest Coverage, Current Ratio, Quick Ratio.
- Growth: 1Y/3Y/5Y CAGR for Revenue, EPS, FCF, Dividend.
- 10-year history charts (Recharts dual-axis): Revenue+EPS, FCF+Dividend, Margin trend.
- Peer comparison table: `lib/peers.ts` (ticker → 5 peers). Same metrics, your stock highlighted, percentile-rank column.

**Technicals tab** — `lib/analytics/technicals.ts`. No talib. All formulas ≤50 lines each:
- 50/200 SMA + EMA, golden/death cross detection with days count.
- RSI(14) with label.
- MACD (12/26/9) with histogram.
- Bollinger Bands (20, 2σ) — %B and bandwidth.
- ATR(14).
- Volume profile (horizontal histogram, right edge of chart).
- Support/resistance: last 3 swing highs + 3 swing lows (10-bar pivot algorithm).
- Regime label: "Strong uptrend" / "Uptrend" / "Range-bound" / "Downtrend" / "Strong downtrend" — price vs 50/200DMA + 50DMA slope + ADX(14) > 25 for "strong".

**Catalysts tab:**
- Next earnings date + consensus EPS + last 4 quarters beat/miss bar chart.
- Dividend calendar (ex-div, payment, declaration) trailing 2 years + next confirmed.
- Analyst consensus: rating distribution bar (Buy/Hold/Sell counts), mean target price, implied upside, upgrades/downgrades last 90 days.
- Short interest % of float, days-to-cover, 12mo sparkline.
- Institutional ownership QoQ change (degrade gracefully for LSE).
- Insider transactions: net buying/selling £ last 6 months.

**Position Risk tab:**
- Position size: % of portfolio AND % of 20-day ADV (amber if exit would take 3–5 days at 10% ADV, red if >5).
- Beta to portfolio benchmark.
- Contribution to portfolio variance.
- Marginal VaR (change in total portfolio 95% VaR if this position grows 1% of portfolio).
- Correlation row to other top-5 holdings (heatmap row, warning if multiple > 0.7).
- Single-stock historical VaR 95 / CVaR 95 in £.
- Stress scenarios (beta-implied): 2008 GFC, 2020 COVID, 2022 rate shock, 2000 dotcom, Brexit — show estimated £ P&L.
- **Conviction sizer widget:** user inputs conviction (1–5) + target volatility → suggests position size via inverse-volatility weighting clipped by max-single-position rule. Outputs £ and % of remaining ISA allowance.

**News tab:** Wire `app/api/news/[ticker]`. Render: source, headline, summary, sentiment label (Anthropic API if `ANTHROPIC_API_KEY` set, else skip), publish time, link out. Group by day, source filter chips. Add "Not investment advice" badge on sentiment.

**Acceptance:** All tabs populated for every real holding. Fundamentals not null for non-LSE holdings (FMP fallback for LSE). Technicals RSI/MACD verified against TradingView for AAPL (within 0.5%). Mobile: tabs horizontally-swipeable below md. No console errors.

---

### PR 4 — Performance + risk + position management
**Branch:** `claude/perf-risk`

**Performance page upgrades:**

Promote benchmark-relative metrics to top. Replace Sharpe-only section with:
- Alpha (annualised bps), Beta, R² — CAPM regression of portfolio excess returns on benchmark excess returns.
- Tracking Error (annualised stdev of port − benchmark daily returns).
- Information Ratio.
- Sortino Ratio (downside-only).
- Calmar Ratio (annualised return / |max drawdown|).
- CVaR 95/99 (Expected Shortfall) — historical and parametric, daily and 10-day.

Risk-free rate: UK 1Y gilt yield via Yahoo `^IRX` proxy. Display rate + lookback window.

**Benchmark wiring:** Add benchmark setting to `/settings`. Default: FTSE All-Share Total Return. Allow override to FTSE 100 TR, MSCI ACWI GBP, or 60/40 blend. **Use total-return series, not price-only — non-negotiable.** Store in new `BenchmarkPrice` Prisma table.

**Rolling charts** (Recharts LineChart, window selector 30/60/90/252 trading days, default 90): Rolling Sharpe, Rolling annualised volatility, Rolling beta vs benchmark.

**Drawdown panel:** Top-5 drawdowns table (peak/trough/recovery dates, depth, duration, recovery time, in-drawdown flag). Underwater equity curve (area chart below zero). Current-drawdown indicator. Ulcer Index.

**Calendar performance heatmap:** 12-col × N-row monthly returns grid. Rows = years, cols = Jan–Dec. Each cell ±5% red→green. Right-most col = annual total return. Bottom row = monthly averages (links to seasonality section).

**BHB attribution visualised:** Stacked horizontal bar by GICS sector — Allocation/Selection/Interaction effects per sector with totals.

**Currency decomposition:** For non-GBP holdings, split return into local-currency return + FX contribution + total GBP return.

**Tax-Year P&L card:** From 6 April of current tax year to today: GBP P&L and % return. Compare to FTSE All-Share TR over same period.

**Compounding projection panel:** Inputs: current portfolio value, average annualised return, ongoing £20k/year contribution. Output: portfolio value at 10/20/30 years with ±1σ band.

**Risk module extensions (`/risk`):**
- HHI on portfolio weights (with interpretation text).
- Top-5 weight as % of portfolio.
- Sector concentration bar.
- Real-time breach indicators against `/settings` rules (single position > X%, single sector > Y%, ISA subscription used + trade > £20k).
- Stress testing: 5 prebuilt scenarios + free-form custom (sliders for market shock, rate shock, FX shock, sector tilts).

**`/trade` page (new):** Pre-trade simulator. Side-by-side "Current vs Post-trade" panel: position weight, sector weight, total beta, portfolio VaR, ISA subscription used. Hard-block if breaches `/settings` thresholds. Estimated transaction cost (5bps + £5 flat, configurable). Correlation-aware sizing warning: if new position has >0.7 correlation with 3+ existing top-10 holdings, show inline: *"This position is highly correlated with N existing holdings. You may be concentrating rather than diversifying."*

**`/positions` extension:** Show all tax lots per holding (acquisition date, qty, cost basis, unrealised gain). Top-of-page band: ISA subscription used £, remaining £, days-to-5-April countdown (green >90, amber 30–90, red <30).

**`/rebalance` page (new):** User defines target weights. System shows drift, proposes buy/sell trades, computes total estimated cost and resulting reduction in tracking error.

**Acceptance:** All metrics reconcile with `scripts/verify-capm.py` (statsmodels.OLS). Benchmark uses TR series. Tax-year P&L card shows current tax year only. Compounding projection visible. `/trade` blocks a trade that breaches concentration. `/positions` shows tax-lot detail.

---

### PR 5 — Mobile UX overhaul
**Branch:** `claude/mobile-ux`

**Global rules:**
- Below md: sidebar nav → fixed bottom tab bar (5 items: Overview / Performance / Holdings / Risk / More). 56px tall. `pb-[env(safe-area-inset-bottom)]`.
- Every Recharts chart in `ResponsiveContainer` with `aspect={16/9}` mobile / `aspect={2/1}` desktop. Resample daily → weekly when viewport < 640px.
- Below sm: TanStack Tables → card lists. Each row = card with primary metric large, secondary in 2×2 grid, tap-to-expand.
- Touch targets ≥44×44px. No hover-only interactions.
- Numeric inputs: `inputMode="decimal"` for iOS numeric keyboard.
- AI chat composer: `pb-[env(safe-area-inset-bottom)]`.

**Per-page:**
- Overview: 4-up KPI grid → 2×2 tablet → 1-column swipeable carousel on phone (Framer Motion `drag="x"`).
- `/performance`: Each chart full-viewport-width vertical scroll item. Seasonality DoW/MoY → two horizontally-swipeable cards.
- `/holdings/[ticker]`: Sticky header collapses on scroll (price + change only). Tabs → horizontal scroll list with snap.
- `/risk`: Stress scenarios → accordion, one at a time.
- `/positions`: Card stack with swipe-left-to-reveal-actions.

**PWA shell:**
- `app/manifest.ts` (Next.js metadata route): icons 192px + 512px, `display: "standalone"`, dark terminal theme color, `scope: "/"`.
- Inline service worker (no next-pwa dep): caches app shell + last-loaded data.
- "Add to Home Screen" prompt after 3rd visit.

**SSE on mobile:**
- Wrap subscription in `document.visibilitychange`: disconnect on hidden, reconnect on visible.
- Default refresh: 60s mobile, 15s desktop. Detect via `matchMedia('(hover: none)')`.

**Acceptance:** Lighthouse Mobile Performance ≥90 on `/`, `/performance`, `/holdings/[first-ticker]`. No horizontal scroll at 390px viewport. Bottom tab bar present below md. AI chat input not obscured by iPhone home indicator.

---

### PR 6 — Reframing copy audit
**Branch:** `claude/copy-audit`

Audit every user-facing string. Replace passive/generic with active wealth-building framing:

| Replace | With |
|---------|------|
| "Portfolio Overview" | "Portfolio" |
| "Returns" (ISA context) | "P&L (tax-free)" |
| "Performance" (page title kept) | Add subtitle: "Tax-free P&L and benchmark-relative metrics" |
| "Holdings" | "Positions" |
| "Risk Management" | "Risk" |
| "this year" in P&L context | "This tax year (since 6 April YYYY)" |
| "vs benchmark" with no name | Always show benchmark name in metric label |

Add site footer: *"Self-directed UK Stocks & Shares ISA tool. £20,000/year contribution limit. Capital gains and dividends are UK-tax-free within the wrapper. Not investment advice."*

Add "Not investment advice" badge on any LLM-derived output (News sentiment, AI chat).

**Acceptance:** No string uses "your investments" or generic finance dashboard language. Settings page surfaces benchmark name and tax-year info.

---

## Out of scope

- Real-money trade execution (simulation only)
- Tax-loss harvesting (ISA gains are tax-free — would mislead)
- Multi-currency reporting currency switching (stay GBP-reporting)
- AI investment advice (sentiment classification only, with badge)
- Multi-user / auth (single-user local app)

---

## Key technical facts

- **Yahoo Finance:** Use v8 chart endpoint (`/v8/finance/chart/{symbol}?interval=1d&range=...`). v7 is auth-blocked. quoteSummary uses v11 (`/v11/finance/quoteSummary/`). Always inject `User-Agent` header.
- **GBX→GBP:** LSE prices in pence. Divide by 100. Applies to EQQQ.L, VWRP.L, VUAG.L, SGLN.L, VWRL.L.
- **Prisma 7:** URL in `prisma.config.ts`, not `schema.prisma`. Adapter: `PrismaBetterSqlite3({ url })`.
- **TanStack Query v5:** `useQuery` must guard non-array data with `Array.isArray(data) ? data : []`.
- **Recharts formatters:** typed as `(v: unknown) => string`.
- **Portfolio baseline (May 10 2026):** 11 ISA holdings, total £7,724. Tickers: EQQQ, VWRP, VUAG, BRK.A, NVDA, GOOGL, AAPL, SGLN, ASML, MSTR, PLTR.
- **ISA allowance:** £20,000/year, 2025/26 tax year. Tax year ends 5 April.
