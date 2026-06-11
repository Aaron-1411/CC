# Personal Hub — Architecture (Phase A audit)

The "Personal Hub / Command Centre" is the dashboard app served at
`https://aaron-projects-hub.pages.dev/workspace`. This document was written as a
point-in-time audit of the app **before** the HubStore data-layer work. It is
the reference for the migration in Phase A and every later phase.

> Repo: https://github.com/Aaron-1411/CC · App folder: `dashboard/`

> **Reconciled at Phase V (2026-06-11).** The Phase A audit below is preserved
> as the historical record of the pre-HubStore app and the migration targets.
> Where facts have since changed they are corrected inline with a **`Now:`**
> note. Headline deltas since this audit:
> - `workspace.html` is now **~2340 lines** (was ~1880).
> - **Eight views**, not seven — a top-level **Chairman** view (LLM chat,
>   Phase 3 Part B) was added: `dashboard, projects, memory, tools, skills,
>   agents, prompts, chairman`.
> - The **HubStore data layer exists** (`HubStore.js` + `seed.js` +
>   `SupabaseAdapter.js` + `store-factory.js` + `config.js`). The renderers read
>   **from HubStore**; the direct-`localStorage`/`ws:` description in §3 is the
>   *starting* state that has since been migrated (see ROADMAP-NOTES Phase 1).
> - Production runs the **localStorage** adapter (`config.js storeAdapter:
>   'local'`); the Supabase adapter is opt-in and reversible.
> - Pages Functions exist: `functions/api/chat.ts` (Anthropic SSE proxy +
>   `audit_log` write) and `functions/api/models.ts`.

---

## 1. Framework and versions

**There is no framework and no build step.** The hub is hand-written
HTML/CSS/vanilla-JS. No React, Vue, Vite, bundler, transpiler, package.json,
node_modules, or lockfile lives in `dashboard/`.

- Language: plain ES2020 JavaScript in a single inline `<script>` block.
- Styling: a single inline `<style>` block using CSS custom properties (design
  tokens) — no Tailwind/PostCSS.
- Fonts: Inter + JetBrains Mono via Google Fonts `<link>`.
- The sibling monorepo projects (`digital-depth-dive`, `ecommerce-deep-dive`,
  etc.) *are* TS/Vite/Next apps with their own build tooling — the hub
  deliberately is not. Do not assume their stack applies here.

### Files in `dashboard/`
| File | Size | Role |
|---|---|---|
| `workspace.html` | ~2340 lines | **The Command Centre.** Target of all hub work. (Was ~1880 at Phase A.) |
| `index.html` | ~69 KB | Public projects-hub landing page. |
| `setup.html` | ~23 KB | One-off setup/instructions page. |
| `favicon.svg` | — | Icon. |

Everything below describes `workspace.html` unless stated otherwise.

---

## 2. Routing

No router and no URL state. The app is a single HTML document with seven
"views" (`<section class="view" id="view-…">`); exactly one carries `.active`
at a time. *(Now: **eight** views — a `chairman` view was added in Phase 3 Part
B.)*

- `switchView(v)` (≈ line 1776) toggles `.view.active` and `.tab.active`,
  scrolls to top, and calls the matching `render*()` function.
- Navigation is event-delegated: a global `document` click handler matches
  `e.target.closest('[data-view]')` (nav tabs, logo, "View all →" links).
- Consequence: views are **not bookmarkable / not deep-linkable** — there is no
  hash or History API usage. Reload always lands on `dashboard`
  (`renderDashboard()` is the only init call, line ~1879).

The views: `dashboard, projects, memory, tools, skills, agents, prompts` —
*plus `chairman` (added Phase 3 Part B), eight in total.*

---

## 3. State management

> **Now (post-Phase 1):** the renderers read **from HubStore**, not the inline
> `SEED_*`/`ws:` path described below. `seed.js` holds the canonical catalog;
> `HubStore.js` is the single store (localStorage adapter by default,
> `SupabaseAdapter.js` opt-in via `store-factory.js`). The `LS` helper and `ws:`
> keys below are the **pre-migration** state and the migration targets — kept
> here as the historical record. See ROADMAP-NOTES "Phase 1" for the migration.

