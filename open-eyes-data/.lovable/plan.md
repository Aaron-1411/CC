## transparenC — UK Government Accountability Dashboard

A live, investigative-style dashboard built on the existing **TanStack Start** stack (React 19 + Vite + Tailwind v4 + shadcn/ui). All external API calls are proxied via TanStack server routes (`/api/*`) to avoid CORS and keep keys server-side. AI briefings use **Lovable AI Gateway** (Gemini) for generation and the **Perplexity connector** for live web-grounded UK stats.

---

### Pages (TanStack file routes)

| Route | Purpose |
|---|---|
| `/` | Headline stats strip, AI top-stories briefing, quick-access cards |
| `/petitions` | Petition tracker — sort/filter, 10k/100k progress bars, debate badges |
| `/contracts` | Contract search — red flags for direct/no-tender awards, preset queries |
| `/parliament` | Active bills with pipeline-stage visualisation |
| `/expenses` | MP expenses, filter by name/category, threshold flagging |
| `/briefing` | AI accountability briefings + live UK KPI grid via Perplexity |

Each route gets its own `head()` metadata (title, description, og:*).

---

### Server routes (proxy layer, all under `src/routes/api/`)

| Endpoint | Upstream |
|---|---|
| `GET /api/petitions` | `petition.parliament.uk/petitions.json` |
| `GET /api/bills` | `bills-api.parliament.uk` |
| `POST /api/contracts/search` | Contracts Finder PublicSearch |
| `GET /api/contracts/:id` | Contracts Finder detail |
| `GET /api/expenses` | IPSA API |
| `POST /api/briefing` | Lovable AI (Gemini) + Perplexity web search, streaming |
| `GET /api/kpis` | Perplexity-grounded fetch of NHS waiting list, debt %GDP, inflation, housebuilding |

Each proxy returns `{ data, meta: { source, licence: "Open Government Licence v3.0", fetchedAt } }` so the UI can render provenance + LIVE timestamp.

Short in-memory caching (60s–5min depending on endpoint) to stay polite to upstreams.

---

### AI layer

- **Lovable AI Gateway** via `@ai-sdk/openai-compatible` helper (`src/lib/ai-gateway.ts`), model `google/gemini-3-flash-preview`.
- **Perplexity connector** (`sonar` / `sonar-pro`) for live web-grounded data — used by `/briefing` for free-text topics, the homepage Top Stories block, and the live KPI panel. Perplexity returns citations which we render as source links.
- Briefing prompts enforce: factual, non-partisan, named ministers, real figures, cite sources.

---

### Design system (added to `src/styles.css`)

- Background `#0a0c10`, cards `#111318`, borders `#1a1d24`
- Accent amber `#f5a623`, danger `#ef4444`, success `#22c55e`, muted text `#8a8f99`
- Fonts via Google Fonts: **Playfair Display** (headings), **IBM Plex Mono** (labels/data), **Source Serif 4** (body)
- New tokens: `--accent-amber`, `--flag-red`, `--ok-green`, `--bg-card`
- Components: `<LiveBadge timestamp />` (pulsing dot), `<DataProvenance source licence fetchedAt />`, `<StageProgress />` (bill pipeline), `<ThresholdBar at={signatures} thresholds={[10000,100000]} />`, `<FlagPill variant="direct-award" />`, skeleton loaders for every panel.

---

### Implementation order

1. **Design tokens + fonts** in `src/styles.css`; add shared primitives (`LiveBadge`, `DataProvenance`, `Skeleton`, `FlagPill`).
2. **Server proxies** for Petitions, Bills, Contracts Finder, IPSA — typed responses, caching, error envelope.
3. **Lovable AI helper** + **Perplexity connector** wiring; `/api/briefing` (streaming) and `/api/kpis`.
4. **Routes**: `/`, `/petitions`, `/contracts`, `/parliament`, `/expenses`, `/briefing` — each with TanStack Query, skeleton states, sort/filter, provenance footer.
5. **Homepage composition**: stats strip pulled from `/api/kpis`, AI top-stories block, navigation cards.
6. SEO `head()` per route, mobile responsive pass, empty/error states.

---

### Technical notes

- Contracts Finder returns XML for some endpoints — proxy normalises to JSON.
- IPSA endpoint is paginated and large; UI fetches on-demand by MP/category.
- Bills API stages mapped to a fixed 5-step pipeline for visualisation.
- All AI/Perplexity calls server-only; `LOVABLE_API_KEY` and `PERPLEXITY_API_KEY` never leave the server.
- Perplexity connector is enabled via the standard connectors flow on first build of `/briefing`.
- Companies House cross-reference is **deferred** per your choice; contract detail page leaves a placeholder slot for later.
- No database needed — everything is live-fetched and cached in-memory.

When you approve, I'll start with the design system + shared primitives, then proxies, then pages.
