// Pure, deterministic table-reshaping engine. No I/O, no AI, no dependencies.
// These are the "transpose / pivot / unpivot" primitives the spreadsheet
// formula engine (hyperformula/exceljs) does NOT provide. Kept side-effect
// free so they can run anywhere (Worker, test, future sidecar) and are
// trivially auditable — the numbers come from this code, never from a model.

export type Cell = string | number | boolean | null;
export type Table = { columns: string[]; rows: Cell[][] };

export type Agg =
  | "sum"
  | "count"
  | "mean"
  | "min"
  | "max"
  | "first"
  | "last"
  | "median"
  | "countDistinct";

const AGGS: Agg[] = [
  "sum",
  "count",
  "mean",
  "min",
  "max",
  "first",
  "last",
  "median",
  "countDistinct",
];
export function isAgg(x: unknown): x is Agg {
  return typeof x === "string" && (AGGS as string[]).includes(x);
}

/** Index of a column by exact name, or -1. */
function colIndex(columns: string[], name: string): number {
  return columns.indexOf(name);
}

function requireCols(columns: string[], names: string[], label: string): number[] {
  return names.map((n) => {
    const i = colIndex(columns, n);
    if (i < 0) throw new Error(`${label}: column "${n}" not found. Available: ${columns.join(", ")}`);
    return i;
  });
}

/** Escape a literal string so it can be used safely inside a RegExp (no ReDoS). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNumber(v: Cell): number | null {
  if (v === null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a human-formatted value into a number, or null if it isn't numeric.
 * Handles the messy real-world formats Excel/Tableau exports produce:
 *   - currency symbols ($ £ € ¥ ₹) and thousands separators ("1,234")
 *   - trailing/leading percent signs ("45%" → 45)
 *   - accounting-style parentheses for negatives ("(1,234)" → -1234)
 *   - leading minus / unicode minus
 * Assumes US/UK convention (comma = thousands, dot = decimal). Blanks → null.
 * Booleans are not treated as formatted numbers (→ null).
 */
