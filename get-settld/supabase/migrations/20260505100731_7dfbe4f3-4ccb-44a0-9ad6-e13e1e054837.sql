
-- Scenario collaborators (co-buyer mode)
create table public.scenario_collaborators (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.saved_scenarios(id) on delete cascade,
  owner_id uuid not null,
  invited_email text not null,
  collaborator_user_id uuid,
  role text not null default 'viewer' check (role in ('viewer','editor')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (scenario_id, invited_email)
);
create index idx_collab_scenario on public.scenario_collaborators(scenario_id);
create index idx_collab_user on public.scenario_collaborators(collaborator_user_id);
create index idx_collab_email on public.scenario_collaborators(invited_email);

alter table public.scenario_collaborators enable row level security;

create policy "Owner manages collaborators"
  on public.scenario_collaborators for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Invitee views own invites"
  on public.scenario_collaborators for select
  to authenticated
  using (
    auth.uid() = collaborator_user_id
    or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

create policy "Invitee accepts own invite"
  on public.scenario_collaborators for update
  to authenticated
  using (
    auth.uid() = collaborator_user_id
    or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

-- Extend saved_scenarios visibility to collaborators
create policy "Collaborators view shared scenarios"
  on public.saved_scenarios for select
  to authenticated
  using (
    exists (
      select 1 from public.scenario_collaborators c
      where c.scenario_id = saved_scenarios.id
        and (
          c.collaborator_user_id = auth.uid()
          or lower(c.invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
        )
    )
  );

create policy "Editors update shared scenarios"
  on public.saved_scenarios for update
  to authenticated
  using (
    exists (
      select 1 from public.scenario_collaborators c
      where c.scenario_id = saved_scenarios.id
        and c.role = 'editor'
        and (
          c.collaborator_user_id = auth.uid()
          or lower(c.invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
        )
    )
  );

-- MIP readiness assessments
create table public.mip_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_mip_user on public.mip_assessments(user_id, created_at desc);
alter table public.mip_assessments enable row level security;

create policy "Users manage own MIP" on public.mip_assessments for all
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Price alerts
create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  postcode text,
  property_url text,
  threshold_pct numeric not null default 5,
  last_value numeric,
  last_checked_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_alerts_user on public.price_alerts(user_id);
alter table public.price_alerts enable row level security;
create policy "Users manage own alerts" on public.price_alerts for all
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Verdict snapshots (verdict-over-time)
create table public.verdict_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_key text not null,
  label text,
  verdict text not null,
  score numeric not null,
  inputs jsonb,
  reasons jsonb,
  created_at timestamptz not null default now()
);
create index idx_snap_user_key on public.verdict_snapshots(user_id, property_key, created_at desc);
alter table public.verdict_snapshots enable row level security;
create policy "Users manage own snapshots" on public.verdict_snapshots for all
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
