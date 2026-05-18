
-- Verdict Receipts
create table public.verdict_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  slug text not null unique,
  property_ref text,
  verdict jsonb not null default '{}'::jsonb,
  score numeric,
  band text,
  signature text not null,
  created_at timestamptz not null default now()
);
create index idx_verdict_receipts_user on public.verdict_receipts(user_id);
alter table public.verdict_receipts enable row level security;

create policy "Anyone can read verdict receipts by slug"
  on public.verdict_receipts for select using (true);
create policy "Users insert own receipts"
  on public.verdict_receipts for insert with check (auth.uid() = user_id);
create policy "Users delete own receipts"
  on public.verdict_receipts for delete using (auth.uid() = user_id);

-- Outcomes
create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_ref text,
  predicted_price numeric,
  actual_price numeric,
  predicted_score numeric,
  satisfaction int check (satisfaction between 1 and 5),
  regret_notes text,
  months_after_completion int,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_outcomes_user on public.outcomes(user_id);
alter table public.outcomes enable row level security;

create policy "Users view own outcomes" on public.outcomes for select using (auth.uid() = user_id);
create policy "Users insert own outcomes" on public.outcomes for insert with check (auth.uid() = user_id);
create policy "Users update own outcomes" on public.outcomes for update using (auth.uid() = user_id);
create policy "Users delete own outcomes" on public.outcomes for delete using (auth.uid() = user_id);

create trigger update_outcomes_updated_at before update on public.outcomes
  for each row execute function public.update_updated_at_column();

create or replace function public.public_outcome_accuracy()
returns table(sample_size bigint, avg_price_error_pct numeric, avg_satisfaction numeric, within_5pct bigint, within_10pct bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*)::bigint,
    round(avg(abs(actual_price - predicted_price) / nullif(predicted_price,0) * 100)::numeric, 1),
    round(avg(satisfaction)::numeric, 2),
    count(*) filter (where abs(actual_price - predicted_price) / nullif(predicted_price,0) <= 0.05)::bigint,
    count(*) filter (where abs(actual_price - predicted_price) / nullif(predicted_price,0) <= 0.10)::bigint
  from public.outcomes
  where actual_price is not null and predicted_price is not null;
$$;

-- Broker Invites
create table public.broker_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code text not null unique,
  broker_email text,
  broker_name text,
  receipt_id uuid references public.verdict_receipts(id) on delete cascade,
  message text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_broker_invites_user on public.broker_invites(user_id);
alter table public.broker_invites enable row level security;

create policy "Users view own invites" on public.broker_invites for select using (auth.uid() = user_id);
create policy "Users insert own invites" on public.broker_invites for insert with check (auth.uid() = user_id);
create policy "Users delete own invites" on public.broker_invites for delete using (auth.uid() = user_id);

create or replace function public.lookup_broker_invite(p_code text)
returns table(id uuid, broker_name text, message text, receipt_id uuid, created_at timestamptz, accepted_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select bi.id, bi.broker_name, bi.message, bi.receipt_id, bi.created_at, bi.accepted_at
  from public.broker_invites bi
  where bi.code = p_code
  limit 1;
end; $$;

create or replace function public.accept_broker_invite(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.broker_invites set accepted_at = now() where code = p_code and accepted_at is null;
  return found;
end; $$;
