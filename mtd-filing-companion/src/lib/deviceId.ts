import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'mtd.deviceId'

/**
 * Returns a stable UUID v4 for this browser, used as HMRC's
 * `Gov-Client-Device-ID`. HMRC requires this to be generated ONCE and reused
 * for the lifetime of the device — regenerating per session is a common
 * fraud-header rejection cause. Persisted in localStorage.
 */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing && isUuidV4(existing)) return existing
    const fresh = uuidv4()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    // localStorage unavailable (private mode / blocked) — fall back to a
    // session-stable id so a header is still emitted. Persistence is lost.
    return uuidv4()
  }
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuidV4(value: string): boolean {
  return UUID_V4.test(value)
}
