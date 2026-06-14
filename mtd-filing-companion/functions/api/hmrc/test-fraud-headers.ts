import {
  buildFraudHeaders,
  type ClientFraudData,
  type VendorConfig,
} from '../../_lib/fraudHeaders'

/**
 * Phase 0a spike endpoint.
 *
 * Flow: browser POSTs raw fraud data → we assemble the full WEB_APP_VIA_SERVER
 * header set → obtain an application-restricted OAuth token → call HMRC's
 * Test Fraud Prevention Headers API (`/test/fraud-prevention-headers/validate`)
 * → return the validator verdict.
 *
 * Designed to flip green on credential drop-in: with no HMRC client
 * credentials configured it still assembles + returns the headers (so the
 * pipeline is observable locally), and reports `credentialsConfigured: false`.
 * The moment real sandbox credentials land in env, it performs the live call.
 */

interface Env {
  HMRC_API_BASE_URL: string
  HMRC_OAUTH_BASE_URL: string
  HMRC_CLIENT_ID?: string
  HMRC_CLIENT_SECRET?: string
  HMRC_SCOPE?: string
  GOV_VENDOR_PRODUCT_NAME: string
  GOV_VENDOR_VERSION: string
}

interface ValidatorResult {
  specVersion?: string
  code?: string
  message?: string
  errors?: unknown[]
  warnings?: unknown[]
}

interface SpikeResponse {
  ok: boolean
  stage: 'assembled' | 'validated' | 'error'
  credentialsConfigured: boolean
  assembledHeaders: Record<string, string>
  validation?: ValidatorResult
  error?: string
}

export async function onRequestPost(context: {
  request: Request
  env: Env
}): Promise<Response> {
  const { request, env } = context

  let client: ClientFraudData
  try {
    client = (await request.json()) as ClientFraudData
  } catch {
    return json({ status: 400, body: errorResponse('Invalid JSON body') }, false)
  }

  if (!isValidClientData(client)) {
    return json(
      { status: 400, body: errorResponse('Missing or malformed fraud data fields') },
      false,
    )
  }

  const vendor: VendorConfig = {
    productName: env.GOV_VENDOR_PRODUCT_NAME,
    version: env.GOV_VENDOR_VERSION,
    // Phase 0a has no authenticated user; the device id stands in as the
    // stable per-user identifier. Replaced by the real internal user id once
    // auth lands (Phase 1+).
    userId: client.deviceId,
  }

  const assembledHeaders = buildFraudHeaders(client, request, vendor)
  const credentialsConfigured = Boolean(env.HMRC_CLIENT_ID && env.HMRC_CLIENT_SECRET)

  if (!credentialsConfigured) {
    return json(
      {
        status: 200,
        body: {
          ok: true,
          stage: 'assembled',
          credentialsConfigured: false,
          assembledHeaders,
        } satisfies SpikeResponse,
      },
      true,
    )
  }

  try {
    const token = await getApplicationToken(env)
    const validation = await validateHeaders(env, assembledHeaders, token)
    const ok = validation.code === 'VALID_HEADERS'
    return json(
      {
        status: 200,
        body: {
          ok,
          stage: 'validated',
          credentialsConfigured: true,
          assembledHeaders,
          validation,
        } satisfies SpikeResponse,
      },
      true,
    )
  } catch (err) {
    return json(
      {
        status: 502,
        body: {
          ok: false,
          stage: 'error',
          credentialsConfigured: true,
          assembledHeaders,
          error: err instanceof Error ? err.message : 'Unknown HMRC error',
        } satisfies SpikeResponse,
      },
      false,
    )
  }
}

/** Application-restricted OAuth 2.0 client_credentials token from HMRC. */
async function getApplicationToken(env: Env): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.HMRC_CLIENT_ID!,
    client_secret: env.HMRC_CLIENT_SECRET!,
  })
  if (env.HMRC_SCOPE) body.set('scope', env.HMRC_SCOPE)

  const res = await fetch(`${env.HMRC_OAUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`OAuth token request failed (${res.status}): ${await safeText(res)}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('OAuth response missing access_token')
  return data.access_token
}

/** Calls HMRC's Test Fraud Prevention Headers validator with the Gov-* headers. */
async function validateHeaders(
  env: Env,
  fraudHeaders: Record<string, string>,
  token: string,
): Promise<ValidatorResult> {
  const res = await fetch(
    `${env.HMRC_API_BASE_URL}/test/fraud-prevention-headers/validate`,
    {
      method: 'GET',
      headers: {
        ...fraudHeaders,
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.hmrc.1.0+json',
      },
    },
  )

  if (!res.ok && res.status !== 200) {
    // The validator returns 200 with a verdict body; other statuses are errors.
    throw new Error(`Validator request failed (${res.status}): ${await safeText(res)}`)
  }
  return (await res.json()) as ValidatorResult
}

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

function errorResponse(message: string): SpikeResponse {
  return {
    ok: false,
    stage: 'error',
    credentialsConfigured: false,
    assembledHeaders: {},
    error: message,
  }
}

function json(
  payload: { status: number; body: SpikeResponse },
  _ok: boolean,
): Response {
  return new Response(JSON.stringify(payload.body), {
    status: payload.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return '<unreadable body>'
  }
}
