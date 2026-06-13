# Whole Health Compass — Launch Remediation Plan

**Status:** Phase 0 (read-only audit) complete. Awaiting decisions D1–D7 before any code changes.
**Branch:** `launch-remediation` (off `master` @ `58a8188`)
**Author:** Claude (audit), for Aaron's review
**Scope rule:** This is **surgery, not a rewrite.** Route structure, the single `ComparativeLens` component, and the content-pack architecture are preserved. No deploy — Aaron deploys after review. Launch waits for D1 clinician sign-off.

---

## How to read this document

- **§1–§7** are the verified audit findings (the 7 Phase-0 areas). Every claim is grounded in a file/line I read directly or a grep I ran in this tree — not inferred.
- **§8** maps the 7 workstreams onto real files.
- **§9** is the priority matrix (what blocks launch vs. what is polish).
- **§10** is the D1–D7 decision set with my recommendation for each — **this is what I need from you to proceed.**
- **§11** lists the hard launch gates.
- **§12** is the acceptance-criteria cross-walk.

**Bottom line up front:** the content is genuinely compliant today (greps below back this up), and the consent/degradation engineering is sound. There are **two P0 launch blockers**: (1) no structural red-flag safety floor, and (2) a client-side `/clinic` auth bypass that renders special-category health data in the shipping default configuration. Everything else is P1 hardening.

---

## §1 — Architecture & form→output mapping

**Stack:** Vite 5.4 + React 18.3 + TS + Tailwind 3.4, `react-router-dom` 6.30, lucide-react, hand-built UI primitives. SPA, no SSR. Package manager **bun**, dev port 5180.

**Routes** (`src/App.tsx:47-56`): `/`, `/compass`, `/learn`, `/learn/:id`, `/for-clinics`, `/compliance`, `/clinic`, `/about`, `/privacy`, `*`→`/`.

**Content-pack architecture** (preserved as-is):
- `ContentPack` packs live in `src/data/packs/` — active is **integrative** (flagship); **musculoskeletal** also present.
- Resolved by `clinicConfig.contentPackId` via `getPack` (`packs/index.ts:18-20`): `getPack(id) => packs[id] ?? integrativePack` — safe fallback.
- `src/data/concerns.ts` re-exports the app surface: `activePack`, `traditions`, `getConcern`, `LENS_SECTIONS`, `CLOSING_LINE`, `contentReview`.

**Form → output is pure selection/branching. No scoring, no inference. VERIFIED:**
- `src/flow/CompassFlow.tsx` — 5-step intake (`TOTAL_STEPS=5`, `STORAGE_KEY="whc_intake_progress"`). The *only* arithmetic in the flow is the progress-bar percentage (line 90). User explicitly selects `concernId` (line 105); "Jump to results" fallback sets `concernId="something-else"`.
- `src/lib/summary.ts` — `IntakeData` is all-string fields. `summaryRows()` maps the user's typed answers **verbatim** and filters empties. `buildSummaryText()` concatenates rows + a fixed disclaimer. **No weighting, no thresholds, no derived conclusions.**
- `src/pages/Compass.tsx:62` — output concern is fetched by `getConcern(result.concernId || "something-else")`; the lens content shown is whatever that concern object contains. The app **selects a pre-authored concern panel**; it does not compute a recommendation.

**Verdict:** ✅ Compliant by construction with principle #1 (never diagnoses). The summary is a faithful transcript of what the patient typed, routed to a pre-written educational panel they chose. **No remediation needed here** beyond keeping it this way (the linter in WS2 will guard the panels' content).

---

## §2 — Safety surface inventory

