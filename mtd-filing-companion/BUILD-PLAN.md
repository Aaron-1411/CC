# MTD Quarterly Filing Companion — BUILD PLAN (v1.1, council-reviewed, decisions locked)

> **Status:** FINALISED v1.1 — reviewed by a 4-member LLM council (2026-06-14). **Fully locked for build.** D5 (pricing/positioning) and D7 (target cohort) are now **decided** (money-effectiveness mandate) — see §2. Next action: Aaron's go for Phase 0.
> **Owner:** Aaron (Aaron-1411)
> **Last updated:** 2026-06-14
> **This file is the single source of truth. Check it before building. Update the Change Log on every scope change.**

---

## 0. One-line thesis (revised post-council)

A dead-simple, mobile-first tool that lets a **UK landlord (and sole trader)** keep digital records and **file their quarterly + year-end MTD for Income Tax** with HMRC — sold **freemium** (free record-keeping + first filing, paid for the year-end final declaration, multi-property/multi-business, and deadline support), targeted first at the **landlord niche** as a cross-sell from Aaron's Landlord Compliance Hub audience.

> **What changed and why:** the original "£6/mo undercuts Xero's £30" thesis did not survive council review. The real competition at the low end is **£0** — multiple HMRC-recognised products are already permanently free (Clear Books Free, Sage Sole Trader, FreeAgent-via-bank, QuickFile, and more), and HMRC *itself* "strongly encourages" a free version. A flat £6 sits in a dead zone: above free, below the £10–15 value-added niche tools (Hammock £15, LandlordOS £12+). The defensible play is **a niche + a value moment to charge for**, not "cheap generic filing." Details and evidence in §1.1 and §7.

**Regulatory tailwind (intact):** MTD for Income Tax is now mandatory and phasing in by income band through 2028 (verified facts in Appendix A).

---

## 1. Verified ground truth (gov.uk, checked 2026-06-14)

> Full quotes + sources in **Appendix A**. Summary:

- **Mandation timeline (by qualifying income):**
  - £50,000+ (2024-25 income) → mandatory **from 6 April 2026** ✅ *(live now)*
  - £30,000+ (2025-26 income) → mandatory **from 6 April 2027**
  - £20,000+ (2026-27 income) → mandatory **from 6 April 2028**
  - Partnerships: future date, not yet set.
- **In scope:** sole traders **and** landlords registered for Self Assessment, with self-employment and/or property income over the threshold. "Qualifying income" = gross (pre-expense) self-employment + property income, combined.
- **Obligations:** **4 quarterly updates/year** (cumulative category totals — HMRC does *not* receive individual receipts) + a **year-end final declaration** that replaces the SA return, due **31 January** following the tax year.
- **Software is mandatory and must be HMRC-recognised.** It must (1) create/store/correct digital records, (2) send quarterly updates, (3) submit the final declaration. Two models: all-in-one vs bridging.
- **To submit real data you must pass HMRC's recognition process:** build against the MTD ITSA APIs on HMRC's Developer Hub, pass sandbox testing, complete the **Production Approvals Checklist**, implement mandatory **fraud-prevention headers**, accept terms of use, and get listed on the gov.uk "find compatible software" page. **Production access check runs ~10 working days** — recognition itself is fast; *being ready to apply* (a complete, standards-meeting product) is the long pole.

### ⚠️ The three facts that reshape this whole plan

