// GET /api/venue-stats?ids=node/1,node/2,…  → VenueStats[]
// Powers friend-aware discovery (slice E): annotate the live wheel results with
// PlateSpin ratings, and call out which places your friends have rated.
import type { VenueStats } from "../../src/contract/types";
import type { Env } from "./_lib/env";
import { json } from "./_lib/http";
import { getSessionUser } from "./_lib/auth";

interface AggRow {
  venue_id: string;
  avg: number | null;
  count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const raw = (new URL(request.url).searchParams.get("ids") || "").trim();
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60);
  if (ids.length === 0) return json([] as VenueStats[]);

  const viewer = await getSessionUser(request, env);
  const placeholders = ids.map(() => "?").join(",");

  const allRes = await env.DB.prepare(
    `SELECT venue_id, AVG(rating) AS avg, COUNT(*) AS count
       FROM meals WHERE venue_id IN (${placeholders}) GROUP BY venue_id`,
  )
    .bind(...ids)
    .all<AggRow>();

  const byId = new Map<string, VenueStats>();
  for (const r of allRes.results ?? []) {
    byId.set(r.venue_id, {
      id: r.venue_id,
      avg: r.avg != null ? Math.round(r.avg * 10) / 10 : 0,
      count: Number(r.count) || 0,
    });
  }

  if (viewer) {
    const friendRes = await env.DB.prepare(
      `SELECT venue_id, AVG(rating) AS avg, COUNT(*) AS count
         FROM meals
        WHERE venue_id IN (${placeholders})
          AND user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)
        GROUP BY venue_id`,
    )
      .bind(...ids, viewer.id)
      .all<AggRow>();
    for (const r of friendRes.results ?? []) {
      const s = byId.get(r.venue_id) ?? { id: r.venue_id, avg: 0, count: 0 };
      s.friendAvg = r.avg != null ? Math.round(r.avg * 10) / 10 : 0;
      s.friendCount = Number(r.count) || 0;
      byId.set(r.venue_id, s);
    }
  }

  return json(Array.from(byId.values()));
};
