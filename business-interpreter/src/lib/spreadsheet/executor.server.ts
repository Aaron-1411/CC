import type ExcelJS from "exceljs";
import {
  TransformPlanSchema,
  type PlanStep,
  type TransformPlan,
} from "./plan";
import { parseAddress } from "./engine.server";

// =============================================================
// Deterministic plan executor.
// Loads sheets into in-memory typed tables, runs each step, then
// writes results back into the workbook. Every step records a
// summary (rows in/out + sample rows) for the audit trail.
// =============================================================

export type Row = Record<string, unknown>;
export type Table = { columns: string[]; rows: Row[] };

export type StepLog = {
  index: number;
  op: string;
  as?: string;
  rowsIn?: number;
  rowsOut?: number;
  durationMs: number;
  sample?: Row[];
  error?: string;
};

export type ExecuteResult = {
  ok: boolean;
  steps: StepLog[];
  tables: Record<string, { columns: string[]; rowCount: number }>;
  error?: string;
};

function readSheetTable(ws: ExcelJS.Worksheet, headerRow: number): Table {
  const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
  const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
  const headers: string[] = [];
  for (let c = 1; c <= colCount; c++) {
    const v = ws.getCell(headerRow, c).value;
    const name = v == null ? `col_${c}` : String(unwrap(v));
    headers.push(name);
  }
  const rows: Row[] = [];
  for (let r = headerRow + 1; r <= rowCount; r++) {
    const row: Row = {};
    let any = false;
    for (let c = 1; c <= colCount; c++) {
      const v = unwrap(ws.getCell(r, c).value);
      if (v != null && v !== "") any = true;
      row[headers[c - 1]] = v;
    }
    if (any) rows.push(row);
  }
  return { columns: headers, rows };
}

function unwrap(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === "object") {
    if ("result" in (v as object)) return (v as { result?: unknown }).result ?? null;
    if ("text" in (v as object)) return (v as { text?: unknown }).text ?? null;
    if ("richText" in (v as object))
      return (v as { richText: { text: string }[] }).richText.map((p) => p.text).join("");
    if (v instanceof Date) return v.toISOString();
  }
  return v;
}

function resolveCol(t: Table, ref: { kind: "name"; name: string } | { kind: "index"; index: number }): string {
  if (ref.kind === "name") {
    if (!t.columns.includes(ref.name)) throw new Error(`Unknown column "${ref.name}"`);
    return ref.name;
  }
  const c = t.columns[ref.index];
  if (!c) throw new Error(`Column index ${ref.index} out of range`);
  return c;
}

function coerce(value: unknown, type: string, dateFormat?: string): unknown {
  if (value == null || value === "") return null;
  switch (type) {
    case "string":
      return String(value);
    case "number": {
      if (typeof value === "number") return value;
      const s = String(value).replace(/[,\s$£€]/g, "").replace(/\((.*)\)/, "-$1");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    case "integer": {
      const n = coerce(value, "number") as number | null;
      return n == null ? null : Math.trunc(n);
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      const s = String(value).toLowerCase().trim();
      if (["true", "yes", "y", "1"].includes(s)) return true;
      if (["false", "no", "n", "0"].includes(s)) return false;
      return null;
    }
    case "date": {
      if (value instanceof Date) return value.toISOString();
      const d = new Date(String(value));
      if (!Number.isNaN(d.getTime())) return d.toISOString();
      void dateFormat;
      return null;
    }
    default:
      return value;
  }
}

function evalExpr(expr: string, row: Row): number | null {
  // Replace {col} → numeric value, then evaluate as a constrained arithmetic expression.
  const resolved = expr.replace(/\{([^}]+)\}/g, (_m, name: string) => {
    const v = row[name.trim()];
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? String(n) : "0";
  });
  if (!/^[\d+\-*/().\s]+$/.test(resolved)) {
    throw new Error(`Unsafe expression after substitution: ${resolved}`);
  }
  try {
    // eslint-disable-next-line no-new-func
    const out = Function(`"use strict";return (${resolved});`)();
    return typeof out === "number" && Number.isFinite(out) ? out : null;
  } catch {
    return null;
  }
}

function compare(a: unknown, op: string, b: unknown): boolean {
  switch (op) {
    case "eq": return a == b; // eslint-disable-line eqeqeq
    case "ne": return a != b; // eslint-disable-line eqeqeq
    case "gt": return Number(a) > Number(b);
    case "gte": return Number(a) >= Number(b);
    case "lt": return Number(a) < Number(b);
    case "lte": return Number(a) <= Number(b);
    case "contains": return String(a ?? "").toLowerCase().includes(String(b ?? "").toLowerCase());
    case "in": return Array.isArray(b) && (b as unknown[]).some((x) => x == a); // eslint-disable-line eqeqeq
    case "notnull": return a != null && a !== "";
    case "isnull": return a == null || a === "";
    default: return false;
  }
}

