/**
 * Personal Hub — type contracts.
 *
 * Source-of-truth reference for every entity in the Command Centre. The hub
 * ships as un-bundled vanilla JS (no `tsc` in `dashboard/`), so this file is
 * not compiled at runtime — it is the binding type contract that `HubStore.js`,
 * `seed.js` and the renderers mirror via JSDoc `@typedef`s.
 *
 * Types are copied verbatim from ROADMAP.md and must not change without a
 * migration. Each interface notes its purpose and the phase that introduced it.
 *
 * Phase A — Audit and Foundation.
 */

/**
 * Lifecycle state of a project, in pipeline order.
 * Introduced: Phase A (used by project tiles since Phase 1).
 */
export type ProjectStatus = 'idea' | 'planning' | 'building' | 'testing' | 'live' | 'archived'

/**
 * Project priority. NOTE: existing `ws:projects` data uses the legacy value
 * `'med'` for medium — the store layer maps `'med'` ↔ `'medium'`.
 * Introduced: Phase A.
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical'

/**
 * A buildable project tracked on the Dashboard and Projects views.
 * Introduced: Phase A (formalises the Phase 1 project tile).
 */
export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  priority: Priority
  quickLaunchUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * A reusable prompt in the Prompt Library — searchable, copyable, favouritable.
 * Introduced: Phase A (Prompt Library lands in Phase 1).
 */
export interface Prompt {
  id: string
  title: string
  body: string
  category: 'development' | 'research' | 'marketing' | 'content'
  favourite: boolean
  createdAt: string
  updatedAt: string
}

/**
 * A capability in the Skills Library card grid.
 * Introduced: Phase A (Skills Library shown in Phase 1, expanded in Phase 4).
 */
export interface Skill {
  id: string
  name: string
  description: string
  tags: string[]
  sourceLink?: string
}

/**
 * A capability card in the Tool Stack dashboard. `connected` is manual config
 * (locked decision #3) — not a live health check.
 * Introduced: Phase A (Tool Stack is Phase 0).
 */
export interface ToolCard {
  id: string
  name: string
  connected: boolean
  description: string
  purpose: string
  futureAgents: string[]
  /** Bullet list of concrete capabilities this tool provides. Added in Phase 0. */
  capabilities: string[]
}

/**
 * The Obsidian-style knowledge branch for one project. Sections are stored as
 * markdown strings (locked decision #2) so the branch can be exported as a zip.
 * Introduced: Phase A (Memory architecture is Phase 2).
 */
export interface MemoryBranch {
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

/**
 * An ADR-style decision record: context → decision → consequences.
 * Introduced: Phase A (Decision Log is Phase 2).
 */
export interface Decision {
  id: string
  date: string
  title: string
  context: string
  decision: string
  consequences: string
}

/**
 * A compressed summary of one work session, with an estimated token count to
 * support future automated context compression.
 * Introduced: Phase A (Session Summaries are Phase 2).
 */
export interface SessionSummary {
  id: string
  date: string
  title: string
  summary: string
  tokensEstimate?: number
}

/**
 * A reference to a repository relevant to a project.
 * Introduced: Phase A (Repository References are Phase 2).
 */
export interface RepoRef {
  name: string
  url: string
  note: string
}

/**
 * A specialist agent in the AI organisation. Defined now for forward
 * compatibility; agents do not execute anything until Phase 3+.
 * Introduced: Phase A (agents become active from Phase 3, Council in Phase 5).
 */
export interface Agent {
  id: string
  name: string
  role: string
  description: string
  status: 'idle' | 'thinking' | 'working' | 'waiting_approval' | 'error' | 'complete'
  activeSkills: string[]
  assignedPhase: number
}

/**
 * One row in the audit log — every agent action is recorded from the first
 * agent call (locked decision #6). Authorisation modes (Phase 8) read this.
 * Introduced: Phase A (audit log populated from Phase 3).
 */
export interface AuditLogEntry {
  id: string
  timestamp: string
  agentId: string
  action: string
  projectId?: string
  tokensUsed?: number
  approved?: boolean
  authorisationLevel: 'advisory' | 'approval' | 'autonomous'
}
