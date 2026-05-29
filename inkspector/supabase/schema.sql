-- Inkspector Database Schema
-- Run this in the Supabase SQL editor after creating your project

-- Bookings table
create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Contact
  name            text not null,
  email           text not null,
  phone           text,
  instagram       text,

  -- Design
  tattoo_style    text not null,
  tattoo_style_notes text,
  colour_preference text
                  check (colour_preference in ('Black & grey only', 'Full colour', 'Colour with black & grey shading', 'Not sure yet')),
  complexity      text
                  check (complexity in ('simple', 'moderate', 'detailed')),
  description     text not null,
  reference_images text[] not null default '{}',
  is_cover_up     boolean not null default false,
  cover_up_darkness text
                  check (cover_up_darkness in ('light', 'medium', 'dark', 'scarred')),
  cover_up_notes  text,

  -- Placement
  body_part       text not null,
  placement_detail text,
  size_category   text not null,
  dimensions      text,
  size_notes      text,

  -- Session
  is_first_tattoo boolean not null default false,
  preferred_date  date,
  time_preference text,
  budget_range    text,

  -- Extra
  additional_notes text,

  -- Admin
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'waitlist')),
  admin_notes     text
);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at_column();

-- Portfolio images table
create table if not exists portfolio_images (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  url             text not null,
  style_tag       text,
  body_part_tag   text,
  caption         text,
  display_order   int not null default 0,
  featured        boolean not null default false
);

-- RLS: bookings
alter table bookings enable row level security;

-- Anyone can insert (public booking form)
create policy "public can insert bookings"
  on bookings for insert
  to anon
  with check (true);

-- Only authenticated (admin) can read/update
create policy "admin can read bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "admin can update bookings"
  on bookings for update
  to authenticated
  using (true);

-- RLS: portfolio_images
alter table portfolio_images enable row level security;

-- Anyone can read portfolio images
create policy "public can read portfolio"
  on portfolio_images for select
  to anon
  using (true);

-- Only authenticated can manage portfolio
create policy "admin can manage portfolio"
  on portfolio_images for all
  to authenticated
  using (true)
  with check (true);

-- Storage buckets (run after enabling Storage in the Supabase dashboard)
insert into storage.buckets (id, name, public) values ('reference-images', 'reference-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
  on conflict (id) do nothing;

-- Storage RLS for reference-images
create policy "anyone can upload reference images"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'reference-images');

create policy "public can view reference images"
  on storage.objects for select
  to anon
  using (bucket_id = 'reference-images');

create policy "admin can manage reference images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'reference-images');

create policy "admin can manage portfolio images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'portfolio');
