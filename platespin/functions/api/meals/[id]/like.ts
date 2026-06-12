// /api/meals/:id/like  — POST to like, DELETE to unlike. Returns the fresh count.
import type { Env } from "../../_lib/env";
import { error, json, nowSeconds } from "../../_lib/http";
import { getSessionUser } from "../../_lib/auth";

async function likeState(env: Env, mealId: string, userId: string) {
  const count = await env.DB.prepare("SELECT COUNT(*) AS c FROM likes WHERE meal_id = ?")
    .bind(mealId)
    .first<{ c: number }>();
  const mine = await env.DB.prepare("SELECT 1 FROM likes WHERE meal_id = ? AND user_id = ?")
    .bind(mealId, userId)
    .first();
  return { likeCount: Number(count?.c) || 0, likedByMe: Boolean(mine) };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await getSessionUser(request, env);
  if (!user) return error("Sign in first", 401);
  const mealId = String(params.id);
  await env.DB.prepare(
    "INSERT OR IGNORE INTO likes (user_id, meal_id, created_at) VALUES (?, ?, ?)",
  )
    .bind(user.id, mealId, nowSeconds())
    .run();
  return json(await likeState(env, mealId, user.id));
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await getSessionUser(request, env);
  if (!user) return error("Sign in first", 401);
  const mealId = String(params.id);
  await env.DB.prepare("DELETE FROM likes WHERE user_id = ? AND meal_id = ?")
    .bind(user.id, mealId)
    .run();
  return json(await likeState(env, mealId, user.id));
};
