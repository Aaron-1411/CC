# Personal Hub — AI Command Centre Roadmap

Repository: https://github.com/Aaron-1411/CC
Live: https://aaron-projects-hub.pages.dev/workspace

---

## Guiding Principles

- Simplicity first. Lightweight, intuitive, fast.
- Reuse first. Extend the existing hub, never rebuild from scratch.
- Mobile friendly. Every screen works at 380px width.
- Dark mode. Modern dark theme throughout.
- Max 3 clicks to any function.
- No agents, autonomous workflows or LLM calls until Phase 3.

---

## Locked Architecture Decisions

These are set once and never revisited mid-build.

1. **Storage abstraction.** All persistence goes through a HubStore interface. localStorage adapter for Phases 0-2. Supabase adapter from Phase 3. UI never calls localStorage directly.

2. **Markdown-native memory.** Project memory is stored as markdown strings mirroring an Obsidian vault layout. Exportable as a zip at any time. Format never changes, only the transport.

3. **Tool status is manual config.** Connected/disconnected status in the Tool Stack is a static boolean in a config file. No live health checks until explicitly scoped in a later phase.

4. **API keys never in client code.** From Phase 3 onward all LLM calls go through Cloudflare Pages Functions with keys in environment variables.

5. **Agent model mapping (config file, not hardcoded strings):**
   - Haiku 4.5: summarisation, classification, session compression
   - Sonnet 4.6: all worker agents (Developer, QA, UX, Automation, etc.)
   - Opus 4.8: Chairman synthesis, Phase 9 council debates on high-value decisions only

6. **Audit log from Phase 3.** An `audit_log` table records every agent action from the first agent call. Phase 8 builds authorisation modes on top of it, not from scratch.

7. **Cost guardrails from Phase 3.** Every LLM call logs token usage. A daily spend estimate is visible in the Tool Stack dashboard.

8. **Repository Intelligence never adds runtime dependencies.** Phase 6 analyses repos, extracts patterns, and creates internal skills and agents. External repos are never imported as dependencies.

---

## TypeScript Types (defined in Phase A, never changed without a migration)

```ts
type ProjectStatus = 'idea' | 'planning' | 'building' | 'testing' | 'live' | 'archived'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  priority: Priority
  quickLaunchUrl?: string
  createdAt: string
  updatedAt: string
}

interface Prompt {
  id: string
  title: string
  body: string
  category: 'development' | 'research' | 'marketing' | 'content'
  favourite: boolean
  createdAt: string
  updatedAt: string
}

interface Skill {
  id: string
  name: string
  description: string
  tags: string[]
  sourceLink?: string
}

interface ToolCard {
  id: string
  name: string
  connected: boolean
  description: string
  purpose: string
  futureAgents: string[]
}

interface MemoryBranch {
  id: string
  projectId: string
  sections: {
    summary: string
    architecture: string
    decisions: Decision[]
    skillsUsed: string[]
    repositories: RepoRef[]
    roadmap: string
    openIssues: string
  }
  sessions: SessionSummary[]
}

interface Decision {
  id: string
  date: string
  title: string
  context: string
  decision: string
  consequences: string
}

interface SessionSummary {
  id: string
  date: string
  title: string
  summary: string
  tokensEstimate?: number
}

interface RepoRef {
  name: string
  url: string
  note: string
}

interface Agent {
  id: string
  name: string
  role: string
  description: string
  status: 'idle' | 'thinking' | 'working' | 'waiting_approval' | 'error' | 'complete'
  activeSkills: string[]
  assignedPhase: number
}

interface AuditLogEntry {
  id: string
  timestamp: string
  agentId: string
  action: string
  projectId?: string
  tokensUsed?: number
  approved?: boolean
  authorisationLevel: 'advisory' | 'approval' | 'autonomous'
}
```

---

## Phase A — Audit and Foundation

**Goal:** Map the existing codebase. Build the data layer. No feature code.

**Deliverables:**
- `ARCHITECTURE.md` — full codebase map: framework, versions, routing, state management, component structure, existing project tile logic, Cloudflare Pages build/deploy config, technical debt
- `CLAUDE.md` — under 200 lines. Stack summary, locked decisions, conventions, hard rules
- `types.ts` — all types above, TypeScript strict
- `store/` — HubStore interface, localStorage adapter, JSON export/import
- `seed.ts` — seed data: 4 projects, 6 prompts, 4 skills, 8 tools (see Phase 0 tool list)

**Definition of done:** App builds and runs identically. Data layer exercised by basic tests. Nothing user-facing changed. One commit per deliverable.

---

## Phase 0 — Tool Stack Dashboard

**Goal:** Visibility into all capabilities available to the user and to future agents.