**What exists today:**
- `src/components/SafetyPanel.tsx` exports `SafetyPanel`, `RedFlags({items})` (renders null when the array is empty), and `InteractionsReminder`. All are **static display copy**; they reference 999 / NHS 111.
- `src/pages/Compass.tsx:83-104` render order: `PractitionerSummary` → `InteractionsReminder` (only if `hasTaking`) → `RedFlags items={concern.redFlags}` (line 88, before the lens) → `ComparativeLens` → `SafetyPanel` → `PathwayNavigator` → `LeadForm` → `ContentGovernanceLine`.
- Red-flag content is **per-concern hand-typed strings**: `integrative.ts` has 9 `redFlags:` arrays (lines 66, 124, 179, 234, 290, 342, 396, 448, 501); `musculoskeletal.ts` has 6.
- Crisis resources (**Samaritans 116 123**) appear in **only 3** hand-typed mental-health red-flag strings (`integrative.ts:69, 126, 398`).

**Gaps (⚠️ → P0):**
1. **No free-text interrupt engine.** Red flags are passive copy the user scrolls past *after* they reach results. A patient typing "crushing chest pain" or "thoughts of ending my life" into `patientWords` gets no real-time intercept — they get a pre-written concern panel and the usual scroll-past red-flag block.
2. **No structural sensitivity metadata.** Concerns carry no machine-readable flags for the high-risk categories the brief calls out: **mental-health / pregnancy / children / cardiac / neuro.** Safety today is *content-dependent* (a human remembered to type Samaritans into 3 of 9 concerns) rather than *guaranteed by structure*.
3. **No universal crisis line.** Crisis resources are not surfaced on every path — only where someone hand-typed them.
4. **Borderline efficacy tokens in red-flag copy** (compliance-adjacent, not safety): `integrative.ts:75` ("treats fatigue … as signals" — regards-as) and `:402` (oneLiner "Treats mood as real"). Legitimate "regard-as" constructions, but the WS2 linter must allowlist them deliberately.

**Verdict:** ⚠️ This is **WS1, P0.** Safety must become *structural*: a red-flag rule engine that screens free-text against curated patterns and **interrupts** with the correct escalation (999 / 111 / crisis line / same-day GP) before educational content, plus a crisis resource block present on every path regardless of concern. **The rule set itself is a clinician sign-off gate (D1).**

---

## §3 — Data-flow inventory

**Intake answers:** stay in the browser. Saved to `sessionStorage["whc_result"]` (`Compass.tsx:16,34`) and `sessionStorage["whc_intake_progress"]` (flow). Not transmitted unless the user submits the lead form. ✅

**Lead submission** (`src/components/LeadForm.tsx`):
- Consent is **robust**: required versioned consent checkbox (lines 177-189) gated on `CONSENT_VERSION`; payload includes `consent: true, consentVersion, consentText` (lines 56-59); separate opt-ins to email the summary and to let the clinic see it (lines 162-174); honeypot field (lines 26-30, 137); client validation (lines 32-39). ✅
- Endpoint: `LEAD_ENDPOINT = clinicConfig.formEndpoint || "/api/lead"` (line 13).
- **⚠️ Lines 69-75 write the FULL payload — including the `summary` health free-text — to `localStorage["whc_leads"]` BEFORE the fetch.** This local mirror is the data the `/clinic` bypass (below) exposes.
- Degradation: a non-ok response from the *own* backend still resolves as `success` (lines 88-104); only a BYO-endpoint failure surfaces an error.

**`/clinic` dashboard — ❌ P0 CLIENT-SIDE AUTH BYPASS. VERIFIED by direct read of `src/pages/Clinic.tsx:55-189`:**
- `load(tok)` — on **`401`** (ADMIN_TOKEN set, wrong token) → `setAuthed(false)`, clears token, shows error. ✅ correct.
- On **`503`** (backend reachable but `ADMIN_TOKEN` unset) → `setAuthed(true); setNotConfigured(true); setUsingLocal(true); setLeads(localLeads())` — **BYPASS #1** (lines 147-155).
- On **`catch`** (no Functions backend reachable at all) → `setAuthed(true); setUsingLocal(true); setLeads(localLeads())` — **BYPASS #2** (lines 171-179).
- `localLeads()` (lines 60-68) reads `localStorage["whc_leads"]`.

