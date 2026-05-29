-- Migration: add new booking detail fields
-- Run this in the Supabase SQL editor if the bookings table already exists

alter table bookings
  add column if not exists tattoo_style_notes  text,
  add column if not exists colour_preference   text
    check (colour_preference in ('Black & grey only', 'Full colour', 'Colour with black & grey shading', 'Not sure yet')),
  add column if not exists complexity          text
    check (complexity in ('simple', 'moderate', 'detailed')),
  add column if not exists cover_up_darkness   text
    check (cover_up_darkness in ('light', 'medium', 'dark', 'scarred')),
  add column if not exists dimensions          text;

-- Storage buckets (safe to re-run)
insert into storage.buckets (id, name, public) values ('reference-images', 'reference-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
  on conflict (id) do nothing;

-- Storage policies (only run if they don't exist yet)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'anyone can upload reference images'
  ) then
    execute $policy$
      create policy "anyone can upload reference images"
        on storage.objects for insert
        to anon
        with check (bucket_id = 'reference-images')
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'public can view reference images'
  ) then
    execute $policy$
      create policy "public can view reference images"
        on storage.objects for select
        to anon
        using (bucket_id = 'reference-images')
    $policy$;
  end if;
end $$;
