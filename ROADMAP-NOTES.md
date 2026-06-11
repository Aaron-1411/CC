# ROADMAP-NOTES.md

Spillover log. Anything identified during a session that belongs to a **later
phase** — or any deliberate **deviation** from the phase prompt — is recorded
here instead of being built into the current phase. See ROADMAP.md for the
authoritative phase plan.

---

## Phase A — deviations from the prompt (with rationale)

These were approved in-session under the "reuse first / behave identically /
never rebuild" direction; logged here for the record.

1. **Vanilla JS instead of TypeScript/Vite.** The prompt assumes `src/`,
   `tsconfig`, `tsc`, a build command and a test runner. The hub is a
   zero-build single-file vanilla-JS static site, and ROADMAP.md's own
   principles say "reuse first, never rebuild" + "simplicity first". So:
   - `types.ts` is a **source-of-truth reference** (all roadmap types, JSDoc'd),
     not a compiled artifact. Runtime code mirrors it via JSDoc `@typedef`s.
   - The store lives at `dashboard/HubStore.js` + `dashboard/seed.js` (plain
     `<script>`s), not `src/store/*.ts`. Same Repository/HubStore interface and
     export/import contract as specified.
   - "Basic tests" are Node assertions run ad-hoc against HubStore.js/seed.js
     (26 store/seed checks + the in-memory fallback), since there is no test
     runner without a build step.
   - **Later-phase note:** if/when the hub gains a build pipeline, port these JS
     modules to the specified `src/store/*.ts` layout — the interface is
     intentionally identical so the move is mechanical.

2. **Docs scoped to `dashboard/`, not repo root.** The prompt says
   ARCHITECTURE.md + CLAUDE.md "in the repo root", but this is a monorepo of
   ~20 projects — root files would imply repo-wide rules. They live in
   `dashboard/` (precedent: `ecommerce-deep-dive/CLAUDE.md`). This file
   (`ROADMAP-NOTES.md`) is at root, as the prompt's phase-boundary rule states.

3. **Phase A seed content = real hub data, not placeholders.** The prompt lists
   generic seed entries (projects Fulcrum Solutions / Kub / HomePulse; skills
   Authentication / Stripe / Reporting / Repository Analysis). Seeding
   fabricated projects/skills into a live command centre would contradict
   "behave identically" and put fake projects in front of the user. The seed
   keeps the **specified counts** (4 projects, 6 prompts, 4 skills, 8 tools,
   1 memory branch) but uses real data:
   - Projects: Personal Hub (building/critical), Inkspector (testing/high),
     PlateSpin (building/high), MoneyMind UK (live/medium).
   - Prompts: 6 real prompts spanning all four categories.
   - Skills: atelier, impeccable, ui-ux-pro-max, stop-slop (real installed).
   - Tools: the eight Phase 0 tools (exact match to the prompt).

4. **`priority` vocabulary mismatch.** Legacy UI data (`ws:projects`) uses
   `'med'`; the `Priority` type uses `'medium'`. The HubStore seed already uses
   the roadmap vocab. **TODO when migrating the UI onto HubStore:** map
   `'med'` ↔ `'medium'` on read/write so existing `ws:projects` data is not
   broken.

---

## Carried forward (later-phase work surfaced during Phase A)

- **UI still reads legacy `ws:` keys.** Phase A built HubStore and seeds it, but
  the renderers (`projects()`, `tools()`, `allSkills()`, `allPrompts()`,
  memory) still read the inline `SEED_*` constants + `ws:` overrides. Migrating
  the renderers to read **from HubStore** (and collapsing the duplication
  between inline `SEED_*` and `seed.js`) is the natural next step — likely early
  in the Phase 1/Phase 3 work, not Phase A (which must "behave identically").
- **JSON export/import UI.** `HubStore.exportAllData()` / `importAllData()`
  exist; Phase 1 wants them surfaced from a settings affordance. Backend ready,
  UI button pending.
- **Views are not deep-linkable.** No hash/History routing — reload always lands
  on Dashboard. Consider hash routing if/when "≤3 clicks" needs bookmarkable
  views.
- **Memory "Export vault" zip** (Phase 2 done-criteria) and per-section markdown
  files — the data shape supports it (`MemoryBranch.sections` are markdown
  strings); the zip export itself is later work.
- **`tokensEstimate`** on `SessionSummary` is populated by hand for now; real
  estimates require the Phase 3 LLM proxy.