function parseFormattedNumber(v: Cell): number | null {
  if (v === null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return null;
  let s = String(v).trim();
  if (s === "") return null;
  let negative = false;
  // Accounting-style parentheses: (1,234) → -1234
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  // Leading minus or unicode minus sign
  if (/^[-−]/.test(s)) {
    negative = !negative;
    s = s.replace(/^[-−]/, "").trim();
  }
  // Strip currency symbols, thousands separators, percent, and whitespace.
  s = s.replace(/[$£€¥₹%,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * RFC-4180-ish CSV parser. Handles quoted fields, embedded commas,
 * embedded newlines, escaped quotes (""), and CRLF/CR/LF line endings.
 * First non-empty row is treated as the header.
 */
export function parseCsv(text: string): Table {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    records.push(record);
    record = [];
  };

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      endField();
      i++;
      continue;
    }
    if (c === "\r") {
      // handle CRLF or lone CR
      if (text[i + 1] === "\n") i++;
      endRecord();
      i++;
      continue;
    }
    if (c === "\n") {
      endRecord();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // flush trailing field/record (unless file ended exactly on a newline with no pending data)
  if (field.length > 0 || record.length > 0) endRecord();

  // Drop fully-empty trailing records.
  while (records.length && records[records.length - 1].every((f) => f === "")) records.pop();
  if (records.length === 0) return { columns: [], rows: [] };

  const header = records[0].map((h, idx) => (h.trim() === "" ? `column_${idx + 1}` : h.trim()));
  const width = header.length;
  const rows: Cell[][] = records.slice(1).map((r) => {
    const out: Cell[] = new Array(width).fill(null);
    for (let j = 0; j < width; j++) out[j] = coerceCsvCell(r[j]);
    return out;
  });
  return { columns: header, rows };
}

/** Numbers stay numbers; everything else stays a trimmed string (empty → null). */
function coerceCsvCell(raw: string | undefined): Cell {
  if (raw === undefined) return null;
  const v = raw;
  if (v === "") return null;
  // Only treat as number when the entire trimmed token is numeric.
  const t = v.trim();
  if (t !== "" && /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t.replace(/,/g, ""))) {
    const num = Number(t.replace(/,/g, ""));
    if (Number.isFinite(num)) return num;
  }
  return v;
}

function csvEscape(v: Cell): string {
  if (v === null) return "";
  const s = typeof v === "string" ? v : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(t: Table): string {
  const lines: string[] = [];
  lines.push(t.columns.map((c) => csvEscape(c)).join(","));
  for (const row of t.rows) lines.push(row.map((c) => csvEscape(c)).join(","));
  return lines.join("\r\n");
}

/* ------------------------------------------------------------------ */
/* Transpose                                                           */
/* ------------------------------------------------------------------ */

/**
 * Spreadsheet-style transpose: the grid (header row + data rows) is flipped.
 * The original column headers become the first column of the result; the
 * first original row's header label seeds the new header row's corner.
 */
export function transpose(t: Table): Table {
  const grid: Cell[][] = [t.columns, ...t.rows];
  const rowCount = grid.length;
  const colCount = grid.reduce((m, r) => Math.max(m, r.length), 0);
  const flipped: Cell[][] = [];
  for (let c = 0; c < colCount; c++) {
    const newRow: Cell[] = [];
    for (let r = 0; r < rowCount; r++) newRow.push(grid[r][c] ?? null);
    flipped.push(newRow);
  }
  if (flipped.length === 0) return { columns: [], rows: [] };
  const newColumns = flipped[0].map((c, idx) => (c === null || c === "" ? `column_${idx + 1}` : String(c)));
  return { columns: newColumns, rows: flipped.slice(1) };
}

/* ------------------------------------------------------------------ */
/* Unpivot (wide → long / melt)                                        */
/* ------------------------------------------------------------------ */

export type UnpivotParams = {
  idColumns: string[];
  valueColumns?: string[]; // default: every column not in idColumns
  varName?: string;
  valueName?: string;
};

export function unpivot(t: Table, params: UnpivotParams): Table {
  const varName = params.varName?.trim() || "variable";
  const valueName = params.valueName?.trim() || "value";
  const idIdx = requireCols(t.columns, params.idColumns, "unpivot.idColumns");
  const valueColNames =
    params.valueColumns && params.valueColumns.length
      ? params.valueColumns
      : t.columns.filter((c) => !params.idColumns.includes(c));
  const valIdx = requireCols(t.columns, valueColNames, "unpivot.valueColumns");

  const columns = [...params.idColumns, varName, valueName];
  const rows: Cell[][] = [];
  for (const row of t.rows) {
    const idVals = idIdx.map((i) => row[i] ?? null);
    for (let k = 0; k < valIdx.length; k++) {
      rows.push([...idVals, valueColNames[k], row[valIdx[k]] ?? null]);
    }
  }
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* Pivot (long → wide / crosstab)                                      */
/* ------------------------------------------------------------------ */

export type PivotParams = {
  indexColumns: string[];
  pivotColumn: string;
  valueColumn: string;
  agg?: Agg;
};

function aggregate(values: Cell[], agg: Agg): Cell {
  if (agg === "count") return values.length;
  if (agg === "first") return values.length ? values[0] : null;
  if (agg === "last") return values.length ? values[values.length - 1] : null;
  if (agg === "countDistinct") {
    // SQL COUNT(DISTINCT) semantics: distinct non-empty values only.
    const seen = new Set<string>();
    for (const v of values) {
      if (v === null || v === "") continue;
      seen.add(typeof v === "string" ? `s:${v}` : JSON.stringify(v));
    }
    return seen.size;
  }
  const nums = values.map(toNumber).filter((x): x is number => x !== null);
  if (nums.length === 0) return null;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "mean":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "median": {
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default:
      return null;
  }
}

export function pivot(t: Table, params: PivotParams): Table {
  const agg: Agg = params.agg && isAgg(params.agg) ? params.agg : "sum";
  const idIdx = requireCols(t.columns, params.indexColumns, "pivot.indexColumns");
  const [pivotIdx] = requireCols(t.columns, [params.pivotColumn], "pivot.pivotColumn");
  const [valueIdx] = requireCols(t.columns, [params.valueColumn], "pivot.valueColumn");

  // Preserve first-seen ordering for both index tuples and pivot columns.
  const pivotCols: string[] = [];
  const pivotSeen = new Set<string>();
  const indexOrder: string[] = [];
  const groups = new Map<string, { idVals: Cell[]; buckets: Map<string, Cell[]> }>();

  for (const row of t.rows) {
    const idVals = idIdx.map((i) => row[i] ?? null);
    const idKey = JSON.stringify(idVals);
    const pivVal = row[pivotIdx];
    const pivLabel = pivVal === null || pivVal === undefined ? "" : String(pivVal);
    if (!pivotSeen.has(pivLabel)) {
      pivotSeen.add(pivLabel);
      pivotCols.push(pivLabel);
    }
    let g = groups.get(idKey);
    if (!g) {
      g = { idVals, buckets: new Map() };
      groups.set(idKey, g);
      indexOrder.push(idKey);
    }
    let bucket = g.buckets.get(pivLabel);
    if (!bucket) {
      bucket = [];
      g.buckets.set(pivLabel, bucket);
    }
    bucket.push(row[valueIdx] ?? null);
  }

  const columns = [...params.indexColumns, ...pivotCols];
  const rows: Cell[][] = indexOrder.map((idKey) => {
    const g = groups.get(idKey)!;
    const out: Cell[] = [...g.idVals];
    for (const pc of pivotCols) {
      const bucket = g.buckets.get(pc);
      out.push(bucket ? aggregate(bucket, agg) : null);
    }
    return out;
  });
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* Group by (summarise rows into per-group aggregates)                 */
/* ------------------------------------------------------------------ */

export type AggSpec = {
  column: string;
  agg: Agg;
  as?: string; // output column name; defaults to `${agg}_${column}`
};

export type GroupByParams = {
  groupColumns: string[];
  aggregations: AggSpec[];
};

/**
 * SQL-style GROUP BY / summarise. Rows sharing the same tuple of
 * `groupColumns` values collapse into one output row; each aggregation
 * computes over its source column within the group. Groups are emitted in
 * first-seen order (deterministic). Distinct from pivot: this reduces rows
 * without spreading a category across columns.
 */
export function groupBy(t: Table, params: GroupByParams): Table {
  const groupIdx = requireCols(t.columns, params.groupColumns, "groupBy.groupColumns");
  if (params.aggregations.length === 0)
    throw new Error("groupBy.aggregations: at least one aggregation is required");
  const aggIdx = params.aggregations.map(
    (a) => requireCols(t.columns, [a.column], "groupBy.aggregations")[0],
  );

  const order: string[] = [];
  const groups = new Map<string, { keyVals: Cell[]; buckets: Cell[][] }>();

  for (const row of t.rows) {
    const keyVals = groupIdx.map((i) => row[i] ?? null);
    const key = JSON.stringify(keyVals);
    let g = groups.get(key);
    if (!g) {
      g = { keyVals, buckets: params.aggregations.map(() => []) };
      groups.set(key, g);
      order.push(key);
    }
    for (let k = 0; k < aggIdx.length; k++) g.buckets[k].push(row[aggIdx[k]] ?? null);
  }

  const aggNames = params.aggregations.map(
    (a) => a.as?.trim() || `${a.agg}_${a.column}`,
  );
  const columns = [...params.groupColumns, ...aggNames];
  const rows: Cell[][] = order.map((key) => {
    const g = groups.get(key)!;
    const out: Cell[] = [...g.keyVals];
    for (let k = 0; k < params.aggregations.length; k++) {
      out.push(aggregate(g.buckets[k], params.aggregations[k].agg));
    }
    return out;
  });
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* Filter (row subset by a single-column condition)                    */
/* ------------------------------------------------------------------ */

export type FilterOp =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "notContains"
  | "isEmpty"
  | "notEmpty";

const FILTER_OPS: FilterOp[] = [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "notContains",
  "isEmpty",
  "notEmpty",
];
export function isFilterOp(x: unknown): x is FilterOp {
  return typeof x === "string" && (FILTER_OPS as string[]).includes(x);
}

export type FilterParams = {
  column: string;
  op: FilterOp;
  value?: string;
};

function passesCmp(op: FilterOp, cmp: number): boolean {
  switch (op) {
    case "gt":
      return cmp > 0;
    case "gte":
      return cmp >= 0;
    case "lt":
      return cmp < 0;
    case "lte":
      return cmp <= 0;
    default:
      return false;
  }
}

/**
 * Keep rows whose value in `column` satisfies the condition. Numeric
 * comparisons run when both sides parse as numbers; otherwise a
 * case-insensitive string comparison is used. Deterministic, no I/O.
 */
export function filter(t: Table, params: FilterParams): Table {
  const [idx] = requireCols(t.columns, [params.column], "filter.column");
  const op = params.op;
  const raw = params.value ?? "";
  const target = toNumber(raw);
  const rawLower = raw.toLowerCase();

  const rows = t.rows.filter((row) => {
    const cell = row[idx] ?? null;
    const empty = cell === null || cell === "";
    switch (op) {
      case "isEmpty":
        return empty;
      case "notEmpty":
        return !empty;
      case "contains":
        return !empty && String(cell).toLowerCase().includes(rawLower);
      case "notContains":
        return empty || !String(cell).toLowerCase().includes(rawLower);
      case "eq":
      case "ne": {
        const cn = toNumber(cell);
        const equal =
          cn !== null && target !== null
            ? cn === target
            : String(cell ?? "") === raw;
        return op === "eq" ? equal : !equal;
      }
      case "gt":
      case "gte":
      case "lt":
      case "lte": {
        // Empty cells are "unknown" and satisfy no ordered comparison
        // (SQL-NULL semantics); use isEmpty/notEmpty to select blanks.
        if (empty) return false;
        const cn = toNumber(cell);
        if (cn !== null && target !== null) {
          return passesCmp(op, cn < target ? -1 : cn > target ? 1 : 0);
        }
        const cs = String(cell ?? "");
        return passesCmp(op, cs < raw ? -1 : cs > raw ? 1 : 0);
      }
      default:
        return true;
    }
  });
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* Sort (order rows by a single column; nulls last)                    */
/* ------------------------------------------------------------------ */

export type SortParams = {
  column: string;
  direction?: "asc" | "desc";
};

export function sort(t: Table, params: SortParams): Table {
  const [idx] = requireCols(t.columns, [params.column], "sort.column");
  const dir = params.direction === "desc" ? -1 : 1;
  const rows = [...t.rows].sort((a, b) => {
    const av = a[idx] ?? null;
    const bv = b[idx] ?? null;
    const aEmpty = av === null || av === "";
    const bEmpty = bv === null || bv === "";
    // Empties always sort last, regardless of direction.
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    const an = toNumber(av);
    const bn = toNumber(bv);
    if (an !== null && bn !== null) return (an < bn ? -1 : an > bn ? 1 : 0) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
  });
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* Select (keep / reorder a subset of columns)                         */
/* ------------------------------------------------------------------ */

export type SelectParams = {
  columns: string[]; // ordered subset to keep
};

export function select(t: Table, params: SelectParams): Table {
  const idx = requireCols(t.columns, params.columns, "select.columns");
  const columns = params.columns.slice();
  const rows = t.rows.map((r) => idx.map((i) => r[i] ?? null));
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* Derive (computed column from arithmetic)                            */
/* ------------------------------------------------------------------ */

export type DeriveOperator = "+" | "-" | "*" | "/";

export type DeriveParams = {
  as: string; // output column name (appended, or overwritten if it already exists)
  left: string; // source column
  operator: DeriveOperator;
  rightKind: "column" | "const";
  right: string; // column name when rightKind="column"; numeric literal when "const"
};

export function derive(t: Table, params: DeriveParams): Table {
  const as = params.as.trim();
  if (!as) throw new Error("derive.as: an output column name is required");
  const [leftIdx] = requireCols(t.columns, [params.left], "derive.left");

  let rightIdx = -1;
  let constVal: number | null = null;
  if (params.rightKind === "column") {
    rightIdx = requireCols(t.columns, [params.right], "derive.right")[0];
  } else {
    constVal = toNumber(params.right);
    if (constVal === null) throw new Error(`derive.right: "${params.right}" is not a number`);
  }

  const apply = (a: number, b: number): number | null => {
    switch (params.operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? null : a / b;
    }
  };

  const existingIdx = colIndex(t.columns, as);
  const columns = existingIdx >= 0 ? t.columns.slice() : [...t.columns, as];
  const rows = t.rows.map((r) => {
    const a = toNumber(r[leftIdx] ?? null);
    const b = params.rightKind === "column" ? toNumber(r[rightIdx] ?? null) : constVal;
    const out: Cell = a === null || b === null ? null : apply(a, b);
    if (existingIdx >= 0) {
      const row = r.slice();
      row[existingIdx] = out;
      return row;
    }
    return [...r, out];
  });
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* Limit (keep the first N rows; optionally skip the first M)          */
/* ------------------------------------------------------------------ */

export type LimitParams = {
  count: number; // number of rows to keep (top-N)
  offset?: number; // rows to skip from the top before keeping (default 0)
};

export function limit(t: Table, params: LimitParams): Table {
  const count = Math.floor(params.count);
  if (!Number.isFinite(count) || count < 0)
    throw new Error("limit.count: a non-negative row count is required");
  const offset = Math.max(0, Math.floor(params.offset ?? 0));
  const rows = t.rows.slice(offset, offset + count);
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* Rename (relabel one or more columns; values untouched)              */
/* ------------------------------------------------------------------ */

export type RenameParams = {
  renames: { from: string; to: string }[];
};

export function rename(t: Table, params: RenameParams): Table {
  if (!params.renames.length) return t;
  const columns = t.columns.slice();
  for (const { from, to } of params.renames) {
    const idx = colIndex(columns, from);
    if (idx < 0) throw new Error(`rename.from: column "${from}" not found`);
    const next = to.trim();
    if (!next) throw new Error("rename.to: a new column name is required");
    columns[idx] = next;
  }
  return { columns, rows: t.rows };
}

/* ------------------------------------------------------------------ */
/* Dedupe (drop duplicate rows, keeping first occurrence)              */
/* ------------------------------------------------------------------ */

export type DedupeParams = {
  columns?: string[]; // subset to compare on; empty/omitted = whole row
};

export function dedupe(t: Table, params: DedupeParams = {}): Table {
  const subset = (params.columns ?? []).filter((c) => c.trim() !== "");
  const idx = subset.length
    ? requireCols(t.columns, subset, "dedupe.columns")
    : t.columns.map((_, i) => i);
  const seen = new Set<string>();
  const rows: Cell[][] = [];
  for (const r of t.rows) {
    // JSON encoding keeps types distinct (number 1 ≠ string "1" ≠ null).
    const key = JSON.stringify(idx.map((i) => r[i] ?? null));
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(r);
  }
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* fillDown                                                            */
/* ------------------------------------------------------------------ */

export type FillDownParams = {
  columns?: string[]; // subset to fill; empty/omitted = all columns
};

/**
 * Forward-fill empty cells (null or "") with the last non-empty value
 * above them, per column. Common for crosstab/pivot exports where group
 * labels only appear on the first row of each block. Leading blanks (with
 * no value above) are left as-is.
 */
export function fillDown(t: Table, params: FillDownParams = {}): Table {
  const subset = (params.columns ?? []).filter((c) => c.trim() !== "");
  const idx = subset.length
    ? requireCols(t.columns, subset, "fillDown.columns")
    : t.columns.map((_, i) => i);
  const last: Cell[] = new Array(t.columns.length).fill(null);
  const haveLast: boolean[] = new Array(t.columns.length).fill(false);
  const rows: Cell[][] = t.rows.map((r) => {
    const out = r.slice();
    for (const i of idx) {
      const v = out[i];
      if (v === null || v === "") {
        if (haveLast[i]) out[i] = last[i];
      } else {
        last[i] = v;
        haveLast[i] = true;
      }
    }
    return out;
  });
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* castNumber (coerce formatted text columns to real numbers)          */
/* ------------------------------------------------------------------ */

export type CastNumberParams = {
  columns: string[]; // columns to convert (required — converting all would clobber labels)
  onError?: "null" | "keep"; // non-blank cells that don't parse: null (default) or keep original
};

/**
 * Convert the selected columns from human-formatted text (currency, percent,
 * thousands separators, accounting negatives) into real numbers so they can be
 * aggregated, pivoted, or computed on. Blank cells become null. Cells that
 * can't be parsed become null (default) or are left untouched (onError: "keep").
 */
export function castNumber(t: Table, params: CastNumberParams): Table {
  const cols = (params.columns ?? []).filter((c) => c.trim() !== "");
  const idx = requireCols(t.columns, cols, "castNumber.columns");
  const onError = params.onError ?? "null";
  const targets = new Set(idx);
  const rows: Cell[][] = t.rows.map((r) => {
    const out = r.slice();
    for (const i of targets) {
      const original = out[i];
      const n = parseFormattedNumber(original);
      if (n !== null) {
        out[i] = n;
      } else if (original === null || original === "") {
        out[i] = null;
      } else {
        out[i] = onError === "keep" ? original : null;
      }
    }
    return out;
  });
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* trim (clean leading/trailing/internal whitespace on text columns)   */
/* ------------------------------------------------------------------ */

export type TrimParams = {
  columns?: string[]; // columns to clean (omitted/empty = all columns)
  collapse?: boolean; // also collapse internal whitespace runs to a single space
};

/**
 * Strip leading/trailing whitespace from string cells in the selected columns
 * (or every column when none are named — trimming never destroys data).
 * Optionally collapse internal whitespace runs to a single space. Numbers,
 * booleans, and nulls pass through untouched. Useful before group by / dedupe /
 * joins, where stray spaces ("North " vs "North") otherwise split values.
 */
export function trim(t: Table, params: TrimParams = {}): Table {
  const cols = (params.columns ?? []).filter((c) => c.trim() !== "");
  const targets = cols.length
    ? new Set(requireCols(t.columns, cols, "trim.columns"))
    : new Set(t.columns.map((_, i) => i));
  const collapse = params.collapse ?? false;
  const rows: Cell[][] = t.rows.map((r) => {
    const out = r.slice();
    for (const i of targets) {
      const v = out[i];
      if (typeof v === "string") {
        let s = v.trim();
        if (collapse) s = s.replace(/\s+/g, " ");
        out[i] = s;
      }
    }
    return out;
  });
  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* splitColumn (split a compound text column into several columns)      */
/* ------------------------------------------------------------------ */

export type SplitColumnParams = {
  column: string; // the column to split
  delimiter: string; // literal separator, e.g. ", " or "-" or "|"
  into?: string[]; // explicit output names; omitted = auto "${column} 1..N"
  keepOriginal?: boolean; // keep the source column too (default: replace it in place)
};

/**
 * Split one compound text column into several columns on a literal delimiter —
 * "Leeds, West Yorkshire" → city + region, "2024-Q3" → year + quarter,
 * "Manu, Aaron" → last + first. Only string cells are split; numbers, booleans
 * and nulls keep their value in the first slot (nulls elsewhere) so no data is
 * lost. The new columns are spliced in at the source column's position.
 *
 * When `into` is omitted, the engine produces as many columns as the widest row
 * needs (named "${column} 1", "${column} 2", …). When `into` is given, it pins
 * the output to exactly those names: short rows pad with null, and any overflow
 * parts are rejoined (with the delimiter) into the last named column so nothing
 * is dropped.
 */
export function splitColumn(t: Table, params: SplitColumnParams): Table {
  const [idx] = requireCols(t.columns, [params.column], "splitColumn.column");
  const delim = params.delimiter;
  if (delim === "") throw new Error("splitColumn: delimiter must not be empty.");
  const keep = params.keepOriginal ?? false;
  const explicit = params.into && params.into.length ? params.into : null;

  // Split each row's source cell into parts (only strings are actually split).
  const parts: Cell[][] = t.rows.map((r) => {
    const v = r[idx];
    return typeof v === "string" ? (v.split(delim) as Cell[]) : [v];
  });

  const maxParts = parts.reduce((m, p) => Math.max(m, p.length), 1);
  const names = explicit ?? Array.from({ length: maxParts }, (_, i) => `${params.column} ${i + 1}`);
  const n = names.length;

  const cells: Cell[][] = parts.map((p) => {
    const slots: Cell[] = new Array(n).fill(null);
    const upper = explicit ? n : p.length;
    for (let i = 0; i < upper; i++) {
      if (i >= p.length) break;
      slots[i] =
        explicit && i === n - 1 && p.length > n
          ? (p.slice(n - 1) as string[]).join(delim) // rejoin overflow into the last column
          : p[i];
    }
    return slots;
  });

  const before = t.columns.slice(0, idx);
  const after = t.columns.slice(idx + 1);
  const columns = keep
    ? [...before, t.columns[idx], ...names, ...after]
    : [...before, ...names, ...after];

  const rows: Cell[][] = t.rows.map((r, ri) => {
    const head = r.slice(0, idx);
    const tail = r.slice(idx + 1);
    return keep ? [...head, r[idx], ...cells[ri], ...tail] : [...head, ...cells[ri], ...tail];
  });

  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* mergeColumns (concatenate several columns into one)                 */
/* ------------------------------------------------------------------ */

export type MergeColumnsParams = {
  columns: string[]; // the columns to concatenate, in the given order
  separator: string; // literal joiner, e.g. " ", ", ", "-", or "" for no gap
  into: string; // name of the resulting column
  keepOriginals?: boolean; // keep the source columns too (default: replace them)
  skipEmpty?: boolean; // drop null/empty cells before joining (default: false)
};

/**
 * Concatenate several columns into one — the inverse of splitColumn.
 * "Aaron" + "Manu" → "Aaron Manu", year + quarter → "2024-Q3",
 * street + city + postcode → a single address line. Cells are stringified
 * (numbers/booleans via String(); null/undefined become ""). The merged
 * column is spliced in at the position of the first source column.
 *
 * With `skipEmpty`, null/empty cells are dropped before joining so you get
 * "a, c" instead of "a, , c". When `keepOriginals` is true the source columns
 * are preserved alongside the merged result; otherwise they are removed.
 */
export function mergeColumns(t: Table, params: MergeColumnsParams): Table {
  if (!params.columns.length) throw new Error("mergeColumns: provide at least one column.");
  const idxs = requireCols(t.columns, params.columns, "mergeColumns.columns");
  const sep = params.separator;
  const keep = params.keepOriginals ?? false;
  const skipEmpty = params.skipEmpty ?? false;
  const into = params.into;

  const insertAt = Math.min(...idxs); // merged column takes the first source slot
  const mergeSet = new Set(idxs);

  const merged: Cell[] = t.rows.map((r) => {
    const pieces: string[] = [];
    for (const i of idxs) {
      const v = r[i];
      const s = v === null || v === undefined ? "" : typeof v === "string" ? v : String(v);
      if (skipEmpty && s === "") continue;
      pieces.push(s);
    }
    return pieces.join(sep);
  });

  const columns: string[] = [];
  t.columns.forEach((c, i) => {
    if (i === insertAt) {
      if (keep) columns.push(c);
      columns.push(into);
    } else if (mergeSet.has(i)) {
      if (keep) columns.push(c);
    } else {
      columns.push(c);
    }
  });

  const rows: Cell[][] = t.rows.map((r, ri) => {
    const out: Cell[] = [];
    r.forEach((cell, i) => {
      if (i === insertAt) {
        if (keep) out.push(cell);
        out.push(merged[ri]);
      } else if (mergeSet.has(i)) {
        if (keep) out.push(cell);
      } else {
        out.push(cell);
      }
    });
    return out;
  });

  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* replace (literal find-and-replace within text columns)              */
/* ------------------------------------------------------------------ */

export type ReplaceParams = {
  columns?: string[]; // columns to operate on (omitted/empty = every column)
  find: string; // literal text to search for (must be non-empty)
  replace?: string; // replacement text (default "" — i.e. delete the match)
  matchCase?: boolean; // case-sensitive match (default false → case-insensitive)
  wholeCell?: boolean; // replace only when the whole cell equals `find` (default false → substring)
};

/**
 * Literal find-and-replace across string cells in the selected columns (or every
 * column when none are named). Only string cells are searched — numbers, booleans
 * and nulls pass through untouched, so no data is coerced. Case-insensitive by
 * default; set `matchCase` to require an exact-case match. By default every
 * occurrence of `find` inside a cell is replaced (substring mode); set `wholeCell`
 * to replace only cells whose entire value equals `find`. The needle is matched
 * literally (regex metacharacters in `find` and `replace` are treated as plain
 * text), so it is safe for arbitrary user input. Useful for normalising labels
 * ("U.S.A." → "USA"), fixing typos, or stripping noise before group by / dedupe /
 * joins, where inconsistent spellings otherwise split values apart.
 */
export function replace(t: Table, params: ReplaceParams): Table {
  if (params.find === "") throw new Error("replace: provide text to find.");
  const cols = (params.columns ?? []).filter((c) => c.trim() !== "");
  const targets = cols.length
    ? new Set(requireCols(t.columns, cols, "replace.columns"))
    : new Set(t.columns.map((_, i) => i));
  const find = params.find;
  const repl = params.replace ?? "";
  const matchCase = params.matchCase ?? false;
  const wholeCell = params.wholeCell ?? false;

  // Escaped literal => the regex is a plain string matcher (no ReDoS, no $-refs).
  const re = wholeCell ? null : new RegExp(escapeRegExp(find), matchCase ? "g" : "gi");
  const cmpFind = matchCase ? find : find.toLowerCase();

  const apply = (s: string): string => {
    if (wholeCell) {
      const cmp = matchCase ? s : s.toLowerCase();
      return cmp === cmpFind ? repl : s;
    }
    // Function replacement keeps `repl` literal ($&, $1, … are not expanded).
    return s.replace(re!, () => repl);
  };

  const rows: Cell[][] = t.rows.map((r) => {
    const out = r.slice();
    for (const idx of targets) {
      const v = out[idx];
      if (typeof v === "string") out[idx] = apply(v);
    }
    return out;
  });

  return { columns: t.columns, rows };
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export type TransformSpec =
  | { op: "none" }
  | { op: "transpose" }
  | { op: "unpivot"; params: UnpivotParams }
  | { op: "pivot"; params: PivotParams }
  | { op: "groupBy"; params: GroupByParams }
  | { op: "filter"; params: FilterParams }
  | { op: "sort"; params: SortParams }
  | { op: "select"; params: SelectParams }
  | { op: "derive"; params: DeriveParams }
  | { op: "limit"; params: LimitParams }
  | { op: "rename"; params: RenameParams }
  | { op: "dedupe"; params: DedupeParams }
  | { op: "fillDown"; params: FillDownParams }
  | { op: "castNumber"; params: CastNumberParams }
  | { op: "trim"; params: TrimParams }
  | { op: "splitColumn"; params: SplitColumnParams }
  | { op: "mergeColumns"; params: MergeColumnsParams }
  | { op: "replace"; params: ReplaceParams };

export function applyTransform(t: Table, spec: TransformSpec): Table {
  switch (spec.op) {
    case "none":
      return t;
    case "transpose":
      return transpose(t);
    case "unpivot":
      return unpivot(t, spec.params);
    case "pivot":
      return pivot(t, spec.params);
    case "groupBy":
      return groupBy(t, spec.params);
    case "filter":
      return filter(t, spec.params);
    case "sort":
      return sort(t, spec.params);
    case "select":
      return select(t, spec.params);
    case "derive":
      return derive(t, spec.params);
    case "limit":
      return limit(t, spec.params);
    case "rename":
      return rename(t, spec.params);
    case "dedupe":
      return dedupe(t, spec.params);
    case "fillDown":
      return fillDown(t, spec.params);
    case "castNumber":
      return castNumber(t, spec.params);
    case "trim":
      return trim(t, spec.params);
    case "splitColumn":
      return splitColumn(t, spec.params);
    case "mergeColumns":
      return mergeColumns(t, spec.params);
    case "replace":
      return replace(t, spec.params);
    default:
      return t;
  }
}

/** Apply an ordered list of transforms left-to-right (e.g. filter → sort → pivot). */
export function applyPipeline(t: Table, specs: TransformSpec[]): Table {
  return specs.reduce((acc, spec) => applyTransform(acc, spec), t);
}

/** Cap a table to a preview window for shipping to the client. */
export function previewTable(t: Table, maxRows = 100, maxCols = 50): Table {
  const columns = t.columns.slice(0, maxCols);
  const rows = t.rows.slice(0, maxRows).map((r) => r.slice(0, maxCols));
  return { columns, rows };
}
