# DOSE

**Kick the sugar, keep the sweet.**

DOSE is a better-for-you sweets brand — low-sugar sweets that taste like the real
thing, sold honestly. This repo holds **both** the reusable brand assets and the
marketing site, in one Next.js project. It's a concept build: nothing is on sale,
there's no backend, and the “buy” flows are interactive front-end only.

The brand has a wellness halo but it is **candy first, not a supplement**. Voice is
cheeky, warm and honest, never preachy. No medical claims anywhere.

Two product lines:

- **EVERYDAY** — the hero line. Low-sugar, lightly fortified daily treat. All ages.
- **FUEL** — secondary line. Caffeine + L-theanine. **Age-gated 16+.**

---

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # next lint
```

Requirements: Node 18.18+ (Next.js 14.2). No environment variables, no services to
stand up — it runs entirely client-side.

---

## Stack

- **Next.js 14.2** (App Router) + **React 18**
- **TypeScript** (strict)
- **Tailwind CSS** with the DOSE design tokens baked into `tailwind.config.ts`
- **Framer Motion** for animation (all of it respects `prefers-reduced-motion`)
- **next/font** for self-hosted Google fonts
- **lucide-react** for icons

---

## What's in here

### Phase 0 — Brand assets (real, reusable, parameterised)

These are not screenshots — they're live, recolourable SVG components driven by props
and the brand palette.

- `components/brand/Wordmark.tsx` — the DOSE wordmark with the gummy-ring “O”.
  `horizontal` / `stacked` / `mark` variants, recolourable letters + accent.
- `components/brand/Gummy.tsx` — the gummy-shape set (`bear`, `bottle`, `worm`,
  `bean`), each with optional gloss, sized and tinted via props.
- `components/brand/PackFront.tsx` — a parameterised pack-front that renders **every
  SKU** from its data record (flavour, line, accent colour, big honest stat).
- `lib/brand.ts` — raw brand colours (`COLORS`) and the accent map + `accent()` helper.

### Phase 1 — The site

Composed in `app/page.tsx`, mobile-first, with these sections:

| Section | What it does |
|---|---|
| `Nav` | Sticky, scroll-aware header; live box count; mobile sheet. |
| `Hero` | Positioning + hero SKU + waitlist. |
| `BuildYourBox` | Pick a box size, add packs up to capacity, one-off vs subscribe pricing. |
| `Quiz` | “Find my DOSE” — matches a flavour vibe to a SKU. |
| `SugarComparison` | DOSE vs a normal pack, in sugar cubes. |
| `Lines` | EVERYDAY vs FUEL; FUEL interactions go through the age gate. |
| `Honesty` | What's actually in it / how it's tested. |
| `Proof` | Social proof + reassurance. |
| `FinalCta` | Closing waitlist call. |
| `Footer` | Wordmark, nav, socials, the honest/age-gate note. |

---

## The design system

Tokens live in `tailwind.config.ts` — use the named utilities, not raw hex.

- **Colours:** `pine` `#1B3A2F`, `raspberry` `#E5446D`, `sun` `#F2C14E`,
  `mint` `#EAF2EC` / `mint-light` `#F4F9F5`, `ink` `#1F2A24`, white.
- **Type:** Bricolage Grotesque (`font-display`) for headlines, Fraunces
  (`font-serif`, italic) for taglines, Inter (`font-body`) for body — wired through
  CSS variables in `app/fonts.ts`.
- **Motif:** rounded “gummy” shapes — `rounded-gummy` (2.5rem) / `rounded-pill`,
  soft shadows (`shadow-soft` / `gummy` / `lift`), `candy-dots` texture, generous
  whitespace.

Surface rhythm runs light → dark → light down the page so sections read as distinct
without hard dividers.

---

## Swapping the data

All product/catalogue data is isolated in **`data/products.ts`**, typed by
`lib/types.ts`. Components read from it — they never hard-code a SKU. To plug in a
real catalogue or CMS later, replace that file's exports (`products`, `BOX_SIZES`,
the derived lists) and the UI follows. Look for `TODO(real-data)`.

Placeholder photography is intentionally absent — the SVG pack-fronts stand in for
3D/product renders.

---

## What's stubbed (no backend by design)

- **Waitlist** (`components/ui/WaitlistForm.tsx`) — validates the email client-side,
  then `console.info`s the signup. See `TODO(waitlist)` for the real-list hook-up.
- **Age gate** (`components/providers/AgeGateProvider.tsx`) — `requireAge(action)`
  runs the action if already confirmed, otherwise opens the 16+ modal and runs it on
  confirmation. **Session state only** (a refresh re-prompts) — deliberately not
  persisted, and not a substitute for real age verification.
- **Build a box** (`components/providers/BoxProvider.tsx`) — full add/remove,
  capacity limits and pricing math, held in React state. There is **no checkout** and
  nothing depends on `localStorage`.

---

## Accessibility & motion

- Semantic landmarks (`header` / `main` / `nav` / `footer`), labelled controls, and
  visible focus rings throughout.
- Modals (mobile menu, age gate) use `role="dialog"` + `aria-modal`, lock body scroll
  and are dismissible.
- **`prefers-reduced-motion` is respected** both globally (in `app/globals.css`) and
  per-component via Framer Motion's `useReducedMotion()`.

---

## Out of scope

Real checkout / payments / Shopify, a CMS, accounts, persisted carts, real age
verification, and final photography. Those are intentionally left as clearly marked
`TODO`s so the concept stays self-contained and deployable.

---

## Deploy

Fully client-side Next.js with `output: "export"` → `npm run build` emits a static
`out/` folder of plain files (no Worker, no backend, no edge size limit).

Live on **Cloudflare Pages**: https://dose-app.pages.dev

It ships through the CC monorepo CI: a push to `Aaron-1411/CC` master runs the
`deploy-dose` job in `.github/workflows/deploy.yml`, which builds with bun and
`wrangler pages deploy dose/out --project-name=dose-app`. No manual deploy needed.
