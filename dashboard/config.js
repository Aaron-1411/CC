/*
 * config.js — runtime configuration for the Personal Hub (Phase 3).
 *
 * There is no build step, so this replaces Vite env vars. Loaded as a classic
 * <script> before the app. The Supabase anon key is PUBLIC by design (row-level
 * security protects the data) — it is safe to commit. The Anthropic API key is
 * NEVER here; it lives only as a Cloudflare Pages secret used by functions/api.
 *
 * To switch the hub onto Supabase:
 *   1. Create a Supabase project; run dashboard/supabase/migrations/0001_init.sql.
 *   2. Paste your Project URL + anon (public) key below.
 *   3. Set storeAdapter to 'supabase'.
 *   4. (Optional) open the hub once on localStorage and use "Migrate to Supabase".
 * To roll back: set storeAdapter back to 'local'. See SETUP.md.
 */
window.HUB_CONFIG = {
  // 'local' = browser localStorage (default). 'supabase' = Supabase backend.
  storeAdapter: 'local',
  supabase: {
    url: '',      // e.g. https://YOUR-PROJECT.supabase.co
    anonKey: '',  // public anon key (safe to commit; protected by RLS)
  },
  // Chairman API proxy path (Cloudflare Pages Function). Reads ANTHROPIC_API_KEY
  // from Cloudflare env — set it as a Pages secret before the Chairman works.
  chatApi: '/api/chat',
};
