# transparenC — Launch Remediation Plan (Phase 0 Audit)

> Read-only discovery output. **No code has been changed.** This document maps the
> codebase, inventories the problems, and ends at the decision gate (§6). Workstream
> 1 does not begin until decisions D1–D7 are confirmed.

Branch: `launch-remediation` (created, clean). Repo: `open-eyes-data/` inside the `Aaron-1411/CC` monorepo.

---

## 0. CONFIRMED DECISIONS (locked 2026-06-12)

| # | Decision | Resolution |
|---|---|---|
| D1 | Custom domain | Domain TBD; code stays workers.dev-safe (no hard-coded host in OG/share). Non-blocking |
| D2 | Polling widget | **REMOVE** from /parties |
| D3 | News tab | **Reframe → "Coverage Tracker"** + review bias/lean table for neutrality |
| D4 | Letter templates | **One generic data-backed template per tool page** |
| D5 | Open-source | **DEFER to v1.1.** ⚠️ Repo is a monorepo with confidential client work — open-sourcing requires extracting transparenC to a standalone repo first. Not done during remediation |
| D6 | "Who runs this" | Placeholder: *"Built and self-funded by one independent developer. No party affiliation, no donations, no ads."* — pending Aaron's final wording |
| D7 | Email digest | **DEFER to v1.1** |
| D8 | Postcode privacy | **Re-route client→postcodes.io directly** so the "never touches our servers" claim becomes true |
| D9 | AI fallback | **Anthropic-only.** Remove Lovable/Gemini fallback path; fix provenance label |

## 0b. VERIFIED FACTS (checked against source 2026-06-12)

| Claim | Old copy | Verified | Source |
|---|---|---|---|
| Petition response threshold | "100 signatures gets a response" ❌ | **10,000 = govt response** | petition.parliament.uk/help |
| Petition debate threshold | "100,000 triggers a debate" ❌ | **100,000 = "considered for debate, and are usually debated"** (not automatic) | petition.parliament.uk/help |
| Contract publication threshold | "over £10k is public" ❌ | **£12,000 inc VAT central gov (incl NHS); £30,000 sub-central** (notifiable below-threshold Contract Details Notice) | gov.uk below-threshold guidance |
| Net migration | "728,000 (latest)" ❌ **grossly stale** | **171,000 net** (YE Dec 2025; 813k in / 642k out; prior yr revised to 331k) | ONS LTIM YE Dec 2025 (pub 21 May 2026) |
| Stop & search disparity | "7×" ❌ **~2× overstated** | **3.8×** (YE Mar 2025; 22.4 vs ~6 per 1,000). Trend: 5.5→4.8→4.1→3.7→3.8 | gov.uk Ethnicity facts & figures |
| Sewage 2024 EDM hours | "3.6 million hours" | **CORRECT — 3,614,427 hours** (2024) | EA storm overflow EDM 2024 |
| "MP letter always gets a reply" | "always gets a reply" ❌ | Convention, not legal duty → "almost always" | — |

---

## 1. Architecture map

| Aspect | Finding | Implication |
|---|---|---|
| Framework | **TanStack Start** (React 19, Vite) — origin Lovable | Modern, file-based routing |
| Rendering | **True SSR on the Worker**. `src/server.ts` → `@tanstack/react-start/server-entry`; `src/start.ts` wraps with error middleware | **Not a SPA.** Per-route `head()` runs server-side → share previews can carry real data *without* the workaround §7 assumes. This is better than the prompt expects. |
| Deploy target | Cloudflare Workers. `wrangler.jsonc`: `main: src/server.ts`, `nodejs_compat`. **No KV namespace, no Cron Trigger, no Durable Objects bound.** | Caching/freshness workstream (WS3) must *add* KV + Cron — none exists today |
| Routing | 27 page routes + 24 `/api/*` server routes (`src/routes/api/*.ts`) | API layer already centralised server-side ✓ |
| State/data | TanStack Query client-side; server routes call upstreams | Good separation, except postcode (see §3) |
| Styling | Tailwind v4 + custom tokens (`amber`, `surface`, `border`, `muted-foreground`); shadcn/ui in `src/components/ui` | No redesign needed (WS8 = polish only) |
| "Caching" today | In-memory `Map` in `lib/proxy.ts` (`cached()`) — **per-isolate, wiped on cold start**; plus build-time JSON snapshots in `src/data/snapshots/` read by `lib/snapshot.ts` `withSnapshot()` (accepts ≤26h old) | No persistent runtime cache. Snapshots refreshed by **GitHub Actions** (`daily-data.yml`, 06:00 UTC) which git-commits updated JSON — not a Worker cron |
| AI | `lib/ai-gateway.ts`: Anthropic direct (`claude-haiku-4-5`) primary, **Lovable gateway → Gemini fallback**. Key via `process.env` (server-only ✓). Consumed only by `routes/api/briefing.ts` | Secrets safe; but Lovable/Gemini fallback + wrong provenance label need addressing (WS1/WS7) |

