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

  // Optional presentational extras (domain, techTags, needs, repoFolder,
  // repoOverride, localPath) live alongside the typed Project core so the
  // existing tile/drawer behaviour is preserved. The typed fields are the
  // contract; extras are additive metadata.
  /** @type {Array<Project & {domain?:string,techTags?:string[],needs?:string[],repoFolder?:string,repoOverride?:string,localPath?:string}>} */
  var PROJECTS = [
    { id:'personal-hub', name:'⌘ Personal Hub', description:'Personal AI Development Command Centre — the management layer for a virtual AI software company. Projects, tool stack, skills, agents, prompts and project memory.',
      status:'building', priority:'critical', quickLaunchUrl:'https://aaron-projects-hub.pages.dev/workspace', createdAt:TS, updatedAt:TS,
      domain:'Meta', techTags:['Vanilla JS','CF Pages'], needs:['ui','design','dashboard'], repoFolder:'dashboard' },
    { id:'ecommerce', name:'🛒 E-Commerce Deep Dive', description:'13-pillar ecommerce brand audit. Paste any URL, get an AI gap analysis → Word report, PowerPoint deck, RAG dashboard.',
      status:'live', priority:'medium', quickLaunchUrl:'https://ecommerce-deep-dive-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Analysis & Data', techTags:['Next.js','Gemini','CF Pages'], needs:['slides','writing','branding','redesign'], repoFolder:'ecommerce-deep-dive' },
    { id:'digital-depth', name:'🔍 Digital Depth Dive', description:'Website analysis toolkit. AI visibility, keyword gaps, lead finder, content remix and landing-page AI.',
      status:'live', priority:'low', quickLaunchUrl:'https://digital-depth-dive-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Analysis & Data', techTags:['React','TS','CF Pages'], needs:['writing','marketing','redesign','ui'], repoFolder:'digital-depth-dive' },
    { id:'open-eyes', name:'👁️ Open Eyes Data', description:'Public data transparency dashboard. Surfaces government datasets, contracts and records in one searchable UI.',
      status:'live', priority:'low', quickLaunchUrl:'https://open-eyes-data-app.mraaronmanu.workers.dev', createdAt:TS, updatedAt:TS,
      domain:'Analysis & Data', techTags:['TanStack','TS','CF Workers'], needs:['ui','redesign','design','dashboard'], repoFolder:'open-eyes-data' },
    { id:'wealth', name:'💰 Wealth Companion', description:'Personal finance & wealth management. Track goals, assets and financial milestones in one place.',
      status:'live', priority:'low', quickLaunchUrl:'https://wealth-companion-app.mraaronmanu.workers.dev', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['TanStack','TS','CF Workers'], needs:['ui','redesign','design','dashboard'], repoFolder:'wealth-companion' },
    { id:'isa', name:'📈 ISA Platform', description:'UK ISA investment tracker. Live prices, portfolio analytics, risk metrics, seasonality and fundamentals.',
      status:'live', priority:'medium', quickLaunchUrl:'https://isa-platform.mraaronmanu.workers.dev', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['Next.js 16','Turso','CF Pages'], needs:['ui','redesign','design','mobile'], repoFolder:'isa-investment-platform' },
    { id:'pension', name:'💷 Pension Finder UK', description:'Find lost workplace pensions, track all pots in one dashboard, get plain-English retirement projections.',
      status:'live', priority:'low', quickLaunchUrl:'https://pension-finder-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['Next.js','Recharts','CF Pages'], needs:['ui','redesign','design','dashboard'], repoFolder:'pension-finder-uk' },
    { id:'moneymind', name:'🧠 MoneyMind UK', description:'Free UK money & rights course — 23 modules, 4 tiers. Lessons, quizzes, calculators, quests and an AI tutor.',
      status:'live', priority:'medium', quickLaunchUrl:'https://moneymind-uk-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['React','Vite','CF Pages'], needs:['ui','redesign','branding','writing','mobile'], repoFolder:'moneymind-uk' },
    { id:'tastybot', name:'🤖 Tastybot', description:'Trading bot dashboard for TastyTrade. Backtests, position management and strategy execution.',
      status:'live', priority:'low', quickLaunchUrl:'https://tastybot-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['React','Vite','CF Pages'], needs:['ui','redesign','design','dashboard'], repoFolder:'tastybot' },
    { id:'quant', name:'📊 Tr4d3 · Quant Desk', description:'12-module quant analysis desk — technicals, fundamentals, factors, backtests, options, portfolio optimiser, macro. Analysis-only.',
      status:'testing', priority:'high', quickLaunchUrl:'https://github.com/Aaron-1411/quant-desk', createdAt:TS, updatedAt:TS,
      domain:'Finance', techTags:['Python','FastAPI','React'], needs:['ui','design','redesign','dashboard'], repoFolder:'', repoOverride:'https://github.com/Aaron-1411/quant-desk', localPath:'~/Desktop/quant-desk' },
    { id:'get-settld', name:'🏡 Get Settld', description:'Free first-time-buyer toolkit. Affordability checks, area research, property valuation and viewing tools.',
      status:'live', priority:'low', quickLaunchUrl:'https://get-settld-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Property', techTags:['React','TS','CF Pages'], needs:['ui','redesign','branding','mobile'], repoFolder:'get-settld' },
    { id:'lease-guard', name:'🏠 Lease Guard', description:'Lease management & tenant protection. Understand your rights, review clauses and track key dates.',
      status:'live', priority:'low', quickLaunchUrl:'https://lease-guard-app.mraaronmanu.workers.dev', createdAt:TS, updatedAt:TS,
      domain:'Property', techTags:['TanStack','TS','CF Workers'], needs:['ui','redesign','writing'], repoFolder:'lease-guard' },
    { id:'whole-health', name:'🧭 Whole Health Compass', description:'White-label patient-education tool. Plain-English concern → practitioner-ready summary across Western/TCM/Ayurveda.',
      status:'live', priority:'medium', quickLaunchUrl:'https://whole-health-compass-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Health', techTags:['React','Vite','CF Pages'], needs:['ui','redesign','branding','design'], repoFolder:'whole-health-compass' },
    { id:'lifedash', name:'⚡ LifeDash', description:'Gamified personal life tracker — Body, Learn, Mind, Experience. XP, streaks, sleep, mood and habits.',
      status:'live', priority:'low', quickLaunchUrl:'https://lifedash-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Health', techTags:['React','CF Pages'], needs:['ui','redesign','mobile','motion','design'], repoFolder:'lifedash' },
    { id:'gymseek', name:'🏋️ GymSeek', description:'AI gym finder. Enter location, budget and preferences → ranked results with pricing and facilities.',
      status:'live', priority:'low', quickLaunchUrl:'https://gymseek-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Health', techTags:['Static','CF Functions'], needs:['ui','redesign','branding','mobile'], repoFolder:'gymseek' },
    { id:'platespin', name:'🍽️ PlateSpin', description:'Spin a wheel of your cuisines, set location + dietary needs, get matched to nearby spots. Free, no login.',
      status:'building', priority:'high', quickLaunchUrl:'https://platespin-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Food & Lifestyle', techTags:['React','Vite','CF Pages'], needs:['design','ui','redesign','mobile','motion','branding'], repoFolder:'platespin' },
    { id:'inkspector', name:'🖋 Inkspector', description:'Tattoo artist site for Jordan Mitchell, London. Portfolio gallery, booking form with admin dashboard, aftercare guides.',
      status:'testing', priority:'high', quickLaunchUrl:'https://inkspector-app.pages.dev', createdAt:TS, updatedAt:TS,
      domain:'Food & Lifestyle', techTags:['Next.js','Supabase','CF Pages'], needs:['design','ui','redesign','images','branding','motion'], repoFolder:'inkspector' },
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
    {
      id: 'p-proxy',
      title: 'Add a keyless API proxy',
      body: 'Add a Cloudflare Pages Function that proxies <UPSTREAM API> so the API key never ships to the client. Include edge caching with a sensible TTL, a fallback mirror, and graceful degradation (return empty + degraded:true, never a 5xx) on upstream failure.',
      category: 'development',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-debug',
      title: 'Debug a failing build',
      body: 'The build is failing. Read the full error, find the root cause (don’t bypass with --no-verify or by disabling checks), fix it properly, re-run the build to confirm green, and explain in one line what was wrong.',
      category: 'development',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-launch',
      title: 'Launch thread',
      body: 'Write a launch thread (6–8 posts) for <PRODUCT>. Hook hard on post 1, show the problem, the build, a demo moment, and end with a clear CTA. Punchy, no emojis unless they earn their place.',
      category: 'marketing',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: 'p-repurpose',
      title: 'Repurpose to social',
      body: 'Repurpose this <ARTICLE/VIDEO> into: 1 LinkedIn post, 1 X thread, and 3 short hooks. Keep each native to its platform. Lead with the most counterintuitive insight.',
      category: 'content',
      favourite: false,
      createdAt: TS,
      updatedAt: TS,
    },
  ];

  // Real installed skills (~/.claude/skills), catalogued in ~/skills-library/README.md.
  // Typed core = id/name/description/tags; cat/invoke/icon are optional extras the
  // Skills view uses for category filtering and the invoke chip.
  /** @type {Array<Skill & {cat?:string,invoke?:string,icon?:string}>} */
  var SKILLS = [
    // ── Design — full frontend build ──
    { id:'atelier', name:'Atelier', invoke:'atelier', icon:'🎨', cat:'build', tags:['design','ui','frontend','redesign','web','dashboard','motion'], description:'Your signature design skill — sleek, high-tech, casual-expert. Ships polished public sites/apps with an outreach-tracking backend.' },
    { id:'impeccable', name:'Impeccable', invoke:'impeccable', icon:'✨', cat:'build', tags:['design','ui','redesign','frontend','motion','components'], description:'Design + 23 commands (polish, audit, critique, animate, bolder, quieter…) with 41 deterministic anti-slop detectors and live browser iteration.' },
    { id:'ui-ux-pro-max', name:'UI/UX Pro Max', invoke:'ui-ux-pro-max', icon:'🧠', cat:'build', tags:['ui','design','components','mobile','web','frontend'], description:'Design-intelligence DB: 50+ styles, 161 palettes, 57 font pairings, 25 chart types across 10 stacks. Plan, build, review and fix UI/UX.' },
    { id:'taste-skill', name:'Design Taste (Frontend)', invoke:'taste-skill', icon:'🎯', cat:'build', tags:['design','frontend','redesign','web','ui'], description:'Anti-slop frontend for landing pages, portfolios and redesigns. Reads the brief, infers direction, audit-first, strict pre-flight check.' },
    { id:'emil-design-eng', name:'Emil Design Eng', invoke:'emil-design-eng', icon:'🪄', cat:'build', tags:['ui','design','motion','components','frontend'], description:"Emil Kowalski's philosophy on UI polish, component design, animation decisions and the invisible details that make software feel great." },
    { id:'soft-skill', name:'High-End Visual Design', invoke:'soft-skill', icon:'💎', cat:'build', tags:['design','ui','web','motion'], description:'Design like a high-end agency — exact fonts, spacing, shadows, cards and animations that feel expensive. Blocks the cheap AI defaults.' },
    { id:'redesign-skill', name:'Redesign Existing Projects', invoke:'redesign-skill', icon:'♻️', cat:'build', tags:['redesign','design','ui','web'], description:'Upgrade existing sites and apps to premium quality. Audits current design, kills generic AI patterns, never breaks functionality.' },
    // ── Design — style-specific looks ──
    { id:'minimalist-skill', name:'Minimalist UI', invoke:'minimalist-skill', icon:'⬜', cat:'style', tags:['design','ui','web','redesign'], description:'Clean editorial interfaces — warm monochrome, typographic contrast, flat bento grids. No gradients, no heavy shadows.' },
    { id:'brutalist-skill', name:'Industrial Brutalist UI', invoke:'brutalist-skill', icon:'🏗️', cat:'style', tags:['design','ui','web','dashboard'], description:'Swiss print × military terminal. Rigid grids, extreme type contrast, analog degradation — for data-heavy dashboards that feel declassified.' },
    { id:'gpt-tasteskill', name:'GPT Taste (GSAP Motion)', invoke:'gpt-tasteskill', icon:'🌀', cat:'style', tags:['design','ui','web','motion','frontend'], description:'Elite UX/UI & GSAP motion engineer — randomized layouts, AIDA structure, editorial type, scroll pinning/stacking/scrubbing.' },
    { id:'stitch-skill', name:'Stitch Design Taste', invoke:'stitch-skill', icon:'🧵', cat:'style', tags:['design','ui','mobile','motion'], description:'Semantic design-system skill for Google Stitch. Generates DESIGN.md files enforcing premium, anti-generic UI standards.' },
    { id:'taste-skill-v1', name:'Design Taste v1 (Legacy)', invoke:'taste-skill-v1', icon:'🗂️', cat:'style', tags:['design','frontend','redesign','web','ui'], description:'The original v1 taste-skill, preserved for projects that depend on its exact behaviour. Use only for backward compatibility.' },
    // ── Design — image generation ──
    { id:'imagegen-frontend-web', name:'Imagegen — Web', invoke:'imagegen-frontend-web', icon:'🖼️', cat:'image', tags:['images','design','web','marketing'], description:'Premium website design references — ONE horizontal image per section (8 sections → 8 images), varied heroes, one consistent palette.' },
    { id:'imagegen-frontend-mobile', name:'Imagegen — Mobile', invoke:'imagegen-frontend-mobile', icon:'📱', cat:'image', tags:['images','design','mobile'], description:'Premium app-native screen concepts inside clean phone mockups (iOS/Android). Generates images only — does not write code.' },
    { id:'image-to-code-skill', name:'Image to Code', invoke:'image-to-code-skill', icon:'🎛️', cat:'image', tags:['design','frontend','web','images'], description:'Generates the design image first, deeply analyses it, then codes the site to match. Codex-tuned, large readable section images.' },
    { id:'brandkit', name:'Brand Kit', invoke:'brandkit', icon:'📦', cat:'image', tags:['branding','images','design'], description:'Premium brand-guideline boards, logo systems, identity decks and visual-world presentations. Minimalist, cinematic, editorial.' },
    // ── Brand & marketing (ckm: plugin) ──
    { id:'design', name:'CKM · Design', invoke:'design', icon:'🖌️', cat:'brand', tags:['design','branding','images','slides','ui'], description:'Logos (55 styles), corporate identity program (50 deliverables), HTML presentations, banners, icons and social photos.' },
    { id:'brand', name:'CKM · Brand', invoke:'brand', icon:'🏷️', cat:'brand', tags:['branding','marketing','writing'], description:'Brand voice, visual identity, messaging frameworks, asset management and brand consistency. For branded content and style guides.' },
    { id:'banner-design', name:'CKM · Banner Design', invoke:'banner-design', icon:'🪧', cat:'brand', tags:['images','branding','marketing'], description:'Banners for social, ads, web heroes and print. Multiple art directions with AI-generated visuals across 13+ styles.' },
    { id:'design-system', name:'CKM · Design System', invoke:'design-system', icon:'🧱', cat:'brand', tags:['tokens','components','slides','design'], description:'Three-layer design tokens (primitive→semantic→component), component specs and strategic slide generation.' },
    { id:'slides', name:'CKM · Slides', invoke:'slides', icon:'📊', cat:'brand', tags:['slides','design','writing'], description:'Strategic HTML presentations with Chart.js, design tokens, responsive layouts and copywriting formulas.' },
    { id:'ui-styling', name:'CKM · UI Styling', invoke:'ui-styling', icon:'🧩', cat:'brand', tags:['ui','components','frontend','web'], description:'Beautiful, accessible UIs with shadcn/ui (Radix + Tailwind), utility-first styling, dark mode and canvas-based visual designs.' },
    // ── Writing / output ──
    { id:'stop-slop', name:'Stop Slop', invoke:'stop-slop', icon:'🧹', cat:'writing', tags:['writing'], description:'Removes AI writing patterns from prose. Use when drafting, editing or reviewing text to eliminate predictable AI tells.' },
    { id:'output-skill', name:'Full Output Enforcement', invoke:'output-skill', icon:'📜', cat:'writing', tags:['writing'], description:'Overrides default LLM truncation. Bans placeholders, forces complete code generation and handles token-limit splits cleanly.' },
    // ── Token efficiency & delegation (caveman plugin) ──
    { id:'caveman', name:'Caveman', invoke:'/caveman', icon:'🪨', cat:'tokens', tags:['efficiency'], description:'Ultra-compressed mode — ~75% fewer tokens with full technical accuracy. Levels: lite, full, ultra, wenyan.' },
    { id:'cavecrew', name:'Cavecrew', invoke:'cavecrew', icon:'🦴', cat:'tokens', tags:['delegation','efficiency'], description:'Decision guide for delegating to compressed subagents (investigator/builder/reviewer) so the main thread eats ~60% fewer tokens.' },
    { id:'caveman-commit', name:'Caveman Commit', invoke:'/caveman-commit', icon:'✅', cat:'tokens', tags:['commit','efficiency'], description:'Ultra-compressed Conventional Commits messages. Subject ≤50 chars, body only when the why is not obvious.' },
    { id:'caveman-review', name:'Caveman Review', invoke:'/caveman-review', icon:'🔎', cat:'tokens', tags:['review','efficiency'], description:'One-line PR review comments — location, problem, fix. Severity-tagged, no throat-clearing.' },
    { id:'caveman-compress', name:'Caveman Compress', invoke:'/caveman-compress', icon:'🗜️', cat:'tokens', tags:['efficiency'], description:'Compress CLAUDE.md / memory files to caveman format to save input tokens. Keeps a human-readable .original.md backup.' },
    { id:'caveman-stats', name:'Caveman Stats', invoke:'/caveman-stats', icon:'📈', cat:'tokens', tags:['efficiency'], description:'Real token usage + estimated savings for the session, read straight from the Claude Code session log.' },
    { id:'caveman-help', name:'Caveman Help', invoke:'/caveman-help', icon:'❓', cat:'tokens', tags:['efficiency'], description:'Quick-reference card for all caveman modes, skills and commands. One-shot display, not a persistent mode.' },
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
          {
            id: 'd-4', date: '2026-06-11', title: 'Memory on HubStore + dependency-free export',
            context: 'Phase 2 needed project memory with an Obsidian-compatible export, but the hard rule forbids external runtime dependencies (no JSZip).',
            decision: 'Store one MemoryBranch per project in HubStore (1:1 via projectId, auto-created); roadmap/open-issues are markdown strings; sessions are immutable. Export Vault uses a hand-rolled dependency-free ZIP writer.',
            consequences: 'No third-party deps; valid zip verified with system unzip; schema is forward-compatible with future automated summarisation.',
          },
          {
            id: 'd-5', date: '2026-06-11', title: 'Phase 3 Part A — Supabase + Chairman proxy infra',
            context: 'The hub needed shared/persistent storage and a server-side path to Anthropic without ever exposing the API key, while keeping the zero-build, no-runtime-dependency rules.',
            decision: 'Add a SupabaseAdapter (PostgREST via fetch, no SDK) that implements the HubStore interface identically behind a config-selected factory; a localStorage→Supabase migration script; and Cloudflare Pages Functions (/api/chat streaming proxy + audit, /api/models) reading the Anthropic key only from a Cloudflare secret. Model map is single-source in model-config.js. Defaults stay on localStorage; Supabase is opt-in via config.js.',
            consequences: 'Infra-only (Chairman chat UI deferred to Part B); no client-side key; no new deps or build step; idempotent upsert migration; opt-in and reversible (flip storeAdapter back to local).',
          },
          {
            id: 'd-6', date: '2026-06-11', title: 'Phase 3 Part B — Chairman chat UI (read context, log decisions on tap)',
            context: 'Phase 3 is "single interface: the user speaks to the Chairman only". The chat UI had to load a project\'s memory/roadmap/skills as context and persist per project, on both storage adapters, while honouring the no-silent-writes rule for memory.',
            decision: 'Add a dedicated top-level Chairman view with a project selector. Each project keeps its own thread, persisted through HubStore.state (key `chairman:thread:<projectId>`), so it works identically on the localStorage and Supabase adapters. On send, the client posts {messages, projectId, context} to /api/chat and renders the streamed Anthropic SSE. Project memory (summary/architecture/roadmap/open-issues/skills/recent decisions+sessions) is assembled client-side and sent as context. Memory writes are never silent: when the Chairman states a line-start "Decided: …", a one-tap "Save decision to memory" button appears and writes an ADR to that project\'s branch.',
            consequences: 'Closes the Phase 3 definition of done (Chairman responds in project context, logs to audit_log server-side, reads context + writes memory on approval, works on mobile). No client-side API key (server reads it from a Cloudflare secret); no new runtime deps; no build step. Verified against a local SSE mock — live Anthropic calls await ANTHROPIC_API_KEY in Cloudflare.',
          },
        ],
        skillsUsed: ['atelier', 'impeccable', 'ui-ux-pro-max', 'stop-slop'],
        repositories: [
          { name: 'Aaron-1411/CC (monorepo)', url: 'https://github.com/Aaron-1411/CC', note: 'Source of truth + CI/CD for the hub and all projects.' },
          { name: 'Live workspace', url: 'https://aaron-projects-hub.pages.dev/workspace', note: 'Deployed Command Centre.' },
        ],
        roadmap: '## Roadmap\n\n- [x] Phase 0 — Tool Stack dashboard\n- [x] Phase 1 — Foundation: projects, dashboard, skills, prompts\n- [x] Phase 2 — Obsidian memory architecture (project branches)\n- [x] Phase A — Audit + HubStore data layer\n- [x] Phase 3A — Supabase adapter + Chairman proxy infra\n- [x] Phase 3B — Chairman chat UI (orchestration)\n- [ ] Phase 4 — Skills system (SKILL.md, arbitration)\n- [ ] Phase 5 — Council agents',
        openIssues: '## Open issues\n\n- Supabase is opt-in (config.js `storeAdapter`); default is still localStorage. Run `supabase/migrations/0001_init.sql` + `migrateHubToSupabase()` to go multi-device (see SETUP.md).\n- Chairman chat UI is live (dedicated view, per-project threads via HubStore.state). It needs `ANTHROPIC_API_KEY` set as a Cloudflare secret to talk to a real model; until then the UI surfaces a "Chairman unavailable" notice. Verified against a local SSE mock.\n- Daily token-spend / cost visibility (roadmap item) is still pending — surface it in the Tool Stack dashboard from the audit_log token totals in a later pass.\n- Tool connection status is manual — wire real health checks later (out of scope until scoped).\n- Focus banner + recent-activity event log still use legacy `ws:` keys (non-entity UI state); migrate to HubStore.state in a later pass.',
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
        {
          id: 's-3', date: '2026-06-11', title: 'Phase 1 — Personal Hub Foundation',
          summary: '## Phase 1\n\nMigrated projects, skills and prompts onto HubStore (full catalog, single source). Rebuilt the dashboard into five ordered sections — Active Projects, Current Priorities, Skills, Prompts, Workspace — with a project add/edit modal, autosaved notes, derived Recent Activity and JSON export/import.',
          tokensEstimate: 41000,
        },
        {
          id: 's-4', date: '2026-06-11', title: 'Phase 2 — Obsidian Memory Architecture',
          summary: '## Phase 2\n\nRebuilt Memory on HubStore: one MemoryBranch per project, an 8-tab branch view (markdown summary/architecture/roadmap/open-issues with preview, ADR decisions, skills multi-select, repository refs, immutable session summaries) and an **Export Vault** that writes an Obsidian-ready zip via a dependency-free ZIP writer — no JSZip. Validated the archive with system `unzip`.',
          tokensEstimate: 52000,
        },
        {
          id: 's-5', date: '2026-06-11', title: 'Phase 3 Part A — Supabase + Chairman proxy infra',
          summary: '## Phase 3 Part A (infrastructure)\n\nShipped the backend layer without touching the localStorage experience. Added: `supabase/migrations/0001_init.sql` (10 tables matching types.ts, updated_at triggers, indexes, permissive anon RLS); `model-config.js` single-source model/pricing map; `SupabaseAdapter.js` (PostgREST via fetch, cache-backed, full HubStore parity, init() hydration) chosen by `store-factory.js`; `migrate-to-supabase.js` (idempotent localStorage→Supabase upsert); Cloudflare Pages Functions `functions/api/chat.ts` (Anthropic streaming proxy, server-side token capture + audit_log write) and `functions/api/models.ts`; `config.js` (defaults to local) and `SETUP.md`. No client-side API key, no new runtime deps, no build step. Supabase + Chairman are opt-in and reversible. Chairman chat UI is deferred to Part B. Fresh-context subagent review passed (one fix: audit_log PK uuid→text for parity with the app text id).',
          tokensEstimate: 60000,
        },
        {
          id: 's-6', date: '2026-06-11', title: 'Phase 3 Part B — Chairman chat UI',
          summary: '## Phase 3 Part B (orchestration UI)\n\nBuilt the Chairman chat interface in `workspace.html` — the single interface that closes the Phase 3 definition of done. A dedicated top-level **Chairman** view with a project selector; each project keeps its own thread persisted through `HubStore.state` under `chairman:thread:<projectId>` (works on both the localStorage and Supabase adapters). On send the client posts `{messages, projectId, context}` to `/api/chat` and renders the streamed Anthropic SSE token-by-token (buffering across chunk boundaries, filtering `content_block_delta`). Project memory/roadmap/skills load as context. Memory writes are never silent: when the Chairman states a line-start "Decided: …" a one-tap **Save decision to memory** button appears and writes an ADR into the project branch. No client-side API key, no new runtime deps, no build step, mobile-first dark UI. Verified against a local SSE mock — live Anthropic calls await `ANTHROPIC_API_KEY` in Cloudflare.',
          tokensEstimate: 48000,
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

  // Bumped when the seed catalog grows so existing partial stores get the new
  // items. Phase A shipped an implicit v1 (4/6/4 subset); Phase 1 = full catalog.
  var SEED_VERSION = 2;

  function readWs(key) {
    try { var raw = global.localStorage.getItem('ws:' + key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }

  /** Add any catalog items missing from a repo by id (never overwrites). */
  function upsertMissing(repo, items) {
    var have = {};
    repo.getAll().forEach(function (x) { if (x && x.id != null) have[x.id] = true; });
    items.forEach(function (it) { if (!have[it.id]) repo.save(it); });
  }

  /**
   * One-time import of legacy `ws:`-prefixed data into HubStore. This is the
   * store/migration layer (not UI), so reading localStorage here is allowed.
   */
  function importLegacyWs(store) {
    var PMAP = { med: 'medium', medium: 'medium', low: 'low', high: 'high', critical: 'critical' };
    var po = readWs('projects') || {};
    Object.keys(po).forEach(function (id) {
      var p = store.projects.get(id); if (!p) return; var o = po[id] || {};
      if (o.status) p.status = o.status;
      if (o.priority) p.priority = PMAP[o.priority] || o.priority;
      if (o.updated) p.updatedAt = o.updated;
      store.projects.save(p);
    });
    (readWs('customSkills') || []).forEach(function (s) {
      if (!store.skills.get(s.id)) {
        store.skills.save({ id: s.id, name: s.name, description: s.desc || s.description || '', tags: s.tags || [], sourceLink: s.source || s.sourceLink || '' });
      }
    });
    (readWs('customPrompts') || []).forEach(function (p) {
      if (!store.prompts.get(p.id)) {
        store.prompts.save({ id: p.id, title: p.title, body: p.body || '', category: String(p.cat || p.category || 'development').toLowerCase(), favourite: !!p.fav, createdAt: TS, updatedAt: TS });
      }
    });
    var pstate = readWs('promptState') || {};
    Object.keys(pstate).forEach(function (id) {
      var p = store.prompts.get(id);
      if (p && pstate[id] && 'fav' in pstate[id]) { p.favourite = !!pstate[id].fav; store.prompts.save(p); }
    });
  }

  /**
   * Seed + migrate on load. Seeds the full catalog for new visitors, then once
   * per SEED_VERSION bump: upserts any missing catalog items into existing
   * (partial) stores and imports legacy ws: data. Idempotent; preserves edits.
   * @param {Object} [store] defaults to global.HubStore
   * @returns {boolean}
   */
  function migrateHub(store) {
    store = store || global.HubStore;
    if (!store || typeof store.isEmpty !== 'function') { return false; }
    runSeed(store); // full catalog if the store is empty (new visitor)
    var ver = Number(store.state.get('seedVersion', 0)) || 0;
    if (ver < SEED_VERSION) {
      upsertMissing(store.projects, PROJECTS);
      upsertMissing(store.prompts, PROMPTS);
      upsertMissing(store.skills, SKILLS);
      upsertMissing(store.tools, TOOLS);
      upsertMissing(store.memory, MEMORY);
      importLegacyWs(store);
      store.state.set('seedVersion', SEED_VERSION);
    }
    return true;
  }

  global.HUB_SEED = HUB_SEED;
  global.runSeed = runSeed;
  global.migrateHub = migrateHub;
  if (typeof module !== 'undefined' && module.exports) { module.exports = { runSeed: runSeed, migrateHub: migrateHub, HUB_SEED: HUB_SEED, SEED_VERSION: SEED_VERSION }; }
})(typeof window !== 'undefined' ? window : this);
