// GET /api/auth/google — kick off Google OAuth (redirect to consent screen).
// Configured only if GOOGLE_CLIENT_ID/SECRET are set; otherwise 503 so the UI can
// hide the button. CSRF-protected via a single-use `state` stored in D1.
import type { Env } from "../_lib/env";
import { error, nowSeconds, randomToken } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return error("Google login is not configured", 503);
  }
  const origin = env.SITE_ORIGIN || new URL(request.url).origin;
  const state = randomToken(16);
  const now = nowSeconds();
  await env.DB.prepare(
    "INSERT INTO login_tokens (token, kind, payload, created_at, expires_at) VALUES (?, 'oauth_state', NULL, ?, ?)",
  )
    .bind(state, now, now + 600)
    .run();

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return Response.redirect(u.toString(), 302);
};
