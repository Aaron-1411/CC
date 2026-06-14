// Validation engine — runs after a transformation. Produces a structured
// report containing reconciliation totals, lineage trees, anomaly checks
// and formula errors. Pure server-side; depends on exceljs + hyperformula.

import type ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";

export type CellRef = { sheet: string; cell: string };

export type Reconciliation = {
  summary: CellRef;
  summary_value: number | string | null;
  recomputed_value: number | string | null;
  delta: number | null;
  delta_pct: number | null;
  classification: "match" | "rounding" | "mismatch" | "non-numeric";
  formula?: string;
};

export type LineageNode = {
  ref: CellRef;
  formula?: string;
  value: number | string | boolean | null;
  children: LineageNode[];
  source?: "source-workbook" | "derived" | "literal";
};

export type Anomaly = {
  kind:
    | "sign_flip" | "outlier" | "missing_period" | "duplicate_key"
    | "mixed_units" | "blank_expected" | "hardcoded_value" | "formula_error";
  severity: "info" | "warn" | "fail";
  ref?: CellRef;
  message: string;
  detail?: Record<string, string | number | boolean | null>;
};

export type FormulaError = { sheet: string; cell: string; error: string; formula?: string };

export type Scorecard = {
  pass: number;
  warn: number;
  fail: number;
  status: "pass" | "warn" | "fail";
  summary_cells_checked: number;
  formulas_checked: number;
};

export type ValidationReport = {
  scorecard: Scorecard;
  reconciliation: Reconciliation[];
  lineage: LineageNode[];
  anomalies: Anomaly[];
  formula_errors: FormulaError[];
};

// ---------- helpers ----------
const colLettersToNum = (s: string): number => {
  let n = 0;
  for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
};
const numToColLetters = (n: number): string => {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const addrToRC = (a: string) => {
  const m = /^([A-Z]+)(\d+)$/i.exec(a);
  if (!m) return null;
  return { col: colLettersToNum(m[1]), row: parseInt(m[2], 10) };
};

// Crude formula reference extractor — finds [SheetName!]A1 or A1:B2 tokens.
const REF_RE = /(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_]*))?!?\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?/g;
function extractRefs(formula: string, defaultSheet: string): { sheet: string; start: CellRef; end: CellRef }[] {
  const refs: { sheet: string; start: CellRef; end: CellRef }[] = [];
  REF_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REF_RE.exec(formula)) !== null) {
    const sheet = m[1] ?? m[2] ?? defaultSheet;
    if (!m[3] || !m[4]) continue;
    const startAddr = `${m[3]}${m[4]}`;
    const endAddr = m[5] && m[6] ? `${m[5]}${m[6]}` : startAddr;
    refs.push({
      sheet,
      start: { sheet, cell: startAddr },
      end: { sheet, cell: endAddr },
    });
  }
  return refs;
}

function getRawCell(ws: ExcelJS.Worksheet, r: number, c: number) {
  return ws.getCell(r, c).value;
}
function cellHasFormula(v: unknown): v is { formula: string; result?: unknown } {
  return !!v && typeof v === "object" && "formula" in (v as object);
}
function cellNumericValue(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "result" in (v as object)) {
    const r = (v as { result?: unknown }).result;
    return typeof r === "number" ? r : null;
  }
  return null;
}

// ---------- public API ----------
export type ValidateOptions = {
  summarySheets?: string[]; // sheet names treated as summary; defaults to last sheet
  sourceSheets?: string[]; // sheets considered raw source; default = all not summary
  expectedColumns?: { sheet: string; header: string }[]; // optional column expectations
};