---

## 2. Copy inventory — hard-coded statistics (WS1/WS2 targets)

**Rule being applied:** every user-visible figure must render via `<SourcedStat>` with a source link + asOf date. Below is every hard-coded number found in user-facing copy.

### `src/data/issues.ts` — homepage issue cards (highest priority; all unsourced)
| Line | Hard-coded figure |
|---|---|
| 49 | "Waiting lists peaked at 7.8 million", "2 million extra appointments per week" |
| 56 | keyFact: "~76% of A&E patients seen within 4 hours" |
| 58 | "target is 95%", "nine different Health Secretaries" |
| 71 / 78 | "1.5 million new homes this parliament" (pledge → needs quoteSourceUrl) |
| 80 | "300,000 new homes per year", "200,000", "100,000 shortfall", "400,000 homes" |
| 93 / 100 | "grew by around 1% in 2025", "~1% GDP growth forecast" |
| 102 | "£40bn tax rise", "October 2024 Budget" |
| 116 / 123 | "cut knife crime by 50%", "13,000 neighbourhood officers", **"7× the rate"** (stale — see §5) |
| 125 | "roughly 7 times", "Only 17% result in action" |
| 138 / 145 | **"3.6 million hours of sewage discharged in 2024"** (verify vs EA 2024 EDM — record was widely cited; confirm exact) |
| 147 | "over 400 years", "£1.4bn in dividends" |
| 160 / 167 | **"728,000 net migration"** (stale — ONS has since revised; see §5) |
| 169 | "second highest figure on record", "under 100,000", "14 years" |
| 182 / 189 | "6,500 new teachers" (pledge → needs quoteSourceUrl) |
| 191 | "around 40% of newly-qualified teachers leave within five years" |

### `src/routes/index.tsx` — borderline (descriptive scope, not live stats)
| Line | Text | Note |
|---|---|---|
| 70 | "Where your £1.2 trillion goes" | Scope label, not an asserted current stat — **decision needed** (keep as descriptive vs bind) |
| 76 | "Every contract over £1m" | Mislabels the actual Contracts Finder threshold; the tool shows >£1m major contracts but the **publication** threshold differs (see §5 contracts) |

### Per-tool page context blocks (sampled — full sweep in WS1)
- `sanctions.tsx:66,70,198,203` — framing + figures (neutrality, §10)
- `parties.tsx` — polling bars (D2) + "as of May 2026" frozen stamp (line 430)
- Numerous `ContextBlock`/`Stat` usages across tool pages already pull from live data ✓ (these are mostly fine; the problem is the *static-copy* stats above)

---

## 3. Data-flow inventory (full table from sub-audit)

24 server routes proxy upstreams. **All return a `fetchedAt` envelope, but the timestamp is stamped at envelope-build time** (`proxy.ts:40`), so it overstates freshness for the 8 snapshot-backed routes and every cache hit.

| Route | Upstream | Licence | Cache | Notes |
|---|---|---|---|---|
| acoba | gov.uk search | OGL | 30m mem | |
| bills | bills-api.parliament.uk | **OPL** | 2m mem | |
| briefing | Anthropic / Lovable-Gemini | n/a | **none** | **no rate limit** |
| committees | committees.api.parliament.uk | **OPL** | snapshot+6h | |
| contracts | contractsfinder.service.gov.uk | OGL | 1h/60s mem | |
| donations | search.electoralcommission.org.uk | EC terms | 30m mem | |
| economy | ons.gov.uk | OGL | snapshot+6h | |
| expenses | theipsa.org.uk | IPSA terms | 4h mem | |
| foi | assets.publishing.service.gov.uk | OGL | snapshot+6h | |
| kpis | api.ons.gov.uk **v1** | OGL | 30m mem | v1 API may be deprecated — verify |
| lobbying | gov.uk search | OGL | 30m mem | |
| meetings | gov.uk search | OGL | 30m mem | |
| mp | members-api.parliament.uk | **OPL** | 4h/24h mem | |
| news | BBC/Guardian/Sky/Independent RSS | **publisher (NOT OGL)** | 1h mem | D3 |
| nhs | england.nhs.uk + gov.uk | OGL | snapshot+1h | |
| parties | static literal | n/a | 24h mem | LIVE badge on static data = misleading |
| petitions | petition.parliament.uk | **OPL** | 60s mem | |
| postcode | api.postcodes.io + members-api | OGL/OPL | **none** | **routes through Worker — privacy claim false** |
| projects | gov.uk content+search+CSV | OGL | snapshot+6h | **`projects_gmpp.json` snapshot MISSING** → always slow live |
| sanctions | gov.uk search (DWP) | OGL | 30m mem | |
| sewage | services3.arcgis.com (EA) | OGL | snapshot+24h | |
| spending | gov.uk content+CSV | OGL | snapshot+24h | |
| stop-search | data.police.uk | OGL | 24h/4h mem | |
| votes | commonsvotes-api.parliament.uk | **OPL** | 10m/5m mem | |

