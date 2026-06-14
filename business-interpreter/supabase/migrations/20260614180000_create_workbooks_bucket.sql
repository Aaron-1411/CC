-- Create the private "workbooks" storage bucket.
-- Previously this bucket was created out-of-band on the hosting dashboard; the
-- RLS policies were in code (migration 20260608204721) but the bucket was not,
-- so a fresh Supabase project had policies pointing at a non-existent bucket and
-- every upload/download (spreadsheets + demonstration recordings) failed.
-- This makes the bucket reproducible from migrations alone.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workbooks',
  'workbooks',
  false,           -- private; access is gated by the per-user RLS policies on storage.objects
  524288000,       -- 500 MB: holds .xlsx/.xlsm plus video/audio demonstration recordings
  NULL             -- mixed content (spreadsheets + a/v); rely on RLS, not mime allow-listing
)
ON CONFLICT (id) DO NOTHING;