1. **You cannot legally take a penny or file a single real return until HMRC recognition + production credentials are granted.** This is a regulatory gate, not a code task. *Council nuance:* the gate is gated on a **complete product meeting HMRC's minimum functionality standards end-to-end** (records → 4 quarterly updates → BSAS adjustments → tax calc → final declaration) — **not** on a partial demo. The approval *check* is ~10 working days; the work is getting the full surface sandbox-passing first.
2. **The real low-end competition is £0, not £30, and HMRC encourages free.** Free recognised competitors already exist and are well-resourced (Clear Books Free does the *entire* job — records, one-click quarterly, year-end, both SE and property, mobile, free; Sage Sole Trader is permanently free; FreeAgent is free via Mettle/NatWest/RBS). The "£6 undercuts £30" framing is dead. **Pricing/positioning must pivot** (resolved in §7-Q1).
3. **The hardest technical risk is fraud-prevention headers on a serverless/edge runtime — not the API calls.** HMRC *does* support the server-side topology (connection method `WEB_APP_VIA_SERVER`), so the architecture is sound, but ~6 of the 16 required `Gov-Client-*` headers must be captured **in the end-user's browser** and forwarded server-side, and one (`Gov-Client-Public-Port`) is **not exposed by the Cloudflare Workers runtime** and will need HMRC's documented missing-data fallback. This must be proven in Phase 0, not discovered in Phase 5 (resolved in §3, Phase 0 & D2).

---

## 2. Locked decisions (council-reviewed)

| # | Decision | Rationale / council note |
|---|----------|--------------------------|
| D1 | **Stack:** Vite + React + shadcn/ui + Supabase (auth/RLS/Postgres) + Cloudflare Pages Functions | Matches Aaron's proven stack (Landlord Hub, WHC, MoneyMind); dodges the CF 3 MiB Worker cap. **Confirmed viable** — but see D2 for the fraud-header caveat. |
| D2 | **HMRC integration is server-side only** (`WEB_APP_VIA_SERVER`), **plus a thin client-side JS collector** that captures the 6 browser-sourced fraud headers and forwards them to the Pages Function. **HMRC OAuth refresh tokens stored AES-GCM-encrypted in Supabase, with the encryption key held only in Cloudflare env secrets** (RLS alone is *not* sufficient — a leaked service-role key would expose all tokens). | OAuth tokens + fraud headers must be server-controlled; the browser never holds HMRC credentials. The client collector is mandatory for `Gov-Client-Device-ID`, `-Screens`, `-Window-Size`, `-Timezone`, `-Browser-JS-User-Agent`, `-Multi-Factor`. The original draft omitted this layer. |
| D3 | **Recognition track (Track R) starts in Phase 0 and runs in parallel** | Critical path to revenue. Note the ~10-working-day approval check is short; the gate is *product completeness*. |
| D4 | **Billing (Stripe) deferred to Phase 7** — build & prove the full sandbox cycle free first | Don't charge before you can file; matches Landlord Hub sequencing. |
| D5 | **✅ LOCKED (2026-06-14, money-effectiveness mandate): freemium, landlord-first.** Free tier = record-keeping + quarterly updates (matches the £0 incumbents so price is never the reason to walk). **Paid unlocks the year-end final declaration, multi-property/multi-business, and deadline-concierge support**, at **£9.99/mo or £89/yr — annual is the default plan** (kills seasonality/file-and-cancel churn, ~3–4× the LTV of monthly). **A B2B2C accountant/bookkeeper channel is the second GTM leg** (highest ARPU, lowest CAC-per-seat: one firm = many filers) — architect for it from day one, sell it once the consumer cycle is proven. | Generic flat-£6 is a dead zone vs £0 recognised incumbents. Money comes from (a) monetising *complexity* not basic filing, (b) annual capture of the full tax cycle, (c) the accountant channel's leverage. Charging on the year-end value moment converts the people whose affairs are actually complicated, while free top-of-funnel doesn't fight the free tier on price. |
| D6 | **v1 scope = the simplest in-scope persona, landlord-led:** single property business OR single sole-trader business, cash basis, standard quarterly periods. Multi-property is the *first paid upsell*, not v1 baseline. | Narrow wedge; expand only after the core cycle is proven end-to-end. |
| D7 | **✅ LOCKED (2026-06-14): build toward the earliest credible recognised listing, serve *all* in-scope bands from day one, aim the GTM *push* at the £30k (6 Apr 2027) wave.** Recognised software isn't cohort-restricted — the moment we're listed we take live £50k-cohort revenue too; we do **not** deliberately sit out 2026. | The recognition gate makes a 6-week launch impossible anyway, so a realistic listing date (late 2026 / early 2027) naturally catches the tail of the live £50k cohort **and** lands us mature and battle-tested *before* the £30k wave — the real volume inflection — floods the market in Apr 2027. Best of both: no all-or-nothing timing bet, marketing spend aimed at the biggest pool. |
| D8 | **Legal posture before any real filing:** trade via a **limited company**; pay the **ICO data-protection fee** (~£52/yr, mandatory); carry **professional indemnity insurance** (not HMRC-mandated but strongly advised); ship a **proper limitation-of-liability ToS** ("we transmit the figures you confirm; we do not give tax advice"). | Disclaimers alone are necessary but **not sufficient** — under the Consumer Rights Act 2015 you cannot disclaim "reasonable skill and care" to a consumer. The Ltd + PI are the real risk firewall. |
| D9 | **Personal project → CC monorepo under "the rules"** | Standard deploy pipeline. |

