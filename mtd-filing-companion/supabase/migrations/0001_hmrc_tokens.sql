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
