// POST /api/auth/login  { email, password }
// Email + password sign-in. Generic error on any failure so we never reveal
// whether an email is registered.
import type { Env } from "../_lib/env";
import { error, json, readJson } from "../_lib/http";
import { createSession, sessionCookie } from "../_lib/auth";
import { findUserByEmail } from "../_lib/users";
import { verifyPassword } from "../_lib/password";
import { toPublicUser } from "../_lib/data";

interface Body {
  email?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  if (!body) return error("Invalid body");

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) return error("Enter your email and password.");

  const user = await findUserByEmail(env, email);
  const ok = user && (await verifyPassword(password, user.password_hash));
  if (!user || !ok) return error("Wrong email or password.", 401);

  const token = await createSession(env, user.id);
  return json({ user: toPublicUser(user) }, 200, { "set-cookie": sessionCookie(token) });
};
