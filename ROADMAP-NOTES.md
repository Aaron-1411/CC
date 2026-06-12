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

---

## Phase 3 Part A — decisions & notes (Supabase + Chairman proxy infra)

**Scope:** infrastructure only. The Chairman chat UI is Phase 3 **Part B** and was
explicitly deferred. Nothing here changes the default localStorage experience —
Supabase and the Chairman proxy are both opt-in and reversible.

- **Storage stays behind HubStore.** `SupabaseAdapter.js` talks to Supabase via
  PostgREST (`fetch`, no SDK — honours no-external-deps) and implements the exact
  HubStore interface. It is cache-backed: `init()` hydrates once via 10 parallel
  GETs, reads stay synchronous, writes are write-through (fire-and-forget
  `persist().catch(onError)`). `store-factory.js` picks the adapter from
  `config.js` `storeAdapter` ('local' default | 'supabase'). UI is untouched.
- **Schema:** `supabase/migrations/0001_init.sql` — 10 tables field-for-field with
  `types.ts`, shared `set_updated_at` BEFORE-UPDATE trigger, indexes, and a
  permissive `anon_all` RLS policy (single-builder hub, no auth until Phase 8;
  anon key is public-by-design). **All PKs are `text`** (incl. `audit_log`, fixed
  from uuid during review) for parity with the app's string ids; server-side
  writers omit `id` and rely on the `gen_random_uuid()::text` default.
- **API key never on the client.** Anthropic calls go through Cloudflare Pages
  Functions: `functions/api/chat.ts` streams `/v1/messages` (SSE), tees the stream
  through a `TransformStream` to capture `input_tokens`/`output_tokens`, and writes
  an `audit_log` row server-side via `context.waitUntil` (agent_id 'chairman',
  authorisation_level 'advisory'). The key is read only from the `ANTHROPIC_API_KEY`
  Cloudflare secret. `functions/api/models.ts` serves the single-source model map.
- **Single-source model/pricing** in `model-config.js` (dual-mode: browser global +
  `module.exports`, so `/api/models` imports it via esbuild). chairman opus / worker
  sonnet / summariser haiku, GBP pricing.
- **Migration:** `migrate-to-supabase.js` (`window.migrateHubToSupabase({url,anonKey})`)
  reads raw `hub:` localStorage keys directly (adapter-independent), upserts every
  table idempotently (`Prefer: resolution=merge-duplicates`). Loaded by workspace.html.
- **Setup/rollback:** `SETUP.md` documents run-migration → flip config → optional
  data migration → verify → Cloudflare secrets → curl test. Rollback = set
  `storeAdapter` back to `'local'` and reload; localStorage data is untouched.
- **Verified:** both Functions bundle cleanly under esbuild (no type-check, loose
  `any`); localStorage path renders error-free (17 projects, backend 'localStorage',
  `migrateHubToSupabase` present); fresh-context subagent review passed.

## Phase 3 Part B — decisions & notes (Chairman chat UI)

**Scope:** the orchestration UI on top of Part A's proxy. This closes the Phase 3
definition of done — *"Chairman responds in context of a project, logs every
action, reads and writes memory, works on mobile."* All in `workspace.html`; no
build step, no new runtime deps, no client-side API key.

- **Placement:** a dedicated top-level **Chairman** view (its own nav tab +
  project selector), not a per-project tab. One interface; the user speaks to the
  Chairman only, picking which project is in focus.
- **Persistence:** per-project threads through `HubStore.state` under
  `chairman:thread:<projectId>` — so each project keeps its own conversation and it
  works identically on the localStorage and Supabase adapters (no new storage path).
- **Context, not silent writes:** on switch/send the client loads the project's
  memory branch (summary / roadmap / open-issues / skills) as the system context.
  Memory is **never** written silently. When the Chairman emits a **line-start**
  `Decided: …` line (regex `/^\s*Decided:\s*(.+)$/im`), a one-tap *Save decision to
  memory* button appears; tapping it writes an ADR into the project branch and flags
  the message saved. A "Decided:" mid-sentence does not trigger it — by design.
