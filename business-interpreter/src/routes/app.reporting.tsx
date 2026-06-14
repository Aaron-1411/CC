import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { runReport, exportXlsx } from "@/lib/reporting.functions";
import { toCsv, type Table } from "@/lib/reporting/reshape";
import {
  Database,
  Link2,
  ClipboardPaste,
  Play,
  Download,
  FileSpreadsheet,
  Loader2,
  ArrowLeftRight,
  Rows3,
  Columns3,
} from "lucide-react";

export const Route = createFileRoute("/app/reporting")({
  head: () => ({ meta: [{ title: "Data Reporting — Workbench" }] }),
  component: ReportingPage,
});

type SourceKind = "csv-text" | "csv-url" | "tableau-vds";
type Op = "none" | "transpose" | "unpivot" | "pivot";
type Agg = "sum" | "count" | "mean" | "min" | "max" | "first";

type RunResult = {
  table: Table;
  preview: Table;
  sourceColumns: string[];
  sourceRowCount: number;
  sourceColCount: number;
  rowCount: number;
  colCount: number;
  truncated: boolean;
};

function ReportingPage() {
  const run = useServerFn(runReport);
  const exportFn = useServerFn(exportXlsx);

  const [kind, setKind] = useState<SourceKind>("csv-text");
  const [csvText, setCsvText] = useState("");
  const [csvUrl, setCsvUrl] = useState("");
  const [luid, setLuid] = useState("");

  const [op, setOp] = useState<Op>("none");
  const [idColumns, setIdColumns] = useState<string[]>([]);
  const [pivotColumn, setPivotColumn] = useState("");
  const [valueColumn, setValueColumn] = useState("");
  const [agg, setAgg] = useState<Agg>("sum");
  const [varName, setVarName] = useState("variable");
  const [valueName, setValueName] = useState("value");

  const [result, setResult] = useState<RunResult | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceColumns = result?.sourceColumns ?? columns;

  function buildSource() {
    if (kind === "csv-text") return { kind, text: csvText } as const;
    if (kind === "csv-url") return { kind, url: csvUrl } as const;
    return { kind: "tableau-vds", datasourceLuid: luid } as const;
  }

  function buildTransform() {
    if (op === "none") return { op: "none" } as const;
    if (op === "transpose") return { op: "transpose" } as const;
    if (op === "unpivot")
      return {
        op: "unpivot",
        params: { idColumns, varName, valueName },
      } as const;
    return {
      op: "pivot",
      params: { indexColumns: idColumns, pivotColumn, valueColumn, agg },
    } as const;
  }

  async function loadColumns() {
    // Run with no transform to discover columns + preview the raw source.
    setError(null);
    setLoading(true);
    try {
      const r = (await run({ data: { source: buildSource(), transform: { op: "none" } } })) as RunResult;
      setResult(r);
      setColumns(r.sourceColumns);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runTransform() {
    setError(null);
    setLoading(true);
    try {
      const r = (await run({ data: { source: buildSource(), transform: buildTransform() } })) as RunResult;
      setResult(r);
      if (r.sourceColumns.length) setColumns(r.sourceColumns);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!result) return;
    const csv = toCsv(result.table);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, `report-${Date.now()}.csv`);
  }

  async function downloadXlsx() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      const r = (await exportFn({ data: { table: result.table, sheetName: "Report" } })) as {
        base64: string;
        contentType: string;
      };
      const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
      triggerDownload(new Blob([bytes], { type: r.contentType }), `report-${Date.now()}.xlsx`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const canRun = useMemo(() => {
    if (kind === "csv-text") return csvText.trim().length > 0;
    if (kind === "csv-url") return csvUrl.trim().length > 0;
    return luid.trim().length > 0;
  }, [kind, csvText, csvUrl, luid]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Data Reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull a dataset from a connector, reshape it (transpose / pivot / unpivot) with a
          deterministic engine, then view it here and store it locally as CSV or XLSX.
        </p>
      </div>

      {/* Source */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" /> 1. Source
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <SourceTab active={kind === "csv-text"} onClick={() => setKind("csv-text")} icon={<ClipboardPaste className="h-4 w-4" />} label="Paste CSV" />
          <SourceTab active={kind === "csv-url"} onClick={() => setKind("csv-url")} icon={<Link2 className="h-4 w-4" />} label="CSV URL" />
          <SourceTab active={kind === "tableau-vds"} onClick={() => setKind("tableau-vds")} icon={<Database className="h-4 w-4" />} label="Tableau VDS" />
        </div>

        <div className="mt-4">
          {kind === "csv-text" && (
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"region,month,sales\nNorth,Jan,120\nNorth,Feb,90\nSouth,Jan,75"}
              className="h-40 w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-sm"
            />
          )}
          {kind === "csv-url" && (
            <input
              value={csvUrl}
              onChange={(e) => setCsvUrl(e.target.value)}
              placeholder="https://example.com/data.csv"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
            />
          )}
          {kind === "tableau-vds" && (
            <div>
              <input
                value={luid}
                onChange={(e) => setLuid(e.target.value)}
                placeholder="Published data source LUID"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Reads a published data source via the VizQL Data Service. Requires
                TABLEAU_SERVER_URL / TABLEAU_PAT_NAME / TABLEAU_PAT_SECRET on the deployment; CSV
                sources work without any config.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={loadColumns}
          disabled={!canRun || loading}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Load &amp; preview columns
        </button>
      </section>

      {/* Transform */}
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">2. Transform</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <OpTab active={op === "none"} onClick={() => setOp("none")} icon={<Rows3 className="h-4 w-4" />} label="None" />
          <OpTab active={op === "transpose"} onClick={() => setOp("transpose")} icon={<ArrowLeftRight className="h-4 w-4" />} label="Transpose" />
          <OpTab active={op === "unpivot"} onClick={() => setOp("unpivot")} icon={<Rows3 className="h-4 w-4" />} label="Unpivot" />
          <OpTab active={op === "pivot"} onClick={() => setOp("pivot")} icon={<Columns3 className="h-4 w-4" />} label="Pivot" />
        </div>

        {(op === "unpivot" || op === "pivot") && sourceColumns.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Load a source first to choose columns.
          </p>
        )}

        {(op === "unpivot" || op === "pivot") && sourceColumns.length > 0 && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {op === "pivot" ? "Index (group-by) columns" : "ID columns (keep as-is)"}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {sourceColumns.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setIdColumns((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      idColumns.includes(c)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {op === "pivot" && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Pivot column (→ new columns)">
                  <Select value={pivotColumn} onChange={setPivotColumn} options={sourceColumns} placeholder="Choose…" />
                </Field>
                <Field label="Value column (aggregated)">
                  <Select value={valueColumn} onChange={setValueColumn} options={sourceColumns} placeholder="Choose…" />
                </Field>
                <Field label="Aggregation">
                  <Select
                    value={agg}
                    onChange={(v) => setAgg(v as Agg)}
                    options={["sum", "count", "mean", "min", "max", "first"]}
                  />
                </Field>
              </div>
            )}

            {op === "unpivot" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Variable column name">
                  <input value={varName} onChange={(e) => setVarName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-base" />
                </Field>
                <Field label="Value column name">
                  <input value={valueName} onChange={(e) => setValueName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-base" />
                </Field>
              </div>
            )}
          </div>
        )}

        <button
          onClick={runTransform}
          disabled={!canRun || loading}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run report
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">3. Result</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.rowCount.toLocaleString()} rows × {result.colCount.toLocaleString()} cols
                {result.truncated && " · table truncated for download"}
                {" · "}from {result.sourceRowCount.toLocaleString()}×{result.sourceColCount} source
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadCsv}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                onClick={downloadXlsx}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                XLSX
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {result.preview.columns.map((c, i) => (
                    <th key={i} className="whitespace-nowrap border-b border-border px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.preview.rows.map((row, ri) => (
                  <tr key={ri} className="odd:bg-background even:bg-muted/20">
                    {row.map((cell, ci) => (
                      <td key={ci} className="whitespace-nowrap border-b border-border px-3 py-1.5">
                        {cell === null ? "" : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.rowCount > result.preview.rows.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing first {result.preview.rows.length} rows — download for the full set.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function SourceTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OpTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${
        active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
