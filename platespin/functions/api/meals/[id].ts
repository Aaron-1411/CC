// /api/meals/:id
//   GET    → Meal (single)
//   DELETE → remove your own meal (auth + ownership required)
import type { Env } from "../_lib/env";
import { error, json } from "../_lib/http";
import { getSessionUser } from "../_lib/auth";
import { fetchMeals } from "../_lib/data";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = String(params.id);
  const viewer = await getSessionUser(request, env);
  const [meal] = await fetchMeals(env, { mealId: id, viewerId: viewer?.id ?? null, limit: 1 });
  if (!meal) return error("Meal not found", 404);
  return json(meal);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = String(params.id);
  const user = await getSessionUser(request, env);
  if (!user) return error("Sign in first", 401);

  const owner = await env.DB.prepare("SELECT user_id FROM meals WHERE id = ?")
    .bind(id)
    .first<{ user_id: string }>();
  if (!owner) return error("Meal not found", 404);
  if (owner.user_id !== user.id) return error("Not your meal", 403);

  await env.DB.prepare("DELETE FROM meals WHERE id = ?").bind(id).run();
  return json({ ok: true });
};