**Why this is P0:** In the **shipping default** (no `ADMIN_TOKEN`, or no Functions yet — exactly the "deploys with zero config" state the repo advertises), **any non-empty token unlocks the dashboard** and renders the localStorage leads, **including each patient's health summary.** Server-side auth (`requireAdmin`, constant-time, 401/503) is *correct*; the problem is the **client trusts itself** in degraded mode. On a shared / reception / kiosk browser this is a cross-patient **special-category (UK GDPR Art. 9)** exposure.

**Privacy notice mismatch (⚠️):** `src/pages/Privacy.tsx:21-25` states answers "stay in your own browser" and "Nothing you type is sent to {clinic} or anyone else unless you deliberately choose to" — but does **not** disclose that a submitted lead (name/email/phone/message **+ health summary**) is persisted to `localStorage["whc_leads"]`, and states **no retention period.** Transparency gap.

**Verdict:** ❌ **WS4, P0** (auth bypass + stop persisting health text locally) and **P1** (privacy disclosure + retention). Consent *capture* is already sound — the defect is local persistence + degraded-mode rendering + non-disclosure.

---

## §4 — Compliance reality check

**Provenance rendering — pack-level only, not per-lens / per-claim (⚠️):**
- `src/components/ComparativeLens.tsx:155-162` renders a **single generic collective footnote** ("NHS, NICE and the US NCCIH … to explain how each tradition thinks, not whether an approach works"). It is **not** per-lens, **not** per-claim, **not** dated.
- `src/components/ContentGovernance.tsx` (`ContentGovernanceLine` on results, `ContentGovernanceCard` on `/compliance`) gates on **pack-level** `contentReview` (reviewedBy, role, date, version, statement) — **one reviewer record for the whole pack**, no per-lens sources.
- The equal-framing is good: `ComparativeLens.tsx:132-137` intro banner says traditions are "presented as equals. None is ranked above another, and none replaces a conversation with a qualified practitioner" (✅ principle #4); per-lens `CLOSING_LINE` routes to a practitioner (line 69, ✅ principle #5).

**Banned-pattern greps — RAN IN THIS TREE (globs quoted to avoid the zsh nomatch error). Net result: content is genuinely clean:**
- **Dosing** (numbers + units / "mg"/"ml"/"twice daily" etc.): **0 real hits.**
- **Diagnosis** ("you have", "this is X condition"): all hits are **negations or policy statements** ("not a diagnosis", "we don't diagnose").
- **Efficacy** ("treats", "cures", "works", "effective"): only legitimate **"regard-as"** constructions (e.g. `integrative.ts:75` "treats … as signals", `:402` "Treats mood as real") and disclaimer text ("not whether an approach works").
- **Named remedies** (herb/formula/supplement/brand): **1 hit** — `src/components/SampleJourney.tsx:18` `taking: "A daily vitamin D supplement."` This is **patient-authored example input**, not an app recommendation (defensible), but a strict linter will flag it → genericise to "A daily supplement."
- **Ranking** ("best", "better than", "superior"): only behavioral "beats" in `musculoskeletal.ts:107,236` (movement-vs-rest comparisons, **not** tradition-ranking).

**Verdict:** The content **passes** the 5 untradeable principles today. But compliance is currently *manual* — held by careful authoring. **WS2, P0** makes it *mechanical*: (a) a build-time `lint:content` linter with a curated allowlist for the legitimate "regard-as"/"beats" constructions and a `linter/banned-remedies.txt` list, wired into CI; and (b) **per-lens provenance** (reviewer + register + dates + sources) rendered as visible badges, replacing the single collective footnote.

---

## §5 — Config & degradation

- `wrangler.toml` — `pages_build_output_dir = "dist"`, `nodejs_compat`. **Graceful-degradation backend**: D1 `DB`, Resend (`RESEND_API_KEY`/`LEAD_FROM`/`LEAD_NOTIFY_TO`), `ADMIN_TOKEN` — **all optional, off by default**, CI stays green, go-live is a documented config step (`ACTIVATION.md`). Each capability switches on only when its binding/secret is present; until then the API returns friendly "accepted" responses.
- White-label: `src/config/clinic.ts` drives clinic name/contact; title set at module load for crawlers (`App.tsx:30-32`).

**Verdict:** ✅ Degradation engineering is solid and intentional. **WS6 (P1)** only needs to make degradation *honest on the patient surface* (don't imply a capability is live when its binding is absent) and finish white-label coverage. **One caveat:** the *same* degradation philosophy is what produces the `/clinic` P0 — "fail open" is right for a contact form, **wrong for an auth gate.** WS4 must make `/clinic` **fail closed.**

---

## §6 — Metadata / SEO / share

- `index.html` **has:** charset, viewport, theme-color, `X-Content-Type-Options: nosniff`, referrer policy, `format-detection telephone=no`, title, description, robots `index,follow max-image-preview:large`, `og:type/locale/title/description`, favicon, apple-touch-icon, font preconnects.
- **MISSING:** `og:image`, `twitter:card` + `twitter:*`, `<link rel="canonical">`, JSON-LD structured data.
- `public/` contains only `_redirects` (`/* /index.html 200`) and `favicon.svg`. **No `sitemap.xml`, no `robots.txt`, no og-image asset.** (Note: a sitemap was referenced in the HEAD commit message but is not present in `public/` — to verify/repair in WS5.)
- `vite.config.ts` is plain `react()` + alias — **no SSG/prerender.** As an SPA, crawlers and social unfurlers get an empty shell. `package.json` has **no** `lint:content` or prerender scripts and **no** `linter/` or `scripts/` dir.

**Verdict:** ❌ **WS5, P1.** Add prerender (approach = D3) so each route ships real HTML; add `og:image` (branded card = D7), twitter tags, canonical, JSON-LD, `sitemap.xml`, `robots.txt`.

---

## §7 — Accessibility (WCAG 2.2 AA)

- Strong primitives: skip-link `App.tsx:42` (`<a href="#main" class="skip-link">`) → `<main id="main">` (line 45); hand-built UI components.
- `ScrollToTop` (`App.tsx:17-23`) scrolls on navigation but **does not move focus to `<main>`** — keyboard/screen-reader users aren't repositioned on route change (minor but real AA gap).
- Full AA pass (focus-visible on all interactives, form label/error associations and `aria-live` on the lead form, lens tab semantics + roving focus, target sizes, reduced-motion, contrast tokens) not yet audited line-by-line.

**Verdict:** ✅ Good foundation. **WS7, P1** — route-change focus management + a systematic AA pass.

---

## §8 — Workstreams → real files

| WS | Title | Priority | Primary files (touch) | New files |
|----|-------|----------|------------------------|-----------|
| **WS1** | Safety floor — red-flag interrupt engine + universal crisis resources | **P0** | `src/components/SafetyPanel.tsx`, `src/pages/Compass.tsx` (intercept before lens), `src/flow/CompassFlow.tsx` (screen free-text), `src/data/packs/*.ts` (add structural `sensitivity` + typed `RedFlagRule[]`), `src/data/concerns.ts` (re-export) | `src/lib/redflags.ts` (rule engine + `RedFlagRule`), `src/components/RedFlagInterrupt.tsx`, `src/data/crisis.ts` (universal resources) |
| **WS2** | Compliance enforcement + per-lens provenance | **P0** | `src/components/ComparativeLens.tsx` (per-lens provenance badges), `src/components/ContentGovernance.tsx`, `src/data/packs/*.ts` (add `Provenance` per lens), `src/components/SampleJourney.tsx:18` (genericise), `package.json` (`lint:content` script + CI), `.github/workflows/*` | `src/lib/provenance.ts` (`Provenance` type + render), `scripts/lint-content.mjs`, `linter/banned-remedies.txt`, `linter/allowlist.txt` |
| **WS3** | Regulatory honesty — registers explainer + equals-panel | **P1** | `src/pages/Compliance.tsx` / `for-clinics`, `ComparativeLens.tsx` (link to explainer) | `src/components/RegistersExplainer.tsx`, `src/data/registers.ts` |
| **WS4** | Data protection — fail-closed `/clinic`, stop local health persistence, privacy + retention | **P0** (auth + persistence) / **P1** (disclosure) | `src/pages/Clinic.tsx:147-179` (remove client bypass — render leads **only** on server auth), `src/components/LeadForm.tsx:69-75` (stop writing `summary` to localStorage), `src/pages/Privacy.tsx` (disclose persistence + retention), `functions/` (server stays source of truth) | — |
| **WS5** | Prerender / SEO / share | **P1** | `vite.config.ts` (prerender), `index.html` (og:image, twitter, canonical, JSON-LD), `package.json` (build step) | `public/og-image.*`, `public/sitemap.xml`, `public/robots.txt`, `scripts/prerender.mjs` (if D3=custom) |
| **WS6** | White-label + honest degradation | **P1** | `src/config/clinic.ts`, patient-surface components that imply live capability, `ACTIVATION.md` | — |
| **WS7** | Accessibility WCAG 2.2 AA | **P1** | `src/App.tsx` (`ScrollToTop` focus mgmt), `LeadForm.tsx` (aria-live/labels), `ComparativeLens.tsx` (tab semantics), global focus-visible/contrast tokens | — |

---

## §9 — Priority matrix

**P0 — hard launch blockers (must land + sign-off before go-live):**
- **WS1** structural safety floor (red-flag interrupt engine + universal crisis resources) — *and its rule set needs D1 clinician sign-off.*
- **WS2** compliance linter in CI + per-lens provenance.
- **WS4 (auth + persistence half)** — make `/clinic` fail closed; stop persisting health free-text to `localStorage`.

**P1 — launch hardening (target for launch, not a hard gate):**
- WS3 registers explainer; WS4 privacy disclosure + retention; WS5 prerender/SEO/share; WS6 honest degradation + white-label; WS7 accessibility AA.

**P2 — post-launch polish:**
- JSON-LD richness, additional content packs, analytics depth, expanded a11y automation.

---

## §10 — Decisions needed (D1–D7)

**I need your call on each before I start WS edits. My recommendation is given for every one.**

- **D1 — Red-flag rule set + clinician sign-off (HARD GATE).** I will draft the `RedFlagRule[]` (patterns, `appliesTo`, action tier 999/111/crisis-line/same-day-GP, message, resources) covering the high-risk categories — cardiac, mental-health/self-harm, pregnancy, children, neuro/stroke — and mark the whole set `draft: true`. **It cannot go live until a named clinician signs it off.**
  *Recommendation:* I author the DRAFT now so review can start; **launch stays blocked on sign-off.** Who is the clinician, and is "DRAFT pending sign-off" acceptable to build against?

- **D2 — `/clinic` auth approach.** Server-side `requireAdmin` is already correct. The fix is client-side: **fail closed.**
  *Recommendation:* Remove BYPASS #1/#2 (`Clinic.tsx:147-179`); render leads **only** after a verified server `200`. When `ADMIN_TOKEN` is unset (503) or no backend (catch), show "Dashboard not configured" — **never** render `localStorage` leads. Pair with WS4 removing the local health mirror entirely. OK to proceed this way?

- **D3 — Prerender approach.** Options: (a) `vite-react-ssg` / `vite-plugin-prerender`-style plugin, (b) a small custom `scripts/prerender.mjs` post-build that renders each route to static HTML, (c) keep SPA + inject per-route meta only.
  *Recommendation:* **(b) custom post-build prerender** — minimal new deps, full control, fits the "surgery not rewrite" rule and the CC monorepo build. Agree?

- **D4 — THR (Traditional Herbal Registration) safety note.** Whether/where to surface a standing note that any herbal product should carry a THR marking and be discussed with a practitioner — *without* naming any product.
  *Recommendation:* Include a tradition-level, product-agnostic THR safety note in the registers explainer (WS3) and the herbal-adjacent lens footer. Confirm wording intent.

- **D5 — Privacy controller framing.** Is the **clinic** the data controller (platform = processor), or is the platform a controller too?
  *Recommendation:* **Clinic = controller, platform = processor** (clinic owns the patient relationship and the enquiry). Privacy copy + retention written accordingly. Confirm.

- **D6 — Confirm NO AI on patient surfaces.** The build forbids any LLM on patient-facing paths.
  *Recommendation:* **Confirmed by design** — there is no model call anywhere in intake/summary/lens; output is pure selection (§1). I will add a linter guard so none can be introduced. Just confirming you want this locked.

- **D7 — og:image branded card.** A static branded share card (logo + "Whole Health Compass" + one-line descriptor), white-labelable later.
  *Recommendation:* Ship a clean default `public/og-image.png` now; make the path config-driven for white-label. Approve a default, or provide art?

---

## §11 — Launch gates (all must be true)

1. WS1 safety floor merged **and** the red-flag rule set signed off by a named clinician (D1).
2. WS2 `lint:content` green in CI **and** per-lens provenance visible on every lens.
3. WS4 `/clinic` fails closed **and** no patient health free-text persists to `localStorage`.
4. Privacy notice discloses persistence + retention (D5 framing).
5. No LLM on any patient surface (D6), enforced by linter.
6. Aaron's review complete. **Aaron deploys — I do not.**

---

## §12 — Acceptance-criteria cross-walk

| Build-prompt acceptance criterion | Workstream | Current state | Gate |
|---|---|---|---|
| Never diagnoses (selection not scoring) | §1 / WS2 | ✅ already pure selection | linter-locked |
| Never names remedy/herb/dose | §4 / WS2 | ✅ clean (1 patient-example to genericise) | P0 |
| Never claims an approach treats/cures/works | §4 / WS2 | ✅ only "regard-as" constructions | P0 |
| Never ranks one tradition above another | §4 | ✅ equal-framing present | linter-locked |
| Always routes to a registered practitioner | §2 / WS3 | ✅ per-lens closing line + panel | P1 explainer |
| Free-text red-flag interrupt before content | §2 / WS1 | ❌ passive scroll-past only | **P0** |
| Universal crisis resources on every path | §2 / WS1 | ❌ only in 3 hand-typed concerns | **P0** |
| Per-lens provenance (reviewer/register/dates/sources) | §4 / WS2 | ❌ single collective footnote | **P0** |
| Compliance linter in CI | §4 / WS2 | ❌ no `lint:content` | **P0** |
| `/clinic` authenticated, fails closed | §3 / WS4 | ❌ client-side bypass in degraded mode | **P0** |
| No special-category data in `localStorage` | §3 / WS4 | ❌ full health summary mirrored locally | **P0** |
| Privacy notice discloses persistence + retention | §3 / WS4 | ❌ says "stays in browser" only | P1 |
| Prerendered routes + og:image + sitemap | §6 / WS5 | ❌ SPA shell, no og:image/sitemap | P1 |
| Honest degradation on patient surface | §5 / WS6 | ✅ backend; ⚠️ surface wording | P1 |
| WCAG 2.2 AA | §7 / WS7 | ✅ foundation; ⚠️ route focus + full pass | P1 |
| No LLM on patient surfaces | §1 / WS2 | ✅ none present | locked (D6) |

---

**Next action:** awaiting your D1–D7 decisions. On confirmation I execute WS1→WS7 on `launch-remediation` (conventional commits per workstream, no force-push), then deliver a diff summary, the linter report, the **DRAFT** red-flag set awaiting clinician sign-off, and `LAUNCH_NOTES.md`. **I will not deploy.**
