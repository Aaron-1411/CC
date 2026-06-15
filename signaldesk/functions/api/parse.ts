// POST /api/parse { content } -> SignalWithTrades (manual paste path).
// Parses freeform text, stores it (idempotent on the generated id), and
// returns the stored signal so the client can select it immediately.
import { type Env, error, json, requireDB } from '../_lib/http';
import { getSignal, insertSignalIfNew } from '../_lib/db';
import { parseSignal, pastedRaw } from '../_lib/parse';

interface Body {
  content?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return error('Invalid JSON body.');
  }
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) return error('Paste some signal text first.');

  const raw = pastedRaw(content);
  const signal = await parseSignal(raw, env);
  await insertSignalIfNew(db, signal, raw);

  const stored = await getSignal(db, signal.id);
  return json(stored ?? { signal, raw, trades: [] });
};
