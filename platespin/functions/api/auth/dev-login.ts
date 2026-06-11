// POST /api/auth/dev-login  { handle, displayName }
// No-OAuth login for local/preview testing. Gated behind ALLOW_DEV_LOGIN="1" so it
// can never be hit in production. Creates the user on first use, else logs in.
import type { Env } from "../_lib/env";
import { error, json, readJson } from "../_lib/http";
import { createSession, sessionCookie } from "../_lib/auth";
import { createUser, findUserByHandle, normalizeHandle } from "../_lib/users";
import { toPublicUser } from "../_lib/data";

interface Body {
  handle?: string;
  displayName?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (env.ALLOW_DEV_LOGIN !== "1") return error("Dev login is disabled", 403);
  const body = await readJson<Body>(request);
  if (!body) return error("Invalid body");

  const handle = normalizeHandle(body.handle || body.displayName || "");
  if (handle.length < 3) return error("Handle must be at least 3 characters");

  let user = await findUserByHandle(env, handle);
  if (!user) {
    user = await createUser(env, {
      handle,
      displayName: body.displayName?.trim() || handle,
      authProvider: "dev",
    });
  }

  const token = await createSession(env, user.id);
  return json({ user: toPublicUser(user) }, 200, { "set-cookie": sessionCookie(token) });
};
