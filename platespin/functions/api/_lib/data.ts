// Shared data access + DTO mapping for v2. Keeps SQL and the snake_case→camelCase
// translation in one place so every endpoint returns identical contract shapes.

import type { CuisineId, DietId, Meal, PublicUser, VenueLite } from "../../../src/contract/types";
import type { Env, UserRow } from "./env";
import { nowSeconds } from "./http";

export function toPublicUser(r: UserRow): PublicUser {
  return {
    id: r.id,
    handle: r.handle,
    displayName: r.display_name,
    avatarUrl: r.avatar_url ?? undefined,
    bio: r.bio ?? undefined,
    createdAt: r.created_at,
  };
}

export function parseCsv(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function toCsv(arr: string[] | undefined): string | null {
  if (!arr || arr.length === 0) return null;
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean))).join(",");
}

/** Photo key → same-origin URL served by /api/photo/[key]. */
export function photoUrl(key: string | null | undefined): string | undefined {
  return key ? `/api/photo/${encodeURIComponent(key)}` : undefined;
}

/** Insert the venue if we haven't cached it yet (id is the OSM id from the proxy). */
export async function upsertVenue(env: Env, v: VenueLite): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO venues (id, name, lat, lng, address, cuisines, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'osm', ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       lat = excluded.lat,
       lng = excluded.lng,
       address = COALESCE(excluded.address, venues.address),
       cuisines = COALESCE(excluded.cuisines, venues.cuisines)`,
  )
    .bind(
      v.id,
      v.name,
      v.location.lat,
      v.location.lng,
      v.address ?? null,
      toCsv(v.cuisines),
      nowSeconds(),
    )
    .run();
}

// Row shape returned by the joined meal query below.
interface MealJoinRow {
  id: string;
  dish: string;
  rating: number;
  note: string | null;
  photo_key: string | null;
  diet_tags: string | null;
  eaten_on: string | null;
  created_at: number;
  a_id: string;
  a_handle: string;
  a_display_name: string;
  a_avatar_url: string | null;
  a_bio: string | null;
  a_created_at: number;
  v_id: string;
  v_name: string;
  v_lat: number;
  v_lng: number;
  v_address: string | null;
  v_cuisines: string | null;
  like_count: number;
  liked_by_me: number;
}

function joinRowToMeal(r: MealJoinRow): Meal {
  return {
    id: r.id,
    author: {
      id: r.a_id,
      handle: r.a_handle,
      displayName: r.a_display_name,
      avatarUrl: r.a_avatar_url ?? undefined,
      bio: r.a_bio ?? undefined,
      createdAt: r.a_created_at,
    },
    venue: {
      id: r.v_id,
      name: r.v_name,
      location: { lat: r.v_lat, lng: r.v_lng },
      address: r.v_address ?? undefined,
      cuisines: parseCsv(r.v_cuisines) as CuisineId[],
    },
    dish: r.dish,
    rating: r.rating,
    note: r.note ?? undefined,
    photoUrl: photoUrl(r.photo_key),
    dietTags: parseCsv(r.diet_tags) as DietId[],
    eatenOn: r.eaten_on ?? undefined,
    createdAt: r.created_at,
    likeCount: Number(r.like_count) || 0,
    likedByMe: Number(r.liked_by_me) > 0,
  };
}

const MEAL_SELECT = `
  SELECT m.id, m.dish, m.rating, m.note, m.photo_key, m.diet_tags, m.eaten_on, m.created_at,
         u.id AS a_id, u.handle AS a_handle, u.display_name AS a_display_name,
         u.avatar_url AS a_avatar_url, u.bio AS a_bio, u.created_at AS a_created_at,
         v.id AS v_id, v.name AS v_name, v.lat AS v_lat, v.lng AS v_lng,
         v.address AS v_address, v.cuisines AS v_cuisines,
         (SELECT COUNT(*) FROM likes l WHERE l.meal_id = m.id) AS like_count,
         (SELECT COUNT(*) FROM likes l2 WHERE l2.meal_id = m.id AND l2.user_id = ?) AS liked_by_me
  FROM meals m
  JOIN users u ON u.id = m.user_id
  JOIN venues v ON v.id = m.venue_id`;

export interface MealQuery {
  viewerId?: string | null; // for likedByMe + "following" scope
  scope?: "following" | "everyone";
  authorId?: string; // meals by a specific user
  venueId?: string; // meals at a specific venue
  mealId?: string; // a single meal by id
  limit?: number;
}

/** The one meals reader — used by the feed, profiles, venue and detail pages. */
export async function fetchMeals(env: Env, q: MealQuery): Promise<Meal[]> {
  const viewer = q.viewerId ?? "";
  const limit = Math.max(1, Math.min(q.limit ?? 30, 100));
  const where: string[] = [];
  const params: unknown[] = [viewer]; // first ? is the liked_by_me viewer id

  if (q.mealId) {
    where.push("m.id = ?");
    params.push(q.mealId);
  }
  if (q.authorId) {
    where.push("m.user_id = ?");
    params.push(q.authorId);
  }
  if (q.venueId) {
    where.push("m.venue_id = ?");
    params.push(q.venueId);
  }
  if (q.scope === "following" && q.viewerId) {
    // followees + self, so a new user's own posts still appear in their feed.
    where.push(
      "(m.user_id = ? OR m.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))",
    );
    params.push(q.viewerId, q.viewerId);
  }

  const sql =
    MEAL_SELECT +
    (where.length ? `\n  WHERE ${where.join(" AND ")}` : "") +
    "\n  ORDER BY m.created_at DESC\n  LIMIT ?";
  params.push(limit);

  const res = await env.DB.prepare(sql)
    .bind(...params)
    .all<MealJoinRow>();
  return (res.results ?? []).map(joinRowToMeal);
}
