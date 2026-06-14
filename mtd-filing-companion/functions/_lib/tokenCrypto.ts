/**
 * App-layer encryption for HMRC OAuth tokens (AES-256-GCM via WebCrypto).
 *
 * Runs on the Cloudflare Workers runtime. The key is held ONLY in Cloudflare
 * env secrets (`TOKEN_ENCRYPTION_KEY`, base64 32 bytes) — never in the database.
 * Encrypting at the app layer means a database compromise (even one that
 * bypasses Supabase RLS) does not yield usable refresh tokens.
 *
 * Generate the key with:  openssl rand -base64 32
 */

const KEY_BYTES = 32
const IV_BYTES = 12 // 96-bit nonce, the standard/required size for AES-GCM
const ENVELOPE_VERSION = 'v1'

/**
 * Imports the base64 `TOKEN_ENCRYPTION_KEY` as a non-extractable AES-GCM key.
 * Throws a clear error if the key is the wrong size so misconfiguration fails
 * loudly at first use rather than silently corrupting stored tokens.
 */
export async function importEncryptionKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToBytes(base64Key.trim())
  if (raw.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${raw.length}). ` +
        'Generate with: openssl rand -base64 32',
    )
  }
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Encrypts a token string. Output is a self-describing envelope:
 *   `v1.<base64 iv>.<base64 ciphertext+tag>`
 * A fresh random IV is used per call (never reuse an IV under the same key).
 * AES-GCM appends a 128-bit auth tag to the ciphertext, so the result is
 * tamper-evident — `decryptString` throws if the bytes are altered.
 */
export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const data = new TextEncoder().encode(plaintext)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data),
  )
  return `${ENVELOPE_VERSION}.${bytesToBase64(iv)}.${bytesToBase64(cipher)}`
}

/** Reverses {@link encryptString}. Throws on a malformed or tampered envelope. */
export async function decryptString(envelope: string, key: CryptoKey): Promise<string> {
  const parts = envelope.split('.')
  if (parts.length !== 3 || parts[0] !== ENVELOPE_VERSION) {
    throw new Error('Malformed token envelope')
  }
  const iv = base64ToBytes(parts[1])
  const cipher = base64ToBytes(parts[2])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(plain)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}
