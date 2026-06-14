/**
 * Shared plumbing for the three HMRC OAuth route handlers (`authorize`,
 * `callback`, `ping`). Keeps the route files thin and the cross-cutting bits —
 * vault construction, the authorise-URL builder, redirect-URI resolution, the
 * CSRF state cookie, and a single error→Response mapper — in one place.
 *
 * Everything here is fetch-injectable and side-effect-light so the routes stay
 * testable against fakes (no live HMRC/Supabase needed to exercise the shapes).
 */

import { importEncryptionKey } from './tokenCrypto'
import { TokenVault } from './tokenStore'
import {
  createSupabaseTokenStore,
  SupabaseTokenStoreError,
  type SupabaseEnv,
} from './supabaseTokenStore'
import { AuthError } from './supabaseAuth'
import { HmrcOAuthError, type HmrcOAuthEnv } from './hmrcOAuth'

type FetchImpl = typeof fetch

/** The full env the HMRC routes read. Superset of the lib-level env slices. */
export interface HmrcRoutesEnv extends HmrcOAuthEnv, SupabaseEnv {
  /** Base64 32-byte AES-GCM key for token encryption (Cloudflare secret). */
  TOKEN_ENCRYPTION_KEY?: string
  /** Supabase project JWT secret, for verifying access tokens. */
  SUPABASE_JWT_SECRET?: string
  /** Fixed OAuth redirect URI; if unset, derived from the request origin. */
  HMRC_REDIRECT_URI?: string
  /** OAuth scopes to request; defaults applied in {@link buildAuthorizeUrl}. */
  HMRC_SCOPE?: string
  /** HMRC API base for user-restricted calls (the ping target lives here). */
  HMRC_API_BASE_URL?: string
  /** Path the ping route GETs to prove the token works. */
  HMRC_PING_PATH?: string
}

/** Default OAuth scopes for MTD ITSA if HMRC_SCOPE is unset. */
export const DEFAULT_HMRC_SCOPE = 'read:self-assessment write:self-assessment'

/** Default ping target — HMRC's user-restricted "hello user" smoke endpoint. */
export const DEFAULT_PING_PATH = '/hello/user'

/** Name of the short-lived CSRF cookie that pins the OAuth `state` value. */
export const STATE_COOKIE = 'mtd_oauth_state'

/**
 * Builds the plaintext-facing {@link TokenVault}: imports the AES key and wraps
 * the Supabase-backed store. Both halves fail loudly (coded errors) if their
 * config is missing, so a half-configured deployment can't silently no-op.
 */
export async function createVault(
  env: HmrcRoutesEnv,
  fetchImpl: FetchImpl = fetch,
): Promise<TokenVault> {
  if (!env.TOKEN_ENCRYPTION_KEY) {
    throw new SupabaseTokenStoreError(
      'not_configured',
      'TOKEN_ENCRYPTION_KEY must be set to encrypt HMRC tokens',
    )
  }
  const key = await importEncryptionKey(env.TOKEN_ENCRYPTION_KEY)
  const store = createSupabaseTokenStore(env, fetchImpl)
  return new TokenVault(store, key)
}

/**
 * Constructs HMRC's user-restricted authorisation URL. `state` is the opaque
 * CSRF nonce we also stash in a cookie and re-check at the callback.
 */
export function buildAuthorizeUrl(
  env: HmrcRoutesEnv,
  redirectUri: string,
  state: string,
): string {
  if (!env.HMRC_OAUTH_BASE_URL) {
    throw new HmrcOAuthError('not_configured', 'HMRC_OAUTH_BASE_URL is not set')
  }
  if (!env.HMRC_CLIENT_ID) {
    throw new HmrcOAuthError('not_configured', 'HMRC_CLIENT_ID is not set')
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.HMRC_CLIENT_ID,
    scope: env.HMRC_SCOPE || DEFAULT_HMRC_SCOPE,
    redirect_uri: redirectUri,
    state,
  })
  return `${env.HMRC_OAUTH_BASE_URL.replace(/\/+$/, '')}/oauth/authorize?${params.toString()}`
}

/**
 * Resolves the OAuth redirect URI. A fixed `HMRC_REDIRECT_URI` wins (it must
 * match what's registered on the Developer Hub); otherwise we derive
 * `<origin>/api/hmrc/callback` from the inbound request so local dev and
 * preview deployments work without extra config.
 */
export function resolveRedirectUri(env: HmrcRoutesEnv, request: Request): string {
  if (env.HMRC_REDIRECT_URI) return env.HMRC_REDIRECT_URI
  const origin = new URL(request.url).origin
  return `${origin}/api/hmrc/callback`
}

/** Generates an unguessable URL-safe state/nonce value. */
export function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Serialises the CSRF state cookie. HttpOnly + SameSite=Lax so it survives the
 * top-level redirect back from HMRC but is never readable by scripts; Secure in
 * production (https origins). Short Max-Age — it only needs to outlive the
 * round-trip to the consent screen.
 */
export function stateCookie(state: string, secure: boolean): string {
  const attrs = [
    `${STATE_COOKIE}=${encodeURIComponent(state)}`,
    'Path=/api/hmrc',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
  ]
  if (secure) attrs.push('Secure')
  return attrs.join('; ')
}

/** Expires the state cookie once the callback has consumed it. */
export function clearStateCookie(secure: boolean): string {
  const attrs = [
    `${STATE_COOKIE}=`,
    'Path=/api/hmrc',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (secure) attrs.push('Secure')
  return attrs.join('; ')
}

/** True when the request arrived over https (so cookies can be Secure). */
export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:'
}

/** A small JSON helper that mirrors the project's response shape. */
export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

/**
 * Maps any error the routes can throw to a JSON {@link Response} with the right
 * HTTP status, so each handler can simply `catch (err) { return errorResponse(err) }`.
 *
 * Status policy:
 *  - auth problems (bad/missing token)      → 401
 *  - the user simply hasn't linked HMRC yet → 409 (`no_tokens`)
 *  - their refresh token died               → 409 (`refresh_expired`, re-auth)
 *  - any config gap (creds/keys/url unset)  → 503 (service not configured)
 *  - upstream HMRC/Supabase transport fault → 502
 *  - anything else                          → 500
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    const status = err.code === 'not_configured' ? 503 : 401
    return jsonResponse({ ok: false, error: err.code, message: err.message }, status)
  }
  if (err instanceof HmrcOAuthError) {
    const status =
      err.code === 'not_configured'
        ? 503
        : err.code === 'no_tokens' || err.code === 'refresh_expired'
          ? 409
          : 502
    return jsonResponse({ ok: false, error: err.code, message: err.message }, status)
  }
  if (err instanceof SupabaseTokenStoreError) {
    const status = err.code === 'not_configured' ? 503 : 502
    return jsonResponse({ ok: false, error: err.code, message: err.message }, status)
  }
  const message = err instanceof Error ? err.message : 'Unknown error'
  return jsonResponse({ ok: false, error: 'internal_error', message }, 500)
}
