// D1 access layer. All SQL lives here; route handlers stay thin.
// Rows store contract objects as JSON so the schema never drifts from the
// shared types in src/types/contract.ts.

import type { D1Database } from '@cloudflare/workers-types';
import type {
  ParsedSignal,
  RawDiscordMessage,
  SignalWithTrades,
  UserTrade,
} from '../../src/types/contract';

// CREATE-IF-NOT-EXISTS DDL, mirrored from schema.sql. Run lazily so a fresh
// deploy (or `wrangler pages dev` without `d1:init`) self-heals on first use.
const DDL = [
  `CREATE TABLE IF NOT EXISTS signals (
     id TEXT PRIMARY KEY,
     raw_json TEXT NOT NULL,
     parsed_json TEXT NOT NULL,
     signal_time TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS trades (
     id TEXT PRIMARY KEY,
     signal_id TEXT NOT NULL,
     trade_json TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sync_state (
     channel_id TEXT PRIMARY KEY,
     last_message_id TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS candle_cache (
     cache_key TEXT PRIMARY KEY,
     payload TEXT NOT NULL,
     fetched_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_signals_time ON signals(signal_time DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_trades_signal ON trades(signal_id)`,
];

let schemaReady = false;

export async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;
  await db.batch(DDL.map((stmt) => db.prepare(stmt)));
  schemaReady = true;
}

interface SignalRow {
  id: string;
  raw_json: string;
  parsed_json: string;
}
interface TradeRow {
  signal_id: string;
  trade_json: string;
}

function rowToSignal(row: SignalRow, trades: UserTrade[]): SignalWithTrades {
  return {
    signal: JSON.parse(row.parsed_json) as ParsedSignal,
    raw: JSON.parse(row.raw_json) as RawDiscordMessage,
    trades,
  };
}

export async function listSignals(db: D1Database): Promise<SignalWithTrades[]> {
  await ensureSchema(db);
  const [sigRes, tradeRes] = await db.batch<SignalRow | TradeRow>([
    db.prepare(`SELECT id, raw_json, parsed_json FROM signals ORDER BY signal_time DESC`),
    db.prepare(`SELECT signal_id, trade_json FROM trades`),
  ]);

  const tradesBySignal = new Map<string, UserTrade[]>();
  for (const r of (tradeRes.results as TradeRow[]) ?? []) {
    const trade = JSON.parse(r.trade_json) as UserTrade;
    const arr = tradesBySignal.get(r.signal_id);
    if (arr) arr.push(trade);
    else tradesBySignal.set(r.signal_id, [trade]);
  }

  return ((sigRes.results as SignalRow[]) ?? []).map((row) =>
    rowToSignal(row, tradesBySignal.get(row.id) ?? []),
  );
}

export async function getSignal(
  db: D1Database,
  id: string,
): Promise<SignalWithTrades | null> {
  await ensureSchema(db);
  const row = await db
    .prepare(`SELECT id, raw_json, parsed_json FROM signals WHERE id = ?`)
    .bind(id)
    .first<SignalRow>();
  if (!row) return null;
  const trades = await db
    .prepare(`SELECT signal_id, trade_json FROM trades WHERE signal_id = ?`)
    .bind(id)
    .all<TradeRow>();
  const parsed = (trades.results ?? []).map((t) => JSON.parse(t.trade_json) as UserTrade);
  return rowToSignal(row, parsed);
}

// Insert a freshly-parsed signal. Returns false if the id already existed
// (idempotent sync), true if a new row was written.
export async function insertSignalIfNew(
  db: D1Database,
  signal: ParsedSignal,
  raw: RawDiscordMessage,
): Promise<boolean> {
  await ensureSchema(db);
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO signals (id, raw_json, parsed_json, signal_time, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      signal.id,
      JSON.stringify(raw),
      JSON.stringify(signal),
      signal.signalTime,
      new Date().toISOString(),
    )
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function upsertTrade(db: D1Database, trade: UserTrade): Promise<void> {
  await ensureSchema(db);
  await db
    .prepare(
      `INSERT INTO trades (id, signal_id, trade_json, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(id) DO UPDATE SET
         signal_id = ?2, trade_json = ?3, updated_at = ?4`,
    )
    .bind(trade.id, trade.signalId, JSON.stringify(trade), new Date().toISOString())
    .run();
}

export async function deleteTrade(db: D1Database, id: string): Promise<void> {
  await ensureSchema(db);
  await db.prepare(`DELETE FROM trades WHERE id = ?`).bind(id).run();
}

export async function getLastMessageId(
  db: D1Database,
  channelId: string,
): Promise<string | null> {
  await ensureSchema(db);
  const row = await db
    .prepare(`SELECT last_message_id FROM sync_state WHERE channel_id = ?`)
    .bind(channelId)
    .first<{ last_message_id: string | null }>();
  return row?.last_message_id ?? null;
}

export async function setLastMessageId(
  db: D1Database,
  channelId: string,
  messageId: string,
): Promise<void> {
  await ensureSchema(db);
  await db
    .prepare(
      `INSERT INTO sync_state (channel_id, last_message_id) VALUES (?1, ?2)
       ON CONFLICT(channel_id) DO UPDATE SET last_message_id = ?2`,
    )
    .bind(channelId, messageId)
    .run();
}

export async function getCachedCandles(
  db: D1Database,
  key: string,
  maxAgeSec: number,
): Promise<string | null> {
  await ensureSchema(db);
  const row = await db
    .prepare(`SELECT payload, fetched_at FROM candle_cache WHERE cache_key = ?`)
    .bind(key)
    .first<{ payload: string; fetched_at: number }>();
  if (!row) return null;
  const ageSec = Math.floor(Date.now() / 1000) - row.fetched_at;
  return ageSec <= maxAgeSec ? row.payload : null;
}

export async function putCachedCandles(
  db: D1Database,
  key: string,
  payload: string,
): Promise<void> {
  await ensureSchema(db);
  await db
    .prepare(
      `INSERT INTO candle_cache (cache_key, payload, fetched_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(cache_key) DO UPDATE SET payload = ?2, fetched_at = ?3`,
    )
    .bind(key, payload, Math.floor(Date.now() / 1000))
    .run();
}
