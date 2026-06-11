// GET /api/auth/me — current user (or null) + which login methods are configured.
import type { Env } from "../_lib/env";
import { json } from "../_lib/http";
import { getSessionUser } from "../_lib/auth";
import { toPublicUser } from "../_lib/data";
import type { MeResponse } from "../../../src/contract/types";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  const body: MeResponse = {
    user: user ? toPublicUser(user) : null,
    authMethods: {
      dev: env.ALLOW_DEV_LOGIN === "1",
      google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      email: Boolean(env.RESEND_API_KEY),
    },
  };
  return json(body);
};
