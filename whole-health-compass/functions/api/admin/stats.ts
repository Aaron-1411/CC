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

  const emptyImpact = {
    uniqueVisitors: 0,
    enquiries: 0,
    preparedEnquiries: 0,
    enquiryRatePct: 0,
    preparednessPct: 0,
    avgMinutesToEnquiry: null as number | null,
    convertingSessions: 0,
    trend: { last30: 0, prev30: 0 },
  };

  const empty = {
    ok: true,
    storage: false,
    totals: { events: 0, leads: 0 },
    funnel: FUNNEL.map((f) => ({ ...f, count: 0 })),
    byConcern: [] as { concernId: string; count: number }[],
    byEvent: [] as { name: string; count: number }[],
    impact: emptyImpact,
  };

  if (!env.DB) return json(empty);

  const url = new URL(request.url);
  const clinicId = slug(url.searchParams.get("clinicId"), 48);
  const where = clinicId ? "WHERE clinic_id = ?" : "";
  const bind = (stmt: D1PreparedStatement) => (clinicId ? stmt.bind(clinicId) : stmt);

  try {
    await ensureSchema(env.DB);

    // `where` filters by clinic when present; the "+ AND" variant lets us append
    // a further predicate to the same clause without duplicating the binding.
    const andWhere = where ? where + " AND" : "WHERE";

    const byEventQ = bind(
      env.DB.prepare(`SELECT name, COUNT(*) AS count FROM events ${where} GROUP BY name`),
    );
    const byConcernQ = bind(
      env.DB.prepare(
        `SELECT concern_id AS concernId, COUNT(*) AS count FROM events
          ${andWhere} concern_id IS NOT NULL
          GROUP BY concern_id ORDER BY count DESC`,
      ),
    );
    const leadsQ = bind(env.DB.prepare(`SELECT COUNT(*) AS count FROM leads ${where}`));

    // ── Impact metrics ────────────────────────────────────────────────────────
    // The funnel proves engagement; these prove outcomes. Unique visitors come
    // from the per-session anon_id (cookieless), "prepared" enquiries are leads
    // that chose to attach their Compass summary, and time-to-enquiry is measured
    // per session from first event to lead_submit. All clinic-scoped when filtered.
    const visitorsQ = bind(
      env.DB.prepare(
        `SELECT COUNT(DISTINCT anon_id) AS count FROM events ${andWhere} anon_id IS NOT NULL`,
      ),
    );
    const preparedQ = bind(
      env.DB.prepare(`SELECT COUNT(*) AS count FROM leads ${andWhere} include_summary = 1`),
    );
    const convertingQ = bind(
      env.DB.prepare(
        `SELECT COUNT(DISTINCT anon_id) AS count FROM events
          ${andWhere} name = 'lead_submit' AND anon_id IS NOT NULL`,
      ),
    );
    // Per-session funnel duration: earliest event → earliest lead_submit, averaged
    // over sessions that actually enquired (guards against clock skew with >=).
    const timeQ = bind(
      env.DB.prepare(
        `WITH sess AS (
           SELECT anon_id, MIN(ts) AS first_ts,
                  MIN(CASE WHEN name = 'lead_submit' THEN ts END) AS lead_ts
             FROM events
             ${andWhere} anon_id IS NOT NULL
             GROUP BY anon_id
         )
         SELECT AVG(lead_ts - first_ts) AS avgMs, COUNT(*) AS n
           FROM sess WHERE lead_ts IS NOT NULL AND lead_ts >= first_ts`,
      ),
    );
    // 30-day momentum on enquiries. Binds are explicit (dates first, clinic last)
    // because this query mixes date predicates with the optional clinic filter.
    const now = Date.now();
    const d30 = now - 30 * 86_400_000;
    const d60 = now - 60 * 86_400_000;
    const trendBinds = clinicId ? [d30, d60, d30, clinicId] : [d30, d60, d30];
    const trendQ = env.DB.prepare(
      `SELECT
         SUM(CASE WHEN ts >= ? THEN 1 ELSE 0 END) AS last30,
         SUM(CASE WHEN ts >= ? AND ts < ? THEN 1 ELSE 0 END) AS prev30
       FROM leads ${where}`,
    ).bind(...trendBinds);

    const [byEventRes, byConcernRes, leadsRes, visitorsRes, preparedRes, convertingRes, timeRes, trendRes] =
      await Promise.all([
        byEventQ.all<{ name: string; count: number }>(),
        byConcernQ.all<{ concernId: string; count: number }>(),
        leadsQ.first<{ count: number }>(),
        visitorsQ.first<{ count: number }>(),
        preparedQ.first<{ count: number }>(),
        convertingQ.first<{ count: number }>(),
        timeQ.first<{ avgMs: number | null; n: number }>(),
        trendQ.first<{ last30: number | null; prev30: number | null }>(),
      ]);

    const eventCounts = new Map<string, number>();
    let totalEvents = 0;
    for (const row of byEventRes.results ?? []) {
      eventCounts.set(row.name, row.count);
      totalEvents += row.count;
    }

    const leads = leadsRes?.count ?? 0;
    const uniqueVisitors = visitorsRes?.count ?? 0;
    const preparedEnquiries = preparedRes?.count ?? 0;
    const avgMs = timeRes?.avgMs ?? null;
    // One-decimal percentage; 0 when the denominator is empty (no false rates).
    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    const impact = {
      uniqueVisitors,
      enquiries: leads,
      preparedEnquiries,
      enquiryRatePct: pct(leads, uniqueVisitors),
      preparednessPct: pct(preparedEnquiries, leads),
      avgMinutesToEnquiry: avgMs != null ? Math.round(avgMs / 60_000) : null,
      convertingSessions: convertingRes?.count ?? 0,
      trend: { last30: trendRes?.last30 ?? 0, prev30: trendRes?.prev30 ?? 0 },
    };

    return json({
      ok: true,
      storage: true,
      totals: { events: totalEvents, leads },
      funnel: FUNNEL.map((f) => ({ ...f, count: eventCounts.get(f.key) ?? 0 })),
      byConcern: byConcernRes.results ?? [],
      byEvent: (byEventRes.results ?? []).sort((a, b) => b.count - a.count),
      impact,
    });
  } catch {
    return json(empty);
  }
};
