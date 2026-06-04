// GET /api/admin/stats — funnel metrics for the token-gated dashboard.
//
// Returns event counts, a derived conversion funnel, a by-concern breakdown and
// lead totals. Degrades to an empty/zeroed shape when D1 is unbound so the
// dashboard renders without errors before persistence is activated.

import { type Env, json, slug, requireAdmin, ensureSchema } from "../../_shared";

// The ordered funnel we report a conversion rate across. Every rung maps to an
// event the client actually fires, so no step shows a misleading zero.
const FUNNEL: { key: string; label: string }[] = [
  { key: "landing_view", label: "Visited site" },
  { key: "compass_start", label: "Started the Compass" },
  { key: "compass_concern_select", label: "Chose a concern" },
  { key: "compass_summary_view", label: "Reached their summary" },
  { key: "lead_submit", label: "Sent an enquiry" },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const empty = {
    ok: true,
    storage: false,
    totals: { events: 0, leads: 0 },
    funnel: FUNNEL.map((f) => ({ ...f, count: 0 })),
    byConcern: [] as { concernId: string; count: number }[],
    byEvent: [] as { name: string; count: number }[],
  };

  if (!env.DB) return json(empty);

  const url = new URL(request.url);
  const clinicId = slug(url.searchParams.get("clinicId"), 48);
  const where = clinicId ? "WHERE clinic_id = ?" : "";
  const bind = (stmt: D1PreparedStatement) => (clinicId ? stmt.bind(clinicId) : stmt);

  try {
    await ensureSchema(env.DB);

    const byEventQ = bind(
      env.DB.prepare(`SELECT name, COUNT(*) AS count FROM events ${where} GROUP BY name`),
    );
    const byConcernQ = bind(
      env.DB.prepare(
        `SELECT concern_id AS concernId, COUNT(*) AS count FROM events
          ${where ? where + " AND" : "WHERE"} concern_id IS NOT NULL
          GROUP BY concern_id ORDER BY count DESC`,
      ),
    );
    const leadsQ = bind(env.DB.prepare(`SELECT COUNT(*) AS count FROM leads ${where}`));

    const [byEventRes, byConcernRes, leadsRes] = await Promise.all([
      byEventQ.all<{ name: string; count: number }>(),
      byConcernQ.all<{ concernId: string; count: number }>(),
      leadsQ.first<{ count: number }>(),
    ]);

    const eventCounts = new Map<string, number>();
    let totalEvents = 0;
    for (const row of byEventRes.results ?? []) {
      eventCounts.set(row.name, row.count);
      totalEvents += row.count;
    }

    return json({
      ok: true,
      storage: true,
      totals: { events: totalEvents, leads: leadsRes?.count ?? 0 },
      funnel: FUNNEL.map((f) => ({ ...f, count: eventCounts.get(f.key) ?? 0 })),
      byConcern: byConcernRes.results ?? [],
      byEvent: (byEventRes.results ?? []).sort((a, b) => b.count - a.count),
    });
  } catch {
    return json(empty);
  }
};
