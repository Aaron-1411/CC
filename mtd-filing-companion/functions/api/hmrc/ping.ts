/**
 * POST /api/hmrc/ping
 *
 * The Phase 1 Definition-of-Done endpoint: proves the whole user-restricted
 * chain works end-to-end for a signed-in, HMRC-linked user. It
 *   1. authenticates the user (Supabase access token),
 *   2. fetches a valid HMRC access token (refreshing + persisting if needed),
 *   3. assembles the WEB_APP_VIA_SERVER fraud-prevention headers from the
 *      browser-posted device data, and
 *   4. GETs HMRC's user-restricted smoke endpoint (default `/hello/user`) with
 *      the Bearer token + fraud headers, returning HMRC's verdict.
 *
 * Body: the same {@link ClientFraudData} the Phase 0a collector posts. We need
 * it here because the fraud headers are mandatory on every user-restricted call,
 * not just the validator — so the real ping must carry them too.
 *
 * Graceful degradation: if the deployment isn't configured (no creds/keys) or
 * the user hasn't linked HMRC yet, the shared {@link errorResponse} maps those
 * to clear coded statuses (503 / 409) instead of opaque 500s.
 */

import { requireUser } from '../../_lib/supabaseAuth'
import { getValidAccessToken } from '../../_lib/hmrcOAuth'
import {
  buildFraudHeaders,
  type ClientFraudData,
  type VendorConfig,
} from '../../_lib/fraudHeaders'
import {
  DEFAULT_PING_PATH,
  createVault,
  errorResponse,
  jsonResponse,
  type HmrcRoutesEnv,
} from '../../_lib/hmrcRoutes'

/** Vendor identity env the fraud headers need, layered onto the routes env. */
interface PingEnv extends HmrcRoutesEnv {
  GOV_VENDOR_PRODUCT_NAME: string
  GOV_VENDOR_VERSION: string
}

export async function onRequestPost(context: {
  request: Request
  env: PingEnv
}): Promise<Response> {
  const { request, env } = context
  try {
    const { userId } = await requireUser(request, env)

    let client: ClientFraudData
    try {
      client = (await request.json()) as ClientFraudData
    } catch {
      return jsonResponse(
        { ok: false, error: 'bad_request', message: 'Invalid JSON body' },
        400,
      )
    }
    if (!isValidClientData(client)) {
      return jsonResponse(
        { ok: false, error: 'bad_request', message: 'Missing or malformed fraud data fields' },
        400,
      )
    }

    // Token first: this is where unconfigured/never-linked/expired states throw
    // coded errors that errorResponse maps to 503/409.
    const vault = await createVault(env)
    const accessToken = await getValidAccessToken(vault, env, userId)

    const vendor: VendorConfig = {
      productName: env.GOV_VENDOR_PRODUCT_NAME,
      version: env.GOV_VENDOR_VERSION,
      userId,
    }
    const fraudHeaders = buildFraudHeaders(client, request, vendor)

    const base = (env.HMRC_API_BASE_URL ?? '').replace(/\/+$/, '')
    const path = env.HMRC_PING_PATH || DEFAULT_PING_PATH
    const res = await fetch(`${base}${path}`, {
      method: 'GET',
      headers: {
        ...fraudHeaders,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.hmrc.1.0+json',
      },
    })

    const hmrcBody = await safeJson(res)
    return jsonResponse({
      ok: res.ok,
      status: res.status,
      hmrc: hmrcBody,
    })
  } catch (err) {
    return errorResponse(err)
  }
}

/** Local copy of the fraud-data guard (fraudHeaders.ts doesn't export one). */
function isValidClientData(c: unknown): c is ClientFraudData {
  if (!c || typeof c !== 'object') return false
  const d = c as Record<string, unknown>
  return (
    typeof d.deviceId === 'string' &&
    typeof d.timezone === 'string' &&
    typeof d.browserJsUserAgent === 'string' &&
    typeof d.screens === 'object' &&
    d.screens !== null &&
    typeof d.windowSize === 'object' &&
    d.windowSize !== null
  )
}

/** Reads a response body as JSON, falling back to text, never throwing. */
async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text.slice(0, 1000)
  }
}