State is module-scoped `let`/`const` variables at the top of the script,
hydrated from localStorage on load through a tiny `LS` helper, then read by
**derived getter functions** the renderers call.

```js
const LS = {
  get(k, d){ try { return JSON.parse(localStorage.getItem('ws:'+k)) ?? d; } catch { return d; } },
  set(k, v){ localStorage.setItem('ws:'+k, JSON.stringify(v)); },
};
```

Derived getters (seed merged with user overrides):
- `projects()` — `SEED_PROJECTS` merged with `projOverrides`.
- `tools()` — `SEED_TOOLS` merged with `toolOverrides`.
- `allSkills()` — `customSkills` ++ `SEED_SKILLS`.
- `allPrompts()` — `customPrompts` ++ `SEED_PROMPTS`, fav from `promptState`.
- `allAgents()` — `SEED_AGENTS` (read-only, no overrides).
- `memBranches()` / `memData(id)` / `saveMem(id, patch)` — memory branches.

There is **no central store and no abstraction** — components mutate the module
variables and call `LS.set(...)` inline. This is the primary thing Phase A's
HubStore replaces.

### 3a. Direct localStorage calls (migration targets)

Every key is `ws:`-prefixed. These are the calls HubStore must absorb so the UI
never touches `localStorage` directly.

| Key (`ws:` +) | Variable | Shape | Written at (line ≈) |
|---|---|---|---|
| `projects` | `projOverrides` | `{ [id]: {status, priority, note, updated} }` | 1753 |
| `focus` | `focusText` | `string` | 1820 |
| `focusPinned` | `focusPinned` | `string[]` (project ids) | 1768 |
| `customSkills` | `customSkills` | `Skill[]` (user-added) | 1859 |
| `customPrompts` | `customPrompts` | `Prompt[]` (user-added) | 1872 |
| `promptState` | `promptState` | `{ [id]: {fav:boolean} }` | 1808 |
| `tools` | `toolOverrides` | `{ [id]: {status} }` | (tool toggle) |
| `memory` | `memStore` | `{ [branchId]: PartialMemory }` | 1299 |
| `memBranches` | `memBranchesEx` | `[{id,name,emoji}]` | 1849 |
| `memCurrent` | `memCurrent` | `string` (selected branch id) | 1845/1850 |
| `activity` | `activity` | `[{icon,text,ts}]` (≤30, newest first) | 1244 |

Reads of all the above happen once at top of script (lines ~1228–1237, 1527).

---

## 4. Component structure & conventions

No components in the framework sense. Structure is:

1. **Seed data** (lines ~911–1221): `SEED_PROJECTS` (16), `SEED_SKILLS` (31),
   `SEED_AGENTS` (5), `SEED_TOOLS` (8), `SEED_PROMPTS` (10), `SEED_MEMORY`
   (`personal-hub` worked example), `MEM_SECTIONS` (8-section config).
2. **State + derived getters** (lines ~1223–1306).
3. **Helpers** (lines ~1308+): `$`/`$$` (querySelector wrappers), `esc()` (HTML
   escape), `today()`, `timeAgo()`, `logActivity()`, label/colour maps
   (`STATUS_LABEL`, `STATUS_ORDER`, `PRIO_LABEL`).
4. **Renderers**: `renderDashboard`, `renderProjects`, `renderSkills`,
   `renderAgents`, `renderPrompts`, `renderTools`, `renderMemory`
   (+ `renderActivity`, `renderMemBranches`, card builders like `skillCard`,
   `agentCard`, `toolCard`, `memSection`). Each builds an HTML string and sets
   `innerHTML` on its container.
5. **Events** (lines ~1795–1876): one delegated `document` click handler for
   nav/cards/prompts, plus per-control listeners for each view's
   search/filter/add. Modals via `openModal`/`closeModals`. Drawer for project
   detail (`openDrawer`/`closeDrawer`).
6. **Init** (line ~1879): `renderDashboard()`.

