
# Settld upgrade plan — first-time-buyer focus, TfL routing, real listing data

This plan delivers the assessment recommendations **excluding billing**, plus a real TfL routing upgrade, real Rightmove-parity data pulled from listings, and an information-architecture pass that puts first-time buyers (FTBs) front and centre. Everything else becomes secondary.

---

## 1. Reposition the product around first-time buyers

The current homepage and pillar grid try to serve buyers, investors and remortgagers equally. We will narrow the surface so an FTB lands on it and immediately understands "this gets me on the ladder."

### Information architecture
- **Homepage**: hero copy rewritten for FTBs. New 3-step "Your path to the keys" panel: *Can I afford it? → Is this the right place? → Should I buy this one?*
- **Primary pillars** (kept, reordered): Affordability, Area, Verdict, Plan.
- **Secondary pillars** (collapsed under "Advanced"): Investment / IRR, Portfolio compare, Lease deep-dive, Remortgage, BTL.
- **Pillar copy**: rewritten in plain English, jargon wrapped in `<Jargon>` everywhere.
- **Onboarding (`/onboarding`)**: defaults persona to "First-time buyer" and only asks the 3 questions that matter (deposit saved, household income, target region). Other personas accessible via "I'm not a first-time buyer".
- **Sidebar / mobile nav**: "Advanced" group becomes collapsible, off by default for FTB persona.
- **Glossary + Jargon component**: sweep all pages to wrap terms (LTV, SDLT, EPC, EWS1, leasehold, gazumping, exchange, completion, MIP, AIP, conveyancer).

### Non-goals
- We will not remove the advanced tools — they stay reachable, just demoted.

---

## 2. TfL commute upgrade (real routing for London)

Replace the heuristic in `src/lib/commuteEstimator.ts` with real data when the destination is in Greater London.

### Approach
- New edge function `tfl-journey` calls `https://api.tfl.gov.uk/Journey/JourneyResults/{from}/to/{to}` (TfL Unified API — free, no key needed for low volume; key supported via env if user adds it later).
- Inputs: `fromLat,fromLng` and `toLat,toLng` (TfL accepts `lat,lng` strings).
- Returns per-mode durations: tube/rail/bus, walk, cycle, drive (TfL covers transit + walk + cycle; drive remains heuristic).
- Client: `commuteEstimator.ts` keeps the same `estimateTimes` signature but becomes `async` and dispatches: London bbox → TfL; outside London → existing heuristic with a "Heuristic" badge.
- Cache results in `react-query` for 24h keyed by `(from, to, mode)`.
- UI: `CommuteToPlace.tsx` shows source badge ("TfL live" vs "Estimate") and links to `tfl.gov.uk` journey page.

### Fallback
- If TfL returns no journey or 5xx, fall back to the heuristic and badge "Estimate".

---

## 3. Real Rightmove-parity data from the listing itself

Currently `properties.ts` ships mock fields. We already have `parse-listing` edge function (Lovable AI). We will extend it.

### Edge function changes (`supabase/functions/parse-listing/index.ts`)
- Expand the AI extraction schema to include every Rightmove-parity field already in the `Property` type:
  - propertyType, tenure, leaseYearsRemaining, groundRent, serviceCharge
  - councilTaxBand, parking, garden
  - broadbandMbps, mobileSignal (Ofcom block on Rightmove pages)
  - chainStatus, daysOnMarket
  - floodRisk, heating, listedBuilding, conservationArea
  - priceHistory (Rightmove "Listing history" block)
  - epc rating
- Strengthen the system prompt to return only fields actually present on the page (no hallucination — leave undefined).
- Fetch with realistic UA header; on 403, return clear `blocked` so the existing `ListingParseError` mapping shows the helpful manual-entry hint.

### Client changes
- `parseListingUrl` already returns `ParsedListing`; widen its TS shape to include the new fields.
- `Properties.tsx` import-listing flow: when fields come back, write them straight into the `Property` object so `PropertyDisclosure` shows real data.
- Where a field is missing, render "Not disclosed" (already supported).

### What we still won't do
- We will not pretend to have Land Registry sold-prices or live Ofcom checks on areas we didn't import — those stay best-effort live calls in their own panels.

---

## 4. Area intelligence overhaul (FTB lens)

Goal: when an FTB looks at an area, they should immediately answer "could I live here, and could I afford it?" — not "what's the demographic split?"

### `Areas.tsx` restructure
New stacked sections per compared area, in this order:
1. **Snapshot for first-time buyers** — median 2-bed asking price, average deposit needed at 90% LTV, monthly payment at today's BoE rate, SDLT for FTBs (using `useRegionTerm` for stamp-duty terminology).
2. **Live local** (existing `<AreaLiveLocal>`): nearest stations + schools.
3. **Cost of living** — council tax band D for the LA, average broadband Mbps, crime per 1k (already available via `use-crime`).
4. **Get-on-the-ladder signals** — % of homes under £450k (FTB SDLT relief threshold), HPI 1y / 5y change, rental yield (for "rent vs buy" sanity).
5. **What's it like to live here** — short narrative paragraph generated by the existing `verdict-narrative` edge function (reused with a new `mode: "area"` branch) using the live data above. Cached 24h.
6. **Cheaper lookalikes** — link to existing `/data-twin` pre-filtered to this area.

