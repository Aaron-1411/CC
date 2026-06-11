// GET /api/auth/google/callback?code&state — exchange the code, upsert the user,
// open a session, and bounce back to the app. Failures redirect to /login?error=…
import type { Env } from "../../_lib/env";
import { nowSeconds } from "../../_lib/http";
import { createSession, sessionCookie } from "../../_lib/auth";
import { createUser, findUserByEmail, findUserByProvider } from "../../_lib/users";

interface GoogleProfile {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

function bounce(origin: string, to: string, setCookie?: string): Response {
  const headers: Record<string, string> = { location: origin + to };
  if (setCookie) headers["set-cookie"] = setCookie;
  return new Response(null, { status: 302, headers });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = env.SITE_ORIGIN || url.origin;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return bounce(origin, "/login?error=oauth_unconfigured");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return bounce(origin, "/login?error=oauth_missing");

  // Validate + consume the CSRF state.
  const stateRow = await env.DB.prepare(
    "SELECT token FROM login_tokens WHERE token = ? AND kind = 'oauth_state' AND expires_at > ?",
  )
    .bind(state, nowSeconds())
    .first();
  if (!stateRow) return bounce(origin, "/login?error=oauth_state");
  await env.DB.prepare("DELETE FROM login_tokens WHERE token = ?").bind(state).run();

  // Exchange the auth code for tokens.
  let accessToken: string | undefined;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return bounce(origin, "/login?error=oauth_exchange");
    const tok = (await tokenRes.json()) as { access_token?: string };
    accessToken = tok.access_token;
  } catch {
    return bounce(origin, "/login?error=oauth_exchange");
  }
  if (!accessToken) return bounce(origin, "/login?error=oauth_exchange");

  // Fetch the profile.
  let profile: GoogleProfile;
  try {
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) return bounce(origin, "/login?error=oauth_profile");
    profile = (await infoRes.json()) as GoogleProfile;
  } catch {
    return bounce(origin, "/login?error=oauth_profile");
  }
  if (!profile.sub) return bounce(origin, "/login?error=oauth_profile");

  // Find or create the user (match by provider sub, then by verified email).
  let user = await findUserByProvider(env, "google", profile.sub);
  if (!user && profile.email) user = await findUserByEmail(env, profile.email);
  if (!user) {
    user = await createUser(env, {
      handle: profile.email ? profile.email.split("@")[0] : profile.name || "user",
      displayName: profile.name || profile.email?.split("@")[0] || "PlateSpin user",
      email: profile.email ?? null,
      avatarUrl: profile.picture ?? null,
      authProvider: "google",
      providerSub: profile.sub,
    });
  }

  const token = await createSession(env, user.id);
  return bounce(origin, "/", sessionCookie(token));
};