**Security:** ✅ No key reaches the client. `ANTHROPIC_API_KEY`/`LOVABLE_API_KEY` read via `process.env` in `lib/ai-gateway.ts` (server-only, imported only by the briefing route). Client strings in `about.tsx`/`briefing.tsx` are documentation only.

**Critical privacy defect:** `postcode-widget.tsx:151` and `about.tsx:127` both claim the postcode is *"never sent to our servers."* **It is.** Trace: widget → `useConstituency.ts:30` → `fetch('/api/postcode?...')` → Worker → `routes/api/postcode.ts:141` `fetch('https://api.postcodes.io/...')`. The postcode transits your edge. Copy and code must be reconciled (WS1 §5.4) — either route client-direct or fix the claim.

**Other data defects:** orphaned `news_uk_v1.json` (never read); briefing provenance hard-coded `"Lovable AI Gateway (Gemini)"` even when Anthropic answers (`briefing.ts:33`); no `/api/status`; no rate limiting anywhere.

---

## 4. Metadata inventory (WS1 §5.2 targets)

| File:line | Issue |
|---|---|
| `__root.tsx:90,91,92` | **"OpenGov Watch"** in description, og:description, twitter:description — legacy name, contradicts `og:title` which already says "transparenC" |
| `__root.tsx:93,94` | OG/Twitter image = **Lovable-hosted R2 URL** (`pub-...r2.dev/...lovable.app...png`) — must self-host a branded 1200×630 card |
| `__root.tsx:88` | `twitter:card: "summary"` — should be `summary_large_image` once the card exists |
| `about.tsx:341,349,350` | Public copy referencing `ANTHROPIC_API_KEY`/`LOVABLE_API_KEY` + **"Netlify environment variables"** (app is on Cloudflare, not Netlify) |
| `briefing.tsx:123,124` | Provenance shows "Lovable AI Gateway (Gemini)" to users |
| `ai-gateway.ts:6` | Comment references "Netlify env vars" (internal, low priority) |
| No `public/robots.txt` / `sitemap.xml` confirmed in public/ | Add for main routes (note: a prior session may have added these to a different tree — **verify presence on this branch**) |
| No canonical URLs | Add per-route canonical; no hard-coded workers.dev in share/OG copy (D1) |

---

## 5. Facts requiring verification before any copy is written (Agent C rule)

These are flagged **UNVERIFIED** until checked against the cited authority at build time. **I will not write a number I cannot confirm.**

| Claim | Status | Verify against |
|---|---|---|
| Petition thresholds: 10k = govt response, 100k = *considered* for debate | Confirmed wrong in copy (`take-action.tsx:287`, `about.tsx:187`) — fix is known | petition.parliament.uk/help |
| Contracts publication threshold under Procurement Act 2023 (~£12k central / ~£30k sub-central) | **UNVERIFIED — exact figures must be confirmed** | gov.uk Procurement Act 2023 guidance |
| Net migration latest figure (728k is stale) | **UNVERIFIED — needs current ONS LTIM release** | ONS LTIM latest |
| Stop & search disparity multiple (7× is stale; recent releases differ materially) | **UNVERIFIED — needs latest** | gov.uk Ethnicity facts & figures |
| Sewage 2024 EDM total hours (3.6m) | **UNVERIFIED — confirm exact vs EA 2024 EDM** | EA storm overflow EDM 2024 |
| NHS A&E 4-hour %, GDP growth, teacher FTE, housing completions | **UNVERIFIED — bind to live** | NHS England / ONS / DfE / MHCLG |
| ONS `api.ons.gov.uk/v1` (used by `kpis.ts`) still live | **UNVERIFIED — v1 may be deprecated** (a prior fix already moved economy.ts off v1) | ONS |

---

## 6. Workstream → file mapping

