// GET /api/journal -> JournalStats over all signals + trades.
import { type Env, json, requireDB } from '../_lib/http';
import { listSignals } from '../_lib/db';
import { computeStats } from '../_lib/stats';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;
  const items = await listSignals(db);
  const stats = computeStats(
    items.map((it) => ({ signal: it.signal, trades: it.trades })),
  );
  return json(stats);
};
