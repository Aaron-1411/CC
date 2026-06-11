# Personal Hub — Setup (Phase 3)

The hub runs with **zero build step**. By default it uses browser `localStorage`
and no backend, so it works the moment you open `workspace.html`. This guide turns
on the two optional Phase 3 services:

1. **Supabase** — shared/persistent storage (instead of per-browser localStorage).
2. **The Chairman API proxy** — a Cloudflare Pages Function that talks to Anthropic.

Both are off until you complete the steps below. Nothing here changes the
localStorage experience, and every step is reversible.

---

## 0. Prerequisites

- A Cloudflare Pages project deploying `dashboard/` (already wired in CI).
- A Supabase project (free tier is fine) — only needed for steps 1–4.
- An Anthropic API key — only needed for the Chairman (steps 5–6).

---

## 1. Create the Supabase schema

1. Create a Supabase project at <https://supabase.com>.
2. Open **SQL Editor → New query**.
3. Paste the entire contents of `supabase/migrations/0001_init.sql` and run it.
   This creates all 10 tables (projects, prompts, skills, tools, memory_branches,
   decisions, session_summaries, repo_refs, audit_log, workspace_notes), the
   `updated_at` triggers, indexes, and a permissive `anon_all` RLS policy.

> **Security note:** the `anon_all` policy lets the public anon key read/write
> every table. That is intentional for a single-builder hub with no auth yet —
> auth/RLS-by-user arrives in Phase 8. Do not put third-party data in here before then.

---

## 2. Point the hub at Supabase

Edit `config.js`:

```js
window.HUB_CONFIG = {
  storeAdapter: 'supabase',                 // was 'local'
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co', // Project URL
    anonKey: 'eyJ...',                        // anon (public) key — safe to commit
  },
  chatApi: '/api/chat',
};
```

The anon key is **public by design** (protected by RLS) and is safe to commit.
The Anthropic key is **never** here — it lives only as a Cloudflare secret (step 5).

---

## 3. Migrate your existing localStorage data (optional)

If you have been using the hub on localStorage and want to bring that data across:

1. Keep `storeAdapter: 'local'` for now (so the migration reads localStorage).
2. Open the hub, then in the browser console run:

   ```js
   await migrateHubToSupabase({
     url: 'https://YOUR-PROJECT.supabase.co',
     anonKey: 'eyJ...'
   })
   ```

   (`migrate-to-supabase.js` is loaded with the app. With no args it reads
   `window.HUB_CONFIG.supabase`.) It is **idempotent** — every row is upserted by
   id, so re-running overwrites rather than duplicating.

3. Now set `storeAdapter: 'supabase'` (step 2) and reload.

---

## 4. Verify

Reload the hub and check the console:

- `[HubStore] using Supabase adapter` — the adapter is active.
- Your projects/skills/prompts render as before (now served from Supabase).

To **roll back** at any time: set `storeAdapter` back to `'local'` and reload.
Your localStorage data is untouched.

---

## 5. Cloudflare secrets for the Chairman

The Chairman proxy (`functions/api/chat.ts`) reads these from the Pages
environment. Set them in **Cloudflare → Pages → your project → Settings →
Environment variables** (and/or via `wrangler`):

| Variable             | Required | Purpose                                            |
| -------------------- | -------- | -------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | yes      | Server-side Anthropic key. **Never** sent to client.|
| `SUPABASE_URL`       | optional | Enables server-side audit_log writes.              |
| `SUPABASE_ANON_KEY`  | optional | Enables server-side audit_log writes.              |

Also ensure the Pages project has a recent **`compatibility_date`** (in
`wrangler.toml` or the dashboard) so the Functions runtime supports streaming.

---

## 6. Test the proxy

After deploying, confirm the endpoints respond:

```bash
# Model config (no key needed):
curl https://YOUR-HUB.pages.dev/api/models

# A minimal Chairman call (streams SSE):
curl -N https://YOUR-HUB.pages.dev/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

`/api/models` returns the model→role map. `/api/chat` streams the reply and writes
an `audit_log` row (if the Supabase secrets are set). The Chairman **chat UI**
itself is Phase 3 Part B — these endpoints are the infrastructure it will use.

---

## Reference

- Model/pricing map: `model-config.js` (single source — `/api/models` serves it).
- Storage adapters: `HubStore.js` (localStorage) / `SupabaseAdapter.js` (Supabase),
  chosen by `store-factory.js` from `config.js`.
- Schema: `supabase/migrations/0001_init.sql`.