export function validateWorkbook(
  wb: ExcelJS.Workbook,
  options: ValidateOptions = {},
): ValidationReport {
  const allSheets: string[] = [];
  wb.eachSheet((ws) => allSheets.push(ws.name));
  const summarySheets = options.summarySheets?.length
    ? options.summarySheets.filter((n) => allSheets.includes(n))
    : [allSheets[allSheets.length - 1]].filter(Boolean);
  const sourceSheets = options.sourceSheets?.length
    ? options.sourceSheets
    : allSheets.filter((n) => !summarySheets.includes(n));

  // 1. Recalc via HyperFormula to surface formula errors & values
  const formulaErrors: FormulaError[] = [];
  const hfSheets: Record<string, (string | number | boolean | null)[][]> = {};
  wb.eachSheet((ws) => {
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    const arr: (string | number | boolean | null)[][] = [];
    for (let r = 1; r <= rowCount; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 1; c <= colCount; c++) {
        const v = getRawCell(ws, r, c);
        if (v == null) row.push(null);
        else if (cellHasFormula(v)) row.push("=" + v.formula);
        else if (typeof v === "object" && "richText" in (v as object))
          row.push((v as { richText: { text: string }[] }).richText.map((p) => p.text).join(""));
        else if (v instanceof Date) row.push(v.toISOString());
        else row.push(v as string | number | boolean);
      }
      arr.push(row);
    }
    hfSheets[ws.name] = arr;
  });

  const hf = HyperFormula.buildFromSheets(hfSheets, { licenseKey: "gpl-v3" });
  let formulasChecked = 0;
  for (const name of Object.keys(hfSheets)) {
    const sid = hf.getSheetId(name);
    if (sid == null) continue;
    const grid = hfSheets[name];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        const cell = grid[r][c];
        if (typeof cell !== "string" || !cell.startsWith("=")) continue;
        formulasChecked++;
        const val = hf.getCellValue({ sheet: sid, row: r, col: c });
        if (val && typeof val === "object" && "type" in (val as object) && "value" in (val as object)) {
          formulaErrors.push({
            sheet: name,
            cell: `${numToColLetters(c + 1)}${r + 1}`,
            error: (val as { value: string }).value,
            formula: cell,
          });
        }
      }
    }
  }
  hf.destroy();

  // 2. Reconciliation + lineage on summary sheets
  const reconciliation: Reconciliation[] = [];
  const lineage: LineageNode[] = [];
  let summaryCellsChecked = 0;

  for (const sName of summarySheets) {
    const ws = wb.getWorksheet(sName);
    if (!ws) continue;
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 1; c <= colCount; c++) {
        const raw = getRawCell(ws, r, c);
        if (!cellHasFormula(raw)) continue;
        summaryCellsChecked++;
        const formula = raw.formula;
        const summaryNum = cellNumericValue(raw);
        // Try to recompute by walking refs & summing source values when formula is a SUM.
        let recomputed: number | null = null;
        if (/^\s*SUM\s*\(/i.test(formula)) {
          const refs = extractRefs(formula, sName);
          let total = 0;
          let anyNumeric = false;
          for (const ref of refs) {
            const refWs = wb.getWorksheet(ref.sheet);
            if (!refWs) continue;
            const s = addrToRC(ref.start.cell);
            const e = addrToRC(ref.end.cell);
            if (!s || !e) continue;
            for (let rr = s.row; rr <= e.row; rr++) {
              for (let cc = s.col; cc <= e.col; cc++) {
                const v = cellNumericValue(getRawCell(refWs, rr, cc));
                if (v != null) {
                  total += v;
                  anyNumeric = true;
                }
              }
            }
          }
          if (anyNumeric) recomputed = total;
        }

        const cellAddr = `${numToColLetters(c)}${r}`;
        let classification: Reconciliation["classification"];
        let delta: number | null = null;
        let deltaPct: number | null = null;
        if (summaryNum == null || recomputed == null) {
          classification = recomputed == null ? "non-numeric" : "mismatch";
        } else {
          delta = summaryNum - recomputed;
          deltaPct = recomputed === 0 ? (delta === 0 ? 0 : 1) : Math.abs(delta / recomputed);
          classification =
            Math.abs(delta) < 1e-9 ? "match" : deltaPct < 0.005 ? "rounding" : "mismatch";
        }
        reconciliation.push({
          summary: { sheet: sName, cell: cellAddr },
          summary_value: summaryNum,
          recomputed_value: recomputed,
          delta,
          delta_pct: deltaPct,
          classification,
          formula,
        });

        // Lineage: 2 levels deep
        lineage.push(buildLineage(wb, sName, cellAddr, 2));
      }
    }
  }

  // 3. Anomaly detection on source sheets
  const anomalies: Anomaly[] = [];
  for (const sName of sourceSheets) {
    const ws = wb.getWorksheet(sName);
    if (!ws) continue;
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    // Collect columns (skip header row 1)
    for (let c = 1; c <= colCount; c++) {
      const header = String(ws.getCell(1, c).value ?? "").trim();
      const nums: { row: number; value: number }[] = [];
      const seenKeys = new Map<string, number>();
      const units = new Set<string>();
      for (let r = 2; r <= rowCount; r++) {
        const raw = ws.getCell(r, c).value;
        const num = cellNumericValue(raw);
        if (typeof raw === "string") {
          const um = /([£$€]|USD|GBP|EUR|%|kg|lb)/i.exec(raw);
          if (um) units.add(um[1].toLowerCase());
          const key = raw.trim();
          if (key) {
            seenKeys.set(key, (seenKeys.get(key) ?? 0) + 1);
          }
        }
        if (num != null) nums.push({ row: r, value: num });
      }
      // Outliers (>3σ)
      if (nums.length >= 5) {
        const mean = nums.reduce((a, b) => a + b.value, 0) / nums.length;
        const variance =
          nums.reduce((a, b) => a + (b.value - mean) ** 2, 0) / nums.length;
        const sd = Math.sqrt(variance);
        if (sd > 0) {
          for (const n of nums) {
            const z = Math.abs(n.value - mean) / sd;
            if (z > 3) {
              anomalies.push({
                kind: "outlier",
                severity: "warn",
                ref: { sheet: sName, cell: `${numToColLetters(c)}${n.row}` },
                message: `Outlier in "${header || `col ${c}`}": ${n.value} is ${z.toFixed(1)}σ from mean ${mean.toFixed(2)}`,
              });
            }
          }
        }
        // Sign flips (previous row negative, this positive — for time-series style)
        for (let i = 1; i < nums.length; i++) {
          if (
            Math.sign(nums[i - 1].value) !== 0 &&
            Math.sign(nums[i].value) !== 0 &&
            Math.sign(nums[i - 1].value) !== Math.sign(nums[i].value) &&
            Math.abs(nums[i].value) + Math.abs(nums[i - 1].value) > 1
          ) {
            anomalies.push({
              kind: "sign_flip",
              severity: "info",
              ref: { sheet: sName, cell: `${numToColLetters(c)}${nums[i].row}` },
              message: `Sign flip in "${header || `col ${c}`}": ${nums[i - 1].value} → ${nums[i].value}`,
            });
          }
        }
      }
      // Duplicate keys (only flag if first column looks like key — heuristic: c===1)
      if (c === 1) {
        for (const [k, n] of seenKeys) {
          if (n > 1)
            anomalies.push({
              kind: "duplicate_key",
              severity: "warn",
              ref: { sheet: sName, cell: `${numToColLetters(c)}?` },
              message: `Duplicate key "${k}" appears ${n}× in column "${header || "A"}"`,
            });
        }
      }
      // Mixed units in single column
      if (units.size > 1) {
        anomalies.push({
          kind: "mixed_units",
          severity: "warn",
          ref: { sheet: sName, cell: `${numToColLetters(c)}1` },
          message: `Column "${header || `col ${c}`}" contains mixed units: ${[...units].join(", ")}`,
        });
      }
    }
  }

  // Hardcoded values where summary sheet expected formulas
  for (const sName of summarySheets) {
    const ws = wb.getWorksheet(sName);
    if (!ws) continue;
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    for (let r = 2; r <= rowCount; r++) {
      for (let c = 2; c <= colCount; c++) {
        const v = ws.getCell(r, c).value;
        if (typeof v === "number" && !cellHasFormula(v)) {
          anomalies.push({
            kind: "hardcoded_value",
            severity: "info",
            ref: { sheet: sName, cell: `${numToColLetters(c)}${r}` },
            message: `Hardcoded number ${v} on summary sheet — consider a formula`,
          });
        }
      }
    }
  }

  // Promote formula errors into anomalies as fails
  for (const fe of formulaErrors) {
    anomalies.push({
      kind: "formula_error",
      severity: "fail",
      ref: { sheet: fe.sheet, cell: fe.cell },
      message: `${fe.error} in formula ${fe.formula ?? ""}`,
    });
  }

  // 4. Scorecard
  const reconMismatches = reconciliation.filter((r) => r.classification === "mismatch").length;
  const reconWarn = reconciliation.filter((r) => r.classification === "rounding").length;
  const failCount = reconMismatches + anomalies.filter((a) => a.severity === "fail").length;
  const warnCount = reconWarn + anomalies.filter((a) => a.severity === "warn").length;
  const passCount = Math.max(0, reconciliation.length - reconMismatches - reconWarn);
  const status: Scorecard["status"] = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";
  const scorecard: Scorecard = {
    pass: passCount,
    warn: warnCount,
    fail: failCount,
    status,
    summary_cells_checked: summaryCellsChecked,
    formulas_checked: formulasChecked,
  };

  return { scorecard, reconciliation, lineage, anomalies, formula_errors: formulaErrors };
}

