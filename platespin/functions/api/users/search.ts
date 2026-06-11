// GET /api/users/search?q=<text> — find people by handle or display name.
import type { Env, UserRow } from "../_lib/env";
import { json } from "../_lib/http";
import { toPublicUser } from "../_lib/data";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const q = (new URL(request.url).searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) return json([]);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const res = await env.DB.prepare(
    `SELECT * FROM users
      WHERE handle LIKE ? OR lower(display_name) LIKE ?
      ORDER BY handle LIMIT 20`,
  )
    .bind(like, like)
    .all<UserRow>();
  return json((res.results ?? []).map(toPublicUser));
};
