// POST /api/auth/signup  { email, password, displayName, handle }
// Email + password account creation with profile (handle + display name).
// Self-contained: no email delivery required to sign up or sign in.
import type { Env } from "../_lib/env";
import { error, json, readJson } from "../_lib/http";
import { createSession, sessionCookie } from "../_lib/auth";
import { createUser, findUserByEmail, findUserByHandle, normalizeHandle } from "../_lib/users";
import { hashPassword } from "../_lib/password";
import { toPublicUser } from "../_lib/data";

interface Body {
  email?: string;
  password?: string;
  displayName?: string;
  handle?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  if (!body) return error("Invalid body");

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const displayName = (body.displayName || "").trim();
  const handle = normalizeHandle(body.handle || "");

  if (!EMAIL_RE.test(email)) return error("Enter a valid email address.");
  if (password.length < 8) return error("Password must be at least 8 characters.");
  if (displayName.length < 1) return error("Add a display name.");
  if (handle.length < 3) return error("Handle must be 3–20 letters, numbers or underscores.");

  if (await findUserByEmail(env, email))
    return error("That email already has an account — sign in instead.", 409);
  if (await findUserByHandle(env, handle))
    return error(`@${handle} is taken — try another.`, 409);

  const passwordHash = await hashPassword(password);
  const user = await createUser(env, {
    handle,
    displayName,
    email,
    authProvider: "email",
    passwordHash,
  });

  const token = await createSession(env, user.id);
  return json({ user: toPublicUser(user) }, 201, { "set-cookie": sessionCookie(token) });
};