function buildLineage(
  wb: ExcelJS.Workbook,
  sheet: string,
  cell: string,
  depth: number,
): LineageNode {
  const ws = wb.getWorksheet(sheet);
  const rc = addrToRC(cell);
  if (!ws || !rc) {
    return { ref: { sheet, cell }, value: null, children: [], source: "literal" };
  }
  const raw = ws.getCell(rc.row, rc.col).value;
  const value =
    raw == null
      ? null
      : cellHasFormula(raw)
      ? ((raw.result as number | string | boolean | null) ?? null)
      : typeof raw === "object" && "richText" in (raw as object)
      ? (raw as { richText: { text: string }[] }).richText.map((p) => p.text).join("")
      : (raw as number | string | boolean);
  if (!cellHasFormula(raw)) {
    return { ref: { sheet, cell }, value, children: [], source: "literal" };
  }
  const formula = raw.formula;
  const children: LineageNode[] = [];
  if (depth > 0) {
    const refs = extractRefs(formula, sheet);
    let added = 0;
    for (const ref of refs) {
      if (added >= 12) break; // cap fanout
      const s = addrToRC(ref.start.cell);
      const e = addrToRC(ref.end.cell);
      if (!s || !e) continue;
      // for ranges, only expand corner + 1 sample
      const samples: { r: number; c: number }[] = [{ r: s.row, c: s.col }];
      if (s.row !== e.row || s.col !== e.col) samples.push({ r: e.row, c: e.col });
      for (const sm of samples) {
        if (added >= 12) break;
        children.push(buildLineage(wb, ref.sheet, `${numToColLetters(sm.c)}${sm.r}`, depth - 1));
        added++;
      }
    }
  }
  return { ref: { sheet, cell }, formula, value, children, source: "derived" };
}