### New helpers
- `src/lib/ftbArea.ts` — pure functions: `ftbDeposit(price, ltv)`, `ftbStampDuty(price)`, `ftbMonthly(price, rate, term)`, `underThreshold(props, 450000)`.
- `src/components/AreaFtbSnapshot.tsx` — renders section 1 using `ftbArea.ts` + `use-boe-rates` + (mock for now) median price from `areas.ts`.
- `src/components/AreaCostOfLiving.tsx` — section 3.
- `src/components/AreaLadderSignals.tsx` — section 4, pulls from `use-hpi` + `use-rental-index`.
- `src/components/AreaNarrative.tsx` — section 5, calls the extended `verdict-narrative` function.

### Edge function tweak
- `verdict-narrative/index.ts` accepts `{ mode: "area" | "verdict", ...}` and returns 2-3 sentence FTB-focused area summary when `mode === "area"`.

### Bug fix in scope
- The runtime error `Postcode lookup failed` from `lookup-postcode` 502: harden `useOutcode` and `lookup-postcode` edge function to gracefully handle invalid outcodes (returns null result, not 502), and `AreaLiveLocal` already shows a friendly fallback.

---

## 5. Trust layer (from earlier assessment, non-billing items)

- **Methodology coverage**: every page that ships a number gets a `<MethodologySection>` link. Sweep `Avm.tsx`, `Investment.tsx`, `Appreciation.tsx`, `LeaseAnalysis.tsx`, `Remortgage.tsx`, `Decide.tsx` — add where missing.
- **FCA copy sweep**: replace "best rate", "save you £X", "guaranteed" with cautious phrasing ("indicative", "estimated", "based on…"). Do this in `Home.tsx`, pillar taglines, `LiveRateBanner.tsx`, `Decide.tsx` verdict copy.
- **Cookie consent → analytics gating**: `CookieBanner.tsx` already exists; wire `localStorage.cookie-consent` to gate any analytics tracker calls (currently `use-track-tool.ts`).
- **Status freshness**: every live data panel must use `<FreshnessPill>` if not already (audit + fix).

---

## 6. Retention quick wins (no billing)

- **Saved verdicts**: `Decide.tsx` already saves a receipt. Add a "Saved" tab on `/alerts` listing recent verdicts from local storage with re-run button.
- **Watermarked PDF export**: `report.tsx` already exists; add a faint "Settld — indicative only" watermark and a per-page footer with methodology version.
- **Mobile polish at 375px**: audit `Home.tsx`, `Areas.tsx`, `Decide.tsx`, `Properties.tsx` for overflow at 375px and fix the worst offenders.
- **Empty-state CTAs**: ensure every list page (`Viewings`, `Shortlist`, `Alerts`, `Properties`) has an `EmptyState` from `@/components/states` with a one-click "Add your first…" CTA.

---

## 7. Out of scope for this build

- **Billing** (Stripe/Paddle, entitlements, /pricing page, Customer Portal) — explicitly skipped per your instruction.
- **Per-area Ofcom / Land Registry mass imports** — too large; handled per-listing via parse-listing instead.
- **Map view of areas** — punt to a follow-up.
- **Co-buyer realtime collaboration** — page exists, no upgrades here.

---

## Technical summary

**New files**
- `supabase/functions/tfl-journey/index.ts`
- `src/lib/ftbArea.ts`
- `src/components/AreaFtbSnapshot.tsx`
- `src/components/AreaCostOfLiving.tsx`
- `src/components/AreaLadderSignals.tsx`
- `src/components/AreaNarrative.tsx`

**Edited files**
- `src/lib/commuteEstimator.ts` (TfL adapter, async)
- `src/components/CommuteToPlace.tsx` (source badge, async)
- `supabase/functions/parse-listing/index.ts` (extended schema)
- `supabase/functions/verdict-narrative/index.ts` (area mode)
- `supabase/functions/lookup-postcode/index.ts` (fail-soft)
- `src/lib/listing.ts` + `src/data/properties.ts` (wider type)
- `src/pages/Home.tsx`, `src/lib/pillars.ts` (FTB-first IA + copy)
- `src/pages/Onboarding.tsx` (FTB default)
- `src/pages/Areas.tsx` (new sections)
- `src/components/AppSidebar.tsx`, `src/components/MobileBottomNav.tsx` (Advanced collapse)
- Methodology + FCA copy sweep across the listed pages
- `src/hooks/use-track-tool.ts` (cookie-consent gate)
- `src/pages/Alerts.tsx` (Saved verdicts tab)
- `src/pages/Report.tsx` (watermark + methodology footer)
- Empty-state polish in `Viewings.tsx`, `Shortlist.tsx`, `Properties.tsx`

**Estimated scope:** ~6 new files, ~18 edited. No DB migrations, no new secrets required (TfL works keyless at our volume).
