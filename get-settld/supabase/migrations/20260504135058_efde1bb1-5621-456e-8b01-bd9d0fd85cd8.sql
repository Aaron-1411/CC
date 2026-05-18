
create table if not exists public.postcode_cache (
  postcode text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

create table if not exists public.comparables_cache (
  postcode_area text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.postcode_cache enable row level security;
alter table public.comparables_cache enable row level security;

create policy "public read postcode_cache"
  on public.postcode_cache for select
  using (true);

create policy "public read comparables_cache"
  on public.comparables_cache for select
  using (true);
