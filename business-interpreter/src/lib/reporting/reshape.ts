// Pure, deterministic table-reshaping engine. No I/O, no AI, no dependencies.
// These are the "transpose / pivot / unpivot" primitives the spreadsheet
// formula engine (hyperformula/exceljs) does NOT provide. Kept side-effect
// free so they can run anywhere (Worker, test, future sidecar) and are
// trivially auditable — the numbers come from this code, never from a model.

export type Cell = string | number | boolean | null;
export type Table = { columns: string[]; rows: Cell[][] };

export type Agg = "sum" | "count" | "mean" | "min" | "max" | "first";

const AGGS: Agg[] = ["sum", "count", "mean", "min", "max", "first"];
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

function toNumber(v: Cell): number | null {
  if (v === null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
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
  const nums = values.map(toNumber).filter((x): x is number => x !== null);
  if (nums.length === 0) return null;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "mean":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
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
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export type TransformSpec =
  | { op: "none" }
  | { op: "transpose" }
  | { op: "unpivot"; params: UnpivotParams }
  | { op: "pivot"; params: PivotParams }
  | { op: "filter"; params: FilterParams }
  | { op: "sort"; params: SortParams }
  | { op: "select"; params: SelectParams };

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
    case "filter":
      return filter(t, spec.params);
    case "sort":
      return sort(t, spec.params);
    case "select":
      return select(t, spec.params);
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