---

## 3. Build phases

> Each phase has a **Definition of Done (DoD)**. Do not start phase N+1 until phase N's DoD is met, **except** the Recognition Track (R) which runs continuously alongside.

### TRACK R — HMRC Recognition (continuous, BLOCKING for go-live)
The business-critical path. Owned start-to-finish.
- **R1.** Register on HMRC Developer Hub; create the application; obtain **sandbox** client ID/secret.
- **R2.** Map the full required API surface: Obligations, Self-Employment Business / Property Business (submit period summaries = quarterly updates), **Business Source Adjustable Summary (BSAS)** adjustments, Individual Calculations (tax calc), Final Declaration / crystallisation, the **Create Test User API** (to mint sandbox ITSA-enrolled test individuals), plus the **Test Fraud Prevention Headers** API.
- **R3.** Implement fraud-prevention headers **for the `WEB_APP_VIA_SERVER` connection method** and validate against HMRC's checker — including the `Gov-Client-Public-Port` missing-data fallback (Workers runtime can't supply it). This is the #1 indie rejection cause; it gets its own Phase 0 spike.
- **R4.** Accept **terms of use**; register the **ICO data-protection fee**; apply for **production credentials**; work the **Production Approvals Checklist**. ⚠️ Recognition requires the product to meet HMRC's **minimum functionality standards end-to-end** — you cannot get listed with quarterly-updates-only.
- **R5.** Submit the request for listing on the gov.uk "find compatible software" page **the moment production credentials land** (it has its own lead time, and the listing is the single biggest trust + discovery asset — sequence it early).
- **DoD(R):** Production credentials granted **and** app listed on gov.uk. *No public launch or billing until this is true.*

### Phase 0 — Feasibility spike (BLOCKING) — *re-scoped post-council*
Prove the **two** riskiest things first, not the easy OAuth path.
- **0a — Fraud-header pipeline on the real runtime (the true go/no-go):** build the client-side JS collector → forward to a Cloudflare Pages Function → assemble all 16 `WEB_APP_VIA_SERVER` `Gov-Client-*`/`Gov-Vendor-*` headers → **pass the Test Fraud Prevention Headers API from the Workers runtime.** Confirm `Gov-Client-Public-IP` via `CF-Connecting-IP`, and exercise the documented fallback for `Gov-Client-Public-Port`. If this can't go green on Cloudflare, that's a **Day-1 architecture decision** (dedicated origin / header-forwarding shim), not a Phase 5 patch.
- **0b — Full mandatory cycle in sandbox:** provision a test user (Create Test User API), authorise via OAuth, submit **all four** quarterly updates, apply a **BSAS** adjustment, retrieve the **tax calculation**, and submit a **final declaration** — all in sandbox. (This mirrors the actual recognition bar, not a single quarter.)
- Document every API call, payload shape, header, and gotcha in a written integration note.
- **DoD:** (1) green fraud-header validation from the Cloudflare Workers runtime, **and** (2) a green end-to-end sandbox cycle (4 quarterly updates → BSAS → tax calc → final declaration). If either can't be done, **stop and re-evaluate the whole project.**

