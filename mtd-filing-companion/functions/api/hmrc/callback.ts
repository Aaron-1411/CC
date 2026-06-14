/**
 * GET /api/hmrc/callback?code=&state=
 *
 * The HMRC OAuth redirect lands here. We:
 *   1. re-authenticate the user (same Supabase session that started the flow),
 *   2. verify the `state` against the CSRF cookie we set in /authorize,
 *   3. handle an HMRC-side denial (`error` query param) cleanly,
 *   4. exchange the `code` for the initial token pair, and
 *   5. encrypt + persist that pair via the {@link TokenVault}, keyed to the user.
 *
 * Only after a successful, persisted exchange do we redirect the user back into
 * the app. The redirect URI passed to the token exchange MUST byte-match the one
 * used at /authorize (HMRC enforces this), so both derive it the same way.
 */

import { readCookie, requireUser } from '../../_lib/supabaseAuth'
import { exchangeAuthCode } from '../../_lib/hmrcOAuth'
import {
  STATE_COOKIE,
  clearStateCookie,
  createVault,
  errorResponse,
  isSecureRequest,
  jsonResponse,
  resolveRedirectUri,
  type HmrcRoutesEnv,
} from '../../_lib/hmrcRoutes'

/** Where to send the user once HMRC is linked. Overridable via env later. */
const POST_LINK_REDIRECT = '/?hmrc=linked'

export async function onRequestGet(context: {
  request: Request
  env: HmrcRoutesEnv
}): Promise<Response> {
  const { request, env } = context
  const secure = isSecureRequest(request)
  try {
    const { userId } = await requireUser(request, env)
    const url = new URL(request.url)

    // HMRC denial / error path: surface it rather than attempting an exchange.
    const oauthError = url.searchParams.get('error')
    if (oauthError) {
      const desc = url.searchParams.get('error_description') ?? ''
      return jsonResponse(
        { ok: false, error: 'hmrc_denied', message: `${oauthError}: ${desc}`.trim() },
        400,
        { 'Set-Cookie': clearStateCookie(secure) },
      )
    }

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) {
      return jsonResponse(
        { ok: false, error: 'missing_params', message: 'Missing code or state' },
        400,
        { 'Set-Cookie': clearStateCookie(secure) },
      )
    }

    // CSRF check: the returned state must equal the one we cookie'd at /authorize.
    const expected = readCookie(request, STATE_COOKIE)
    if (!expected || !timingSafeEqual(expected, state)) {
      return jsonResponse(
        { ok: false, error: 'state_mismatch', message: 'OAuth state did not match' },
        400,
        { 'Set-Cookie': clearStateCookie(secure) },
      )
    }

    const redirectUri = resolveRedirectUri(env, request)
    const tokens = await exchangeAuthCode(env, code, redirectUri)

    // Persist atomically (encrypted) before sending the user on; a failure here
    // must surface, not silently drop the freshly-minted refresh token.
    const vault = await createVault(env)
    await vault.save(userId, tokens)

    return new Response(null, {
      status: 302,
      headers: {
        Location: POST_LINK_REDIRECT,
        'Set-Cookie': clearStateCookie(secure),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}

/** Length-constant string compare, to keep the state check off a timing side-channel. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
