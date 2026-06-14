import type ExcelJS from "exceljs";

// =============================================================
// Workbook comparison for golden-file regression fixtures.
// Compares post-recalc cell values per sheet, with a numeric
// tolerance. Returns a structured diff that drives pass/fail.
// =============================================================

export type CellDiff = {
  sheet: string;
  cell: string;
  expected: unknown;
  actual: unknown;
  reason: "missing_sheet" | "extra_sheet" | "value" | "type" | "missing_cell" | "extra_cell";
};

export type DiffReport = {
  pass: boolean;
  cellsCompared: number;
  diffs: CellDiff[];
  sheetSummary: { sheet: string; diffs: number; cells: number }[];
};

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

function equal(a: unknown, b: unknown, tol: number): "ok" | "value" | "type" {
  if (a == null && b == null) return "ok";
  if (a == null || b == null) return "value";
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      return Math.abs(na - nb) <= tol ? "ok" : "value";
    }
    return "type";
  }
  return String(a).trim() === String(b).trim() ? "ok" : "value";
}

export function diffWorkbooks(
  expected: ExcelJS.Workbook,
  actual: ExcelJS.Workbook,
  opts: { tolerance?: number; maxDiffs?: number } = {},
): DiffReport {
  const tol = opts.tolerance ?? 0.0001;
  const cap = opts.maxDiffs ?? 200;
  const diffs: CellDiff[] = [];
  const sheetSummary: DiffReport["sheetSummary"] = [];
  let cellsCompared = 0;

  const expSheets = new Map<string, ExcelJS.Worksheet>();
  expected.eachSheet((ws) => expSheets.set(ws.name, ws));
  const actSheets = new Map<string, ExcelJS.Worksheet>();
  actual.eachSheet((ws) => actSheets.set(ws.name, ws));

  for (const [name, eWs] of expSheets) {
    const aWs = actSheets.get(name);
    if (!aWs) {
      diffs.push({ sheet: name, cell: "*", expected: "sheet", actual: null, reason: "missing_sheet" });
      sheetSummary.push({ sheet: name, diffs: 1, cells: 0 });
      continue;
    }
    const rows = Math.max(eWs.actualRowCount ?? 0, aWs.actualRowCount ?? 0);
    const cols = Math.max(eWs.actualColumnCount ?? 0, aWs.actualColumnCount ?? 0);
    let sheetDiffs = 0;
    let sheetCells = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const eCell = eWs.getCell(r, c);
        const aCell = aWs.getCell(r, c);
        const ev = unwrap(eCell.value);
        const av = unwrap(aCell.value);
        if (ev == null && av == null) continue;
        sheetCells++;
        cellsCompared++;
        const verdict = equal(ev, av, tol);
        if (verdict !== "ok" && diffs.length < cap) {
          diffs.push({
            sheet: name,
            cell: eCell.address,
            expected: ev,
            actual: av,
            reason: ev == null ? "extra_cell" : av == null ? "missing_cell" : verdict,
          });
          sheetDiffs++;
        }
      }
    }
    sheetSummary.push({ sheet: name, diffs: sheetDiffs, cells: sheetCells });
  }
  for (const name of actSheets.keys()) {
    if (!expSheets.has(name)) {
      diffs.push({ sheet: name, cell: "*", expected: null, actual: "sheet", reason: "extra_sheet" });
      sheetSummary.push({ sheet: name, diffs: 1, cells: 0 });
    }
  }

  return { pass: diffs.length === 0, cellsCompared, diffs, sheetSummary };
}
