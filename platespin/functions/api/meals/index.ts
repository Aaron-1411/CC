// /api/meals
//   GET  ?scope=following|everyone & author=<handle> & venue=<id> & limit=<n>
//        → Meal[]  (feed, profile timeline, or venue timeline)
//   POST  body: CreateMealInput  → Meal  (auth required)
import type { CreateMealInput, Meal } from "../../../src/contract/types";
import type { Env } from "../_lib/env";
import { error, json, nowSeconds, readJson } from "../_lib/http";
import { getSessionUser } from "../_lib/auth";
import { fetchMeals, toCsv, upsertVenue } from "../_lib/data";
import { findUserByHandle } from "../_lib/users";

const VALID_RATING = (r: unknown): r is number =>
  typeof r === "number" && Number.isFinite(r) && r >= 0.5 && r <= 5 && (r * 2) % 1 === 0;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const viewer = await getSessionUser(request, env);
  const scope = url.searchParams.get("scope") === "following" ? "following" : "everyone";
  const limit = Number(url.searchParams.get("limit")) || 30;

  let authorId: string | undefined;
  const authorHandle = url.searchParams.get("author");
  if (authorHandle) {
    const author = await findUserByHandle(env, authorHandle.toLowerCase());
    if (!author) return json([] as Meal[]);
    authorId = author.id;
  }

  const meals = await fetchMeals(env, {
    viewerId: viewer?.id ?? null,
    scope,
    authorId,
    venueId: url.searchParams.get("venue") ?? undefined,
    limit,
  });
  return json(meals);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return error("Sign in to post a meal", 401);

  const body = await readJson<CreateMealInput>(request);
  if (!body) return error("Invalid body");
  if (!body.venue?.id || !body.venue?.name || !body.venue?.location) {
    return error("A venue is required");
  }
  const dish = (body.dish || "").trim();
  if (!dish) return error("What did you eat? (dish is required)");
  if (!VALID_RATING(body.rating)) return error("Rating must be between 0.5 and 5 in half steps");

  await upsertVenue(env, body.venue);

  const id = crypto.randomUUID();
  const now = nowSeconds();
  await env.DB.prepare(
    `INSERT INTO meals (id, user_id, venue_id, dish, rating, note, photo_key, diet_tags, eaten_on, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      user.id,
      body.venue.id,
      dish.slice(0, 140),
      body.rating,
      body.note ? body.note.slice(0, 2000) : null,
      body.photoKey ?? null,
      toCsv(body.dietTags),
      body.eatenOn ?? null,
      now,
    )
    .run();

  const [meal] = await fetchMeals(env, { mealId: id, viewerId: user.id, limit: 1 });
  return json(meal, 201);
};