### Phase 1 — Project scaffold & infra
- Scaffold under CC monorepo "the rules": Vite+React+shadcn, Supabase project, CF Pages + deploy job, hub card.
- Server-side HMRC client module: token storage (encrypted-at-app-layer in Supabase, key in CF secrets), header injection (server + client-collector wiring), **OAuth refresh-with-rotation** handling (access token ~4 hrs; refresh token ~18 months and **rotates on use** — must persist the new refresh token atomically or the user is locked out).
- **DoD:** App deploys green to CF Pages; Supabase auth works; a `/api/hmrc/ping` Pages Function reaches the HMRC sandbox **with valid fraud headers**.

### Phase 2 — Digital record keeping (the "log income / log expenses" core)
- Data model: user → business(es) → transactions; HMRC income/expense **categories** baked in as editable data (content-pack pattern, never hardcoded figures).
- Income & expense entry (manual first), edit/correct (digital records must be correctable), tax-year + quarter assignment.
- **DoD:** A user keeps compliant digital records for one SE business and/or one property business; data round-trips through Supabase with RLS.

### Phase 3 — Quarterly update engine
- Compute **cumulative** period totals per category; **check obligations via API as a pre-submit guard** (retrieve obligation status before every submit to prevent re-filing a fulfilled period); submit the quarterly update with **idempotency keying** (HMRC period-summary endpoints aren't naturally idempotent — a retry after a Worker timeout must not double-submit); show confirmation/receipt; reflect HMRC obligation status (open/fulfilled).
- Deadline awareness UI (7 Aug / 7 Nov / 7 Feb / 7 May).
- **DoD:** All 4 quarterly updates for a tax year submitted in sandbox **from real app data** (not hand-crafted payloads), with idempotent retry proven.

### Phase 4 — Year-end final declaration
- **BSAS** accounting adjustments, other income sources, retrieve & display HMRC tax calculation, submit final declaration/crystallisation.
- **DoD:** Full annual cycle (4 quarters + BSAS + final declaration) completed in sandbox end-to-end.

### Phase 5 — Accounts, security & compliance hardening
- HMRC OAuth grant/refresh-with-rotation per user; encrypted token storage (per D2); UK-GDPR (privacy policy, data retention, export/delete); **append-only / WORM audit trail** of submissions (payload hash, HMRC correlationId, fraud-header snapshot, timestamp — a plain mutable Supabase table is insufficient; add a DB-level append-only constraint or external log); error/retry handling for HMRC outages.
- **Legal posture (D8):** Ltd company formed; ICO fee paid; PI insurance bound; limitation-of-liability ToS + "non-advice / you-confirm" patterns live.
- Security review (financial data = fintech-grade expectations).
- **DoD:** Security review passed; OAuth refresh-with-rotation robust; GDPR pages live; no secrets client-side; legal posture in place.

### Phase 6 — Onboarding & UX wedge
- **"Am I in scope?" checker — pulled EARLY** (threshold + dates from Appendix A as editable data). Ship it as a free, **no-login, public/SEO lead-gen magnet** — it's the cheapest top-of-funnel and can go live before the full app.
- Dead-simple onboarding; mobile-first per Aaron's Mobile Standards; the differentiator made tangible (guided quarterly flow, plain-English, zero accounting jargon; receipt capture + a **running live tax estimate** so users see year-round value between deadlines).
- **DoD:** A non-accountant goes signup → first quarterly submission unaided in usability testing.

### Phase 7 — Billing (per D5, locked)
- Stripe **freemium**: free record-keeping + quarterly updates; **paid gate on the final declaration, multi-property/multi-business, and deadline support** at **£9.99/mo or £89/yr with annual as the pre-selected default** (smooths cash, kills inter-deadline churn); free trial; dunning.
- **DoD:** Paid subscription lifecycle works; trial→paid→cancel tested; annual (default) + monthly both work.

### Phase 8 — Private beta → go-live (gated on TRACK R)
- Private beta with a handful of real in-scope users (landlord-led) filing a real quarter.
- Public launch **only after** Recognition DoD(R) is met and listing is live.
- GTM: lean on the gov.uk listing (trust badge), the Landlord Compliance Hub audience (cross-sell), and accountant/bookkeeper referral. Aim the push at the **£30k 2027 cohort** (per D7).
- **DoD:** Live, recognised, listed on gov.uk, first paying customers filing real quarters.

---

## 4. Risk register (council-expanded)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Fraud-prevention headers fail on the Cloudflare Workers runtime | **Critical** | Phase 0a proves it on the real runtime *first*; `CF-Connecting-IP` for public IP, documented fallback for the unsupplied client port; fall back to a dedicated origin/shim if it can't go green |
| Free recognised competitors (£0) + HMRC encourages free | **Critical** | Pivot to freemium + landlord niche + charge on the year-end value moment; accountant channel for defensibility (D5) — **not** flat-£6 generic |
| HMRC recognition gated on a *complete* product, not a demo | **High** | Phase 0b proves the full mandatory surface in sandbox; Track R works the minimum-functionality standards explicitly |
| Support burden destroys £6 margin (non-accountants, 4 synced spikes/yr) | **High** | Reprice up + annual billing; canned plain-English guidance; route tax *advice* away (non-advice posture); deadline-concierge as a *paid* tier, not free |
| Seasonality / inter-deadline churn (annual tax rhythm) | **High** | Annual plan as default; year-round value (receipt capture, live tax estimate); deadline-triggered re-engagement |
| Liability — wrong filing → user harm | **High** | Ltd company + PI insurance + limitation-of-liability ToS + you-confirm steps + audit trail (D8); disclaimers alone are insufficient under CRA 2015 |
| OAuth refresh-token rotation mishandled → users locked out | **Medium** | Atomic persist-on-rotate in Phase 1; covered in Phase 5 hardening |
| Submission double-fire on retry | **Medium** | Idempotency keys + pre-submit obligation check (Phase 3) |
| Financial-data security / GDPR | **Medium** | Server-only HMRC creds, app-layer token encryption, append-only audit, ICO fee, security review (Phase 5) |
| Trust barrier (no-name brand + HMRC) | **Medium** | gov.uk "recognised" listing as the trust badge; Landlord Hub cross-sell; transparency; early seeded reviews |
| Solo founder bandwidth across many projects | **Medium** | Narrow v1 (D6); freemium reduces support per free user; lean on existing audience rather than cold paid CAC |

---

## 5. Council review (what the panel changed)

Four parallel expert critiques (2026-06-14), each on a distinct lens. Verdicts and the load-bearing changes they forced:

| Lens | Verdict | Key changes folded into this plan |
|------|---------|-----------------------------------|
| **Regulatory / recognition feasibility** | GO-WITH-CONDITIONS | No minimum-company/revenue bar; approval check ~10 working days. **But** recognition needs a *complete* standards-meeting product → re-scoped Phase 0b to the full cycle. Added ICO fee + terms-of-use as named Track-R gates; moved gov.uk listing request earlier. |
| **Market / pricing** | **PIVOT-POSITIONING** | Flat £6 is dead vs £0 recognised incumbents (Clear Books Free, Sage Sole Trader, FreeAgent-via-bank). → New D5: freemium, charge on the year-end value moment, reprice up to £8–12/mo or £79–99/yr, landlord niche, accountant B2B2C channel. |
| **Technical / security** | **FIX-ARCHITECTURE** | Server-side topology is HMRC-sanctioned (`WEB_APP_VIA_SERVER`) — not fatal. But added the missing client-side header collector (D2), token encryption (D2), OAuth refresh-with-rotation (Phase 1/5), submission idempotency (Phase 3), append-only audit (Phase 5), BSAS into Phase 4, Create Test User into Phase 0/R2, and re-scoped Phase 0 to test the *fraud-header-on-Workers* risk first. |
| **Business / legal / GTM** | GO-WITH-CONDITIONS | Unit economics only work as a lean operation. Added legal posture D8 (Ltd + ICO + PI + CRA-2015-aware ToS); annual-billing default; gov.uk listing + Landlord-Hub cross-sell + accountant referral as GTM; D7 to target the £30k (2027) wave; pulled the in-scope checker early as lead-gen. |

**Net council steer:** the *build* is feasible and the regulatory gate is passable for a solo dev. The existential risks are **commercial** (free incumbents) and **operational** (support burden at a low price), plus **one architecture landmine** (fraud headers on edge). This plan now de-risks all three before heavy build. **D5/D7 — the pricing-and-cohort decision — is now resolved** (2026-06-14, money-effectiveness mandate): freemium / landlord-first / accountant-channel-second, annual-default; build toward the earliest recognised listing and aim the GTM push at the £30k 2027 volume wave while serving all bands from day one. Nothing in the plan is now held open — the only gate left is Aaron's go for Phase 0.

---

## 6. Open questions — resolved by the council

1. **Pricing/wedge viability vs free recognised software?** → **Resolved & LOCKED (D5):** flat £6 is not viable. **Freemium + landlord-first + accountant channel**, charging on the year-end final-declaration value moment, **£9.99/mo or £89/yr (annual default).** Signed off 2026-06-14 under the money-effectiveness mandate.
2. **Is solo-dev HMRC recognition achievable?** → **Resolved:** yes — no company/financial bar, ~10-working-day approval check. The work is building the *complete* standards-meeting product and getting fraud headers green (Phase 0).
3. **Is the v1 narrow wedge right?** → **Resolved:** yes, single business / cash basis / standard periods, **landlord-led**; multi-property is the first paid upsell (D6).
4. **Minimum viable legal/insurance posture?** → **Resolved:** Ltd company + ICO data-protection fee + PI insurance + limitation-of-liability ToS; disclaimers alone insufficient under CRA 2015 (D8).
5. **Is the phase order right given the recognition critical path?** → **Resolved:** yes, with two fixes — re-scope Phase 0 to the full cycle + fraud-header spike, and pull the in-scope checker (Phase 6) early as lead-gen. **D7 LOCKED:** build toward the earliest recognised listing and serve all bands from day one; aim the GTM *push* at the £30k 2027 volume wave (don't sit out the live £50k cohort).

---

## 7. Change Log (drift control)
| Date | Change | Reason |
|------|--------|--------|
| 2026-06-14 | Draft v0.1 created | Initial plan, pre-council |
| 2026-06-14 | **Finalised v1.0 after 4-member LLM council review** | Pricing pivot (flat-£6 → freemium/niche/accountant, D5); target the £30k 2027 wave (D7); legal posture added (D8); architecture fixes — client-side fraud-header collector, token encryption, OAuth refresh-rotation, submission idempotency, append-only audit (D2, Phases 1/3/5); Phase 0 re-scoped to fraud-headers-on-Workers + full sandbox cycle; ICO/terms-of-use/Create-Test-User/BSAS added to Track R & phases; risk register expanded; open questions resolved. D5/D7 held open for Aaron's sign-off. |
| 2026-06-14 | **v1.1 — D5 & D7 LOCKED (money-effectiveness mandate)** | Aaron delegated the open decision with "use your best judgement given our core aim is making money effectively." D5 locked: freemium, landlord-first, **£9.99/mo or £89/yr annual-default**, accountant B2B2C as the second GTM leg (architect day one). D7 locked: build toward earliest recognised listing, serve all bands from day one, aim GTM push at the £30k 2027 volume wave — not an either/or with the live £50k cohort. Nothing now held open; only gate is Aaron's go for Phase 0. |

---

## Appendix A — Verified gov.uk facts (2026-06-14)

**Thresholds & dates** — *Check if you're eligible for MTD for Income Tax*:
- "£50,000 for 2024-2025 tax year … use it from 6 April 2026"
- "£30,000 for 2025-2026 tax year … use it from 6 April 2027"
- "£20,000 for 2026-2027 tax year … use it from 6 April 2028"
- In scope: "sole trader or a landlord registered for Self Assessment" with self-employment and/or property income over threshold. "Partnerships will also need to use Making Tax Digital for Income Tax in the future." Exemptions exist for the digitally excluded.

**Quarterly updates** — *Send quarterly updates*: 4 per year. Standard periods/deadlines: 6 Apr–5 Jul → 7 Aug; 6 Apr–5 Oct → 7 Nov; 6 Apr–5 Jan → 7 Feb; 6 Apr–5 Apr → 7 May (following year). Calendar option available (1 Apr–30 Jun, etc.). Updates contain cumulative category totals; "HMRC will not receive details of individual digital records."

**Software** — *Find compatible software*: "All software listed has been through HMRC's recognition process." Must create/store/correct digital records, send quarterly updates, and submit the tax return by 31 January following. All-in-one vs bridging.

**Vendor requirements** — *MTD ITSA end-to-end service guide (Developer Hub, updated 23 Mar 2026)*: minimum functionality standards for production access; product build → sandbox testing → Production Approvals Checklist → fraud-prevention headers → terms of use. Production access check "takes up to 10 working days." HMRC "strongly encourages all software providers to produce a free version"; free offerings must give reasonable guidance/support and stay free for a full accounting period for simple affairs.

**Fraud-prevention headers (council-verified)** — server-side web apps use connection method **`WEB_APP_VIA_SERVER`**, requiring 16 `Gov-Client-*`/`Gov-Vendor-*` headers. ~6 are browser-sourced (`Gov-Client-Device-ID`, `-Browser-JS-User-Agent`, `-Screens`, `-Window-Size`, `-Timezone`, `-Multi-Factor`) and must be collected client-side and forwarded. `Gov-Client-Public-IP` is obtainable on Cloudflare via `CF-Connecting-IP`; `Gov-Client-Public-Port` is generally **not** exposed by the Workers runtime and uses HMRC's documented missing-data procedure.

**ICO** — UK data-protection fee is mandatory for processing personal/financial data (Tier-1 micro ≈ £52/yr).

**Sources:**
- https://www.gov.uk/guidance/check-if-youre-eligible-for-making-tax-digital-for-income-tax
- https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates
- https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax
- https://www.gov.uk/guidance/choose-the-right-software-for-making-tax-digital-for-income-tax
- https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/
- https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub (production check ~10 working days)
- https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/
- https://developer.service.hmrc.gov.uk/guides/fraud-prevention/getting-it-right/
- https://developers.cloudflare.com/fundamentals/reference/http-headers/ (CF-Connecting-IP)
- https://ico.org.uk/for-organisations/data-protection-fee/

**Competitive landscape (council-verified, market lens):**
- https://www.clearbooks.co.uk/free-mtd-software/ (free: records, one-click quarterly, year-end, SE + property)
- https://www.sage.com/en-gb/making-tax-digital/sole-trader/ (permanently free)
- https://www.icaew.com/technical/tax/making-tax-digital/mtd-for-income-tax-software-providers
- Landlord-niche paid tools cluster £9.95–£15/mo (Hammock, LandlordOS)
