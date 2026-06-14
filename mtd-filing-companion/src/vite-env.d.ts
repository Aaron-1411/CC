/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://<ref>.supabase.co (browser-safe). */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon/publishable key (browser-safe; RLS-gated, NOT service-role). */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /**
   * Build-time UI-preview flag ("1" to enable). When set, the app renders the
   * authenticated dashboard shell with a clear "preview" banner so the UI can be
   * viewed without a live Supabase/HMRC backend. Off (the default) in real
   * deployments. See {@link file://./lib/preview.ts}.
   */
  readonly VITE_PREVIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
