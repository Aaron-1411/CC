/**
 * KV-backed data layer with a Prisma-shaped facade.
 *
 * Brand Command Centre originally ran on Prisma + SQLite (a single local Node
 * process). On Cloudflare Pages there is no persistent filesystem, so we store
 * each "table" as one JSON array in a Cloudflare KV namespace (binding `BCC_KV`)
 * and expose the exact slice of the Prisma client API the app already calls —
 * `findUnique / findFirst / findMany / count / create / update / updateMany`,
 * compound-unique `where` keys, `include: { brandContext }`, `{ increment }`
 * data, and `orderBy` / `take`. That lets the orchestrator, agents, queries and
 * server actions stay byte-for-byte unchanged behind `db`.
 *
 * Scale assumption: this is a single-operator tool with a handful of brands and
 * low write concurrency, so a read-whole-array / write-whole-array model is more
 * than fast enough and avoids per-record key sprawl. Writes within a request are
 * sequential (awaited), so they never race each other.
 */

// ── KV access ────────────────────────────────────────────────────────────────
interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

// Dev / `next dev` fallback: an in-process map that mimics KV (lost on restart).
const globalForDev = globalThis as unknown as { __bccDevKV?: Map<string, string> };

function getKV(): KVStore {
  // Cloudflare KV is only bound in the edge runtime at request time. The require
  // is wrapped because it only resolves inside next-on-pages' edge bundle.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    const env = getRequestContext().env as Record<string, unknown>;
    const kv = env.BCC_KV as KVStore | undefined;
    if (kv) return kv;
  } catch {
    // not in the edge runtime — fall through to the dev store
  }
  if (!globalForDev.__bccDevKV) globalForDev.__bccDevKV = new Map();
  const map = globalForDev.__bccDevKV;
  return {
    get: async (k) => map.get(k) ?? null,
    put: async (k, v) => {
      map.set(k, v);
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────
type Row = Record<string, unknown>;
type Where = Record<string, unknown>;
type OrderBy = Record<string, "asc" | "desc">;

const nowISO = () => new Date().toISOString();

function newId(): string {
  // cuid-ish: sortable-ish time prefix + randomness. Opaque to every call site.
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

/** Serialise a value for storage: Date → ISO string, everything else as-is. */
function ser(v: unknown): unknown {
  return v instanceof Date ? v.toISOString() : v;
}

/** Revive known date columns from ISO strings back into Date objects on read. */
function revive(row: Row, dateFields: string[]): Row {
  const out: Row = { ...row };
  for (const f of dateFields) {
    const v = out[f];
    if (typeof v === "string") out[f] = new Date(v);
  }
  return out;
}

/** Flatten compound-unique keys (`{ brandId_agentType: { ... } }`) into fields. */
function flattenWhere(where: Where, compound: Record<string, [string, string]>): Where {
  const flat: Where = {};
  for (const [k, v] of Object.entries(where)) {
    if (compound[k] && isPlainObject(v)) Object.assign(flat, v);
    else flat[k] = v;
  }
  return flat;
}

function rowMatches(row: Row, flatWhere: Where): boolean {
  return Object.entries(flatWhere).every(([k, v]) => row[k] === v);
}

/** Apply Prisma-style update `data`: handle `{ increment }`, Date → ISO. */
function applyData(row: Row, data: Row): Row {
  const out: Row = { ...row };
  for (const [k, v] of Object.entries(data)) {
    if (isPlainObject(v) && "increment" in v) {
      out[k] = ((out[k] as number) ?? 0) + (v.increment as number);
    } else {
      out[k] = ser(v);
    }
  }
  return out;
}

function sortRows(rows: Row[], orderBy?: OrderBy): Row[] {
  if (!orderBy) return rows;
  const [field, dir] = Object.entries(orderBy)[0];
  return [...rows].sort((a, b) => {
    const av = a[field] as string | number | null;
    const bv = b[field] as string | number | null;
    if (av === bv) return 0;
    // nulls sort last regardless of direction
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : 1;
    return dir === "desc" ? -cmp : cmp;
  });
}

// ── model row types (mirror the former Prisma models) ───────────────────────
export interface BrandRow {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
  primaryColour: string | null;
  toneOfVoice: string | null;
  industry: string | null;
  cmsType: string | null;
  createdAt: Date;
  brandContext?: BrandContextRow | null;
}

export interface BrandContextRow {
  id: string;
  brandId: string;
  auditFindings: unknown;
  competitors: unknown;
  publishedUrls: unknown;
  postedContent: unknown;
  activePromos: unknown;
  approvedAssets: unknown;
  updatedAt: Date;
}

export interface AuditRow {
  id: string;
  brandId: string;
  status: string;
  pillars: unknown;
  opportunityMatrix: unknown;
  startedAt: Date;
  completedAt: Date | null;
  reportPath: string | null;
  deckPath: string | null;
}

export interface AgentConfigRow {
  id: string;
  brandId: string;
  agentType: string;
  enabled: boolean;
  scheduleExpr: string | null;
  autonomyLevel: string;
  config: unknown;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  runCount: number;
  approvalCount: number;
}

export interface AgentRunRow {
  id: string;
  brandId: string;
  agentType: string;
  trigger: string;
  pillarId: number | null;
  status: string;
  itemCount: number;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface InboxItemRow {
  id: string;
  brandId: string;
  agentType: string;
  type: string;
  title: string;
  description: string;
  payload: unknown;
  previewUrl: string | null;
  estimatedImpact: string | null;
  pillarSource: number | null;
  status: string;
  edited: boolean;
  dedupeKey: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  publishedItemId: string | null;
}

export interface PublishedItemRow {
  id: string;
  brandId: string;
  agentType: string;
  type: string;
  title: string;
  payload: unknown;
  publishedAt: Date;
  externalId: string | null;
  externalUrl: string | null;
  metrics: unknown;
}

// ── generic table ────────────────────────────────────────────────────────────
interface TableConfig {
  /** KV key under which this table's JSON array lives. */
  storeKey: string;
  /** Columns to revive into Date objects on read. */
  dateFields: string[];
  /** Compound-unique key name → the two fields it expands to. */
  compound?: Record<string, [string, string]>;
  /** `@updatedAt` column, bumped on every update. */
  updatedAt?: string;
  /** Per-model column defaults applied on create (data overrides these). */
  defaults: () => Row;
}

type CreateArgs = { data: Record<string, unknown> };
type UpdateArgs = { where: Where; data: Record<string, unknown> };

class Table<T> {
  constructor(private cfg: TableConfig) {}

  private async readAll(): Promise<Row[]> {
    const raw = await getKV().get(this.cfg.storeKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Row[]) : [];
    } catch {
      return [];
    }
  }

  private async writeAll(rows: Row[]): Promise<void> {
    await getKV().put(this.cfg.storeKey, JSON.stringify(rows));
  }

  private flat(where: Where = {}): Where {
    return flattenWhere(where, this.cfg.compound ?? {});
  }

  private out(row: Row): T {
    return revive(row, this.cfg.dateFields) as T;
  }

  async findUnique({ where }: { where: Where; include?: unknown }): Promise<T | null> {
    const flat = this.flat(where);
    const rows = await this.readAll();
    const hit = rows.find((r) => rowMatches(r, flat));
    return hit ? this.out(hit) : null;
  }

  async findFirst({
    where,
    orderBy,
  }: { where?: Where; orderBy?: OrderBy } = {}): Promise<T | null> {
    const flat = this.flat(where ?? {});
    const rows = sortRows(await this.readAll(), orderBy).filter((r) => rowMatches(r, flat));
    return rows[0] ? this.out(rows[0]) : null;
  }

  async findMany({
    where,
    orderBy,
    take,
  }: { where?: Where; orderBy?: OrderBy; take?: number } = {}): Promise<T[]> {
    const flat = this.flat(where ?? {});
    let rows = sortRows(await this.readAll(), orderBy).filter((r) => rowMatches(r, flat));
    if (typeof take === "number") rows = rows.slice(0, take);
    return rows.map((r) => this.out(r));
  }

  async count({ where }: { where?: Where } = {}): Promise<number> {
    const flat = this.flat(where ?? {});
    const rows = await this.readAll();
    return rows.filter((r) => rowMatches(r, flat)).length;
  }

  async create({ data }: CreateArgs): Promise<T> {
    const rows = await this.readAll();
    const merged: Row = { ...this.cfg.defaults() };
    for (const [k, v] of Object.entries(data)) merged[k] = ser(v);
    if (!merged.id) merged.id = newId();
    rows.push(merged);
    await this.writeAll(rows);
    return this.out(merged);
  }

  async update({ where, data }: UpdateArgs): Promise<T | null> {
    const flat = this.flat(where);
    const rows = await this.readAll();
    const idx = rows.findIndex((r) => rowMatches(r, flat));
    if (idx === -1) return null;
    let next = applyData(rows[idx], data);
    if (this.cfg.updatedAt) next = { ...next, [this.cfg.updatedAt]: nowISO() };
    rows[idx] = next;
    await this.writeAll(rows);
    return this.out(next);
  }

  async updateMany({ where, data }: { where?: Where } & Pick<UpdateArgs, "data">): Promise<{ count: number }> {
    const flat = this.flat(where ?? {});
    const rows = await this.readAll();
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      if (!rowMatches(rows[i], flat)) continue;
      let next = applyData(rows[i], data);
      if (this.cfg.updatedAt) next = { ...next, [this.cfg.updatedAt]: nowISO() };
      rows[i] = next;
      count++;
    }
    if (count > 0) await this.writeAll(rows);
    return { count };
  }
}

// ── model definitions ────────────────────────────────────────────────────────
const brandTable = new Table<BrandRow>({
  storeKey: "t:brand",
  dateFields: ["createdAt"],
  defaults: () => ({
    createdAt: nowISO(),
    logoUrl: null,
    primaryColour: null,
    toneOfVoice: null,
    industry: null,
    cmsType: null,
  }),
});

const brandContextTable = new Table<BrandContextRow>({
  storeKey: "t:brandContext",
  dateFields: ["updatedAt"],
  updatedAt: "updatedAt",
  defaults: () => ({
    updatedAt: nowISO(),
    auditFindings: [],
    competitors: [],
    publishedUrls: [],
    postedContent: [],
    activePromos: [],
    approvedAssets: [],
  }),
});

const auditTable = new Table<AuditRow>({
  storeKey: "t:audit",
  dateFields: ["startedAt", "completedAt"],
  defaults: () => ({
    status: "PENDING",
    startedAt: nowISO(),
    completedAt: null,
    opportunityMatrix: null,
    reportPath: null,
    deckPath: null,
  }),
});

const agentConfigTable = new Table<AgentConfigRow>({
  storeKey: "t:agentConfig",
  dateFields: ["lastRunAt", "nextRunAt"],
  compound: { brandId_agentType: ["brandId", "agentType"] },
  defaults: () => ({
    enabled: false,
    scheduleExpr: null,
    autonomyLevel: "APPROVAL_REQUIRED",
    config: {},
    lastRunAt: null,
    nextRunAt: null,
    runCount: 0,
    approvalCount: 0,
  }),
});

const agentRunTable = new Table<AgentRunRow>({
  storeKey: "t:agentRun",
  dateFields: ["startedAt", "finishedAt"],
  defaults: () => ({
    status: "RUNNING",
    pillarId: null,
    itemCount: 0,
    error: null,
    startedAt: nowISO(),
    finishedAt: null,
  }),
});

const inboxItemTable = new Table<InboxItemRow>({
  storeKey: "t:inboxItem",
  dateFields: ["createdAt", "reviewedAt"],
  compound: { brandId_dedupeKey: ["brandId", "dedupeKey"] },
  defaults: () => ({
    status: "PENDING",
    edited: false,
    previewUrl: null,
    estimatedImpact: null,
    pillarSource: null,
    dedupeKey: null,
    createdAt: nowISO(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: null,
    publishedItemId: null,
  }),
});

const publishedItemTable = new Table<PublishedItemRow>({
  storeKey: "t:publishedItem",
  dateFields: ["publishedAt"],
  defaults: () => ({
    publishedAt: nowISO(),
    externalId: null,
    externalUrl: null,
    metrics: null,
  }),
});

// Brand needs a Prisma-style `include: { brandContext: true }` on findUnique.
const brand = {
  findMany: (args?: { orderBy?: OrderBy }) => brandTable.findMany(args),
  findFirst: (args?: { orderBy?: OrderBy }) => brandTable.findFirst(args),
  create: (args: CreateArgs) => brandTable.create(args),
  update: (args: UpdateArgs) => brandTable.update(args),
  async findUnique(args: {
    where: Where;
    include?: { brandContext?: boolean };
  }): Promise<BrandRow | null> {
    const b = await brandTable.findUnique(args);
    if (b && args.include?.brandContext) {
      b.brandContext = await brandContextTable.findUnique({
        where: { brandId: b.id },
      });
    }
    return b;
  },
};

export const db = {
  brand,
  brandContext: brandContextTable,
  audit: auditTable,
  agentConfig: agentConfigTable,
  agentRun: agentRunTable,
  inboxItem: inboxItemTable,
  publishedItem: publishedItemTable,
};
