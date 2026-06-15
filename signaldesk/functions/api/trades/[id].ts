// DELETE /api/trades/:id -> { ok: true }.
import { type Env, json, requireDB } from '../../_lib/http';
import { deleteTrade } from '../../_lib/db';

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;
  await deleteTrade(db, String(params.id));
  return json({ ok: true });
};
