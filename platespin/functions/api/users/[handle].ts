// GET /api/users/:handle — public profile + social counts + viewer relation.
import type { UserProfile } from "../../../src/contract/types";
import type { Env } from "../_lib/env";
import { error, json } from "../_lib/http";
import { getSessionUser } from "../_lib/auth";
import { toPublicUser } from "../_lib/data";
import { findUserByHandle } from "../_lib/users";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const handle = String(params.handle).toLowerCase();
  const user = await findUserByHandle(env, handle);
  if (!user) return error("User not found", 404);
  const viewer = await getSessionUser(request, env);

  const followerCount = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?",
  )
    .bind(user.id)
    .first<{ c: number }>();
  const followingCount = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?",
  )
    .bind(user.id)
    .first<{ c: number }>();
  const mealAgg = await env.DB.prepare(
    "SELECT COUNT(*) AS c, AVG(rating) AS avg FROM meals WHERE user_id = ?",
  )
    .bind(user.id)
    .first<{ c: number; avg: number | null }>();

  let isFollowing = false;
  if (viewer && viewer.id !== user.id) {
    const f = await env.DB.prepare(
      "SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?",
    )
      .bind(viewer.id, user.id)
      .first();
    isFollowing = Boolean(f);
  }

  const profile: UserProfile = {
    ...toPublicUser(user),
    followerCount: Number(followerCount?.c) || 0,
    followingCount: Number(followingCount?.c) || 0,
    mealCount: Number(mealAgg?.c) || 0,
    avgRating: mealAgg?.avg != null ? Math.round(mealAgg.avg * 10) / 10 : undefined,
    isFollowing,
    isSelf: viewer?.id === user.id,
  };
  return json(profile);
};
