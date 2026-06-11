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

---

## Phase 1 — decisions & notes

- **Full-catalog migration done.** The renderers now read **from HubStore**
  (resolving the Phase A carry-forward above). seed.js holds the canonical
  catalog: 17 projects (`personal-hub` + 16 real), 31 skills, 10 prompts; the
  inline `SEED_PROJECTS/SEED_SKILLS/SEED_PROMPTS` were deleted. Only
  `SEED_AGENTS` and `SEED_MEMORY` remain inline (agents are read-only; memory is
  Phase 2).
- **Compat getters.** `projects()/allSkills()/allPrompts()` enrich store records
  with static catalog extras (project `domain/techTags/needs/repoFolder`; skill
  `cat/invoke/icon`) and legacy aliases (`desc/live/tags`) so the existing
  tiles/drawer render unchanged. Extras are presentational config, not user data.
- **`personal-hub` is intentionally a project** (building/critical) so the
  Workspace context panel and its memory branch line up.
- **`HubStore.state` KV** added for non-entity app state. Workspace notes +
  selected project persist there (`workspace:notes`, `workspace:project`); it is
  included in export/import. This is the anchor the Phase 3 Chairman will load
  project context from — keep `renderWorkspace`/`renderWsContext` extensible.
- **`migrateHub()` is version-gated** (`SEED_VERSION`). Bump it when the catalog
  grows so existing partial stores upsert missing items; it also one-time imports
  legacy `ws:` data (project overrides with `med→medium`, custom skills/prompts,
  prompt favourites). Never overwrites edits or deletions.
- **Recent Activity is derived** from entity `updatedAt`. The `Skill` type has no
  `updatedAt` field (by ROADMAP contract), so **seeded** skills don't surface in
  the feed — projects, prompts, and user-added skills (which get timestamps) do.
  Left type-pure deliberately; revisit if skills need activity tracking.
- **Remaining `ws:` usage (out of Phase 1 scope):** focus text (`ws:focus`),
  pins (`ws:focusPinned`), the `logActivity` event log (`ws:activity`, now
  unsurfaced), and all memory keys (`ws:memory/memCurrent/memBranches` — Phase
  2). These are not Phase 1 entities; migrate onto HubStore in their phases.
- **Dashboard composition:** chosen with the user — the Dashboard shows all five
  sections in order **and** Projects/Skills/Prompts remain 1-click nav tabs
  (shared card builders + getters; independent filter/search state).

---

## Phase 2 — decisions & notes

- **Memory rebuilt on HubStore.** One `MemoryBranch` per project (1:1 via
  `projectId`), auto-created empty on branch open and on new-project save. The
  old `ws:memory` / inline `SEED_MEMORY` / `MEM_SECTIONS` shape and the custom
  "+ Add branch" feature were removed. Old `ws:memory` is **not** migrated — its
  shape was incompatible and it was only a demo branch.
- **Type-faithful sections.** `sections.roadmap` and `sections.openIssues` are
  markdown **strings** (per `MemoryBranch`), not arrays; `decisions` are ADR
  objects, `repositories` are `RepoRef`, `sessions` are immutable
  `SessionSummary` records.
- **Export Vault is dependency-free** (user decision). Hand-rolled ZIP "store"
  writer (`crc32` + `makeZip`) instead of JSZip — honours the no-external-deps
  hard rule. Output validated with system `unzip` (integrity OK, folder tree
  `memory/{slug}/…` + `sessions/{date}-{slug}.md` extracts correctly).
- **Tiny markdown renderer** (`mdToHtml`) for preview tabs: headings, ordered/
  unordered lists, `- [x]/[ ]` task items, bold/italic, inline code, links. Not
  a full CommonMark parser — sufficient for memory notes.
- **Forward-compatible for auto-summarisation:** the schema is unchanged from
  the types; `SessionSummary.tokensEstimate` is captured manually now and a
  future Phase 3 agent can write sessions/decisions back via the same store API.
