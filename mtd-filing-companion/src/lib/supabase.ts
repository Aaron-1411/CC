/**
 * Browser Supabase client (auth only, for now).
 *
 * Reads the project URL + anon (publishable) key from Vite env. Both are
 * browser-safe: the anon key is meant to ship to the client and is gated by
 * Row-Level Security — it is NOT the service-role key (that one is server-only
 * and lives in Cloudflare secrets / `.dev.vars`, never here).
 *
 * The values come from `.env.local` (gitignored) via Vite's `VITE_` convention:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 *
 * Until a real Supabase project exists those are blank, so {@link isSupabaseConfigured}
 * is false and the UI shows a clear "not configured" notice instead of crashing
 * — the same graceful-degradation posture the server routes use.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** True only when both browser-safe Supabase values are present. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The singleton client, or `null` when unconfigured. Callers that need it should
 * branch on {@link isSupabaseConfigured} first; the auth layer does this for them.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Passwordless magic-link sign-in returns to the app with the session in
        // the URL; let the client pick it up automatically and persist + refresh.
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
    })
  : null