function aggregate(values: unknown[], fn: string): unknown {
  const nums = values.map((v) => (typeof v === "number" ? v : Number(v))).filter((n) => Number.isFinite(n));
  switch (fn) {
    case "sum": return nums.reduce((a, b) => a + b, 0);
    case "mean": return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    case "min": return nums.length ? Math.min(...nums) : null;
    case "max": return nums.length ? Math.max(...nums) : null;
    case "count": return values.filter((v) => v != null && v !== "").length;
    case "first": return values[0] ?? null;
    case "last": return values[values.length - 1] ?? null;
    default: return null;
  }
}

function writeTableToSheet(
  wb: ExcelJS.Workbook,
  table: Table,
  sheet: string,
  start: string,
  includeHeader: boolean,
  replaceSheet: boolean,
) {
  let ws = wb.getWorksheet(sheet);
  if (ws && replaceSheet) {
    wb.removeWorksheet(ws.id);
    ws = undefined;
  }
  if (!ws) ws = wb.addWorksheet(sheet);
  const { row: r0, col: c0 } = parseAddress(start);
  let r = r0;
  if (includeHeader) {
    table.columns.forEach((name, i) => {
      ws!.getCell(r, c0 + i).value = name;
    });
    r++;
  }
  for (const row of table.rows) {
    table.columns.forEach((name, i) => {
      const v = row[name];
      ws!.getCell(r, c0 + i).value = (v ?? null) as ExcelJS.CellValue;
    });
    r++;
  }
}

export async function executePlan(
  wb: ExcelJS.Workbook,
  rawPlan: unknown,
): Promise<ExecuteResult> {
  const parsed = TransformPlanSchema.safeParse(rawPlan);
  if (!parsed.success) {
    return { ok: false, steps: [], tables: {}, error: `Invalid plan: ${parsed.error.message}` };
  }
  const plan: TransformPlan = parsed.data;
  const tables = new Map<string, Table>();
  const steps: StepLog[] = [];

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const t0 = Date.now();
    try {
      const log: StepLog = { index: i, op: step.op, durationMs: 0 };
      const out = runStep(wb, step, tables);
      if (out) {
        tables.set(out.name, out.table);
        log.as = out.name;
        log.rowsOut = out.table.rows.length;
        log.sample = out.table.rows.slice(0, 3);
      }
      log.rowsIn = (step as PlanStep & { from?: string }).from
        ? tables.get((step as PlanStep & { from?: string }).from!)?.rows.length
        : undefined;
      log.durationMs = Date.now() - t0;
      steps.push(log);
    } catch (e) {
      steps.push({
        index: i,
        op: step.op,
        durationMs: Date.now() - t0,
        error: (e as Error).message,
      });
      return {
        ok: false,
        steps,
        tables: Object.fromEntries(
          Array.from(tables.entries()).map(([k, v]) => [k, { columns: v.columns, rowCount: v.rows.length }]),
        ),
        error: `Step ${i} (${step.op}) failed: ${(e as Error).message}`,
      };
    }
  }

  return {
    ok: true,
    steps,
    tables: Object.fromEntries(
      Array.from(tables.entries()).map(([k, v]) => [k, { columns: v.columns, rowCount: v.rows.length }]),
    ),
  };
}

