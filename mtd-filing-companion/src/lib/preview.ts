/**
 * UI-preview mode.
 *
 * A build-time flag (`VITE_PREVIEW=1`) that lets the app render its real
 * authenticated UI — dashboard, HMRC panel, diagnostics — *without* a live
 * Supabase project or HMRC credentials, so the interface can be viewed as a
 * visual demo (e.g. on the hub) while the external backends are still being set
 * up.
 *
 * This changes nothing about production: in any normal build the flag is unset,
 * `isPreview` is false, and the usual auth gate applies (sign-in required,
 * "Supabase not configured" notice when creds are absent). Preview mode never
 * fabricates data or pretends a backend is connected — it only unlocks the
 * layout behind a prominent "preview" banner, and disables the live actions
 * (sign-in, HMRC connect/test) that would otherwise hit an unconfigured server.
 */

/** True only in a build made with `VITE_PREVIEW=1`. */
export const isPreview = import.meta.env.VITE_PREVIEW === '1'

/** Placeholder identity shown in the header while in preview mode. */
export const PREVIEW_EMAIL = 'demo@preview.mtd'
