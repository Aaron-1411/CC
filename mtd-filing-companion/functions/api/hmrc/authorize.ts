/**
 * GET /api/hmrc/authorize
 *
 * Kicks off the 3-legged HMRC OAuth flow: identifies the signed-in user, mints
 * a CSRF `state` nonce, stashes it in an HttpOnly cookie, and 302-redirects the
 * browser to HMRC's consent screen. HMRC sends the user back to
 * /api/hmrc/callback with `code` + `state`, where {@link onRequestGet} (callback)
 * finishes the exchange.
 *
 * The user must be authenticated (Supabase access token) so that, when the
 * callback persists the resulting HMRC tokens, they're keyed to a real internal
 * user id — not an anonymous session.
 */

import { requireUser } from '../../_lib/supabaseAuth'
import {
  buildAuthorizeUrl,
  errorResponse,
  isSecureRequest,
  randomState,
  resolveRedirectUri,
  stateCookie,
  type HmrcRoutesEnv,
} from '../../_lib/hmrcRoutes'

export async function onRequestGet(context: {
  request: Request
  env: HmrcRoutesEnv
}): Promise<Response> {
  const { request, env } = context
  try {
    // Authn-gate the redirect: we need a user to attribute the tokens to.
    await requireUser(request, env)

    const redirectUri = resolveRedirectUri(env, request)
    const state = randomState()
    const authorizeUrl = buildAuthorizeUrl(env, redirectUri, state)

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizeUrl,
        'Set-Cookie': stateCookie(state, isSecureRequest(request)),
        // Don't let a CDN/browser cache a one-shot, state-bearing redirect.
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