**Tools to display:**
- Claude Code
- Codex
- GitHub
- Obsidian
- Supabase
- n8n
- LM Studio
- Wispr Flow

**Each tool card displays:**
- Tool name
- Connected status (manual config boolean)
- Description
- Assigned purpose
- Future agent access (e.g. CTO, Developer, Chairman)
- Available capabilities (bullet list)

**Features:**
- Search
- Filter: All / Connected / Local / Available
- Capability-dashboard feel, not a settings page

**Definition of done:** Tool Stack section fully functional on desktop and 380px. Status toggleable in config. Looks and feels like a professional capability layer.

---

## Phase 1 — Personal Hub Foundation

**Goal:** Daily workspace. The default place every work session starts.

**Retain and improve:** Existing project tile system. All existing functionality preserved.

**Project fields:**
- Name, Description, Status, Priority, Last Updated, Quick Launch URL

**Status options:** Idea / Planning / Building / Testing / Live / Archived

**Priority options:** Low / Medium / High / Critical

**Dashboard homepage sections:**

1. **Active Projects** — project tiles, filterable by status and priority
2. **Current Priorities** — derived from projects where priority is High or Critical and status is not Archived. Not a separate data store.
3. **Skills Library** — card grid from HubStore. Name, description, tags. Add/edit skills.
4. **Prompt Library** — search, copy-to-clipboard, favourite toggle, category filter. Add/edit prompts.
5. **Workspace** — project context panel, recent activity (derived from updatedAt), notes textarea persisted in HubStore. Architecture must be extensible for Chairman in Phase 3.

**Definition of done:** All spec Phase 1 success criteria pass. Works at 380px. Every section has a meaningful empty state. JSON export/import accessible from settings.

---

## Phase 2 — Obsidian Memory Architecture

**Goal:** Project-specific knowledge layer. Compressed, retrievable, token-efficient.

**Memory structure per project:**
```
memory/
  {project-slug}/
    summary.md
    architecture.md
    decisions.md        ← ADR format: context / decision / consequences
    skills-used.md
    repositories.md
    roadmap.md
    open-issues.md
    sessions/
      {date}-{slug}.md
```

**UI sections:**
- Project Memory — tabbed view of all sections above, editable
- Decision Log — ADR-style list, add/edit decisions
- Session Summaries — chronological list, add/view, estimated tokens shown
- Roadmap — rendered markdown

**Export:** "Export vault" button downloads a zip matching the folder structure above, proving Obsidian compatibility and migration path.

**Context compression design:** Architecture must support future automated summarisation. Session summaries have a `tokensEstimate` field. Compression is manual in this phase.

**Definition of done:** A full memory branch for the Personal Hub project exists, can be edited and exported. The zip opens correctly in Obsidian.

---

## Phase 3 — Chairman

**Goal:** Single interface. User speaks to Chairman only.

**Infrastructure prerequisite:** Supabase migration (projects, prompts, skills, memory branches, audit log, session state). Cloudflare Pages Functions proxy for all LLM calls. API keys in environment variables only.

**Chairman responsibilities:**
- Load project memory on project open
- Load relevant skills
- Load project roadmap
- Determine required council agents
- Manage execution workflows
- Write session summaries and decisions back to memory

**User experience:** User types to Chairman. Chairman handles everything. No manual memory, skill, or repo management required.

**Audit log:** Every Chairman action logged from day one (agent, action, project, tokens, authorisation level).

**Cost visibility:** Daily token spend estimate visible in Tool Stack dashboard.

**Definition of done:** Chairman responds in context of a project, logs every action, reads and writes memory, works on mobile.

---

## Phase 4 — Skills System

**Goal:** SKILL.md as a living, searchable, arbitrated capability library.

**Skill fields:** Name, description, tags, dependencies, use cases, source link, version

**Features:**
- Search and filter by tag
- Dependency graph
- Skill recommendation engine: when multiple skills overlap, compare and recommend one or a combination
- Skill arbitration: when confidence is low, ask for approval before invoking
- Manual skill selection before sending prompts to Chairman

**Definition of done:** Chairman can invoke skills by name. Skill arbitration works for at least two overlapping skills. Skills persist in Supabase.

---

## Phase 5 — Council

**Goal:** Specialist agents behind the Chairman. Expert planning.

**Agents:**
- CTO — architecture, technical decisions, build vs buy
- Product — roadmap, priorities, user value
- Developer — implementation, code review
- QA — testing strategy, edge cases
- UX — interface and experience review
- Automation — n8n workflows, integration patterns
- Repository Intelligence — GitHub analysis, skill extraction
- Skill Librarian — SKILL.md curation, arbitration

