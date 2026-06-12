// GET /api/venue?id=<osmId> — venue aggregate page: cached venue + rating stats
// (all PlateSpin + friends-only) + recent meals there.
// Query param (not a path segment) because OSM ids contain "/" e.g. "node/123".
import type { VenueAggregate, VenueLite, VenueStats } from "../../src/contract/types";
import type { CuisineId } from "../../src/contract/types";
import type { Env, VenueRow } from "./_lib/env";
import { error, json } from "./_lib/http";
import { getSessionUser } from "./_lib/auth";
import { fetchMeals, parseCsv } from "./_lib/data";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = (new URL(request.url).searchParams.get("id") || "").trim();
  if (!id) return error("id is required");

  const row = await env.DB.prepare("SELECT * FROM venues WHERE id = ?").bind(id).first<VenueRow>();
  if (!row) return error("Venue not found", 404);
  const viewer = await getSessionUser(request, env);

  const venue: VenueLite = {
    id: row.id,
    name: row.name,
    location: { lat: row.lat, lng: row.lng },
    address: row.address ?? undefined,
    cuisines: parseCsv(row.cuisines) as CuisineId[],
  };

  const all = await env.DB.prepare(
    "SELECT AVG(rating) AS avg, COUNT(*) AS count FROM meals WHERE venue_id = ?",
  )
    .bind(id)
    .first<{ avg: number | null; count: number }>();

  const stats: VenueStats = {
    id,
    avg: all?.avg != null ? Math.round(all.avg * 10) / 10 : 0,
    count: Number(all?.count) || 0,
  };

  if (viewer) {
    const friends = await env.DB.prepare(
      `SELECT AVG(rating) AS avg, COUNT(*) AS count FROM meals
        WHERE venue_id = ? AND user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)`,
    )
      .bind(id, viewer.id)
      .first<{ avg: number | null; count: number }>();
    if (friends && Number(friends.count) > 0) {
      stats.friendAvg = Math.round((friends.avg as number) * 10) / 10;
      stats.friendCount = Number(friends.count);
    }
  }

  const meals = await fetchMeals(env, { venueId: id, viewerId: viewer?.id ?? null, limit: 50 });
  const body: VenueAggregate = { venue, stats, meals };
  return json(body);
};
