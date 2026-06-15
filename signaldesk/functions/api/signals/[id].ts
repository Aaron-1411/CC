// GET /api/signals/:id -> SignalWithTrades | 404.
import { type Env, error, json, requireDB } from '../../_lib/http';
import { getSignal } from '../../_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;
  const id = String(params.id);
  const signal = await getSignal(db, id);
  if (!signal) return error('Signal not found.', 404);
  return json(signal);
};