**Each agent has:**
- Defined responsibilities (in CLAUDE.md agent config)
- Structured output format
- Communication protocol to Chairman

**Chairman decides** which agents participate per request and synthesises the final answer. Deep reasoning internally, compressed communication externally.

**Definition of done:** Chairman routes a request to at least two agents and synthesises a coherent response. Council agents do not communicate directly with the user.

---

## Phase 6 — Repository Intelligence

**Goal:** Continuous capability improvement from GitHub.

**Capabilities:**
- Scan and categorise repositories
- Extract skills, workflows, agent designs, patterns
- Compare against existing projects and skills
- Never add external repos as runtime dependencies

**Agent Factory Model:**
```
Repository
  → Analysis
  → Skill (SKILL.md entry)
  → Internal Agent
  → Improved Internal Agent
```

**Storage:** Findings stored in Obsidian memory and SKILL.md.

**Definition of done:** Repository Intelligence scans one repo and produces a SKILL.md entry and a session summary. No new runtime dependency is created.

---

## Phase 7 — Agent Operations Floor

**Goal:** Make the AI organisation visible and observable.

**Session 7a — Status board:**
- Agent list with live status: Idle / Thinking / Working / Waiting Approval / Error / Complete
- Current task, active skills, memory usage, recent communications per agent
- Communication links shown when agents are collaborating

**Session 7b — Sims-style office:**
- Agents as desks in a virtual office
- Monitor illumination indicates state
- Click agent to reveal full detail panel
- Real-time updates as agents work

**Definition of done (7a):** Status board accurately reflects agent state. Updates within 2 seconds of state change.

**Definition of done (7b):** Office layout renders at 380px. All agent states visually distinguishable.

---

## Phase 8 — Authorisation Engine

**Goal:** 13 Pillars operating model. Project-level control.

**Modes:**
- **Advisory:** Agents recommend only. No actions taken.
- **Approval:** Agents prepare actions, user must approve each before execution.
- **Autonomous:** Agents may research, plan, implement, test, update memory, and complete workflows automatically.

**Per project:** Each project has its own authorisation level.

**Audit:** Complete audit log already exists from Phase 3. Phase 8 adds UI to view and filter it, and enforcement logic for each mode.

**Definition of done:** Switching a project to Advisory means no agent takes action without surfacing a recommendation first. Audit log shows every decision point.

---

## Phase 9 — LLM Council Integration

**Goal:** Multi-model debate for high-value decisions only.

**Trigger conditions (not routine tasks):**
- Architecture decisions
- Product strategy
- Major refactors
- Build vs buy decisions

**Process:**
- Specialist agent invokes internal model council
- Models debate
- Chairman synthesises consensus recommendation
- User sees recommendation, not the debate

**Models in council:** Configurable. Default: Sonnet 4.6 + Opus 4.8 + one open-source model via LM Studio.

**Definition of done:** One architecture decision is run through the council and a consensus recommendation is returned to the user via Chairman.

---

## Phase 10 — Autonomous Organisation

**Goal:** Virtual software company operating end to end.

**Session 10a — Orchestrator:**
```
User
  → Chairman
  → Council
  → Skills
  → Tools
  → Execution
```

Orchestrator assigns work, triggers agents, coordinates reviews, manages approvals, updates memory and SKILL.md.

**Session 10b — End-to-end workflow testing:**
- A real feature request flows from user input through Chairman, Council, Developer agent, QA agent, back to user with a result and a full audit trail.
- Memory is updated. SKILL.md is updated. Token cost is logged.

**Definition of done:** A complete workflow runs without manual intervention (in Autonomous mode). Audit log captures every step. System improves SKILL.md with findings from the workflow.

---

## Session Protocol (every phase)

1. Set `/model` to "Use Opus in plan mode, Sonnet 4.6 otherwise"
2. Start in plan mode (Shift+Tab)
3. Read ROADMAP.md, CLAUDE.md, ARCHITECTURE.md before any code
4. Present full plan for the phase before writing a single line
5. Implement in small commits — one logical change per commit
6. At 50% context, run `/compact`
7. Before declaring done: fresh-context subagent reviews the diff against this phase's spec
8. Final step: update the hub's own memory branch with a session summary and any new decisions

---

## Out of Scope (until explicitly scoped)

- Auth / user accounts
- Multi-user collaboration
- Live tool health checks
- Obsidian vault live sync
- Any LLM call in client code
- Any external repo as a runtime dependency

If Claude Code proposes any of the above during a phase that doesn't include them, the answer is no.

---

## ROADMAP-NOTES.md

Any work identified during a session that belongs to a later phase goes into ROADMAP-NOTES.md in the repo root, not into the current build.