Conventions observed:
- camelCase functions/vars; `SCREAMING_CASE` for seed constants and label maps.
- `data-*` attributes drive delegation (`data-view`, `data-proj`, `data-fav`,
  `data-copy`, `data-status`, `data-cat`, `data-tstatus`, `data-plugin`,
  `data-branch`, `data-toc`, and the memory `data-m*` handlers).
- All user-rendered strings pass through `esc()`.
- Filter buttons share the class `.filter` across views — selectors must be
  **scoped to their container id** (`#proj-filters`, `#skill-filters`,
  `#tool-filters`, …); a document-wide `.filter` query hits other views.

---

## 5. Project tiles — data flow

1. `SEED_PROJECTS` defines 16 projects: `{id,name,domain,desc,live,folder,tags,
   status,priority,needs}` (quant adds `repoOverride` + `localPath`).
2. `projects()` overlays `projOverrides[id]` (`status`, `priority`, `note`,
   `updated`) and computes `repo` (`repoOverride` or `REPO_BASE+folder`).
3. `renderDashboard()` shows pinned focus + "Current Priorities" (derived:
   high/critical & not archived). `renderProjects()` renders the filterable
   grid (filter by status, text search).
4. Clicking a project card → `openDrawer(id)` (detail drawer): edit status /
   priority / note. Saving writes `projOverrides` to `ws:projects` and calls
   `logActivity(...)`.
5. Status vocabulary: `idea, planning, building, testing, live, archived`.
   Priority vocabulary: `critical, high, med, low`.
   ⚠️ Note the roadmap's `Priority` type uses `medium`; the current code uses
   `med`. HubStore/types must reconcile this (see §7).

---

## 6. Build & deploy (Cloudflare Pages)

CI is GitHub Actions → Cloudflare Pages via Wrangler. The dashboard job:

```yaml
deploy-dashboard:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: a1a1276a1a278339d95c187e0bf6de47
        command: pages deploy dashboard --project-name=aaron-projects-hub --branch=main
```

- **No build step** — Wrangler uploads the `dashboard/` folder verbatim. Any
  file added there (e.g. `HubStore.js`, `seed.js`) is published as a static
  asset and must be loadable without bundling.
- Clean URLs: Cloudflare Pages serves `/workspace.html` at `/workspace`
  (308 redirect from the `.html` form).
- Trigger: push to `Aaron-1411/CC` `master`. Each project has its own deploy
  job; one job failing (e.g. `deploy-ecommerce-deep-dive`) does **not** block
  `deploy-dashboard`, but does turn the overall run red.

---

## 7. Technical debt & risks to "preserve existing functionality"

1. **Direct localStorage everywhere** — no abstraction, no schema, no
   versioning/migration. Primary HubStore migration target.
2. **Single 1880-line file** mixes data, state, render and events in one global
   scope. No modules — anything HubStore adds via `<script>` shares globals and
   load-order matters (define HubStore/seed *before* the main script runs).
3. **No tests, no types.** Pure JS; correctness is manual. Phase A adds a types
   reference + JS data layer but cannot add a `tsc`/test pipeline without a
   build step (out of scope — see CLAUDE.md).
4. **Vocabulary mismatch** between current code (`priority: 'med'`) and the
   roadmap types (`'medium'`). Migration must map, not silently break existing
   `ws:projects` data.
5. **V2 jumped ahead of the roadmap.** Tools/Memory/Skills/Agents views already
   ship with ad-hoc `ws:` persistence. Phase A retrofits HubStore *underneath*
   them; the risk is regressing working behaviour — every migrated read/write
   must keep the same `ws:` keys and shapes (or migrate data on read).
6. **Memory is local-only**, single-device. Real Obsidian/Supabase sync is a
   later phase.
7. **Tool connection status is manual config**, not a live health check (locked
   decision #3 — intentional, not debt).
8. **No empty states audited** for all sections (Phase 1 definition-of-done).

### Hard constraint for Phase A
The app must look and behave **identically** after Phase A. HubStore + seed are
introduced as a layer; user-facing behaviour, the seven views, and all `ws:`
data shapes are preserved. Seeding only runs when the store is empty.