| WS | Scope | Primary files |
|---|---|---|
| **Contract** | Binding types | NEW `src/contract/{sources,stats,freshness,pledges,petitions,corrections}.ts` |
| **WS1** Credibility hygiene | Corrections, branding, dev-artefact removal, privacy | `data/issues.ts`, `take-action.tsx`, `about.tsx`, `__root.tsx`, `briefing.tsx`, `postcode-widget.tsx`, `index.tsx`, `public/` |
| **WS2** Trust infra | SourcedStat, freshness badges, /methodology, /about upgrades | NEW `components/sourced-stat.tsx`, `components/freshness-badge.tsx`, NEW `routes/methodology.tsx`, `primitives.tsx` (replace `LiveBadge`), NEW `data/corrections.ts` |
| **WS3** Data layer | KV + Cron, envelope freshness, /api/status, rate limit | `wrangler.jsonc` (add KV+cron), `lib/proxy.ts`, `lib/snapshot.ts`, NEW `routes/api/status.ts`, all `routes/api/*` |
| **WS4** Pledge tracker | Rebuild /parties on Pledge contract | `data/parties.ts` → NEW `data/pledges/*`, `parties.tsx`, NEW `routes/parties/pledge.$id.tsx` |
| **WS5** Petitions loop | Velocity, constituency, outcomes | `routes/api/petitions.ts`, `petitions.tsx`, `my-area.tsx` (needs KV history from WS3) |
| **WS6** Neutrality | Framing sweep | `sanctions.tsx`, `about.tsx:263` (ACOBA "critics say"), `news.tsx`, all share-copy strings |
| **WS7** AI grounding | Closed-book briefing | `lib/ai-gateway.ts`, `routes/api/briefing.ts`, `briefing.tsx` (+ rate limit from WS3) |
| **WS8** A11y/perf | WCAG 2.2 AA, Lighthouse, mobile nav | `primitives.tsx`, `site-shell.tsx`, all status-indicator components |

**Adaptations flagged:**
- **WS3** assumes no caching exists to build on — correct; must add KV + Worker Cron from scratch, and migrate the GitHub-Actions snapshot job's role (keep it as a cheap daily seed *or* fold into Worker cron — recommend keeping GH Actions as backstop, adding KV for sub-daily freshness).
- **WS7's** "full SSR not required, share-preview is a workaround" — **app already does SSR**; per-route `head()` can pull loader data, so real-data OG tags are a first-class fix, not a hack. Recommend doing it properly.
- **WS5** velocity/constituency views **depend on WS3 KV** (snapshot history). Sequencing: WS3 before WS5.
- `news.tsx` already has a per-outlet "bias/lean" table — that table is itself an editorial judgement and must be reviewed under D3/WS6.

---

## 7. Decisions required before Workstream 1 (please confirm)

| # | Decision | My recommendation | Need from you |
|---|---|---|---|
| **D1** | Custom domain (e.g. transparenc.uk) | Acquire; ship with workers.dev redirect. Code will avoid hard-coded workers.dev URLs regardless | Domain name + whether you'll register it now |
| **D2** | Polling widget on /parties | **Remove** — horse-race data contradicts "primary sources only" and adds nothing to accountability | Confirm remove (or override to isolate it) |
| **D3** | News tab | **Reframe as "Coverage Tracker"** with explicit meta-transparency framing; review the bias/lean table under neutrality. Or remove | Reframe / remove / keep-as-is |
| **D4** | Pre-drafted MP letter templates | Replace topic-specific templates with **one generic data-backed template per tool page**, auto-filled with that page's stats | Confirm approach |
| **D5** | Open-source the repo | Recommended (strongest neutrality proof). Adds LICENSE + README + secret scan | Yes now / defer to v1.1 |
| **D6** | "Who runs this" wording | Need your exact sentence, e.g. *"Built and self-funded by one independent developer. No party affiliation, no donations, no ads."* | Provide the sentence |
| **D7** | Weekly constituency email digest | **Defer to v1.1** (needs Resend + double-opt-in + privacy update) | Confirm defer |

**Plus two findings that need a call but aren't in the original D-list:**
- **D8 (new):** Postcode privacy — fix the *claim* (acknowledge it transits the Worker but isn't logged) **or** re-route the lookup client→postcodes.io directly so the original claim becomes true. Client-direct is more privacy-preserving and makes the strong claim honest. **Recommend client-direct.**
- **D9 (new):** Lovable/Gemini AI fallback — keep it server-side as a redundancy, or remove entirely and run Anthropic-only? **Recommend remove** (one provider, accurate provenance, simpler trust story).

---

## 8. Proposed sequencing once approved

Contract → WS1 (P0 hygiene, ship-blocker) → WS2 (trust infra) → WS3 (data layer; unblocks WS5) → WS4 (flagship pledge tracker) → WS5 → WS6 → WS7 → WS8 → Reviewer pass (§14 checklist) → STOP for your deploy.

**No production deploy by me.** You deploy after review.
