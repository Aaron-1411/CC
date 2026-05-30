# The Rules — Project Setup Standard

Every project Aaron ships follows this setup. When a new project is added, apply all steps below.

---

## 1. Add to the CC monorepo

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

## 2. Create a Cloudflare Pages or Workers project

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

## 3. Add a deploy job to `.github/workflows/deploy.yml`

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

## 4. Add a card to the hub dashboard

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

## 5. Update memory

Update `~/.claude/projects/-Users-aaronmanu/memory/project_cc_monorepo.md` with:
- Project name, folder, live URL, stack, deploy type in the personal projects table
- Or client name, URL, notes in the client projects table

---

## 6. Commit and push

```bash
git add .
git commit -m "feat: add <project-name> — apply the rules"
git push origin master
```

CI runs automatically. Everything is live within ~2 minutes.

---

## SPA routing (Cloudflare Pages)

For any React/Vite SPA, add a `_redirects` file in the `public/` folder:
```
/* /index.html 200
```

This ensures client-side routing works on direct URL loads.

---

## Never

- Never manually deploy via the Cloudflare dashboard — the pipeline does it
- Never touch client project infra (Ez Tuition, Plus 15, Fulcrum Solutions, etc.)
- Never commit `.env` files or API keys
- Never add a project as a git submodule — remove `.git` from any nested repos
