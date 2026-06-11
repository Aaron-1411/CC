/*
 * seed.js — bootstrap data for HubStore (Phase A).
 *
 * runSeed() writes ONLY when the store is empty; it never overwrites existing
 * user data. Loads as a plain <script> after HubStore.js and exposes both
 * `window.HUB_SEED` (the raw seed) and `window.runSeed`.
 *
 * Counts follow the Phase A spec (4 projects, 6 prompts, 4 skills, 8 tools,
 * 1 memory branch) but the CONTENT is Aaron's real hub data, not the generic
 * placeholders in the prompt (Fulcrum/Kub/HomePulse, Authentication/Stripe/…).
 * Seeding fabricated projects into a live command centre would violate the
 * "reuse first / behave identically / no fabrication" direction. See
 * ROADMAP-NOTES.md → "Phase A seed content".
 *
 * Shapes conform to dashboard/types.ts.
 * @typedef {import('./types').Project} Project
 * @typedef {import('./types').Prompt} Prompt
 * @typedef {import('./types').Skill} Skill
 * @typedef {import('./types').ToolCard} ToolCard
 * @typedef {import('./types').MemoryBranch} MemoryBranch
 */
(function (global) {
  'use strict';

  var TS = '2026-06-11T00:00:00.000Z';

  /** @type {Project[]} — real projects, spread across statuses/priorities. */
  var PROJECTS = [
    {
      id: 'personal-hub',
      name: 'Personal Hub',
      description: 'Personal AI Development Command Centre — the management layer for a virtual AI software company. Projects, tool stack, skills, agents, prompts and project memory.',
      status: 'building',
      priority: 'critical',
      quickLaunchUrl: 'https://aaron-projects-hub.pages.dev/workspace',
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'inkspector',
      name: 'Inkspector',
      description: 'Tattoo artist site for Jordan Mitchell, London. Portfolio gallery, booking form with admin dashboard, aftercare guides.',
      status: 'testing',
      priority: 'high',
      quickLaunchUrl: 'https://inkspector-app.pages.dev',
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'platespin',
      name: 'PlateSpin',
      description: 'Spin a wheel of your cuisines, set location + dietary needs, get matched to nearby spots. Free, no login.',
      status: 'building',
      priority: 'high',
      quickLaunchUrl: 'https://platespin-app.pages.dev',
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'moneymind',
      name: 'MoneyMind UK',
      description: 'Free UK money & rights course — 23 modules, 4 tiers. Lessons, quizzes, calculators, quests and an AI tutor.',
      status: 'live',
      priority: 'medium',
      quickLaunchUrl: 'https://moneymind-uk-app.pages.dev',
      createdAt: TS,
      updatedAt: TS,
    },
  ];

  /** @type {Prompt[]} — real prompts covering all four categories. */
  var PROMPTS = [
    {
      id: 'p-rules',
      title: 'Ship a feature the Aaron way',
      body: 'Build & deploy this following the rules: add it to the CC monorepo, wire a Cloudflare deploy job in .github/workflows/deploy.yml, add a hub card, ensure full mobile responsiveness, then push to master so CI deploys. Surface blockers only — do the work, don’t narrate.',
      category: 'development',
      favourite: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-mobile',
      title: 'Mobile responsive audit',
      body: 'Audit this page for mobile at 320px, 375px, 414px and 768px. Check: no horizontal overflow, touch targets ≥44px, inputs ≥16px font, nav collapses, images max-width 100%, grids reflow to one column. Fix every issue you find and report what changed.',
      category: 'development',
      favourite: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-teardown',
      title: 'Competitor teardown',
      body: 'Do a teardown of <COMPETITOR>. Cover: positioning, pricing, core features, what they do well, where the gaps are, and 3 concrete openings I could exploit. Be specific and cite what you actually saw.',
      category: 'research',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-validate',
      title: 'Validate a product idea',
      body: 'Pressure-test this idea: <IDEA>. Who is it for, what painful problem does it solve, why now, what’s the cheapest way to test demand this week, and what would make me kill it? Be blunt.',
      category: 'research',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-landing',
      title: 'Landing page copy',
      body: 'Write landing page copy for <PRODUCT>. Audience: <AUDIENCE>. Give me: a hero headline + subhead, 3 benefit blocks (outcome-led, not feature-led), social-proof framing, and one strong CTA. Confident, casual-expert tone — no corporate filler.',
      category: 'marketing',
      favourite: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-blog',
      title: 'Blog post from notes',
      body: 'Turn these rough notes into a tight blog post: <NOTES>. Keep my voice — direct, practical, builder-to-builder. Strong opening line, clear sections, a takeaway readers can act on today. No AI throat-clearing.',
      category: 'content',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
  ];

  /** @type {Skill[]} — real installed skills (~/.claude/skills), not placeholders. */
  var SKILLS = [
    {
      id: 'atelier',
      name: 'Atelier',
      description: 'Signature design skill — sleek, high-tech, casual-expert. Ships polished public sites/apps with an outreach-tracking backend.',
      tags: ['design', 'ui', 'frontend', 'redesign', 'web', 'dashboard', 'motion'],
      sourceLink: 'https://github.com/Aaron-1411/CC',
    },
    {
      id: 'impeccable',
      name: 'Impeccable',
      description: 'Design + 23 commands (polish, audit, critique, animate…) with 41 deterministic anti-slop detectors and live browser iteration.',
      tags: ['design', 'ui', 'redesign', 'frontend', 'motion', 'components'],
      sourceLink: 'https://github.com/Aaron-1411/CC',
    },
    {
      id: 'ui-ux-pro-max',
      name: 'UI/UX Pro Max',
      description: 'Design-intelligence DB: 50+ styles, 161 palettes, 57 font pairings, 25 chart types across 10 stacks. Plan, build, review and fix UI/UX.',
      tags: ['ui', 'design', 'components', 'mobile', 'web', 'frontend'],
      sourceLink: 'https://github.com/Aaron-1411/CC',
    },
    {
      id: 'stop-slop',
      name: 'Stop Slop',
      description: 'Removes AI writing patterns from prose. Use when drafting, editing or reviewing text to eliminate predictable AI tells.',
      tags: ['writing'],
      sourceLink: 'https://github.com/Aaron-1411/CC',
    },
  ];

  /** @type {ToolCard[]} — the eight Phase 0 tools; `connected` is manual config (#3). */
  var TOOLS = [
    {
      id: 'claude-code', name: 'Claude Code', connected: true,
      description: 'Agentic CLI coding environment — reads, edits and ships across the whole repo.',
      purpose: 'Primary development and implementation environment.',
      futureAgents: ['CTO', 'Developer', 'Chairman'],
      capabilities: [
        'Read, edit and refactor across the whole repo',
        'Run shell commands, tests and builds',
        'Multi-file agentic changes with planning',
        'Browser preview and MCP tool integrations',
      ],
    },
    {
      id: 'codex', name: 'Codex', connected: true,
      description: 'OpenAI Codex agent for code tasks, parallel jobs and image-to-code work.',
      purpose: 'Secondary build agent for scoped coding tasks and design-to-code.',
      futureAgents: ['Developer', 'Designer'],
      capabilities: [
        'Scoped code generation and edits',
        'Parallel task execution',
        'Image-to-code from mockups',
        'Runs in ChatGPT and CLI',
      ],
    },
    {
      id: 'github', name: 'GitHub', connected: true,
      description: 'Source of truth + CI/CD. Push to Aaron-1411/CC master → Actions deploy to Cloudflare Pages.',
      purpose: 'Version control, monorepo and automated deployment pipeline.',
      futureAgents: ['CTO', 'Developer', 'Release Manager'],
      capabilities: [
        'Version control and branch management',
        'CI/CD via GitHub Actions',
        'Automated Cloudflare Pages deploys',
        'Issues, pull requests and releases',
      ],
    },
    {
      id: 'obsidian', name: 'Obsidian', connected: false,
      description: 'Markdown knowledge vault. Project-branch memory, decisions, roadmaps and session summaries.',
      purpose: 'Long-term project memory and compressed context store.',
      futureAgents: ['Chairman', 'Archivist', 'Council'],
      capabilities: [
        'Markdown knowledge vault',
        'Per-project memory branches',
        'Backlinks and graph view',
        'Local-first plain-text storage',
      ],
    },
    {
      id: 'supabase', name: 'Supabase', connected: false,
      description: 'Postgres + Auth + storage backend. Powers Inkspector and future authed apps.',
      purpose: 'Database, auth and storage for projects that need a backend.',
      futureAgents: ['Backend', 'Developer'],
      capabilities: [
        'Postgres database',
        'Auth with row-level security',
        'File storage and edge functions',
        'Realtime subscriptions',
      ],
    },
    {
      id: 'n8n', name: 'n8n', connected: false,
      description: 'Self-hostable workflow automation — wire APIs, triggers and scheduled jobs.',
      purpose: 'Automation and orchestration glue for future agent workflows.',
      futureAgents: ['Operations', 'Chairman'],
      capabilities: [
        'Visual workflow automation',
        '400+ app integrations',
        'Scheduled and webhook triggers',
        'Self-hostable',
      ],
    },
    {
      id: 'lm-studio', name: 'LM Studio', connected: false,
      description: 'Local LLM runtime. Run open models on-device for private, zero-cost inference.',
      purpose: 'Local model inference for cheap, private agent reasoning.',
      futureAgents: ['Council', 'Researcher'],
      capabilities: [
        'Run open LLMs on-device',
        'OpenAI-compatible local API',
        'Private, zero-cost inference',
        'GGUF model management',
      ],
    },
    {
      id: 'wispr-flow', name: 'Wispr Flow', connected: false,
      description: 'Voice-to-text dictation. Capture ideas and briefs hands-free, anywhere.',
      purpose: 'Fast voice capture for briefs, notes and prompts.',
      futureAgents: ['Assistant'],
      capabilities: [
        'Voice-to-text dictation',
        'Hands-free capture anywhere',
        'Fast brief and note entry',
        'Works across all apps',
      ],
    },
  ];

  /** @type {MemoryBranch[]} — one worked-example branch for the Personal Hub. */
  var MEMORY = [
    {
      id: 'mem-personal-hub',
      projectId: 'personal-hub',
      sections: {
        summary: 'Personal AI Development Command Centre. Static single-file SPA (workspace.html) deployed on Cloudflare Pages. Evolving into the management layer for a virtual AI software company — projects, tool stack, skills, agents, prompts and project memory.',
        architecture: 'Vanilla JS + localStorage behind a HubStore abstraction, no build step. Dark theme design tokens shared with the public hub. Views: Dashboard, Projects, Memory, Tools, Skills, Agents, Prompts. Deployed via Aaron-1411/CC master → GitHub Actions → Cloudflare Pages (aaron-projects-hub).',
        decisions: [
          {
            id: 'd-1', date: '2026-06-11', title: 'One static HTML file',
            context: 'The hub must deploy instantly and stay easy to reason about.',
            decision: 'Keep everything in one static HTML file — zero build, instant deploy.',
            consequences: 'No bundler/tests; load order matters; great DX for a solo builder.',
          },
          {
            id: 'd-2', date: '2026-06-11', title: 'Storage behind HubStore',
            context: 'Direct localStorage calls were scattered and unmigratable.',
            decision: 'All persistence goes through a HubStore interface (localStorage adapter now, Supabase from Phase 3).',
            consequences: 'UI never touches localStorage directly; backend can swap without UI changes.',
          },
          {
            id: 'd-3', date: '2026-06-11', title: 'Agents are read-only until Phase 3',
            context: 'Forward compatibility without premature autonomy.',
            decision: 'The Agents view is a read-only catalog of installed plugin subagents — no execution yet.',
            consequences: 'Capability visibility now; orchestration deferred to Chairman (Phase 3+).',
          },
        ],
        skillsUsed: ['atelier', 'impeccable', 'ui-ux-pro-max', 'stop-slop'],
        repositories: [
          { name: 'Aaron-1411/CC (monorepo)', url: 'https://github.com/Aaron-1411/CC', note: 'Source of truth + CI/CD for the hub and all projects.' },
          { name: 'Live workspace', url: 'https://aaron-projects-hub.pages.dev/workspace', note: 'Deployed Command Centre.' },
        ],
        roadmap: '## Roadmap\n\n- [x] Phase 0 — Tool Stack dashboard\n- [x] Phase 1 — Foundation: projects, dashboard, skills, prompts\n- [x] Phase 2 — Obsidian memory architecture (project branches)\n- [x] Phase A — Audit + HubStore data layer\n- [ ] Phase 3 — Chairman orchestration + Supabase\n- [ ] Phase 4 — Skills system (SKILL.md, arbitration)\n- [ ] Phase 5 — Council agents',
        openIssues: '## Open issues\n\n- Memory is local-only — needs sync to the real Obsidian vault before multi-device use.\n- Tool connection status is manual — wire real health checks later (out of scope until scoped).\n- UI still reads legacy `ws:` keys; migrate renderers onto HubStore in a later step.',
      },
      sessions: [
        {
          id: 's-1', date: '2026-06-11', title: 'V2 — Tool Stack + Memory',
          summary: 'Built V2: added the Tool Stack, extended project statuses/priorities, and the Obsidian-style Project Memory layer with per-project branches.',
          tokensEstimate: 18000,
        },
        {
          id: 's-2', date: '2026-06-11', title: 'Phase A — Foundation data layer',
          summary: 'Audited the codebase (ARCHITECTURE.md), wrote CLAUDE.md and types.ts, and introduced the HubStore abstraction with a localStorage adapter, export/import and seed. App behaviour unchanged.',
          tokensEstimate: 22000,
        },
      ],
    },
  ];

  var HUB_SEED = { projects: PROJECTS, prompts: PROMPTS, skills: SKILLS, tools: TOOLS, memory: MEMORY };

  /**
   * Seed the store on first run only. Never overwrites existing data.
   * @param {Object} [store] defaults to global.HubStore
   * @returns {boolean} true if seeding happened, false if skipped
   */
  function runSeed(store) {
    store = store || global.HubStore;
    if (!store || typeof store.isEmpty !== 'function') { return false; }
    if (!store.isEmpty()) { return false; }
    PROJECTS.forEach(function (p) { store.projects.save(p); });
    PROMPTS.forEach(function (p) { store.prompts.save(p); });
    SKILLS.forEach(function (s) { store.skills.save(s); });
    TOOLS.forEach(function (t) { store.tools.save(t); });
    MEMORY.forEach(function (m) { store.memory.save(m); });
    return true;
  }

  global.HUB_SEED = HUB_SEED;
  global.runSeed = runSeed;
  if (typeof module !== 'undefined' && module.exports) { module.exports = { runSeed: runSeed, HUB_SEED: HUB_SEED }; }
})(typeof window !== 'undefined' ? window : this);
