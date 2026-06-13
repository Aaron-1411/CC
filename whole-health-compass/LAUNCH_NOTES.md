# Whole Health Compass — Launch Handoff

**Status:** Remediation complete on `launch-remediation`. **Not deployed** — this is for Aaron's pre-deploy review.
**Branch:** `launch-remediation` (off `master` @ `58a8188`) · 8 commits · working tree clean
**Scope rule honoured:** surgery, not a rewrite. Route structure, the single `ComparativeLens` component, and the content-pack architecture are unchanged.
**Bottom line:** the build is green and compliant by construction, but **launch is gated on one human action that I cannot do — a named clinician must sign off the red-flag rules** (§2). The other two items in §3 are recommended polish, not blockers.

---

## §1 — What shipped (D1–D7)

| Commit | Workstream | Decision |
| --- | --- | --- |
| `2b7fc53` | Structural red-flag safety screen — free-text interrupt engine + universal crisis block on every path | **D1** |
| `fafaf47` | `REMEDIATION_PLAN.md` (read-only audit + D1–D7 plan) | — |
| `f8e1d16` | Content-compliance linter + no-LLM guard + source provenance, wired as a CI gate | **D6** |
| `d64625e` | `/clinic` fails closed; stop mirroring special-category health data in the browser | **D2, D5** |
| `a19100b` | Register-verification literacy + product-agnostic THR (Traditional Herbal Registration) note | **D4** |
| `92bb40c` | Per-route prerender → crawler-correct HTML/meta/JSON-LD, sitemap, robots | **D3, D7** |
| `257ddbd` | Honest lead-form degradation — only claim receipt when the backend actually stored/emailed | **WS6** |
| `b673590` | Accessible tabs (ARIA APG), route-change focus management, form-field a11y | **WS7** |

The five untradeable principles hold: the app never diagnoses, never names a remedy/herb/formula/supplement/dose, never claims an approach treats/cures/works, never ranks one tradition above another, and routes every path to a qualified registered practitioner. The content linter (`scripts/lint-content.mjs`) now enforces this mechanically on every build.

---

## §2 — LAUNCH GATE: red-flag clinician sign-off (D1) — **blocks deploy**

The red-flag engine (`src/lib/redflags.ts`) is live and runs in production today — it screens free-text and interrupts with the correct escalation (999 / NHS 111 / crisis line / same-day GP) before any educational content. **All 15 rules currently ship `draft: true`.**

`draft` is **not** a feature flag — the rules fire regardless. It is compliance provenance: it marks each rule as **not yet reviewed and signed off by a named, qualified clinician.** That sign-off is a human gate I deliberately cannot clear.

**Action before launch:**
1. A named clinician reviews all 15 rules in `src/lib/redflags.ts` — the trigger patterns, the severity, and the escalation copy for each.
2. On approval, flip the reviewed rules to `draft: false` and record who signed off and when (the file header documents the convention).
3. Re-run `npm run build` and confirm green, then deploy.

Until this is done, treat the safety screen as provisional. This is the single hard blocker.

---

## §3 — Recommended before deploy (not blockers)

**a) Export the OG card to PNG.** `src/config/clinic.ts` sets `ogImagePath: "/og-image.svg"`, and `public/og-image.svg` is an SVG. The prerender composes it into absolute `og:image` / `twitter:image` URLs correctly, **but most social platforms (Facebook, LinkedIn, X, iMessage, WhatsApp, Slack) will not render an SVG OG image** — the card will silently fail to preview. Export a **1200×630 PNG**, drop it in `public/` (e.g. `og-image.png`), and point `ogImagePath` at it. The favicon (`public/favicon.svg`) is fine as SVG — only the social card needs raster.

**b) Optional — index the knowledge-base articles.** `scripts/prerender.mjs` emits `sitemap.xml` for the 7 static public routes and deliberately omits `/clinic` (private dashboard) and the dynamic `/learn/:id` articles (titled client-side). If knowledge-base SEO matters, enumerate the content-pack issue ids at prerender time and emit one `<url>` per article. Low effort, no architectural change — purely a discoverability gain.

**c) Turn on the backend when ready.** The site ships fully working with zero backend config and degrades gracefully. To make lead capture durable, send clinic notification emails, and unlock `/clinic`, follow **`ACTIVATION.md`** (D1 database binding, Resend env vars, `WHC_ADMIN_TOKEN`). Each is independent and off-by-default; `/clinic` fails closed until `ADMIN_TOKEN` is set, so there is nothing to break by leaving them off.

---

## §4 — Verify (all green on this branch)

```bash
cd whole-health-compass
npm run typecheck      # tsc on app + functions
npm run compliance     # lint:content + guard:no-llm
npm run build          # vite build + prerender (7 route shells + sitemap.xml + robots.txt)
```

`npm run compliance` is the CI gate (content linter + no-LLM guard). No LLM runs on any patient surface — the guard enforces it across `src/**` and `functions/**`.

---

## §5 — Final diff (vs. `master` @ `58a8188`)

30 files changed, **+2295 / −105**. New files marked `A`.

**New safety / compliance core**
- `A src/lib/redflags.ts` — red-flag rule engine (15 rules, all `draft: true` — see §2)
- `A src/components/RedFlagInterrupt.tsx` — interrupt UI shown before educational content
- `A src/data/crisis.ts` — universal crisis resources (999 / NHS 111 / Samaritans 116 123 / Shout)
- `A src/data/registers.ts` + `A src/components/RegistersExplainer.tsx` — register-verification literacy (D4)

**New build/CI tooling (zero runtime deps)**
- `A scripts/lint-content.mjs`, `A linter/banned-remedies.txt`, `A linter/allowlist.txt` — content compliance linter (D6)
- `A scripts/guard-no-llm.mjs` — no-LLM guard (D6)
- `A scripts/prerender.mjs` — per-route HTML/meta/JSON-LD + sitemap + robots (D3)

**Modified surfaces**
- `M src/pages/Clinic.tsx` — fail-closed dashboard, no browser health-data persistence (D2, D5)
- `M src/components/LeadForm.tsx` — honest degradation + form a11y (WS6, WS7)
- `M src/components/ui/index.tsx`, `M src/App.tsx` — accessible tabs + route-change focus (WS7)
- `M functions/api/lead.ts` — `{ ok, stored, emailed }` honesty contract (WS6)
- `M src/pages/Privacy.tsx`, `M src/pages/Compliance.tsx` — controller/processor wording (D5), THR note (D4)
- `M src/config/clinic.ts`, `M index.html`, `A public/og-image.svg` — branded default social card (D7)
- `M src/components/ComparativeLens.tsx`, `M src/components/SampleJourney.tsx`, `M src/flow/CompassFlow.tsx`, `M src/pages/Compass.tsx`, `M src/data/packs/*`, `M src/data/types.ts` — wiring the safety screen + register literacy into the journey

**Docs**
- `A REMEDIATION_PLAN.md` (audit), `M ACTIVATION.md` (backend runbook), `A LAUNCH_NOTES.md` (this file)

---

**Do not deploy from automation.** Clear the §2 gate, action §3a, then deploy per `ACTIVATION.md`.
