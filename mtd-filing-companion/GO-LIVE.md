# MTD Filing Companion — Go-Live Guide

Step-by-step to take this app from the current **labelled UI preview** to a **live
authenticated app**, then to **real HMRC filing**. Two external gates, in order.
Only you can pass them (they need accounts/credentials). Everything on the code
side is already wired and waiting.

- **Hub card:** https://aaron-projects-hub.pages.dev (Finance group, badged "Visual demo")
- **Direct app:** https://mtd-filing-companion-app.pages.dev
- **Repo folder:** `Aaron-1411/CC` → `mtd-filing-companion/`

---

## How the self-healing deploy works

The CI build in `.github/workflows/deploy.yml` (job `deploy-mtd-filing-companion`)
checks one thing: is the GitHub secret **`MTD_SUPABASE_URL`** set?

- **Empty** → builds with `VITE_PREVIEW=1` → ships the honest UI preview (live
  actions disabled behind a "Preview · UI demo" banner). *(current state)*
- **Set** → builds the live authenticated app. **No code change needed.**

So **Gate 1 (Supabase) alone flips demo → live login.** Gate 2 (HMRC) makes the
filing real. Do them in that order and you see progress after each.

---

## GATE 1 — Supabase (flips the app live)

### 1. Create the project
supabase.com → **New project**. Region near you (London / eu-west). Set + save a
DB password. Wait ~2 min for provisioning.

### 2. Run the one migration
Project → **SQL Editor → New query** → paste the entire contents of
`supabase/migrations/0001_hmrc_tokens.sql` (also reproduced at the bottom of this
file) → **Run**. That is the only migration. It creates the `hmrc_tokens` table
with RLS deny-all (service-role access only).

### 3. Collect 4 values — Settings → API

| Supabase field | GitHub secret name |
|---|---|
| Project URL | `MTD_SUPABASE_URL` |
| `anon` / publishable key | `MTD_SUPABASE_ANON_KEY` |
| `service_role` key (secret) | `MTD_SUPABASE_SERVICE_ROLE_KEY` |
| JWT Secret (Settings → API → JWT Settings / JWT Keys) | `MTD_SUPABASE_JWT_SECRET` |

### 4. Generate the token-encryption key
Run locally, copy the output:
```
openssl rand -base64 32
```
→ goes into `MTD_TOKEN_ENCRYPTION_KEY`.

### 5. Set the 5 GitHub secrets on `Aaron-1411/CC`
Web UI: **Settings → Secrets and variables → Actions → New repository secret**.
Or CLI (it prompts for each value, so the secret never lands in a chat log):
```
gh secret set MTD_SUPABASE_URL --repo Aaron-1411/CC
gh secret set MTD_SUPABASE_ANON_KEY --repo Aaron-1411/CC
gh secret set MTD_SUPABASE_SERVICE_ROLE_KEY --repo Aaron-1411/CC
gh secret set MTD_SUPABASE_JWT_SECRET --repo Aaron-1411/CC
gh secret set MTD_TOKEN_ENCRYPTION_KEY --repo Aaron-1411/CC
```

### 6. Enable email login
**Authentication → Providers → Email** (the app uses passwordless magic-link —
no passwords stored). Optionally add your email under **Authentication → Users**.

### 7. Redeploy
Ping Claude to trigger + verify the deploy, or push any commit to `master`. The
build sees `MTD_SUPABASE_URL` is non-empty and ships the live authenticated app.
✅ The hub link is now a real login. The hub badge then flips amber → green "Live".

---

## GATE 2 — HMRC Developer Hub (makes filing real)

1. **Register** at https://developer.service.hmrc.gov.uk with a **Government
   Gateway** login (create one if needed). *(only-you gate)*
2. **Create a sandbox application.**
3. **Subscribe** it to "Test Fraud Prevention Headers API" (already wired in
   Phase 0a), plus the Self Assessment / MTD-ITSA APIs when you move to filing.
4. **Set the redirect URI** on the HMRC app to **exactly**:
   ```
   https://mtd-filing-companion-app.pages.dev/api/hmrc/callback
   ```
   (The deploy job pins `HMRC_REDIRECT_URI` to this — it must byte-match.)
5. **Copy the client ID/secret** into two more GitHub secrets:
   ```
   gh secret set MTD_HMRC_CLIENT_ID --repo Aaron-1411/CC
   gh secret set MTD_HMRC_CLIENT_SECRET --repo Aaron-1411/CC
   ```
6. **Redeploy.** The job PATCHes these into Cloudflare env vars; the `/api/hmrc/*`
   routes go from "not_configured" to a live sandbox OAuth round-trip
   (sign in → Connect HMRC → callback → ping).

---

## Full GitHub-secret reference

| Secret | Source | Gate |
|---|---|---|
| `MTD_SUPABASE_URL` | Supabase Project URL | 1 (trigger) |
| `MTD_SUPABASE_ANON_KEY` | Supabase anon/publishable key | 1 |
| `MTD_SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | 1 |
| `MTD_SUPABASE_JWT_SECRET` | Supabase JWT secret | 1 |
| `MTD_TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` | 1 |
| `MTD_HMRC_CLIENT_ID` | HMRC sandbox app | 2 |
| `MTD_HMRC_CLIENT_SECRET` | HMRC sandbox app | 2 |

---

## Who does what

- **Only you:** create the Supabase project, run the migration via your login,
  register on HMRC with Government Gateway, and place the secret values.
- **Claude, on your signal:** print the migration SQL, trigger the redeploy,
  watch the CI run, verify the promotion end-to-end, flip the hub badge → "Live".

Fastest win: **Gate 1 only** (~10 min) gets you a real logged-in app on the hub.

---

## Migration SQL (`supabase/migrations/0001_hmrc_tokens.sql`)

```sql
-- HMRC OAuth token storage — one row per app user.
--
-- The two token columns hold ciphertext ONLY. Tokens are encrypted at the
-- application layer (AES-256-GCM, see functions/_lib/tokenCrypto.ts) BEFORE they
-- reach this table, and the encryption key lives only in Cloudflare env secrets
-- — never in Postgres. So even a full database compromise (including a leaked
-- service-role key that can read these rows) yields ciphertext, not usable HMRC
-- tokens. This is decision D2: app-layer encryption, because RLS alone is not
-- sufficient.
--
-- Access is service-role-only. RLS is enabled with NO policies, so the `anon`
-- and `authenticated` roles are denied all access. The Cloudflare Pages Function
-- reaches this table with the service-role key (which bypasses RLS) — never a
-- user session.

create table if not exists public.hmrc_tokens (
  user_id                  uuid    primary key references auth.users (id) on delete cascade,
  access_token_enc         text    not null,
  refresh_token_enc        text    not null,
  access_token_expires_at  bigint  not null,
  refresh_token_expires_at bigint  not null,
  scope                    text    not null default '',
  updated_at               bigint  not null
);

alter table public.hmrc_tokens enable row level security;

-- No policies are created on purpose. With RLS enabled and zero policies, the
-- anon and authenticated roles can do nothing. The server's service-role key
-- bypasses RLS and is the only intended accessor (per D2). The on-delete-cascade
-- on the auth.users FK also gives us free GDPR cleanup when a user is deleted.

comment on table public.hmrc_tokens is
  'Encrypted HMRC OAuth tokens, one row per user. App-layer AES-256-GCM (key in CF secrets, not here). Service-role access only — RLS deny-all.';
```
