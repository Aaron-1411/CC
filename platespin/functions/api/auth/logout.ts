// POST /api/auth/logout — destroy the session row and clear the cookie.
import type { Env } from "../_lib/env";
import { json } from "../_lib/http";
import { clearCookie, deleteSession } from "../_lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await deleteSession(request, env);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
};
