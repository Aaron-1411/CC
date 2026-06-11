-- Personal Hub — Phase 3 initial schema.
-- Mirrors dashboard/types.ts. Run once in the Supabase SQL editor (or via the
-- Supabase CLI). Idempotent: safe to re-run (IF NOT EXISTS / OR REPLACE).
--
-- SECURITY NOTE: there is no auth yet (auth is a later phase). The policies
-- below grant the public `anon` role full access, because this is a
-- single-user personal hub reached only with the anon key. Anyone who has the
-- anon key (it ships in the committed config.js) can read/write these tables.
-- Keep the project URL private and do not store secrets here until auth lands.

-- ── shared updated_at trigger ────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── projects ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id              text primary key,
  name            text not null,
  description     text not null default '',
  status          text not null default 'idea'
                    check (status in ('idea','planning','building','testing','live','archived')),
  priority        text not null default 'medium'
                    check (priority in ('low','medium','high','critical')),
  quick_launch_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── prompts ──────────────────────────────────────────────────────────────────
create table if not exists prompts (
  id          text primary key,
  title       text not null,
  body        text not null default '',
  category    text not null default 'development'
                check (category in ('development','research','marketing','content')),
  favourite   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── skills ───────────────────────────────────────────────────────────────────
create table if not exists skills (
  id          text primary key,
  name        text not null,
  description text not null default '',
  tags        text[] not null default '{}',
  source_link text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── tools ────────────────────────────────────────────────────────────────────
create table if not exists tools (
  id            text primary key,
  name          text not null,
  connected     boolean not null default false,
  description   text not null default '',
  purpose       text not null default '',
  future_agents text[] not null default '{}',
  capabilities  text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── memory_branches (1:1 with projects; scalar markdown sections live here) ───
create table if not exists memory_branches (
  id          text primary key,
  project_id  text not null unique,
  summary     text not null default '',
  architecture text not null default '',
  roadmap     text not null default '',
  open_issues text not null default '',
  skills_used text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── decisions (ADR records, child of a memory branch) ────────────────────────
create table if not exists decisions (
  id               text primary key,
  memory_branch_id text not null references memory_branches(id) on delete cascade,
  date             date,
  title            text not null,
  context          text not null default '',
  decision         text not null default '',
  consequences     text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists decisions_branch_idx on decisions(memory_branch_id);

-- ── session_summaries (immutable records, child of a memory branch) ──────────
create table if not exists session_summaries (
  id               text primary key,
  memory_branch_id text not null references memory_branches(id) on delete cascade,
  date             date,
  title            text not null,
  summary          text not null default '',
  tokens_estimate  integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists session_summaries_branch_idx on session_summaries(memory_branch_id);

-- ── repo_refs (repository references, child of a memory branch) ──────────────
create table if not exists repo_refs (
  id               text primary key,
  memory_branch_id text not null references memory_branches(id) on delete cascade,
  name             text not null default '',
  url              text not null default '',
  note             text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists repo_refs_branch_idx on repo_refs(memory_branch_id);

-- ── audit_log (live from Phase 3; every agent/API action) ────────────────────
create table if not exists audit_log (
  id                  uuid primary key default gen_random_uuid(),
  timestamp           timestamptz not null default now(),
  agent_id            text not null,
  action              text not null default '',
  project_id          text,
  tokens_used         integer,
  approved            boolean,
  authorisation_level text not null default 'advisory'
                        check (authorisation_level in ('advisory','approval','autonomous')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists audit_log_ts_idx on audit_log(timestamp);
create index if not exists audit_log_project_idx on audit_log(project_id);

-- ── workspace_notes (key/value app state: workspace:notes, workspace:project) ─
create table if not exists workspace_notes (
  key        text primary key,
  value      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── updated_at triggers on every table ───────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'projects','prompts','skills','tools','memory_branches','decisions',
    'session_summaries','repo_refs','audit_log','workspace_notes'
  ] loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- ── Row Level Security — permissive for anon until auth lands (see note above) ─
do $$
declare t text;
begin
  foreach t in array array[
    'projects','prompts','skills','tools','memory_branches','decisions',
    'session_summaries','repo_refs','audit_log','workspace_notes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists anon_all on %I', t);
    execute format($p$create policy anon_all on %I for all to anon using (true) with check (true)$p$, t);
  end loop;
end $$;
