/**
 * lib/db.ts — Prisma-compatible DB layer using Turso's HTTP pipeline API.
 * Zero external dependencies, zero WASM. Works on Cloudflare Pages free plan (≤3 MB).
 * Replaces @prisma/client + @prisma/adapter-libsql + @libsql/client entirely.
 */

// ---------------------------------------------------------------------------
// Shared return types
// ---------------------------------------------------------------------------
export interface HoldingRow {
  id: number; ticker: string; yfSymbol: string; name: string; type: string;
  nativeCcy: string; isin: string | null; ter: number | null; exchange: string | null;
  units: number | null; avgCostGBP: number | null; notes: string | null;
  createdAt: Date; updatedAt: Date;
}
export interface PositionRow {
  id: number; snapshotId: number; holdingId: number;
  valueGBP: number; units: number | null; priceGBP: number;
  dailyReturnPct: number; weight: number;
}
export interface PositionWithHoldingRow extends PositionRow { holding: HoldingRow; }
export interface SnapshotRow {
  id: number; date: Date; totalValueGBP: number; gbpUsd: number; createdAt: Date;
}
export interface SnapshotWithPositionsRow extends SnapshotRow {
  positions: PositionWithHoldingRow[];
}
export interface TradeRow {
  id: number; holdingId: number; type: string; date: Date;
  units: number; priceGBP: number; totalGBP: number; fees: number;
  notes: string | null; createdAt: Date;
}
export interface TradeWithHoldingRow extends TradeRow {
  holding: { ticker: string; name: string; [k: string]: unknown };
}
export interface PriceHistoryRow {
  id: number; ticker: string; date: string;
  adjClose: number; close: number; open: number; high: number; low: number; volume: number;
}
export interface IsaAllowanceRow {
  id: number; taxYear: string; allowanceGBP: number; usedGBP: number;
}
export interface FundamentalSnapshotRow {
  ticker: string; data: string; fetchedAt: Date;
}

// ---------------------------------------------------------------------------
// Minimal Turso HTTP pipeline client (native fetch only)
// ---------------------------------------------------------------------------

type TursoValue = { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string }
  | { type: "null" };

interface TursoRow { [i: number]: TursoValue; }
interface TursoResult {
  cols: { name: string; decltype: string | null }[];
  rows: TursoRow[];
  affected_row_count: number;
  last_insert_rowid: string | null;
}
type InValue = string | number | boolean | null;

function tursoUrl(): string {
  let url = process.env.DATABASE_URL ?? "";
  // Turso libsql:// → https://
  if (url.startsWith("libsql://")) url = "https://" + url.slice(9);
  if (!url.startsWith("http")) throw new Error(`Invalid DATABASE_URL: ${url}`);
  return url.replace(/\/$/, "");
}

function authToken(): string | null {
  return process.env.DATABASE_AUTH_TOKEN ?? null;
}

function toTursoArg(v: InValue): TursoValue {
  if (v === null) return { type: "null" };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  }
  return { type: "text", value: String(v) };
}

async function pipeline(requests: { sql: string; args?: InValue[] }[]): Promise<TursoResult[]> {
  const base = tursoUrl();
  const token = authToken();
  const body = {
    requests: requests.map((r) => ({
      type: "execute",
      stmt: { sql: r.sql, args: r.args?.map(toTursoArg) ?? [] },
    })),
  };

  const res = await fetch(`${base}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Turso HTTP error ${res.status}: ${text}`);
  }

  const json = await res.json() as {
    results: Array<{
      type: "ok" | "error";
      response?: { type: string; result?: TursoResult };
      error?: { message: string };
    }>;
  };

  return json.results.map((r, i) => {
    if (r.type === "error") throw new Error(`Turso query ${i} failed: ${r.error?.message}`);
    if (!r.response?.result) throw new Error(`Turso query ${i}: no result`);
    return r.response.result;
  });
}

async function execute(sql: string, args?: InValue[]): Promise<TursoResult> {
  const [result] = await pipeline([{ sql, args }]);
  return result;
}

async function executeBatch(stmts: { sql: string; args?: InValue[] }[]): Promise<TursoResult[]> {
  if (!stmts.length) return [];
  return pipeline(stmts);
}

