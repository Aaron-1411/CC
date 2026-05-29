import { createClient } from '@supabase/supabase-js'

/** Lightweight client for static / build-time Supabase reads. No cookies. */
export function createStaticClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
  )
}
