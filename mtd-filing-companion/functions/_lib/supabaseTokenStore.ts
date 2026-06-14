/**
 * Supabase-backed {@link TokenStore} — the production persistence for HMRC
 * tokens. It is a thin, dependency-free PostgREST client (no
 * `@supabase/supabase-js`): two HTTP calls against `/rest/v1/hmrc_tokens`,
 * authenticated with the service-role key.
 *
 * It holds ciphertext ONLY — exactly like {@link InMemoryTokenStore}, it never
 * sees plaintext tokens; {@link TokenVault} handles encrypt/decrypt around it.
 * Because it implements the same `TokenStore` port, it drops in wherever the
 * in-memory store is used today, with no change to the OAuth code above it.
 *
 * `save` is an atomic upsert: a single `POST` with
 * `Prefer: resolution=merge-duplicates`, which PostgREST executes as one
 * `INSERT ... ON CONFLICT (user_id) DO UPDATE`. That all-or-nothing write is
 * what protects a token rotation from stranding the user with a half-written
 * pair (the lock-out failure mode the OAuth layer guards against).
 *
 * Access is service-role-only by design (decision D2): the table has RLS
 * enabled with no policies, so anon/authenticated sessions get nothing, and
 * only this server path — holding the service-role key, which bypasses RLS —
 * can reach the rows. The service-role key must therefore live in Cloudflare
 * secrets and never reach the browser.
 *
 * `fetchImpl` is injectable so the round-trip is testable against a fake
 * PostgREST without a live database, the same seam used in {@link hmrcOAuth}.
 */

import type { StoredTokenRecord, TokenStore } from './tokenStore'

type FetchImpl = typeof fetch

/** Connection details for the Supabase project's PostgREST endpoint. */
export interface SupabaseConfig {
  /** Project URL, e.g. `https://abcd.supabase.co` (no trailing `/rest/v1`). */
  url: string
  /** Service-role key — bypasses RLS. Server-only; never expose to the client. */
  serviceRoleKey: string
}

/** Env subset this module reads. Optional so a missing config fails loudly. */
export interface SupabaseEnv {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export type SupabaseTokenStoreErrorCode = 'not_configured' | 'load_failed' | 'save_failed'

/** Carries a stable `code` so callers can distinguish config vs. transport faults. */
export class SupabaseTokenStoreError extends Error {
  constructor(
    readonly code: SupabaseTokenStoreErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SupabaseTokenStoreError'
  }
}

/** The on-disk shape: snake_case columns, mirroring the 0001 migration. */
interface TokenRow {
  user_id: string
  access_token_enc: string
  refresh_token_enc: string
  access_token_expires_at: number
  refresh_token_expires_at: number
  scope: string
  updated_at: number
}

const TABLE = 'hmrc_tokens'

export class SupabaseTokenStore implements TokenStore {
  private readonly restBase: string

  constructor(
    private readonly config: SupabaseConfig,
    private readonly fetchImpl: FetchImpl = fetch,
  ) {
    this.restBase = `${config.url.replace(/\/+$/, '')}/rest/v1`
  }

  async load(userId: string): Promise<StoredTokenRecord | null> {
    const url = `${this.restBase}/${TABLE}?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: this.authHeaders(),
    })
    if (!res.ok) {
      throw new SupabaseTokenStoreError(
        'load_failed',
        `Supabase token load failed (${res.status}): ${await safeText(res)}`,
      )
    }
    const rows = (await res.json()) as TokenRow[]
    if (!Array.isArray(rows) || rows.length === 0) return null
    return rowToRecord(rows[0])
  }

  async save(record: StoredTokenRecord): Promise<void> {
    const url = `${this.restBase}/${TABLE}`
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
        // merge-duplicates = upsert on the primary key (user_id), in one
        // atomic INSERT ... ON CONFLICT DO UPDATE. return=minimal skips the
        // echoed row to save a round-trip's worth of body.
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([recordToRow(record)]),
    })
    if (!res.ok) {
      throw new SupabaseTokenStoreError(
        'save_failed',
        `Supabase token save failed (${res.status}): ${await safeText(res)}`,
      )
    }
  }

  private authHeaders(): Record<string, string> {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
      Accept: 'application/json',
    }
  }
}

/**
 * Builds a {@link SupabaseTokenStore} from env, failing loudly if either var is
 * missing rather than silently producing a store that 401s on first use.
 */
export function createSupabaseTokenStore(
  env: SupabaseEnv,
  fetchImpl: FetchImpl = fetch,
): SupabaseTokenStore {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new SupabaseTokenStoreError(
      'not_configured',
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set',
    )
  }
  return new SupabaseTokenStore(
    { url: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY },
    fetchImpl,
  )
}

function rowToRecord(row: TokenRow): StoredTokenRecord {
  return {
    userId: row.user_id,
    accessTokenEnc: row.access_token_enc,
    refreshTokenEnc: row.refresh_token_enc,
    // PostgREST may serialise bigint as string; coerce to be safe (epoch ms is
    // well within Number.MAX_SAFE_INTEGER).
    accessTokenExpiresAt: Number(row.access_token_expires_at),
    refreshTokenExpiresAt: Number(row.refresh_token_expires_at),
    scope: row.scope,
    updatedAt: Number(row.updated_at),
  }
}

function recordToRow(record: StoredTokenRecord): TokenRow {
  return {
    user_id: record.userId,
    access_token_enc: record.accessTokenEnc,
    refresh_token_enc: record.refreshTokenEnc,
    access_token_expires_at: record.accessTokenExpiresAt,
    refresh_token_expires_at: record.refreshTokenExpiresAt,
    scope: record.scope,
    updated_at: record.updatedAt,
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return '<unreadable body>'
  }
}
