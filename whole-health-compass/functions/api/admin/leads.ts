// GET /api/admin/leads — clinic inbox for the token-gated dashboard.
//
// Auth: Authorization: Bearer <ADMIN_TOKEN>. When ADMIN_TOKEN is unset the
// endpoint reports 503 (not configured) rather than exposing data. When D1 is
// unbound it returns an empty list with storage:false so the dashboard can show
// a friendly "persistence not activated yet" state.

import { type Env, json, slug, requireAdmin, ensureSchema } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const denied = requireAdmin(request, env);
  if (denied) return denied;

  if (!env.DB) return json({ ok: true, storage: false, leads: [] });

  const url = new URL(request.url);
  const clinicId = slug(url.searchParams.get("clinicId"), 48);

  try {
    await ensureSchema(env.DB);
    const stmt = clinicId
      ? env.DB.prepare(
          `SELECT id, clinic_id, name, email, phone, message, concern_id, concern_label,
                  include_summary, consent_version, consented_at, source, ts
             FROM leads WHERE clinic_id = ? ORDER BY ts DESC LIMIT 200`,
        ).bind(clinicId)
      : env.DB.prepare(
          `SELECT id, clinic_id, name, email, phone, message, concern_id, concern_label,
                  include_summary, consent_version, consented_at, source, ts
             FROM leads ORDER BY ts DESC LIMIT 200`,
        );
    const { results } = await stmt.all();
    return json({ ok: true, storage: true, leads: results ?? [] });
  } catch {
    return json({ ok: true, storage: false, leads: [], error: "read_failed" });
  }
};
