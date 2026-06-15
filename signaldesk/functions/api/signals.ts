// GET /api/signals -> SignalWithTrades[] (newest first).
import { type Env, json, requireDB } from '../_lib/http';
import { listSignals } from '../_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;
  return json(await listSignals(db));
};
