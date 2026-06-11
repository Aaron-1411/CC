// Session auth for PlateSpin v2: opaque tokens in an httpOnly cookie, backed by
// the D1 `sessions` table. No JWTs, no client-readable session state.

import type { Env, UserRow } from "./env";
import { nowSeconds, randomToken } from "./http";

export const COOKIE_NAME = "ps_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Build a Set-Cookie value for a fresh session. */
export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/** Build a Set-Cookie value that clears the session. */
export function clearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie") || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/** Create a session row and return the token to set as a cookie. */
export async function createSession(env: Env, userId: string): Promise<string> {
  const token = randomToken();
  const now = nowSeconds();
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  )
    .bind(token, userId, now, now + SESSION_TTL_SECONDS)
    .run();
  return token;
}

/** Resolve the current user from the session cookie, or null. Expired = null. */
export async function getSessionUser(request: Request, env: Env): Promise<UserRow | null> {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`,
  )
    .bind(token, nowSeconds())
    .first<UserRow>();
  return row ?? null;
}

/** Delete the session referenced by the request's cookie (logout). */
export async function deleteSession(request: Request, env: Env): Promise<void> {
  const token = parseCookies(request)[COOKIE_NAME];
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}
