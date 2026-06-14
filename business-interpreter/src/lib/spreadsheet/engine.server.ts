import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";

export type SheetSnapshot = {
  name: string;
  rowCount: number;
  colCount: number;
  preview: (string | number | boolean | null)[][]; // first 50 rows × first 26 cols
  formulas: Record<string, string>; // a few sample formulas keyed by address
};

export type WorkbookSnapshot = {
  sheets: SheetSnapshot[];
};

export async function loadWorkbook(buf: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

export function snapshot(wb: ExcelJS.Workbook): WorkbookSnapshot {
  const sheets: SheetSnapshot[] = [];
  wb.eachSheet((ws) => {
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    const preview: (string | number | boolean | null)[][] = [];
    const previewRows = Math.min(50, rowCount);
    const previewCols = Math.min(26, colCount);
    for (let r = 1; r <= previewRows; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 1; c <= previewCols; c++) {
        const cell = ws.getCell(r, c);
        const v = cell.value;
        if (v == null) row.push(null);
        else if (typeof v === "object" && "result" in (v as object))
          row.push((v as { result?: unknown }).result as never ?? null);
        else if (typeof v === "object" && "richText" in (v as object))
          row.push((v as { richText: { text: string }[] }).richText.map((p) => p.text).join(""));
        else if (v instanceof Date) row.push(v.toISOString());
        else row.push(v as string | number | boolean);
      }
      preview.push(row);
    }
    const formulas: Record<string, string> = {};
    let collected = 0;
    ws.eachRow({ includeEmpty: false }, (row, rNum) => {
      if (collected >= 10) return;
      row.eachCell({ includeEmpty: false }, (cell, cNum) => {
        if (collected >= 10) return;
        const v = cell.value as { formula?: string } | unknown;
        if (v && typeof v === "object" && "formula" in (v as object)) {
          formulas[cell.address || `${rNum},${cNum}`] =
            "=" + ((v as { formula: string }).formula ?? "");
          collected++;
        }
      });
    });
    sheets.push({ name: ws.name, rowCount, colCount, preview, formulas });
  });
  return { sheets };
}

// ---------- Address helpers ----------
function colLettersToNum(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function numToColLetters(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
export function parseAddress(addr: string): { row: number; col: number } {
  const m = /^([A-Za-z]+)(\d+)$/.exec(addr);
  if (!m) throw new Error(`Bad cell address: ${addr}`);
  return { col: colLettersToNum(m[1]), row: parseInt(m[2], 10) };
}
export function parseRange(
  range: string,
): { sheet?: string; start: { row: number; col: number }; end: { row: number; col: number } } {
  let sheet: string | undefined;
  let r = range;
  if (r.includes("!")) {
    const [s, rest] = r.split("!");
    sheet = s.replace(/^'|'$/g, "");
    r = rest;
  }
  const [a, b] = r.split(":");
  const start = parseAddress(a);
  const end = b ? parseAddress(b) : start;
  return { sheet, start, end };
}

// ---------- Operations ----------
export type OpResult = { ok: true; info?: string } | { ok: false; error: string };

export function opCreateSheet(wb: ExcelJS.Workbook, name: string): OpResult {
  if (wb.getWorksheet(name)) return { ok: false, error: `Sheet "${name}" already exists` };
  wb.addWorksheet(name);
  return { ok: true, info: `Created sheet "${name}"` };
}

export function opDeleteSheet(wb: ExcelJS.Workbook, name: string): OpResult {
  const ws = wb.getWorksheet(name);
  if (!ws) return { ok: false, error: `Sheet "${name}" not found` };
  wb.removeWorksheet(ws.id);
  return { ok: true, info: `Deleted sheet "${name}"` };
}

export function opCopyRange(
  wb: ExcelJS.Workbook,
  args: { fromSheet: string; fromRange: string; toSheet: string; toStart: string },
): OpResult {
  const fromWs = wb.getWorksheet(args.fromSheet);
  if (!fromWs) return { ok: false, error: `Source sheet "${args.fromSheet}" not found` };
  let toWs = wb.getWorksheet(args.toSheet);
  if (!toWs) toWs = wb.addWorksheet(args.toSheet);
  const { start, end } = parseRange(args.fromRange);
  const dst = parseAddress(args.toStart);
  let written = 0;
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      const src = fromWs.getCell(r, c);
      const dstCell = toWs.getCell(dst.row + (r - start.row), dst.col + (c - start.col));
      dstCell.value = src.value;
      written++;
    }
  }
  return { ok: true, info: `Copied ${written} cells from ${args.fromSheet}!${args.fromRange} to ${args.toSheet}!${args.toStart}` };
}

export function opSetValues(
  wb: ExcelJS.Workbook,
  args: { sheet: string; start: string; values: (string | number | boolean | null)[][] },
): OpResult {
  let ws = wb.getWorksheet(args.sheet);
  if (!ws) ws = wb.addWorksheet(args.sheet);
  const dst = parseAddress(args.start);
  let written = 0;
  for (let r = 0; r < args.values.length; r++) {
    const row = args.values[r];
    for (let c = 0; c < row.length; c++) {
      ws.getCell(dst.row + r, dst.col + c).value = row[c] as ExcelJS.CellValue;
      written++;
    }
  }
  return { ok: true, info: `Wrote ${written} cells starting at ${args.sheet}!${args.start}` };
}

