// POST /api/trades (body: UserTrade) -> upsert, returns the stored trade.
import { type Env, error, json, requireDB } from '../_lib/http';
import { upsertTrade } from '../_lib/db';
import type { UserTrade } from '../../src/types/contract';

function isValidTrade(t: Partial<UserTrade>): t is UserTrade {
  return (
    typeof t.id === 'string' &&
    typeof t.signalId === 'string' &&
    (t.direction === 'long' || t.direction === 'short') &&
    typeof t.entryPrice === 'number' &&
    typeof t.entryTime === 'string' &&
    (t.status === 'open' || t.status === 'closed')
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;

  let body: Partial<UserTrade>;
  try {
    body = (await request.json()) as Partial<UserTrade>;
  } catch {
    return error('Invalid JSON body.');
  }
  if (!isValidTrade(body)) return error('Malformed trade payload.');

  await upsertTrade(db, body);
  return json(body);
};
