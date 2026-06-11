# The Rules

How Claude works with Aaron on every project. Two parts:

- **Operating rules** — the always-on collaboration rules. These are mirrored live on the hub at [`/resources` → House rules](https://aaron-projects-hub.pages.dev/resources#rules).
- **Project Setup Standard** — the step-by-step every new project follows (the detail behind operating rule 4).

Whenever an operating rule changes, it's updated **here and on the Resources page**, so the page always shows what's currently on.

---

## Operating rules

### 1. Do the work, don't narrate — _Always_
Terse output, no step-by-step narration. Surface only blockers, forks worth a decision, and what's now live.

### 2. Honest hosting signposting — _Always_
Cloudflare can't run live backends (trading bots, Flask/FastAPI, anything with a server process or secrets). Every app on the hub is badged **Live** / **Visual demo** / **Self-host**. When a deploy is blocked, host it locally and hand over the link rather than shipping something that pretends to work.

### 3. Token efficiency — _Always_
Auto-compact near ~50% context, delegate broad search to subagents, surgical file reads, lean tool use. Keep a running TL;DR via chapters.

### 4. Project setup standard — _Per project_
New project → add to the CC monorepo → Cloudflare Pages/Workers project → deploy job in the workflow → card on the hub → update memory → commit. Full steps in the [Project Setup Standard](#project-setup-standard) below.

### 5. Back up on command — _Trigger_
When Aaron says **"back up"**, create an immutable GitHub restore point — an annotated tag via the `gh` API (never a force-push), named `<project>-vN`.

### 6. Client work is hands-off — _Always_
Never touch Ez Tuition, Plus 15, the Plus 15 Case Study, Fulcrum Solutions, or any client infrastructure unless Aaron explicitly asks.

### 7. This list stays live — _Meta_
Whenever an operating rule changes, it's updated here **and** on the Resources page — so the page always shows what's currently on.

---

## Project Setup Standard

Every project Aaron ships follows this setup. When a new project is added, apply all steps below.

---

### 1. Add to the CC monorepo

Clone or sync the project into a folder at the root of this repo:

```
Aaron-1411/CC/
└── project-name/   ← project lives here
```

- Lovable projects: clone from `Aaron-1411/<repo>` into the matching folder
- New projects: create the folder and scaffold directly here
- Remove any `.git` directory inside the project folder (avoid embedded repos)

```bash
git rm --cached -f project-name   # if it was accidentally added as submodule
rm -rf project-name/.git
git add project-name/
```

---

### 2. Create a Cloudflare Pages or Workers project

**Pages (static / Vite / Next.js):**
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/a1a1276a1a278339d95c187e0bf6de47/pages/projects" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"project-name-app","production_branch":"main"}'
```

**Workers (TanStack Start):** configured via `wrangler.json` inside the project folder. The `wrangler.json` must include:
```json
{ "name": "project-name-app", "compatibility_date": "2024-01-01" }
```

Cloudflare account ID: `a1a1276a1a278339d95c187e0bf6de47`  
Workers subdomain: `mraaronmanu`

---

### 3. Add a deploy job to `.github/workflows/deploy.yml`

Pick the right pattern for the project type:

**Static HTML (no build step):**
```yaml
deploy-project-name:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: a1a1276a1a278339d95c187e0bf6de47
        command: pages deploy project-name --project-name=project-name-app --branch=main
```

**Vite / React SPA:**
```yaml
deploy-project-name:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: cd project-name && bun install && bun run build
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: a1a1276a1a278339d95c187e0bf6de47
        command: pages deploy project-name/dist --project-name=project-name-app --branch=main
```

**TanStack Start (CF Workers):**
```yaml
deploy-project-name:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: cd project-name && bun install && bun run build && rm -rf .wrangler
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: a1a1276a1a278339d95c187e0bf6de47
        workingDirectory: project-name/dist/server
        command: deploy
```

**Next.js static export:**
```yaml
deploy-project-name:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: cd project-name && bun install && bun run build
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: a1a1276a1a278339d95c187e0bf6de47
        command: pages deploy project-name/out --project-name=project-name-app --branch=main
```

---

### 4. Add a card to the hub dashboard

File: `dashboard/index.html`

- **Personal projects** → card in the Live Apps section under the correct group pill (`Lovable` or `Claude Code`)
- **Client projects** → row in the Client Work list (link to live URL, never deploy their infra)

Card format (personal):
```html
<div class="card lovable" onclick="window.open('https://project-name-app.pages.dev','_blank')" role="link" tabindex="0">
  <div class="card-head">
    <span class="card-name">emoji Project Name</span>
    <span class="card-live"><span class="live-dot"></span>Live</span>
  </div>
  <p class="card-desc">One sentence description of what it does.</p>
  <div class="card-foot">
    <div class="tags"><span class="tag">React</span><span class="tag">CF Pages</span></div>
    <div class="card-btns">
      <a class="btn-sq" href="https://github.com/Aaron-1411/repo-name" target="_blank" onclick="event.stopPropagation()" title="GitHub">
        <!-- github svg -->
      </a>
      <a class="btn-open" href="https://project-name-app.pages.dev" target="_blank" onclick="event.stopPropagation()">
        Open <!-- arrow svg -->
      </a>
    </div>
  </div>
</div>
```

Client row format:
```html
<a class="client-row" href="https://client-site.com" target="_blank">
  <span class="client-name">emoji Client Name</span>
  <span class="client-desc">One sentence description.</span>
  <span class="client-action">client-site.com <!-- arrow svg --></span>
</a>
```

Update the hero stats counter and section count when adding projects.

---

### 5. Update memory

Update `~/.claude/projects/-Users-aaronmanu/memory/project_cc_monorepo.md` with:
- Project name, folder, live URL, stack, deploy type in the personal projects table
- Or client name, URL, notes in the client projects table

---

### 6. Commit and push

```bash
git add .
git commit -m "feat: add <project-name> — apply the rules"
git push origin master
```

CI runs automatically. Everything is live within ~2 minutes.

---

### SPA routing (Cloudflare Pages)

For any React/Vite SPA, add a `_redirects` file in the `public/` folder:
```
/* /index.html 200
```

This ensures client-side routing works on direct URL loads.

---

### Never

- Never manually deploy via the Cloudflare dashboard — the pipeline does it
- Never touch client project infra (Ez Tuition, Plus 15, Fulcrum Solutions, etc.)
- Never commit `.env` files or API keys
- Never add a project as a git submodule — remove `.git` from any nested repos