// ---------------------------------------------------------------------------
// Result → typed row helpers
// ---------------------------------------------------------------------------
function colIndex(result: TursoResult, name: string): number {
  return result.cols.findIndex((c) => c.name === name);
}

function colMap(result: TursoResult): Map<string, number> {
  const m = new Map<string, number>();
  result.cols.forEach((c, i) => m.set(c.name, i));
  return m;
}

function readVal(row: TursoRow, idx: number): unknown {
  if (idx < 0) return null;
  const v = row[idx];
  if (!v || v.type === "null") return null;
  if (v.type === "integer") return Number(v.value);
  if (v.type === "float") return v.value;
  if (v.type === "blob") return v.base64;
  return (v as { type: "text"; value: string }).value;
}

function mapRow(cols: Map<string, number>, row: TursoRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  cols.forEach((idx, name) => { out[name] = readVal(row, idx); });
  return out;
}

function resultToObjects(result: TursoResult): Record<string, unknown>[] {
  const cols = colMap(result);
  return result.rows.map((row) => mapRow(cols, row));
}

// ---------------------------------------------------------------------------
// Type coercions
// ---------------------------------------------------------------------------
function toNum(v: unknown): number { return Number(v ?? 0); }
function toNumN(v: unknown): number | null { return v == null ? null : Number(v); }
function toStr(v: unknown): string { return String(v ?? ""); }
function toStrN(v: unknown): string | null { return v == null ? null : String(v); }
function toDate(v: unknown): Date { return new Date(String(v)); }

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------
function mapHolding(r: Record<string, unknown>): HoldingRow {
  return {
    id: toNum(r.id), ticker: toStr(r.ticker), yfSymbol: toStr(r.yfSymbol),
    name: toStr(r.name), type: toStr(r.type), nativeCcy: toStr(r.nativeCcy),
    isin: toStrN(r.isin), ter: toNumN(r.ter), exchange: toStrN(r.exchange),
    units: toNumN(r.units), avgCostGBP: toNumN(r.avgCostGBP), notes: toStrN(r.notes),
    createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt),
  };
}

function mapSnapshot(r: Record<string, unknown>): SnapshotRow {
  return {
    id: toNum(r.id), date: toDate(r.date),
    totalValueGBP: toNum(r.totalValueGBP), gbpUsd: toNum(r.gbpUsd),
    createdAt: toDate(r.createdAt),
  };
}

function mapPosition(r: Record<string, unknown>): PositionRow {
  return {
    id: toNum(r.id), snapshotId: toNum(r.snapshotId), holdingId: toNum(r.holdingId),
    valueGBP: toNum(r.valueGBP), units: toNumN(r.units), priceGBP: toNum(r.priceGBP),
    dailyReturnPct: toNum(r.dailyReturnPct), weight: toNum(r.weight),
  };
}

function mapTrade(r: Record<string, unknown>): TradeRow {
  return {
    id: toNum(r.id), holdingId: toNum(r.holdingId), type: toStr(r.type),
    date: toDate(r.date), units: toNum(r.units), priceGBP: toNum(r.priceGBP),
    totalGBP: toNum(r.totalGBP), fees: toNum(r.fees),
    notes: toStrN(r.notes), createdAt: toDate(r.createdAt),
  };
}

function mapPriceHistory(r: Record<string, unknown>): PriceHistoryRow {
  return {
    id: toNum(r.id), ticker: toStr(r.ticker), date: toStr(r.date),
    adjClose: toNum(r.adjClose), close: toNum(r.close), open: toNum(r.open),
    high: toNum(r.high), low: toNum(r.low), volume: toNum(r.volume),
  };
}

function mapIsaAllowance(r: Record<string, unknown>): IsaAllowanceRow {
  return {
    id: toNum(r.id), taxYear: toStr(r.taxYear),
    allowanceGBP: toNum(r.allowanceGBP), usedGBP: toNum(r.usedGBP),
  };
}

function mapFundamentalSnapshot(r: Record<string, unknown>): FundamentalSnapshotRow {
  return { ticker: toStr(r.ticker), data: toStr(r.data), fetchedAt: toDate(r.fetchedAt) };
}

