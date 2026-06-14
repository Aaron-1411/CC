/**
 * Storage layer for a user's HMRC OAuth tokens.
 *
 * Two halves:
 *  - `TokenStore` is the raw persistence port. Implementations hold ALREADY
 *    ENCRYPTED ciphertext and never see plaintext tokens. `save` MUST be atomic
 *    (a single row upsert) — a refresh rotates the refresh token, so a partial
 *    write would strand the user with an unusable token pair and lock them out.
 *  - `TokenVault` wraps a `TokenStore` + a `CryptoKey`: it encrypts on the way
 *    in and decrypts on the way out, so callers work in plaintext `HmrcTokens`
 *    while the store only ever holds the `v1.<iv>.<cipher>` envelopes.
 *
 * The Supabase-backed `TokenStore` lands once auth + schema exist. Until then
 * `InMemoryTokenStore` exercises the whole path locally and in tests.
 */

import { decryptString, encryptString } from './tokenCrypto'

/** Decrypted, ready-to-use token set. Epoch-millis expiries. */
export interface HmrcTokens {
  accessToken: string
  refreshToken: string
  /** When the access token stops working (epoch ms). */
  accessTokenExpiresAt: number
  /** When the refresh token itself expires (epoch ms) — ~18 months out. */
  refreshTokenExpiresAt: number
  scope: string
}

/** What actually hits the database: tokens encrypted, everything else clear. */
export interface StoredTokenRecord {
  userId: string
  accessTokenEnc: string
  refreshTokenEnc: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
  scope: string
  /** Last write time (epoch ms) — useful for debugging rotation races. */
  updatedAt: number
}

/**
 * Persistence port. Implementations store ciphertext only.
 * `save` is an atomic upsert keyed on `userId`.
 */
export interface TokenStore {
  load(userId: string): Promise<StoredTokenRecord | null>
  save(record: StoredTokenRecord): Promise<void>
}

/**
 * Plaintext-facing wrapper around a {@link TokenStore}. Encrypts the access and
 * refresh tokens with the supplied AES-GCM key before they touch the store, and
 * decrypts them on load. Callers never deal with ciphertext.
 */
export class TokenVault {
  constructor(
    private readonly store: TokenStore,
    private readonly key: CryptoKey,
  ) {}

  /** Returns the user's decrypted tokens, or null if none are stored. */
  async load(userId: string): Promise<HmrcTokens | null> {
    const record = await this.store.load(userId)
    if (!record) return null
    const [accessToken, refreshToken] = await Promise.all([
      decryptString(record.accessTokenEnc, this.key),
      decryptString(record.refreshTokenEnc, this.key),
    ])
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: record.accessTokenExpiresAt,
      refreshTokenExpiresAt: record.refreshTokenExpiresAt,
      scope: record.scope,
    }
  }

  /**
   * Encrypts and atomically persists the user's tokens. Encryption happens
   * before the single `store.save` call so the store write is all-or-nothing.
   */
  async save(userId: string, tokens: HmrcTokens): Promise<void> {
    const [accessTokenEnc, refreshTokenEnc] = await Promise.all([
      encryptString(tokens.accessToken, this.key),
      encryptString(tokens.refreshToken, this.key),
    ])
    await this.store.save({
      userId,
      accessTokenEnc,
      refreshTokenEnc,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      scope: tokens.scope,
      updatedAt: Date.now(),
    })
  }
}

/**
 * Process-memory {@link TokenStore} for local dev and tests. Not for production
 * — a Worker isolate is ephemeral, so this loses tokens on restart.
 */
export class InMemoryTokenStore implements TokenStore {
  private readonly rows = new Map<string, StoredTokenRecord>()

  async load(userId: string): Promise<StoredTokenRecord | null> {
    return this.rows.get(userId) ?? null
  }

  async save(record: StoredTokenRecord): Promise<void> {
    this.rows.set(record.userId, { ...record })
  }
}
