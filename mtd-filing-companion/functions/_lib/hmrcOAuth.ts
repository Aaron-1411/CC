/**
 * HMRC user-restricted (3-legged) OAuth 2.0: the authorisation-code exchange,
 * refresh-with-rotation, and the get-a-valid-access-token entry point callers
 * actually use.
 *
 * The dangerous bit is refresh. HMRC access tokens last ~4 hours; the refresh
 * token lasts ~18 months and **rotates on every use** — each refresh returns a
 * NEW refresh token and invalidates the old one. If we fetch a new pair but
 * fail to persist it, the user is locked out and must re-authorise. So
 * {@link getValidAccessToken}:
 *   1. persists the rotated pair (atomically, via {@link TokenVault.save})
 *      BEFORE handing the access token back, and
 *   2. de-duplicates concurrent refreshes for the same user (single-flight), so
 *      two in-flight requests can't each burn the refresh token and race.
 *
 * `fetchImpl` is injectable purely so this lock-out-critical path is testable
 * without hitting the network.
 */

import type { HmrcTokens, TokenVault } from './tokenStore'

/** Env subset this module needs. Mirrors the names used elsewhere in functions. */
export interface HmrcOAuthEnv {
  HMRC_OAUTH_BASE_URL: string
  HMRC_CLIENT_ID?: string
  HMRC_CLIENT_SECRET?: string
  HMRC_SCOPE?: string
}

type FetchImpl = typeof fetch

/** Treat the access token as expired this many ms early, to cover clock skew + flight time. */
const ACCESS_TOKEN_SKEW_MS = 30_000

/**
 * Assumed refresh-token lifetime. HMRC's token response does NOT carry the
 * refresh-token expiry, and the documented life is ~18 months. We use a
 * deliberately conservative 540 days so we prompt re-auth slightly early rather
 * than handing HMRC a dead refresh token.
 */
const REFRESH_TOKEN_LIFETIME_MS = 540 * 24 * 60 * 60 * 1000

export type HmrcOAuthErrorCode =
  | 'not_configured'
  | 'no_tokens'
  | 'refresh_expired'
  | 'token_request_failed'
  | 'malformed_token_response'

/** Carries a stable `code` so callers can branch (e.g. re-auth on `refresh_expired`). */
export class HmrcOAuthError extends Error {
  constructor(
    readonly code: HmrcOAuthErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'HmrcOAuthError'
  }
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

/**
 * Exchanges an authorisation code (from the redirect callback) for the initial
 * token pair. This is the only point a refresh token is born, so a missing one
 * here is a hard error. Sets the ~18-month refresh-token clock from now.
 */
export async function exchangeAuthCode(
  env: HmrcOAuthEnv,
  code: string,
  redirectUri: string,
  fetchImpl: FetchImpl = fetch,
): Promise<HmrcTokens> {
  const data = await tokenRequest(
    env,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    fetchImpl,
  )
  if (!data.refresh_token) {
    throw new HmrcOAuthError(
      'malformed_token_response',
      'Authorization-code exchange returned no refresh_token',
    )
  }
  const now = Date.now()
  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: now + data.expires_in! * 1000,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_LIFETIME_MS,
    scope: data.scope ?? env.HMRC_SCOPE ?? '',
  }
}

/**
 * Exchanges the current refresh token for a fresh pair. HMRC rotates the
 * refresh token, so we take `data.refresh_token` when present (it always is) and
 * only fall back to the current one defensively. The 18-month refresh clock is
 * carried forward, NOT reset — rotation doesn't re-extend the original grant.
 */
export async function refreshTokens(
  env: HmrcOAuthEnv,
  current: HmrcTokens,
  fetchImpl: FetchImpl = fetch,
): Promise<HmrcTokens> {
  const data = await tokenRequest(
    env,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
    }),
    fetchImpl,
  )
  const now = Date.now()
  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token ?? current.refreshToken,
    accessTokenExpiresAt: now + data.expires_in! * 1000,
    refreshTokenExpiresAt: current.refreshTokenExpiresAt,
    scope: data.scope ?? current.scope,
  }
}

