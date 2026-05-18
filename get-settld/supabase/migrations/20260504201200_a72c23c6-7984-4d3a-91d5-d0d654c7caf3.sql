create table if not exists public.crime_cache (
  geo_key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.crime_cache enable row level security;
create policy "public read crime_cache" on public.crime_cache for select using (true);

create table if not exists public.transport_cache (
  geo_key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.transport_cache enable row level security;
create policy "public read transport_cache" on public.transport_cache for select using (true);