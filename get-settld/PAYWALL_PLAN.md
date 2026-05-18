# Paywall implementation plan

This is a forward-looking design doc. Nothing in this file is shipped or visible
to users yet — the app is currently 100% free. When we're ready to monetise,
work through the phases below in order.

---

## Goals

- Free tier remains genuinely useful so the app keeps growing organically (SEO, word-of-mouth).
- Paid tier unlocks the heavy, "concrete-decision" features and removes usage caps.
- One tap to upgrade from anywhere a limit is hit. No dark patterns.
- Cancellable in two clicks; no email-only cancellation.
- Fully UK-compliant: VAT, FCA financial-promotion rules, Consumer Rights Act 14-day cooling-off.

## Proposed plans

| Plan | Price (indicative) | Audience |
|------|--------------------|----------|
| **Explore** (free) | £0 | New buyers browsing |
| **Decide** | £6/mo or £39/yr | Active buyers shortlisting |
| **Move** | £14/mo or £99/yr | Under offer / completing |

(Numbers are placeholders — A/B and survey before launch.)

### Free tier (Explore)
Stays as today, plus:
- 3 saved scenarios, 5 shortlisted properties, 2 area deep-dives per month.
- Watermarked PDF reports (logo + "Made with FTB Toolkit").
- Standard freshness on data (cache up to 24h).

### Decide tier
- Unlimited scenarios, shortlist, area reports.
- Unwatermarked PDF + CSV exports.
- Saved searches + email alerts (uses existing Resend edge function).
- Document vault (Lovable Cloud Storage bucket per user).
- Stress-test toggle: rate +1/+2/+3, income shock, void months.

### Move tier (everything in Decide, plus)
- Offer-letter AI generator (Lovable AI gateway, gemini-2.5-pro).
- Solicitor / surveyor handoff with affiliate revenue share.
- Co-buyer collaborative scenarios (real-time).
- Priority support SLA (24h reply).

---

## Engineering work

### Phase 0 — Pricing & legal pre-flight
- [ ] `/pricing` route with the three tiers, FAQs, "Why pay?" callout.
- [ ] Update Terms of Use with subscription, cancellation, refund clauses.
- [ ] Add VAT-inclusive copy ("£X / month inc. VAT").
- [ ] FCA-style compliance review of every claim about "saving money", "best rate" etc.

### Phase 1 — Billing infrastructure
- [ ] Decide provider — Stripe (recommended: best UK SCA support, Customer Portal solves cancel/refund).
- [ ] Add `stripe_customer_id`, `subscription_status`, `subscription_tier`, `current_period_end` columns to `profiles`.
- [ ] Edge functions:
  - `create-checkout-session` — POST `{ tier, interval }` → returns Stripe URL.
  - `stripe-webhook` — verify signature, upsert subscription state.
  - `customer-portal` — returns Stripe billing portal URL.
- [ ] Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_DECIDE_MONTHLY`, etc.
- [ ] RLS: only the user can read their own subscription row.

### Phase 2 — Entitlement layer
- [ ] `useEntitlement()` hook returning `{ tier, isPaid, limits, refresh() }`.
- [ ] `<RequirePaid feature="export-pdf">` wrapper. Falls back to upgrade modal instead of redirect.
- [ ] `useUsage(meterKey)` hook + `usage_meters` table for free-tier counters (resets monthly).
- [ ] Server-side enforcement on every paid edge function (don't trust the client).

### Phase 3 — UI
- [ ] Upgrade modal (single component, takes `featureId` for contextual copy).
- [ ] Usage meter pill in `ScenarioBar` ("3 of 5 scenarios used").
- [ ] Account → Billing screen using Stripe Customer Portal.
- [ ] Pricing page CTAs deep-link to checkout with the right Stripe price ID.
- [ ] Empty-state CTAs on the gated features ("This is a Decide feature — try it for £1 for 7 days").

### Phase 4 — Trial & conversion
- [ ] 14-day trial without card, then card capture.
- [ ] Reminder emails at day 11 and day 13 (Resend).
- [ ] Soft cap before hard cap — show the meter at 80%, block at 100%.
- [ ] Annual discount (~30%) toggle on pricing page.

### Phase 5 — Affiliate & revenue add-ons
- [ ] Mortgage broker referral CTA with UTM tracking on `/mortgage` and `/decide`.
- [ ] Conveyancer / surveyor marketplace on `/journey` exchange + survey steps.
- [ ] Track affiliate clicks in a `partner_referrals` table for revenue reconciliation.

---

## Routes that will gate behind paid

Currently free → eventually Decide tier (with usage meter on free):
- `/report` (already gated behind auth — easy upgrade to paid).
- PDF / CSV export buttons on `Areas`, `Decide`, `RightFit`, `Investment`.
- More than N saved scenarios on `ScenarioBar`.
- More than N shortlisted properties on `Shortlist`.

Move tier:
- `/co-buyer` real-time collaboration.
- `/alerts` (saved searches with daily email).
- Offer-letter AI generator (new route `/offer/letter`).
- Document vault (new route `/vault`).

---

## What we explicitly will NOT do

- No paywall on the verdict (`/decide`) — it's the primary acquisition surface.
- No paywall on the buying journey checklist — that's our SEO moat.
- No retroactive removal of existing free features for current free users.
- No upsell modals on first visit — only when a limit is actually hit.
- No "only £X/day!" framing or countdown timers.

---

## Metrics to track before flipping the switch

- Activation: % of signups who complete a full verdict.
- Retention: D7 / D30 return rate.
- Free-tier limit hits per user per week.
- Pricing-page → checkout → paid funnel.
- Cancellation reasons (always offer a textarea on the cancel flow).
