// /api/follows
//   POST { handle, action: "follow" | "unfollow" }  (auth required)
//   GET  ?handle=<h>&type=followers|following  → PublicUser[]
import type { PublicUser } from "../../src/contract/types";
import type { Env, UserRow } from "./_lib/env";
import { error, json, nowSeconds, readJson } from "./_lib/http";
import { getSessionUser } from "./_lib/auth";
import { toPublicUser } from "./_lib/data";
import { findUserByHandle } from "./_lib/users";

interface PostBody {
  handle?: string;
  action?: "follow" | "unfollow";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const me = await getSessionUser(request, env);
  if (!me) return error("Sign in first", 401);
  const body = await readJson<PostBody>(request);
  if (!body?.handle || (body.action !== "follow" && body.action !== "unfollow")) {
    return error("handle and action are required");
  }

  const target = await findUserByHandle(env, body.handle.toLowerCase());
  if (!target) return error("User not found", 404);
  if (target.id === me.id) return error("You can't follow yourself");

  if (body.action === "follow") {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)",
    )
      .bind(me.id, target.id, nowSeconds())
      .run();
  } else {
    await env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?")
      .bind(me.id, target.id)
      .run();
  }
  return json({ ok: true, following: body.action === "follow" });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const handle = url.searchParams.get("handle");
  const type = url.searchParams.get("type") === "followers" ? "followers" : "following";
  if (!handle) return error("handle is required");

  const user = await findUserByHandle(env, handle.toLowerCase());
  if (!user) return json([] as PublicUser[]);

  // followers: who follows USER  → join on follower; following: who USER follows.
  const sql =
    type === "followers"
      ? `SELECT u.* FROM follows f JOIN users u ON u.id = f.follower_id
         WHERE f.followee_id = ? ORDER BY f.created_at DESC LIMIT 200`
      : `SELECT u.* FROM follows f JOIN users u ON u.id = f.followee_id
         WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT 200`;
  const res = await env.DB.prepare(sql).bind(user.id).all<UserRow>();
  return json((res.results ?? []).map(toPublicUser));
};