// ---------------------------------------------------------------------------
// Helper: load positions (+ holding) for a set of snapshot IDs
// ---------------------------------------------------------------------------
const EMPTY_HOLDING: HoldingRow = {
  id: 0, ticker: "", yfSymbol: "", name: "", type: "", nativeCcy: "GBP",
  isin: null, ter: null, exchange: null, units: null, avgCostGBP: null, notes: null,
  createdAt: new Date(0), updatedAt: new Date(0),
};

async function loadPositionsForSnapshots(
  snapshotIds: number[],
  includeHolding: boolean,
): Promise<Map<number, PositionWithHoldingRow[]>> {
  if (!snapshotIds.length) return new Map();

  const ph = snapshotIds.map(() => "?").join(",");
  const posResult = await execute(
    `SELECT * FROM PositionSnapshot WHERE snapshotId IN (${ph})`,
    snapshotIds,
  );
  const posRows = resultToObjects(posResult).map(mapPosition);

  let holdingsById = new Map<number, HoldingRow>();
  if (includeHolding && posRows.length) {
    const holdingIds = [...new Set(posRows.map((p) => p.holdingId))];
    const hh = holdingIds.map(() => "?").join(",");
    const holdResult = await execute(
      `SELECT * FROM Holding WHERE id IN (${hh})`,
      holdingIds,
    );
    holdingsById = new Map(
      resultToObjects(holdResult).map((r) => { const h = mapHolding(r); return [h.id, h]; })
    );
  }

  const result = new Map<number, PositionWithHoldingRow[]>();
  for (const p of posRows) {
    const withHolding: PositionWithHoldingRow = {
      ...p,
      holding: holdingsById.get(p.holdingId) ?? EMPTY_HOLDING,
    };
    const arr = result.get(p.snapshotId) ?? [];
    arr.push(withHolding);
    result.set(p.snapshotId, arr);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public prisma-compatible object
// ---------------------------------------------------------------------------
export const prisma = {
  // ── Holding ──────────────────────────────────────────────────────────────
  holding: {
    async findMany(args?: { orderBy?: { ticker?: "asc" | "desc" } }): Promise<HoldingRow[]> {
      const ord = (args?.orderBy?.ticker ?? "asc").toUpperCase();
      const res = await execute(`SELECT * FROM Holding ORDER BY ticker ${ord}`);
      return resultToObjects(res).map(mapHolding);
    },

    async findUnique(args: { where: { ticker?: string; id?: number } }): Promise<HoldingRow | null> {
      if (args.where.ticker !== undefined) {
        const res = await execute("SELECT * FROM Holding WHERE ticker = ? LIMIT 1", [args.where.ticker]);
        const rows = resultToObjects(res);
        return rows.length ? mapHolding(rows[0]) : null;
      }
      if (args.where.id !== undefined) {
        const res = await execute("SELECT * FROM Holding WHERE id = ? LIMIT 1", [args.where.id]);
        const rows = resultToObjects(res);
        return rows.length ? mapHolding(rows[0]) : null;
      }
      return null;
    },

    async update(args: {
      where: { id: number };
      data: Partial<{ units: number | null; avgCostGBP: number | null }>;
    }): Promise<HoldingRow | null> {
      const sets: string[] = [];
      const params: InValue[] = [];
      if ("units" in args.data) { sets.push("units = ?"); params.push(args.data.units ?? null); }
      if ("avgCostGBP" in args.data) { sets.push("avgCostGBP = ?"); params.push(args.data.avgCostGBP ?? null); }
      sets.push("updatedAt = ?");
      params.push(new Date().toISOString());
      params.push(args.where.id);
      await execute(`UPDATE Holding SET ${sets.join(", ")} WHERE id = ?`, params);
      const res = await execute("SELECT * FROM Holding WHERE id = ? LIMIT 1", [args.where.id]);
      const rows = resultToObjects(res);
      return rows.length ? mapHolding(rows[0]) : null;
    },
  },

  // ── DailySnapshot ─────────────────────────────────────────────────────────
  dailySnapshot: {
    async findFirst(args?: {
      orderBy?: { date?: "asc" | "desc" };
      where?: { date?: { gte?: Date } };
      include?: { positions?: boolean | { include?: { holding?: boolean } } };
      select?: { date?: boolean; totalValueGBP?: boolean; id?: boolean };
    }): Promise<SnapshotWithPositionsRow | null> {
      let sql = "SELECT * FROM DailySnapshot";
      const params: InValue[] = [];
      if (args?.where?.date?.gte) {
        sql += " WHERE date >= ?";
        params.push(args.where.date.gte.toISOString());
      }
      const ord = (args?.orderBy?.date ?? "desc").toUpperCase();
      sql += ` ORDER BY date ${ord} LIMIT 1`;

      const res = await execute(sql, params);
      const rows = resultToObjects(res);
      if (!rows.length) return null;
      const snap = mapSnapshot(rows[0]);

      if (args?.include?.positions) {
        const inclHolding =
          typeof args.include.positions === "object" && !!args.include.positions.include?.holding;
        const posMap = await loadPositionsForSnapshots([snap.id], inclHolding);
        return { ...snap, positions: posMap.get(snap.id) ?? [] };
      }
      return { ...snap, positions: [] };
    },

    async findMany(args?: {
      orderBy?: { date?: "asc" | "desc" };
      where?: { date?: { gte?: Date } };
      select?: { date?: boolean; totalValueGBP?: boolean };
      take?: number;
      include?: { positions?: boolean | { include?: { holding?: boolean } } };
    }): Promise<SnapshotWithPositionsRow[]> {
      let sql = "SELECT * FROM DailySnapshot";
      const params: InValue[] = [];
      if (args?.where?.date?.gte) {
        sql += " WHERE date >= ?";
        params.push(args.where.date.gte.toISOString());
      }
      const ord = (args?.orderBy?.date ?? "asc").toUpperCase();
      sql += ` ORDER BY date ${ord}`;
      if (args?.take !== undefined) sql += ` LIMIT ${args.take}`;

      const res = await execute(sql, params);
      const snaps = resultToObjects(res).map(mapSnapshot);

      if (args?.include?.positions && snaps.length) {
        const inclHolding =
          typeof args.include.positions === "object" && !!args.include.positions.include?.holding;
        const posMap = await loadPositionsForSnapshots(snaps.map((s) => s.id), inclHolding);
        return snaps.map((s) => ({ ...s, positions: posMap.get(s.id) ?? [] }));
      }
      return snaps.map((s) => ({ ...s, positions: [] }));
    },

    async create(args: {
      data: {
        date: Date;
        totalValueGBP: number;
        gbpUsd: number;
        positions?: {
          create: Array<{
            holdingId: number; valueGBP: number; units: number | null;
            priceGBP: number; dailyReturnPct: number; weight: number;
          }>;
        };
      };
    }): Promise<SnapshotWithPositionsRow> {
      const now = new Date().toISOString();
      // Insert snapshot and get ID via RETURNING
      const snapRes = await execute(
        "INSERT INTO DailySnapshot (date, totalValueGBP, gbpUsd, createdAt) VALUES (?, ?, ?, ?) RETURNING *",
        [args.data.date.toISOString(), args.data.totalValueGBP, args.data.gbpUsd, now],
      );
      const snap = mapSnapshot(resultToObjects(snapRes)[0]);

      const creates = args.data.positions?.create ?? [];
      if (creates.length) {
        const CHUNK = 50;
        for (let i = 0; i < creates.length; i += CHUNK) {
          const chunk = creates.slice(i, i + CHUNK);
          await executeBatch(
            chunk.map((pos) => ({
              sql: "INSERT INTO PositionSnapshot (snapshotId, holdingId, valueGBP, units, priceGBP, dailyReturnPct, weight) VALUES (?, ?, ?, ?, ?, ?, ?)",
              args: [snap.id, pos.holdingId, pos.valueGBP, pos.units ?? null, pos.priceGBP, pos.dailyReturnPct, pos.weight],
            })),
          );
        }
      }
      return { ...snap, positions: [] };
    },
  },

  // ── FundamentalSnapshot ───────────────────────────────────────────────────
  fundamentalSnapshot: {
    async findUnique(args: { where: { ticker: string } }): Promise<FundamentalSnapshotRow | null> {
      const res = await execute(
        "SELECT * FROM FundamentalSnapshot WHERE ticker = ? LIMIT 1",
        [args.where.ticker],
      );
      const rows = resultToObjects(res);
      return rows.length ? mapFundamentalSnapshot(rows[0]) : null;
    },

    async upsert(args: {
      where: { ticker: string };
      update: { data: string; fetchedAt: Date };
      create: { ticker: string; data: string; fetchedAt?: Date };
    }): Promise<FundamentalSnapshotRow | null> {
      const now = (args.update.fetchedAt ?? new Date()).toISOString();
      await execute(
        `INSERT INTO FundamentalSnapshot (ticker, data, fetchedAt) VALUES (?, ?, ?)
         ON CONFLICT(ticker) DO UPDATE SET data = excluded.data, fetchedAt = excluded.fetchedAt`,
        [args.where.ticker, args.update.data, now],
      );
      const res = await execute(
        "SELECT * FROM FundamentalSnapshot WHERE ticker = ? LIMIT 1",
        [args.where.ticker],
      );
      const rows = resultToObjects(res);
      return rows.length ? mapFundamentalSnapshot(rows[0]) : null;
    },
  },

  // ── PriceHistory ──────────────────────────────────────────────────────────
  priceHistory: {
    async findMany(args?: {
      where?: { ticker?: string | { in?: string[] }; date?: { in?: string[] } };
      orderBy?: { date?: "asc" | "desc" };
      select?: Record<string, boolean>;
      take?: number;
    }): Promise<PriceHistoryRow[]> {
      let sql = "SELECT * FROM PriceHistory";
      const params: InValue[] = [];
      const conds: string[] = [];

      if (args?.where?.ticker) {
        if (typeof args.where.ticker === "string") {
          conds.push("ticker = ?");
          params.push(args.where.ticker);
        } else if (args.where.ticker.in?.length) {
          conds.push(`ticker IN (${args.where.ticker.in.map(() => "?").join(",")})`);
          params.push(...args.where.ticker.in);
        }
      }
      if (args?.where?.date?.in?.length) {
        conds.push(`date IN (${args.where.date.in.map(() => "?").join(",")})`);
        params.push(...args.where.date.in);
      }

      if (conds.length) sql += ` WHERE ${conds.join(" AND ")}`;
      const ord = (args?.orderBy?.date ?? "asc").toUpperCase();
      sql += ` ORDER BY date ${ord}`;
      if (args?.take !== undefined) sql += ` LIMIT ${args.take}`;

      const res = await execute(sql, params);
      return resultToObjects(res).map(mapPriceHistory);
    },

    async findFirst(args?: {
      where?: { ticker?: string };
      orderBy?: { date?: "asc" | "desc" };
      select?: Record<string, boolean>;
    }): Promise<PriceHistoryRow | null> {
      let sql = "SELECT * FROM PriceHistory";
      const params: InValue[] = [];
      if (args?.where?.ticker) {
        sql += " WHERE ticker = ?";
        params.push(args.where.ticker);
      }
      const ord = (args?.orderBy?.date ?? "desc").toUpperCase();
      sql += ` ORDER BY date ${ord} LIMIT 1`;

      const res = await execute(sql, params);
      const rows = resultToObjects(res);
      return rows.length ? mapPriceHistory(rows[0]) : null;
    },

    async createMany(args: {
      data: Array<{
        ticker: string; date: string; adjClose: number; close: number;
        open: number; high: number; low: number; volume: number;
      }>;
    }): Promise<{ count: number }> {
      if (!args.data.length) return { count: 0 };
      const CHUNK = 50;
      let count = 0;
      for (let i = 0; i < args.data.length; i += CHUNK) {
        const chunk = args.data.slice(i, i + CHUNK);
        await executeBatch(
          chunk.map((b) => ({
            sql: "INSERT OR IGNORE INTO PriceHistory (ticker, date, adjClose, close, open, high, low, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [b.ticker, b.date, b.adjClose, b.close, b.open, b.high, b.low, b.volume] as InValue[],
          })),
        );
        count += chunk.length;
      }
      return { count };
    },

    async count(args?: { where?: { ticker?: string } }): Promise<number> {
      let sql = "SELECT COUNT(*) as cnt FROM PriceHistory";
      const params: InValue[] = [];
      if (args?.where?.ticker) {
        sql += " WHERE ticker = ?";
        params.push(args.where.ticker);
      }
      const res = await execute(sql, params);
      return toNum(resultToObjects(res)[0]?.cnt ?? 0);
    },

    async groupBy(_args: {
      by: string[];
      _count?: { ticker?: boolean };
      _min?: { date?: boolean };
      _max?: { date?: boolean };
    }): Promise<Array<{ ticker: string; _count: { ticker: number }; _min: { date: string | null }; _max: { date: string | null } }>> {
      const res = await execute(
        "SELECT ticker, COUNT(*) as _count, MIN(date) as _min_date, MAX(date) as _max_date FROM PriceHistory GROUP BY ticker"
      );
      return resultToObjects(res).map((r) => ({
        ticker: toStr(r.ticker),
        _count: { ticker: toNum(r._count) },
        _min: { date: toStrN(r._min_date) },
        _max: { date: toStrN(r._max_date) },
      }));
    },
  },

  // ── IsaAllowance ──────────────────────────────────────────────────────────
  isaAllowance: {
    async findFirst(args?: { orderBy?: { taxYear?: "asc" | "desc" } }): Promise<IsaAllowanceRow | null> {
      const ord = (args?.orderBy?.taxYear ?? "desc").toUpperCase();
      const res = await execute(`SELECT * FROM IsaAllowance ORDER BY taxYear ${ord} LIMIT 1`);
      const rows = resultToObjects(res);
      return rows.length ? mapIsaAllowance(rows[0]) : null;
    },

    async update(args: {
      where: { id: number };
      data: { usedGBP?: number };
    }): Promise<IsaAllowanceRow | null> {
      const sets: string[] = [];
      const params: InValue[] = [];
      if ("usedGBP" in args.data) { sets.push("usedGBP = ?"); params.push(args.data.usedGBP ?? 0); }
      if (!sets.length) return null;
      params.push(args.where.id);
      await execute(`UPDATE IsaAllowance SET ${sets.join(", ")} WHERE id = ?`, params);
      const res = await execute("SELECT * FROM IsaAllowance WHERE id = ? LIMIT 1", [args.where.id]);
      const rows = resultToObjects(res);
      return rows.length ? mapIsaAllowance(rows[0]) : null;
    },
  },

  // ── Trade ─────────────────────────────────────────────────────────────────
  trade: {
    async findMany(args?: {
      where?: { holding?: { ticker?: string } };
      include?: { holding?: boolean | { select?: Record<string, boolean> } };
      orderBy?: { date?: "asc" | "desc" };
      take?: number;
    }): Promise<TradeWithHoldingRow[]> {
      const params: InValue[] = [];
      let sql =
        "SELECT t.*, h.ticker as h_ticker, h.name as h_name FROM Trade t JOIN Holding h ON t.holdingId = h.id";

      if (args?.where?.holding?.ticker) {
        sql += " WHERE h.ticker = ?";
        params.push(args.where.holding.ticker);
      }

      const ord = (args?.orderBy?.date ?? "desc").toUpperCase();
      sql += ` ORDER BY t.date ${ord}`;
      if (args?.take !== undefined) sql += ` LIMIT ${args.take}`;

      const res = await execute(sql, params);
      return resultToObjects(res).map((r) => ({
        ...mapTrade(r),
        holding: { ticker: toStr(r.h_ticker), name: toStr(r.h_name) },
      }));
    },

    async create(args: {
      data: {
        holdingId: number; type: string; date: Date;
        units: number; priceGBP: number; totalGBP: number;
        fees: number; notes?: string | null;
      };
      include?: { holding?: boolean | { select?: Record<string, boolean> } };
    }): Promise<TradeWithHoldingRow> {
      const now = new Date().toISOString();
      const res = await execute(
        "INSERT INTO Trade (holdingId, type, date, units, priceGBP, totalGBP, fees, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
        [
          args.data.holdingId, args.data.type, args.data.date.toISOString(),
          args.data.units, args.data.priceGBP, args.data.totalGBP,
          args.data.fees, args.data.notes ?? null, now,
        ],
      );
      const trade = mapTrade(resultToObjects(res)[0]);
      const hRes = await execute("SELECT ticker, name FROM Holding WHERE id = ? LIMIT 1", [trade.holdingId]);
      const hRows = resultToObjects(hRes);
      return {
        ...trade,
        holding: { ticker: toStr(hRows[0]?.ticker), name: toStr(hRows[0]?.name) },
      };
    },
  },
};