export function opWriteFormula(
  wb: ExcelJS.Workbook,
  args: { sheet: string; cell: string; formula: string },
): OpResult {
  let ws = wb.getWorksheet(args.sheet);
  if (!ws) ws = wb.addWorksheet(args.sheet);
  const { row, col } = parseAddress(args.cell);
  const f = args.formula.startsWith("=") ? args.formula.slice(1) : args.formula;
  ws.getCell(row, col).value = { formula: f } as ExcelJS.CellFormulaValue;
  return { ok: true, info: `Wrote formula at ${args.sheet}!${args.cell}: =${f}` };
}

export function opFillDown(
  wb: ExcelJS.Workbook,
  args: { sheet: string; sourceCell: string; throughRow: number },
): OpResult {
  const ws = wb.getWorksheet(args.sheet);
  if (!ws) return { ok: false, error: `Sheet "${args.sheet}" not found` };
  const src = parseAddress(args.sourceCell);
  const cell = ws.getCell(src.row, src.col);
  const val = cell.value as { formula?: string } | unknown;
  if (!val || typeof val !== "object" || !("formula" in (val as object))) {
    return { ok: false, error: `${args.sourceCell} does not contain a formula` };
  }
  const baseFormula = (val as { formula: string }).formula;
  let filled = 0;
  for (let r = src.row + 1; r <= args.throughRow; r++) {
    const adjusted = adjustFormulaRow(baseFormula, src.row, r);
    ws.getCell(r, src.col).value = { formula: adjusted } as ExcelJS.CellFormulaValue;
    filled++;
  }
  return { ok: true, info: `Filled formula from ${args.sourceCell} down ${filled} rows` };
}

// Simple A1 row-bump that respects $ anchors.
function adjustFormulaRow(formula: string, fromRow: number, toRow: number): string {
  const delta = toRow - fromRow;
  return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (_m, colDol, col, rowDol, row) => {
    const newRow = rowDol ? row : String(parseInt(row, 10) + delta);
    return `${colDol}${col}${rowDol}${newRow}`;
  });
}

export function opReadRange(
  wb: ExcelJS.Workbook,
  args: { sheet: string; range: string },
): { ok: true; values: (string | number | boolean | null)[][] } | { ok: false; error: string } {
  const ws = wb.getWorksheet(args.sheet);
  if (!ws) return { ok: false, error: `Sheet "${args.sheet}" not found` };
  const { start, end } = parseRange(args.range);
  const out: (string | number | boolean | null)[][] = [];
  for (let r = start.row; r <= end.row; r++) {
    const row: (string | number | boolean | null)[] = [];
    for (let c = start.col; c <= end.col; c++) {
      const cell = ws.getCell(r, c);
      const v = cell.value;
      if (v == null) row.push(null);
      else if (typeof v === "object" && "result" in (v as object))
        row.push(((v as { result?: unknown }).result as never) ?? null);
      else if (typeof v === "object" && "formula" in (v as object))
        row.push("=" + (v as { formula: string }).formula);
      else if (v instanceof Date) row.push(v.toISOString());
      else row.push(v as string | number | boolean);
    }
    out.push(row);
  }
  return { ok: true, values: out };
}

// Compute live formula values via HyperFormula for any new formulas the agent wrote.
export function recalc(wb: ExcelJS.Workbook): { errors: { sheet: string; cell: string; error: string }[] } {
  const sheets: Record<string, (string | number | boolean | null)[][]> = {};
  wb.eachSheet((ws) => {
    const arr: (string | number | boolean | null)[][] = [];
    const rowCount = ws.actualRowCount ?? ws.rowCount ?? 0;
    const colCount = ws.actualColumnCount ?? ws.columnCount ?? 0;
    for (let r = 1; r <= rowCount; r++) {
      const row: (string | number | boolean | null)[] = [];
      for (let c = 1; c <= colCount; c++) {
        const v = ws.getCell(r, c).value;
        if (v == null) row.push(null);
        else if (typeof v === "object" && "formula" in (v as object))
          row.push("=" + (v as { formula: string }).formula);
        else if (typeof v === "object" && "result" in (v as object))
          row.push(((v as { result?: unknown }).result as never) ?? null);
        else if (v instanceof Date) row.push(v.toISOString());
        else row.push(v as string | number | boolean);
      }
      arr.push(row);
    }
    sheets[ws.name] = arr;
  });

  const hf = HyperFormula.buildFromSheets(sheets, { licenseKey: "gpl-v3" });
  const errors: { sheet: string; cell: string; error: string }[] = [];
  for (const sheetName of Object.keys(sheets)) {
    const sheetId = hf.getSheetId(sheetName);
    if (sheetId == null) continue;
    const ws = wb.getWorksheet(sheetName);
    if (!ws) continue;
    const rowCount = sheets[sheetName].length;
    const colCount = sheets[sheetName][0]?.length ?? 0;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const original = sheets[sheetName][r][c];
        if (typeof original !== "string" || !original.startsWith("=")) continue;
        const val = hf.getCellValue({ sheet: sheetId, row: r, col: c });
        const cell = ws.getCell(r + 1, c + 1);
        if (val && typeof val === "object" && "type" in (val as object) && "value" in (val as object)) {
          // CellError
          const err = (val as { type: string; value: string }).value;
          errors.push({ sheet: sheetName, cell: cell.address, error: err });
          cell.value = { formula: original.slice(1), result: err } as ExcelJS.CellFormulaValue;
        } else {
          cell.value = { formula: original.slice(1), result: val as string | number | boolean | null } as ExcelJS.CellFormulaValue;
        }
      }
    }
  }
  hf.destroy();
  return { errors };
}