function runStep(
  wb: ExcelJS.Workbook,
  step: PlanStep,
  tables: Map<string, Table>,
): { name: string; table: Table } | null {
  const get = (name: string): Table => {
    const t = tables.get(name);
    if (!t) throw new Error(`Table "${name}" not in scope`);
    return t;
  };

  switch (step.op) {
    case "load_sheet": {
      const ws = wb.getWorksheet(step.sheet);
      if (!ws) throw new Error(`Sheet "${step.sheet}" not found`);
      return { name: step.as, table: readSheetTable(ws, step.headerRow) };
    }
    case "select_columns": {
      const src = get(step.from);
      const names = step.columns.map((c) => resolveCol(src, c));
      const rows = src.rows.map((r) => Object.fromEntries(names.map((n) => [n, r[n]])));
      return { name: step.as, table: { columns: names, rows } };
    }
    case "rename_columns": {
      const src = get(step.from);
      const cols = src.columns.map((c) => step.map[c] ?? c);
      const rows = src.rows.map((r) => {
        const o: Row = {};
        for (const c of src.columns) o[step.map[c] ?? c] = r[c];
        return o;
      });
      return { name: step.as, table: { columns: cols, rows } };
    }
    case "coerce_types": {
      const src = get(step.from);
      const rows = src.rows.map((r) => {
        const o: Row = { ...r };
        for (const [col, type] of Object.entries(step.types)) {
          o[col] = coerce(o[col], type, step.dateFormat);
        }
        return o;
      });
      return { name: step.as, table: { columns: src.columns, rows } };
    }
    case "filter_rows": {
      const src = get(step.from);
      const rows = src.rows.filter((r) =>
        step.where.every((w) => compare(r[w.column], w.op, w.value as unknown)),
      );
      return { name: step.as, table: { columns: src.columns, rows } };
    }
    case "sort_rows": {
      const src = get(step.from);
      const rows = [...src.rows].sort((a, b) => {
        for (const k of step.by) {
          const av = a[k.column];
          const bv = b[k.column];
          const cmp = av == bv ? 0 : (av as number) > (bv as number) ? 1 : -1; // eslint-disable-line eqeqeq
          if (cmp !== 0) return k.dir === "desc" ? -cmp : cmp;
        }
        return 0;
      });
      return { name: step.as, table: { columns: src.columns, rows } };
    }
    case "derive_column": {
      const src = get(step.from);
      const cols = src.columns.includes(step.name) ? src.columns : [...src.columns, step.name];
      const rows = src.rows.map((r) => ({ ...r, [step.name]: evalExpr(step.expr, r) }));
      return { name: step.as, table: { columns: cols, rows } };
    }
    case "group_aggregate": {
      const src = get(step.from);
      const groups = new Map<string, Row[]>();
      for (const r of src.rows) {
        const key = step.by.map((k) => JSON.stringify(r[k] ?? null)).join("|");
        const arr = groups.get(key) ?? [];
        arr.push(r);
        groups.set(key, arr);
      }
      const cols = [...step.by, ...step.agg.map((a) => a.as)];
      const rows: Row[] = [];
      for (const arr of groups.values()) {
        const o: Row = {};
        for (const k of step.by) o[k] = arr[0][k];
        for (const a of step.agg) o[a.as] = aggregate(arr.map((r) => r[a.column]), a.fn);
        rows.push(o);
      }
      return { name: step.as, table: { columns: cols, rows } };
    }
    case "join": {
      const L = get(step.left);
      const R = get(step.right);
      const key = (row: Row, side: "left" | "right") =>
        step.on.map((o) => JSON.stringify(row[side === "left" ? o.left : o.right] ?? null)).join("|");
      const rIdx = new Map<string, Row[]>();
      for (const r of R.rows) {
        const k = key(r, "right");
        const arr = rIdx.get(k) ?? [];
        arr.push(r);
        rIdx.set(k, arr);
      }
      const cols = [...L.columns, ...R.columns.filter((c) => !L.columns.includes(c))];
      const rows: Row[] = [];
      const matchedRightKeys = new Set<string>();
      for (const l of L.rows) {
        const k = key(l, "left");
        const matches = rIdx.get(k) ?? [];
        if (matches.length) {
          matchedRightKeys.add(k);
          for (const r of matches) rows.push({ ...r, ...l });
        } else if (step.how === "left" || step.how === "outer") {
          rows.push({ ...l });
        }
      }
      if (step.how === "right" || step.how === "outer") {
        for (const r of R.rows) {
          if (!matchedRightKeys.has(key(r, "right"))) rows.push({ ...r });
        }
      }
      return { name: step.as, table: { columns: cols, rows } };
    }
    case "pivot": {
      const src = get(step.from);
      const colVals = Array.from(new Set(src.rows.map((r) => String(r[step.columns] ?? "")))).sort();
      const groups = new Map<string, Row[]>();
      for (const r of src.rows) {
        const k = step.index.map((i) => JSON.stringify(r[i] ?? null)).join("|");
        const arr = groups.get(k) ?? [];
        arr.push(r);
        groups.set(k, arr);
      }
      const cols = [...step.index, ...colVals];
      const rows: Row[] = [];
      for (const arr of groups.values()) {
        const o: Row = {};
        for (const i of step.index) o[i] = arr[0][i];
        for (const cv of colVals) {
          const subset = arr.filter((r) => String(r[step.columns] ?? "") === cv);
          o[cv] = aggregate(subset.map((r) => r[step.values]), step.agg);
        }
        rows.push(o);
      }
      return { name: step.as, table: { columns: cols, rows } };
    }
    case "write_sheet": {
      const t = get(step.from);
      writeTableToSheet(wb, t, step.sheet, step.start, step.includeHeader, step.replaceSheet);
      return null;
    }
    case "write_formula": {
      let ws = wb.getWorksheet(step.sheet);
      if (!ws) ws = wb.addWorksheet(step.sheet);
      const { row, col } = parseAddress(step.cell);
      const f = step.formula.startsWith("=") ? step.formula.slice(1) : step.formula;
      ws.getCell(row, col).value = { formula: f } as ExcelJS.CellFormulaValue;
      return null;
    }
    case "fill_down_formula": {
      const ws = wb.getWorksheet(step.sheet);
      if (!ws) throw new Error(`Sheet "${step.sheet}" not found`);
      const { row, col } = parseAddress(step.sourceCell);
      const cell = ws.getCell(row, col).value as { formula?: string } | unknown;
      if (!cell || typeof cell !== "object" || !("formula" in (cell as object))) {
        throw new Error(`${step.sourceCell} has no formula to fill down`);
      }
      const base = (cell as { formula: string }).formula;
      for (let r = row + 1; r <= step.throughRow; r++) {
        const adj = base.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (_m, cd, c, rd, rr) =>
          `${cd}${c}${rd}${rd ? rr : String(parseInt(rr, 10) + (r - row))}`,
        );
        ws.getCell(r, col).value = { formula: adj } as ExcelJS.CellFormulaValue;
      }
      return null;
    }
  }
}
