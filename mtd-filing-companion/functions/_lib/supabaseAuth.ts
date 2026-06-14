/**
 * Identifies the signed-in user from their Supabase access token, with zero
 * third-party dependencies.
 *
 * Supabase issues an HS256 JWT signed with the project's JWT secret. We verify
 * that signature ourselves via WebCrypto HMAC-SHA256 (no `jose`, no
 * `@supabase/supabase-js`) — consistent with the WebCrypto-everywhere approach
 * already used for token encryption. A valid token's `sub` claim is the
 * `auth.users.id` uuid, which is exactly the foreign key the `hmrc_tokens` rows
 * are keyed on, so it becomes our internal `userId`.
 *
 * The token is read from the `Authorization: Bearer` header first, then an
 * `sb-access-token` cookie (Supabase's browser default), so the same helper
 * serves both fetch callers and same-site navigations (the OAuth redirect flow).
 *
 * Verification is deliberately strict: signature, `exp`, and—if present—`nbf`
 * are all checked. A token that fails any check yields a coded {@link AuthError}
 * rather than a thrown opaque error, so routes can map it to the right HTTP
 * status (401 vs 500) without string-matching.
 */

/** Env subset this module needs. Optional so a missing secret fails loudly. */
export interface SupabaseAuthEnv {
  /** Project JWT secret (HS256). Server-only — never ship to the browser. */
  SUPABASE_JWT_SECRET?: string
}

export type AuthErrorCode =
  | 'not_configured'
  | 'missing_token'
  | 'invalid_token'
  | 'expired_token'

/** Carries a stable `code` so routes can pick 401 (auth) vs 500 (config). */
export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/** The authenticated principal: just the internal user id, for now. */
export interface AuthedUser {
  /** `sub` claim — the Supabase `auth.users.id` uuid. */
  userId: string
}

interface JwtPayload {
  sub?: string
  exp?: number
  nbf?: number
  [k: string]: unknown
}

/** Tolerance (seconds) applied to `exp`/`nbf` to cover minor clock skew. */
const CLOCK_SKEW_S = 30

/**
 * Verifies the caller's Supabase access token and returns their user id.
 * Throws {@link AuthError} on any failure (missing/invalid/expired token, or
 * an unconfigured JWT secret).
 */
export async function requireUser(
  request: Request,
  env: SupabaseAuthEnv,
): Promise<AuthedUser> {
  if (!env.SUPABASE_JWT_SECRET) {
    throw new AuthError(
      'not_configured',
      'SUPABASE_JWT_SECRET must be set to verify Supabase access tokens',
    )
  }

  const token = extractToken(request)
  if (!token) {
    throw new AuthError('missing_token', 'No Supabase access token on the request')
  }

  const payload = await verifyJwt(token, env.SUPABASE_JWT_SECRET)
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new AuthError('invalid_token', 'Access token has no subject (sub) claim')
  }
  return { userId: payload.sub }
}

/** Pulls the JWT from the Authorization header, falling back to the cookie. */
function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (auth && /^Bearer\s+/i.test(auth)) {
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    if (token) return token
  }
  return readCookie(request, 'sb-access-token')
}

/**
 * Verifies an HS256 JWT against `secret` and returns its payload. Throws
 * {@link AuthError} (`invalid_token` / `expired_token`) on any failure.
 */
async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new AuthError('invalid_token', 'Malformed JWT (expected three segments)')
  }
  const [headerB64, payloadB64, signatureB64] = parts

  let header: { alg?: string; typ?: string }
  let payload: JwtPayload
  try {
    header = JSON.parse(utf8FromB64Url(headerB64)) as { alg?: string; typ?: string }
    payload = JSON.parse(utf8FromB64Url(payloadB64)) as JwtPayload
  } catch {
    throw new AuthError('invalid_token', 'JWT header/payload is not valid JSON')
  }

  if (header.alg !== 'HS256') {
    // Pin the algorithm: never trust the token's self-declared alg beyond HS256
    // (guards against alg-confusion / "none" attacks).
    throw new AuthError('invalid_token', `Unsupported JWT alg: ${header.alg ?? 'none'}`)
  }

  const ok = await hmacVerify(`${headerB64}.${payloadB64}`, signatureB64, secret)
  if (!ok) {
    throw new AuthError('invalid_token', 'JWT signature verification failed')
  }

  const nowS = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && nowS > payload.exp + CLOCK_SKEW_S) {
    throw new AuthError('expired_token', 'Access token has expired')
  }
  if (typeof payload.nbf === 'number' && nowS + CLOCK_SKEW_S < payload.nbf) {
    throw new AuthError('invalid_token', 'Access token is not yet valid (nbf)')
  }
  return payload
}

/** Constant-time-ish HMAC-SHA256 verify via WebCrypto's `verify`. */
async function hmacVerify(
  signingInput: string,
  signatureB64Url: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const signature = b64UrlToBytes(signatureB64Url)
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(signingInput),
  )
}

/** Reads a named cookie value from the request's Cookie header, or null. */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const k = part.slice(0, eq).trim()
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim())
  }
  return null
}

function utf8FromB64Url(b64url: string): string {
  return new TextDecoder().decode(b64UrlToBytes(b64url))
}

function b64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    b64url.length + ((4 - (b64url.length % 4)) % 4),
    '=',
  )
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}