- **Streaming:** `chairSend` posts `{messages, projectId, context}` to
  `window.HUB_CONFIG.chatApi` (`/api/chat`) and renders the Anthropic SSE
  token-by-token. `chairStream` buffers across chunk boundaries
  (`buf.split('\n'); buf = lines.pop()`), JSON-parses each `data:` line, and appends
  only `content_block_delta` `delta.text` (ignores `[DONE]`/keepalive). Errors land
  as a `⚠️` assistant line; the thread is re-persisted after each turn.
- **Mobile-first dark UI:** sticky compose bar, aligned user/assistant bubbles,
  verified at 375px within viewport.
- **Verified:** against a **local SSE mock** — streaming/accumulation proven by
  direct replication, save-to-memory ADR write + per-project persistence confirmed,
  375px layout screenshotted, test artifacts cleaned from localStorage. Live
  Anthropic calls await the `ANTHROPIC_API_KEY` Cloudflare secret (Part A infra).

---

## Phase V — notes & spillover

- **Durable workspace = `~/cc-hub`.** MASTER-BUILD assumed `~/Claude-Projects`;
  that checkout turned out to be a divergent CC clone (150 behind / 1 ahead) with
  **uncommitted client work** (`inkspector/**`, a hands-off client project), nested
  per-project git repos, and a launchd sync dependency
  (`com.aaronmanu.sync-projects.plist` → absolute path
  `/Users/aaronmanu/Claude-Projects/sync-all.sh`). It was **not touched**. The
  build runs from a clean dedicated clone at `~/cc-hub` instead.
- **Stale clones — candidates for Aaron's cleanup (not a session's):**
  `~/Claude-Projects` (divergent, uncommitted client work, launchd-wired) and
  `/tmp/CC-fresh` (old working copy). Leave both alone; flagged for the owner.
- **Missing spend indicator vs locked decision #7.** CLAUDE.md locked decision #7
  says "a daily spend estimate is visible in the Tool Stack dashboard." No such
  indicator exists in the UI. Phase V is "no new features", so building it is
  deferred — schedule with the Phase 7a operations board (cost guardrails surface
  naturally there) or earlier if Aaron wants it sooner.
- **`MASTER-BUILD.md` not in the repo.** The governing plan lives at
  `~/Downloads/MASTER-BUILD (2).md` (untracked). Decide whether to commit a copy
  into the repo (e.g. `dashboard/MASTER-BUILD.md`) as the authoritative build plan,
  or keep it external. Pending Aaron's call.

## Phase R — Hub extracted to its own repo (2026-06)

- **The hub left the monorepo.** Everything that was under `dashboard/` —
  `workspace.html`, `HubStore.js`, `seed.js`, `functions/`, the hub's
  `ROADMAP.md` / `ROADMAP-NOTES.md` / `ARCHITECTURE.md` / `CLAUDE.md` /
  `BUILD-STATE.md`, etc. — now lives in its own private repo
  **`Aaron-1411/cc-hub`**, with full git history preserved (extracted via
  `git filter-repo --path dashboard/ --path-rename dashboard/:`).
- **Deploy moved with it.** The hub's Cloudflare Pages project
  (`aaron-projects-hub`, live at `/workspace`) now deploys from the new repo's
  own `.github/workflows/deploy.yml` (deploys `.` from repo root, which fixes the
  old wrangler functions-directory trap so `functions/` ships). The
  `deploy-dashboard` job was surgically removed from THIS monorepo's shared
  `deploy.yml`; the other 15 project deploy jobs are untouched.
- **What stays here:** only `dashboard/README.md`, a pointer to the new repo.
  This monorepo's history is NOT rewritten — extraction output went only to the
  new repo; nothing here changed except this note, the pointer README, and the
  one removed deploy job.
