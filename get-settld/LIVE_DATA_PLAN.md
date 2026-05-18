# Go-live Data Integration Plan

This document maps every score, calculator and chart in the toolkit to the
**real UK data sources** required to make it production-ready, plus the
phased rollout to switch from synthetic data to live data.

---

## 1. Data sources by domain

### Property & transactions
| Need | Provider | Access | Notes |
|---|---|---|---|
| Sold prices, comparables (AVM) | **HM Land Registry — Price Paid Data** | Free monthly CSV; SPARQL endpoint | Primary anchor for £/sqft. |
| House Price Index (5y growth, monthly trend) | **ONS UK House Price Index** | Free CSV / API | LAD-level series. |
| Live listings, asking prices, days on market | **Rightmove / Zoopla** (no public API) → use **PropertyData**, **Sprift**, **LandInsight** or **Twenty7tec Hometrack** | Paid (£300–£2k/mo) | Required for offer-strategy + listing density. |
| EPC ratings & floor area (sqft) | **EPC Open Data (gov.uk)** | Free, registration | Drives Condition + heating-cost estimates. |
| UPRN / address resolution | **OS Places API** + **Postcodes.io** | Free tier sufficient | Canonical property identity. |
| Title / tenure / lease length | **HM Land Registry Title Register** | £3 per title (API) | On-demand only — call when user opens AVM. |

### Area, demographics, infrastructure
| Need | Provider |
|---|---|
| Crime per 1,000 (12-mo rolling) | data.police.uk Street-level API (free) |
| Schools (Ofsted + Progress 8) | Ofsted Open Data + DfE Performance Tables (free) |
| Transport accessibility (PTAL, journey times) | DfT PTAL · TfL Journey Planner API · National Rail OpenLDBWS |
| Green space | OS Open Greenspace + ONS Access to Greenspace (free) |
| Income & affordability | ONS ASHE earnings + Land Registry medians |
| Rental demand / yield | ONS Private Rental Market Stats + Zoopla rental indices (paid) |
| Regen pipeline & planning applications | EGi/CoStar (paid) **OR** scrape local-authority planning portals (free, brittle) |

### Financials
| Need | Provider |
|---|---|
| Live mortgage rates by LTV/product | **Twenty7tec** or **Mortgage Brain** APIs (paid, FCA-regulated source) |
| Bank of England base rate, SVR averages | BoE Statistical Database (free) |
| Inflation (CPI/CPIH) for LISA, deposit projections | ONS (free) |
| SDLT/LBTT/LTT bands | Already encoded in `src/lib/taxes.ts`; refresh annually from gov.uk Budgets |

---

## 2. Score → data wiring (now that scoring is automated)

Every factor in `src/lib/autoScore.ts` already declares its `source`. To go
live, replace the static `AREAS` and `PROPS` datasets with a live data
layer that returns the same shape:

```
deriveAppreciation(area)   ← needs: PTAL, commute times, Ofsted, regen capex,
                              ONS HPI growth, ONS PRMS yield, Land Registry £/sqft
deriveAreaFit(area)        ← needs: police.uk crime, OS Open Greenspace,
                              ONS earnings, capex pipeline
runAvm(subject, comps)     ← needs: Land Registry Price Paid + EPC sqft + tenure
```

No component code needs to change — only the data fetcher.

---

## 3. Architecture for go-live

```
┌──────────────┐        ┌─────────────────────────┐        ┌───────────────────┐
│ React client │ ─────▶ │ Lovable Cloud Edge Fn   │ ─────▶ │ Provider APIs     │
│              │        │  • Auth / RLS            │        │  HMLR · ONS · DfT │
│              │        │  • Caching (Redis/PG)    │        │  Twenty7tec · etc │
└──────────────┘        │  • Rate-limit per user   │        └───────────────────┘
                        │  • Aggregation / scoring │
                        └─────────────────────────┘
```

Key decisions:
1. **All paid keys live in Edge Function env vars** (never `VITE_*`).
2. **Cache aggressively in Postgres**: HMLR, EPC, Ofsted, ONS update monthly
   at most → 30-day TTL is safe and slashes costs.
3. **Per-area materialised view** refreshed nightly, exposing the exact
   shape of `Area` so the existing scoring lib continues to work.
4. **Mortgage rates** = 1-hour TTL (regulated source, must be fresh).

---

## 4. Phased rollout

### Phase 1 — Foundation (2 weeks)
- Enable Lovable Cloud, Auth (email + Google), Postgres, Edge Functions
- `users`, `user_roles`, `saved_scenarios`, `documents` tables with RLS
- Move scenario persistence from `localStorage` to authenticated DB rows
- Implement `lookup_postcode` Edge Fn (Postcodes.io + OS Places, free)

### Phase 2 — Free public datasets (3 weeks)
- ETL: HMLR Price Paid (monthly), EPC Open Data (monthly), ONS HPI (monthly)
- Edge Fn `get_area(postcode)` returns the full `Area` shape
- Edge Fn `get_comparables(uprn|postcode, beds, sqft)` powers AVM
- Switch `Areas`, `Properties`, `Avm`, `Appreciation`, `RightFit` from
  static imports to React Query against these endpoints

### Phase 3 — Schools, crime, transport (2 weeks)
- Ofsted + DfE ingest, police.uk ingest, OS Open Greenspace ingest
- Replace synthetic `schools`, `crime`, `green` fields end-to-end

### Phase 4 — Paid data feeds (4 weeks, gated by procurement)
- Twenty7tec mortgage rates → `RATES_DB` becomes a server-fetched table
- PropertyData / Sprift listings → live offer-strategy & rental yield
- EGi/CoStar regen pipeline → real `capexPipeline`

### Phase 5 — Hardening (parallel, ongoing)
- Web Worker for Monte Carlo & scoring loops
- Zod schemas at every API boundary (already prepped via `ScoreTrace`)
- CSP, HSTS, `X-Frame-Options: DENY`, secure cookies
- Sentry/PostHog for error + analytics
- DPIA + ICO registration (PII: income, DOB, documents)

---

## 5. Compliance

- **FCA**: mortgage rate display = financial promotion → must include risk
  warning + provider FCA reference + last-updated timestamp.
- **GDPR**: PII minimisation, right-to-erasure endpoint, encrypted at rest
  (`pgcrypto` for income/DOB).
- **Land Registry licence**: free for non-commercial display; commercial use
  requires attribution under Open Government Licence v3.
- **Ofsted/DfE**: OGL v3 attribution.

---

## 6. Estimated monthly cost (live)

| Item | Free tier | Paid (1k users) |
|---|---|---|
| Lovable Cloud (Postgres + Functions) | covered | ~£40 |
| HMLR / ONS / DfT / Ofsted / police.uk | £0 | £0 |
| OS Places API | 600k req free | £0 |
| Twenty7tec mortgage feed | — | ~£500 |
| PropertyData listings | — | ~£300 |
| EGi/CoStar regen | — | ~£800 |
| Sentry + PostHog | covered | ~£60 |
| **Total** | **£0** | **~£1,700/mo** |

---

## 7. Acceptance criteria for "live"

- [ ] Any UK postcode returns a populated `Area` within 800ms (cached) / 4s (cold)
- [ ] AVM uses ≥5 real comparables within 0.5 miles & 18 months
- [ ] Mortgage rates < 1h old, FCA disclosure visible
- [ ] All scores carry a methodology popover with the live source name
- [ ] No synthetic data shown without an explicit "Modelled estimate" badge
