# CLAUDE.md — Personal Hub / Command Centre

Guidance for Claude Code when working in `dashboard/`. Scoped to the hub app
(`workspace.html`), not the wider monorepo. Read `ROADMAP.md` (authority on
phases, types, scope) and `ARCHITECTURE.md` before writing code.

---

## Stack

- **Framework:** none. Hand-written HTML + CSS + vanilla ES2020 JS.
- **Entry / target:** `dashboard/workspace.html` — single file, inline
  `<style>` + `<script>`. Sibling files: `index.html`, `setup.html`.
- **Data layer:** `dashboard/HubStore.js` + `dashboard/seed.js` (Phase A).
  All persistence goes through HubStore, which uses `hub:`-prefixed localStorage
  keys. (The legacy inline UI still reads `ws:`-prefixed keys; those migrate
  onto HubStore in a later step — see ROADMAP-NOTES.md.)
- **Build command:** none — there is no bundler/transpiler. Files in
  `dashboard/` are deployed verbatim, so anything added must run un-bundled
  (plain `<script>`, load-order matters: define HubStore/seed before the main
  script).
- **Test command:** none yet (no runner without a build step). Verify by
  loading the page (preview server) and exercising views + localStorage.
- **Deploy target:** Cloudflare Pages, project `aaron-projects-hub`. CI job
  `deploy-dashboard` runs `wrangler pages deploy dashboard
  --project-name=aaron-projects-hub --branch=main` on push to
  `Aaron-1411/CC` master. Live at `/workspace`.

---

## Locked architectural decisions (verbatim from ROADMAP.md)

These are set once and never revisited mid-build.

1. **Storage abstraction.** All persistence goes through a HubStore interface.
   localStorage adapter for Phases 0-2. Supabase adapter from Phase 3. UI never
   calls localStorage directly.
2. **Markdown-native memory.** Project memory is stored as markdown strings
   mirroring an Obsidian vault layout. Exportable as a zip at any time. Format
   never changes, only the transport.
3. **Tool status is manual config.** Connected/disconnected status in the Tool
   Stack is a static boolean in a config file. No live health checks until
   explicitly scoped in a later phase.
4. **API keys never in client code.** From Phase 3 onward all LLM calls go
   through Cloudflare Pages Functions with keys in environment variables.
5. **Agent model mapping (config file, not hardcoded strings):**
   - Haiku 4.5: summarisation, classification, session compression
   - Sonnet 4.6: all worker agents (Developer, QA, UX, Automation, etc.)
   - Opus 4.8: Chairman synthesis, Phase 9 council debates on high-value
     decisions only
6. **Audit log from Phase 3.** An `audit_log` table records every agent action
   from the first agent call. Phase 8 builds authorisation modes on top of it,
   not from scratch.
7. **Cost guardrails from Phase 3.** Every LLM call logs token usage. A daily
   spend estimate is visible in the Tool Stack dashboard.
8. **Repository Intelligence never adds runtime dependencies.** Phase 6
   analyses repos, extracts patterns, and creates internal skills and agents.
   External repos are never imported as dependencies.

---

## Hard rules

- **All persistence through HubStore.** A direct `localStorage` call inside a
  component / renderer is a bug. The only allowed `localStorage` access is
  inside the HubStore localStorage adapter.
- **Dark theme only. Mobile-first.** Every screen works at 380px. Nothing more
  than 3 clicks deep.
- **No LLM calls, agents, councils, or autonomous workflows until Phase 3.**
  The Agents view is a read-only catalog; it does not execute anything.
- **No external repos added as runtime dependencies, ever.** Zero npm deps in
  the hub; no `<script src>` to third-party libs beyond fonts already present.
- **API keys never in client code.** No secrets in `workspace.html` or any
  file under `dashboard/`.
- **Preserve existing behaviour.** Phase A must leave the app looking and
  behaving identically. Keep the `ws:` keys and data shapes (migrate on read if
  a shape must change — never silently drop user data). Seed only when empty.

---

## Types & code style

- **Strict typing intent, JS reality.** There is no `tsc` here, so types live in
  `dashboard/types.ts` as the **source-of-truth reference** (all ROADMAP types,
  verbatim, JSDoc'd). Runtime code is vanilla JS that mirrors those types via
  JSDoc `@typedef` / `@param` / `@returns` annotations.
- Treat the type contracts as binding: no implicit `any`, give exported/public
  functions explicit documented return types, prefer narrow unions over loose
  strings (e.g. `ProjectStatus`, `Priority`).
- **Known vocabulary mismatch:** existing code uses `priority: 'med'`; the
  `Priority` type uses `'medium'`. Map between them in the store layer; do not
  break existing `ws:projects` data.
- All user-facing strings rendered to the DOM pass through `esc()`.
- camelCase for functions/vars, `SCREAMING_CASE` for seed constants and label
  maps. `data-*` attributes drive event delegation.

---

## Commits

- Convention: `type(scope): description` — one logical change per commit.
  Phase A uses `chore(foundation): step N — description`.
- Do not skip hooks or bypass signing. Create new commits; don't amend.

---

## Phase boundary rule

Work identified for a later phase goes into `ROADMAP-NOTES.md` at the repo root
— **not** into the current build. If a change would introduce anything from the
"Out of Scope" list in ROADMAP.md (auth, multi-user, live health checks,
Obsidian live sync, client-side LLM calls, external runtime deps), the answer
is no.

## Session protocol (per ROADMAP.md + MASTER-BUILD)

1. Read ROADMAP.md, CLAUDE.md, ARCHITECTURE.md, and `dashboard/BUILD-STATE.md`
   before any code.
2. Present the full plan for the phase before writing a line; get approval.
3. Touch only `dashboard/**`, root `ROADMAP.md`, `ROADMAP-NOTES.md`, and
   `.gitignore`. Nothing else in the monorepo.
4. Implement in small commits — one logical change each.
5. At 50% context, run `/compact`.
6. Tests are plain Node: `dashboard/tests/*.test.mjs` with `node:assert`
   (no runner, no build step).
7. Never mark a phase complete on a failing check.
8. Before "done": a fresh-context subagent reviews the diff against the phase
   spec.
9. On completion, update `dashboard/BUILD-STATE.md` and tag `phase-{n}-complete`.
10. Final step: update the Personal Hub memory branch with a session summary and
    any new decisions.

## Knowledge-repo rules (Appendix B — from Phase 3.5 onward)

- Skills, agents, memory live in **cc-knowledge**. Never in Supabase, never
  hardcoded in `dashboard/`.
- All knowledge reads/writes go through `functions/api/knowledge.ts`.
  `GITHUB_TOKEN` server-side only.
- `SKILL.md` and agent files keep the Claude Code native formats; unknown
  frontmatter keys allowed, breaking the format is not.
- `~/.claude/skills` is additive territory: individual symlinks only, never
  replace the folder.

See ROADMAP.md Appendix A (STORAGE MAP) for the full three-homes boundary.
