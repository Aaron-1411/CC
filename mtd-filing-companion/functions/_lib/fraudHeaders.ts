/**
 * Server-side assembler for HMRC fraud-prevention headers, `WEB_APP_VIA_SERVER`
 * connection method. Runs in the Cloudflare Workers runtime (Pages Functions).
 *
 * This is the SINGLE place percent-encoding and header assembly happen. The
 * browser posts raw values (see src/lib/fraudHeaders.ts); here we add the
 * server-derived values, encode per HMRC's rules, and emit the final headers.
 *
 * Spec:
 *  - https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/
 *  - https://developer.service.hmrc.gov.uk/guides/fraud-prevention/getting-it-right/
 */

/** Raw browser-sourced values, exactly as posted by the client collector. */
export interface ClientFraudData {
  deviceId: string
  timezone: string
  screens: {
    width: number
    height: number
    scalingFactor: number
    colourDepth: number
  }
  windowSize: {
    width: number
    height: number
  }
  browserJsUserAgent: string
}

export interface VendorConfig {
  /** Marketed product name, e.g. "MTD Filing Companion". Percent-encoded on emit. */
  productName: string
  /** Already-formatted `key=value`, e.g. "mtd-filing-companion=0.0.0". */
  version: string
  /** Stable identifier for the end user within our app (internal user id). */
  userId: string
}

/**
 * HMRC encoding for key=value block components: US-ASCII, with reserved and
 * non-ASCII characters percent-encoded. `encodeURIComponent` matches this — it
 * encodes `=`, `&`, `:` (→ `%3A`), space (→ `%20`) and all non-ASCII, while
 * leaving HMRC's permitted unreserved set intact.
 */
const enc = encodeURIComponent

/** Builds an HMRC `k1=v1&k2=v2` block with keys and values percent-encoded. */
function kvBlock(pairs: Record<string, string | number>): string {
  return Object.entries(pairs)
    .map(([k, v]) => `${enc(k)}=${enc(String(v))}`)
    .join('&')
}

/**
 * Assembles the full set of `WEB_APP_VIA_SERVER` fraud-prevention headers.
 *
 * Genuinely-unobtainable headers on the Cloudflare Pages runtime are OMITTED
 * (never sent with placeholder values like `null`/`0`, which HMRC rejects):
 *   - Gov-Client-Public-Port   — client source port not exposed by Workers
 *   - Gov-Client-Multi-Factor  — our app does not MFA the end user
 *   - Gov-Vendor-License-IDs   — no license keys
 *   - Gov-Vendor-Public-IP     — origin IP not exposed behind CF edge
 *   - Gov-Vendor-Forwarded     — TLS hops not reliably enumerable behind CF edge
 * These (Public-Port, Vendor-Public-IP, Vendor-Forwarded) must be pre-registered
 * with HMRC's SDS team as missing-data before production.
 */
export function buildFraudHeaders(
  client: ClientFraudData,
  request: Request,
  vendor: VendorConfig,
): Record<string, string> {
  const publicIp = request.headers.get('CF-Connecting-IP') ?? ''
  const headers: Record<string, string> = {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Device-ID': client.deviceId,
    'Gov-Client-User-IDs': kvBlock({
      [slug(vendor.productName)]: vendor.userId,
    }),
    'Gov-Client-Timezone': client.timezone,
    'Gov-Client-Screens': kvBlock({
      width: client.screens.width,
      height: client.screens.height,
      'scaling-factor': client.screens.scalingFactor,
      'colour-depth': client.screens.colourDepth,
    }),
    'Gov-Client-Window-Size': kvBlock({
      width: client.windowSize.width,
      height: client.windowSize.height,
    }),
    'Gov-Client-Browser-JS-User-Agent': client.browserJsUserAgent,
    'Gov-Vendor-Version': vendor.version,
    'Gov-Vendor-Product-Name': enc(vendor.productName),
  }

  // Gov-Client-Public-IP requires its read-time timestamp; only emit the pair
  // together (empty IP would be missing-data, so omit both if absent).
  if (publicIp) {
    headers['Gov-Client-Public-IP'] = publicIp
    headers['Gov-Client-Public-IP-Timestamp'] = new Date().toISOString()
  }

  return headers
}

/** Lowercases + hyphenates a product name into a safe key=value key. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
