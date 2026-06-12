# transparenC — Launch Remediation Notes

Branch: `launch-remediation` (pushed to GitHub; **not deployed** — `master` untouched).
All commits typecheck clean (`tsc --noEmit`) and are prettier-formatted.

## Decisions applied
D1 workers.dev-safe (domain TBD) · D2 polling removed · D3 News→Coverage Tracker ·
D4 (generic per-page template — partial) · **D5 open-source DEFERRED** (monorepo holds
confidential client work; must extract transparenC first) · D6 placeholder "who runs this"
(awaiting final wording) · D7 email digest deferred · D8 postcode now client-direct ·
D9 Anthropic-only.

## Verified facts (checked against source 2026-06-12)
| Was | Now | Source |
|---|---|---|
| Net migration 728k | **171,000** (YE Dec 2025) | ONS LTIM |
| Stop & search 7× | **3.8×** (YE Mar 2025) | gov.uk Ethnicity F&F |
| Petition "100 sigs = response / 100k = debate" | **10k = response; 100k = considered for debate** | petition.parliament.uk/help |
| Contracts "over £10k" | **£12k central / £30k sub-central inc VAT** | gov.uk Procurement Act 2023 |
| "MP always replies" | convention, not duty | — |
| Sewage 3.6m hours | **correct — 3,614,427** (2024) | EA EDM |
| GDP "~1%" | **1.4%** (2025) | ONS |
| A&E "~76%" | **76.9%** (Apr 2026) | NHS England |

## Shipped (commits on this branch)
1. **Phase 0** — `REMEDIATION_PLAN.md` (audit, decisions, verified facts).
2. **Shared Contract** — `src/contract/{sources,stats,freshness,pledges,petitions,corrections}.ts`.
3. **WS1** — factual corrections; `<SourcedStat>` on homepage + issues; branding purge
   (OpenGov Watch, Lovable OG → self-hosted `og-card.svg`, Netlify refs); **postcode
   client-direct** via new `/api/constituency-mp` (privacy claim now true).
4. **WS2** — `<FreshnessBadge>`; `/methodology` (rubric, contest route, per-source licence
   table OGL/OPL); `/about` corrections log + "who runs this".
5. **WS3** — rate-limit `/api/briefing` (8/min/IP); honest `fetchedAt` primitives
   (`cachedTimed`); `/api/status`; `snapshotHealth()`.
6. **WS6** — sanctions neutral framing; News→Coverage Tracker with editorial bias/lean
   labels removed; unattributed commentary stripped.
7. **WS7** — closed-book briefing grounded in cached issue stats + pledges; Anthropic-only
   (Lovable/Gemini removed); sources-list + verify disclaimer.
8. **WS4 partial / D2** — polling widget removed; colour-only status copy fixed.

## §14 Reviewer checklist — honest status
**Accuracy & sourcing**
- [x] Homepage/issue figures via `<SourcedStat>` with source + asOf
- [x] All §5.1 corrections applied; petition thresholds consistent; corrections log seeded
- [~] **Tool-page** stats not yet all migrated to `<SourcedStat>` (they pull live data already, but the LiveBadge→FreshnessBadge UI sweep and per-route honest `fetchedAt` wiring across 24 routes is **remaining** — primitives exist)
- [x] No unresolved UNVERIFIED items in shipped copy

**Integrity & neutrality**
- [x] `/methodology` live; six-status rubric; honesty statement; contest route
- [x] No unattributed commentary (sanctions, ACOBA, news swept); D2 polling removed; D3 News reframed
- [x] /about editorialise contradiction resolved; per-source licence table (Parliament = OPL)

**Privacy & security**
- [x] Postcode client-direct; copy matches code; no key client-side; briefing key server-only
- [x] `/api/briefing` rate-limited
- [~] Privacy **page** (dedicated `/privacy`) not yet added — privacy note corrected inline on home + /about

**Platform**
- [x] `/api/status`; honest-freshness primitives
- [x] Meta/OG cleaned of legacy names + Lovable assets (self-hosted SVG card)
- [ ] KV + Worker Cron + global rate limiting — **launch-config (needs your CF account)**
- [ ] Per-route share-preview OG with live headline stat — remaining (SSR makes this feasible)

**Quality**
- [ ] Lighthouse run — not yet executed
- [~] WCAG sweep — colour-only status copy fixed; full keyboard/contrast/aria audit remaining

## Remaining work (specs for a focused follow-up)
1. **WS4 — flagship pledge tracker rebuild.** Migrate `/parties` onto the `Pledge` contract:
   verbatim quote + `quoteSourceUrl` per pledge, metric mapping for measurable ones, six-status
   chips (icon+text+colour), status-history expander, per-pledge permalink `/parties/pledge/{id}`,
   two-click test. **Requires sourcing each manifesto quote — any unverifiable pledge must be
   `not_assessable` + `unverified` (never guess).** The contract + methodology rubric are already in place.
2. **WS5 — petitions loop.** Needs KV (WS3 infra) for `PetitionSnapshot` history → velocity views
   ("fastest-growing 24h", "recently crossed 10k/100k"), constituency relevance on My Area, and
   `PetitionOutcome` (link govt response/Hansard — link only, no editorialising).
3. **WS8 — a11y/perf.** Full WCAG 2.2 AA pass (keyboard nav incl. postcode flow, contrast ≥4.5:1,
   aria-labels on emoji icons, focus states, `prefers-reduced-motion`); Lighthouse to targets;
   sweep remaining `LiveBadge` → `<FreshnessBadge>` across tool pages.

## Launch-config tasks (need your Cloudflare account / decisions)
- [ ] `wrangler secret put ANTHROPIC_API_KEY` (briefing is Anthropic-only now)
- [ ] Create KV namespace (`wrangler kv namespace create SNAPSHOTS` / `RATE_LIMIT`), add binding to
      `wrangler.jsonc`, migrate snapshot reads + a global rate limiter to KV. **Not added as
      unprovisioned bindings — that would break `wrangler deploy`.**
- [ ] Add Worker Cron trigger for sub-daily refresh (or keep the existing GitHub Actions daily job).
- [ ] Custom domain (D1) + redirect from workers.dev; then set absolute OG image URL.
- [ ] Rasterise `og-card.svg` → 1200×630 PNG for maximum social-platform compatibility (SVG works on
      modern platforms but PNG is safest); set `og:image`/`twitter:image` to it.
- [ ] D6: confirm final "who runs this" wording.
- [ ] `corrections@` contact (currently a provisional mailto on /methodology).

## Known data follow-ups (from Phase 0)
- Missing `projects_gmpp.json` snapshot → `/projects` always does the slow live fetch.
- Orphaned `news_uk_v1.json` (never read) — safe to delete.
- `kpis.ts` still uses `api.ons.gov.uk/v1` (may be deprecated) — verify.

**Nothing here is deployed. Deploy is yours after review.**