/**
 * The entry point for any HMRC API call. Returns a usable access token for the
 * user: the cached one if it's still valid (minus skew), otherwise refreshes,
 * persists the rotated pair atomically, and returns the new access token.
 *
 * Concurrent callers for the same user share ONE refresh (single-flight) so the
 * rotating refresh token can't be spent twice in a race.
 *
 * Throws {@link HmrcOAuthError} `no_tokens` if the user has never authorised, or
 * `refresh_expired` if their refresh token is past its life (re-auth required).
 */
export async function getValidAccessToken(
  vault: TokenVault,
  env: HmrcOAuthEnv,
  userId: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  const current = await vault.load(userId)
  if (!current) {
    throw new HmrcOAuthError('no_tokens', `No HMRC tokens stored for user ${userId}`)
  }
  if (!isExpired(current.accessTokenExpiresAt)) {
    return current.accessToken
  }

  const map = flightMap(vault)
  let flight = map.get(userId)
  if (!flight) {
    flight = refreshAndStore(vault, env, userId, fetchImpl).finally(() => {
      map.delete(userId)
    })
    map.set(userId, flight)
  }
  const refreshed = await flight
  return refreshed.accessToken
}

/** Re-reads the freshest tokens, refreshes, and atomically persists before returning. */
async function refreshAndStore(
  vault: TokenVault,
  env: HmrcOAuthEnv,
  userId: string,
  fetchImpl: FetchImpl,
): Promise<HmrcTokens> {
  // Re-load inside the flight: another path may have refreshed while we queued.
  const latest = await vault.load(userId)
  if (!latest) {
    throw new HmrcOAuthError('no_tokens', `No HMRC tokens stored for user ${userId}`)
  }
  if (!isExpired(latest.accessTokenExpiresAt)) {
    return latest
  }
  if (Date.now() >= latest.refreshTokenExpiresAt) {
    throw new HmrcOAuthError(
      'refresh_expired',
      `Refresh token for user ${userId} has expired; re-authorisation required`,
    )
  }
  const refreshed = await refreshTokens(env, latest, fetchImpl)
  // Persist the rotated pair BEFORE returning, or a crash here locks the user out.
  await vault.save(userId, refreshed)
  return refreshed
}

/** Per-vault, per-user in-flight refreshes. WeakMap so test vaults don't leak. */
const inFlightRefreshes = new WeakMap<TokenVault, Map<string, Promise<HmrcTokens>>>()

function flightMap(vault: TokenVault): Map<string, Promise<HmrcTokens>> {
  let m = inFlightRefreshes.get(vault)
  if (!m) {
    m = new Map()
    inFlightRefreshes.set(vault, m)
  }
  return m
}

function isExpired(expiresAtMs: number): boolean {
  return Date.now() >= expiresAtMs - ACCESS_TOKEN_SKEW_MS
}

/** POSTs the form-encoded grant to HMRC's token endpoint, injecting client creds. */
async function tokenRequest(
  env: HmrcOAuthEnv,
  body: URLSearchParams,
  fetchImpl: FetchImpl,
): Promise<TokenResponse> {
  if (!env.HMRC_CLIENT_ID || !env.HMRC_CLIENT_SECRET) {
    throw new HmrcOAuthError('not_configured', 'HMRC client credentials are not configured')
  }
  body.set('client_id', env.HMRC_CLIENT_ID)
  body.set('client_secret', env.HMRC_CLIENT_SECRET)

  const res = await fetchImpl(`${env.HMRC_OAUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  if (!res.ok) {
    throw new HmrcOAuthError(
      'token_request_failed',
      `OAuth token request failed (${res.status}): ${await safeText(res)}`,
    )
  }

  const data = (await res.json()) as TokenResponse
  if (!data.access_token || typeof data.expires_in !== 'number') {
    throw new HmrcOAuthError(
      'malformed_token_response',
      'OAuth response missing access_token or expires_in',
    )
  }
  return data
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return '<unreadable body>'
  }
}
