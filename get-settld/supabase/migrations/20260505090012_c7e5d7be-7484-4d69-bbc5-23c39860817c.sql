
-- Roles enum + table (separate from profiles to prevent privilege escalation)
create type public.app_role as enum ('admin', 'pro', 'free');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'free',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Auto-create profile + free role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'free');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Saved properties
create table public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null default 'manual',
  address text not null,
  area text,
  price numeric,
  beds numeric,
  baths numeric,
  sqft numeric,
  url text,
  image_url text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_properties enable row level security;

create policy "Users view own properties" on public.saved_properties
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own properties" on public.saved_properties
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own properties" on public.saved_properties
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own properties" on public.saved_properties
  for delete to authenticated using (auth.uid() = user_id);

create trigger update_saved_properties_updated_at before update on public.saved_properties
  for each row execute function public.update_updated_at_column();

create index idx_saved_properties_user on public.saved_properties(user_id, created_at desc);

-- Saved scenarios
create table public.saved_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_scenarios enable row level security;

create policy "Users view own scenarios" on public.saved_scenarios
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own scenarios" on public.saved_scenarios
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own scenarios" on public.saved_scenarios
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own scenarios" on public.saved_scenarios
  for delete to authenticated using (auth.uid() = user_id);

create trigger update_saved_scenarios_updated_at before update on public.saved_scenarios
  for each row execute function public.update_updated_at_column();

create index idx_saved_scenarios_user on public.saved_scenarios(user_id, created_at desc);
