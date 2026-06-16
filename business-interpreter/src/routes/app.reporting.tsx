import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { runReport, exportXlsx } from "@/lib/reporting.functions";
import { toCsv, type Table, type TransformSpec, type DatePart } from "@/lib/reporting/reshape";
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
  Filter,
  ArrowDownUp,
  ListChecks,
  Sigma,
  Calculator,
  Scissors,
  TextCursorInput,
  CopyMinus,
  ArrowDownToLine,
  Hash,
  Eraser,
  TableColumnsSplit,
  TableCellsMerge,
  Replace,
  CalendarDays,
  DecimalsArrowRight,
  Percent,
  Plus,
  X,
} from "lucide-react";

export const Route = createFileRoute("/app/reporting")({
  head: () => ({ meta: [{ title: "Data Reporting — Workbench" }] }),
  component: ReportingPage,
});

type SourceKind = "csv-text" | "csv-url" | "tableau-vds";
type Op =
  | "none"
  | "transpose"
  | "unpivot"
  | "pivot"
  | "groupBy"
  | "filter"
  | "sort"
  | "select"
  | "derive"
  | "limit"
  | "rename"
  | "dedupe"
  | "fillDown"
  | "castNumber"
  | "trim"
  | "splitColumn"
  | "mergeColumns"
  | "replace"
  | "dateExtract"
  | "round"
  | "percentOfTotal";
type Agg = "sum" | "count" | "mean" | "min" | "max" | "first" | "last" | "median" | "countDistinct";

const AGG_OPTIONS: Agg[] = [
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
type AggRow = { column: string; agg: Agg; as: string };
type DeriveOperator = "+" | "-" | "*" | "/";

const DERIVE_OP_LABELS: Record<DeriveOperator, string> = {
  "+": "+ add",
  "-": "− subtract",
  "*": "× multiply",
  "/": "÷ divide",
};
type FilterOp =
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

const FILTER_OP_LABELS: Record<FilterOp, string> = {
  eq: "= equals",
  ne: "≠ not equal",
  gt: "> greater than",
  gte: "≥ greater or equal",
  lt: "< less than",
  lte: "≤ less or equal",
  contains: "contains",
  notContains: "does not contain",
  isEmpty: "is empty",
  notEmpty: "is not empty",
};

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
  const [filterColumn, setFilterColumn] = useState("");
  const [filterOp, setFilterOp] = useState<FilterOp>("eq");
  const [filterValue, setFilterValue] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectColumns, setSelectColumns] = useState<string[]>([]);
  const [groupColumns, setGroupColumns] = useState<string[]>([]);
  const [aggRows, setAggRows] = useState<AggRow[]>([{ column: "", agg: "sum", as: "" }]);
  const [deriveAs, setDeriveAs] = useState("");
  const [deriveLeft, setDeriveLeft] = useState("");
  const [deriveOperator, setDeriveOperator] = useState<DeriveOperator>("+");
  const [deriveRightKind, setDeriveRightKind] = useState<"column" | "const">("column");
  const [deriveRight, setDeriveRight] = useState("");
  const [limitCount, setLimitCount] = useState("10");
  const [limitOffset, setLimitOffset] = useState("0");
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [dedupeColumns, setDedupeColumns] = useState<string[]>([]);
  const [fillDownColumns, setFillDownColumns] = useState<string[]>([]);
  const [castColumns, setCastColumns] = useState<string[]>([]);
  const [castOnError, setCastOnError] = useState<"null" | "keep">("null");
  const [trimColumns, setTrimColumns] = useState<string[]>([]);
  const [trimCollapse, setTrimCollapse] = useState(false);
  const [splitCol, setSplitCol] = useState("");
  const [splitDelimiter, setSplitDelimiter] = useState(", ");
  const [splitInto, setSplitInto] = useState("");
  const [splitKeepOriginal, setSplitKeepOriginal] = useState(false);
  const [mergeColumnsSel, setMergeColumnsSel] = useState<string[]>([]);
  const [mergeSeparator, setMergeSeparator] = useState(" ");
  const [mergeInto, setMergeInto] = useState("");
  const [mergeKeepOriginals, setMergeKeepOriginals] = useState(false);
  const [mergeSkipEmpty, setMergeSkipEmpty] = useState(false);
  const [replaceColumns, setReplaceColumns] = useState<string[]>([]);
  const [replaceFind, setReplaceFind] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [replaceMatchCase, setReplaceMatchCase] = useState(false);
  const [replaceWholeCell, setReplaceWholeCell] = useState(false);
  const [dateExtractCol, setDateExtractCol] = useState("");
  const [dateExtractPart, setDateExtractPart] = useState<DatePart>("year");
  const [dateExtractInto, setDateExtractInto] = useState("");
  const [dateExtractKeepOriginal, setDateExtractKeepOriginal] = useState(true);
  const [roundColumns, setRoundColumns] = useState<string[]>([]);
  const [roundDecimals, setRoundDecimals] = useState("2");
  const [percentOfTotalCol, setPercentOfTotalCol] = useState("");
  const [percentOfTotalGroupCols, setPercentOfTotalGroupCols] = useState<string[]>([]);
  const [percentOfTotalInto, setPercentOfTotalInto] = useState("");
  const [percentOfTotalDecimals, setPercentOfTotalDecimals] = useState("2");

  const [result, setResult] = useState<RunResult | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<TransformSpec[]>([]);
  const [pipelineColumns, setPipelineColumns] = useState<string[]>([]);

  // Columns offered to the draft builder: once a pipeline exists, the next step
  // works against the columns produced by the steps so far, not the raw source.
  const baseColumns = result?.sourceColumns ?? columns;
  const sourceColumns = steps.length > 0 ? pipelineColumns : baseColumns;

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
    if (op === "pivot")
      return {
        op: "pivot",
        params: { indexColumns: idColumns, pivotColumn, valueColumn, agg },
      } as const;
    if (op === "groupBy")
      return {
        op: "groupBy",
        params: {
          groupColumns,
          aggregations: aggRows
            .filter((r) => r.column)
            .map((r) => ({ column: r.column, agg: r.agg, ...(r.as.trim() ? { as: r.as.trim() } : {}) })),
        },
      } as const;
    if (op === "filter")
      return {
        op: "filter",
        params: { column: filterColumn, op: filterOp, value: filterValue },
      } as const;
    if (op === "sort")
      return {
        op: "sort",
        params: { column: sortColumn, direction: sortDir },
      } as const;
    if (op === "derive")
      return {
        op: "derive",
        params: {
          as: deriveAs.trim(),
          left: deriveLeft,
          operator: deriveOperator,
          rightKind: deriveRightKind,
          right: deriveRight.trim(),
        },
      } as const;
    if (op === "limit") {
      const count = Math.max(0, Math.floor(Number(limitCount) || 0));
      const offset = Math.max(0, Math.floor(Number(limitOffset) || 0));
      return {
        op: "limit",
        params: offset > 0 ? { count, offset } : { count },
      } as const;
    }
    if (op === "rename")
      return {
        op: "rename",
        params: { renames: [{ from: renameFrom, to: renameTo.trim() }] },
      } as const;
    if (op === "dedupe")
      return {
        op: "dedupe",
        params: dedupeColumns.length ? { columns: dedupeColumns } : {},
      } as const;
    if (op === "fillDown")
      return {
        op: "fillDown",
        params: fillDownColumns.length ? { columns: fillDownColumns } : {},
      } as const;
    if (op === "castNumber")
      return {
        op: "castNumber",
        params: { columns: castColumns, onError: castOnError },
      } as const;
    if (op === "trim")
      return {
        op: "trim",
        params: {
          ...(trimColumns.length ? { columns: trimColumns } : {}),
          ...(trimCollapse ? { collapse: true } : {}),
        },
      } as const;
    if (op === "splitColumn") {
      const intoNames = splitInto
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        op: "splitColumn",
        params: {
          column: splitCol,
          delimiter: splitDelimiter,
          ...(intoNames.length ? { into: intoNames } : {}),
          ...(splitKeepOriginal ? { keepOriginal: true } : {}),
        },
      } as const;
    }
    if (op === "mergeColumns")
      return {
        op: "mergeColumns",
        params: {
          columns: mergeColumnsSel,
          separator: mergeSeparator,
          into: mergeInto.trim(),
          ...(mergeKeepOriginals ? { keepOriginals: true } : {}),
          ...(mergeSkipEmpty ? { skipEmpty: true } : {}),
        },
      } as const;
    if (op === "replace")
      return {
        op: "replace",
        params: {
          ...(replaceColumns.length ? { columns: replaceColumns } : {}),
          find: replaceFind,
          replace: replaceWith,
          ...(replaceMatchCase ? { matchCase: true } : {}),
          ...(replaceWholeCell ? { wholeCell: true } : {}),
        },
      } as const;
    if (op === "dateExtract")
      return {
        op: "dateExtract",
        params: {
          column: dateExtractCol,
          part: dateExtractPart,
          ...(dateExtractInto.trim() ? { into: dateExtractInto.trim() } : {}),
          ...(dateExtractKeepOriginal ? {} : { keepOriginal: false }),
        },
      } as const;
    if (op === "round")
      return {
        op: "round",
        params: {
          ...(roundColumns.length ? { columns: roundColumns } : {}),
          decimals: Number.parseInt(roundDecimals, 10) || 0,
        },
      } as const;
    if (op === "percentOfTotal")
      return {
        op: "percentOfTotal",
        params: {
          column: percentOfTotalCol,
          ...(percentOfTotalGroupCols.length ? { groupColumns: percentOfTotalGroupCols } : {}),
          ...(percentOfTotalInto.trim() ? { into: percentOfTotalInto.trim() } : {}),
          decimals: Number.parseInt(percentOfTotalDecimals, 10) || 0,
        },
      } as const;
    return { op: "select", params: { columns: selectColumns } } as const;
  }

  async function loadColumns() {
    // Run with no transform to discover columns + preview the raw source.
    setError(null);
    setLoading(true);
    try {
      const r = (await run({ data: { source: buildSource(), transform: { op: "none" } } })) as RunResult;
      setResult(r);
      setColumns(r.sourceColumns);
      setSteps([]);
      setPipelineColumns([]);
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
      const draft = buildTransform() as TransformSpec;
      const includeDraft = op !== "none" && transformReady;
      const specs: TransformSpec[] = includeDraft ? [...steps, draft] : steps;
      const r = (await run({
        data: specs.length
          ? { source: buildSource(), transforms: specs }
          : { source: buildSource(), transform: { op: "none" } },
      })) as RunResult;
      setResult(r);
      if (r.sourceColumns.length) setColumns(r.sourceColumns);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function resetDraft() {
    setOp("none");
    setIdColumns([]);
    setPivotColumn("");
    setValueColumn("");
    setAgg("sum");
    setVarName("variable");
    setValueName("value");
    setFilterColumn("");
    setFilterOp("eq");
    setFilterValue("");
    setSortColumn("");
    setSortDir("asc");
    setSelectColumns([]);
    setGroupColumns([]);
    setAggRows([{ column: "", agg: "sum", as: "" }]);
    setDeriveAs("");
    setDeriveLeft("");
    setDeriveOperator("+");
    setDeriveRightKind("column");
    setDeriveRight("");
    setLimitCount("10");
    setLimitOffset("0");
    setRenameFrom("");
    setRenameTo("");
    setDedupeColumns([]);
    setFillDownColumns([]);
    setCastColumns([]);
    setCastOnError("null");
    setTrimColumns([]);
    setTrimCollapse(false);
    setSplitCol("");
    setSplitDelimiter(", ");
    setSplitInto("");
    setSplitKeepOriginal(false);
    setMergeColumnsSel([]);
    setMergeSeparator(" ");
    setMergeInto("");
    setMergeKeepOriginals(false);
    setMergeSkipEmpty(false);
    setReplaceColumns([]);
    setReplaceFind("");
    setReplaceWith("");
    setReplaceMatchCase(false);
    setReplaceWholeCell(false);
    setDateExtractCol("");
    setDateExtractPart("year");
    setDateExtractInto("");
    setDateExtractKeepOriginal(true);
    setRoundColumns([]);
    setRoundDecimals("2");
    setPercentOfTotalCol("");
    setPercentOfTotalGroupCols([]);
    setPercentOfTotalInto("");
    setPercentOfTotalDecimals("2");
  }

  async function addStep() {
    if (op === "none" || !transformReady) return;
    const nextSteps = [...steps, buildTransform() as TransformSpec];
    setError(null);
    setLoading(true);
    try {
      const r = (await run({
        data: { source: buildSource(), transforms: nextSteps },
      })) as RunResult;
      setSteps(nextSteps);
      setResult(r);
      if (r.sourceColumns.length) setColumns(r.sourceColumns);
      setPipelineColumns(r.table.columns);
      resetDraft();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function applyPipelineSteps(nextSteps: TransformSpec[]) {
    setError(null);
    setLoading(true);
    try {
      const r = (await run({
        data: nextSteps.length
          ? { source: buildSource(), transforms: nextSteps }
          : { source: buildSource(), transform: { op: "none" } },
      })) as RunResult;
      setSteps(nextSteps);
      setResult(r);
      if (r.sourceColumns.length) setColumns(r.sourceColumns);
      setPipelineColumns(nextSteps.length ? r.table.columns : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function removeStep(idx: number) {
    void applyPipelineSteps(steps.filter((_, i) => i !== idx));
  }

  function clearPipeline() {
    void applyPipelineSteps([]);
  }

  function describeStep(spec: TransformSpec): string {
    switch (spec.op) {
      case "transpose":
        return "Transpose";
      case "unpivot":
        return `Unpivot · keep ${spec.params.idColumns.join(", ")}`;
      case "pivot":
        return `Pivot ${spec.params.pivotColumn} → ${spec.params.valueColumn} (${spec.params.agg ?? "sum"})`;
      case "groupBy":
        return `Group by ${spec.params.groupColumns.join(", ")}`;
      case "filter":
        return `Filter ${spec.params.column} ${spec.params.op}${
          spec.params.value ? ` ${spec.params.value}` : ""
        }`;
      case "sort":
        return `Sort ${spec.params.column} ${spec.params.direction ?? "asc"}`;
      case "select":
        return `Select ${spec.params.columns.join(", ")}`;
      case "derive":
        return `Compute ${spec.params.as} = ${spec.params.left} ${spec.params.operator} ${spec.params.right}`;
      case "limit":
        return `Limit ${spec.params.count} rows${
          spec.params.offset ? ` (skip ${spec.params.offset})` : ""
        }`;
      case "rename":
        return `Rename ${spec.params.renames.map((r) => `${r.from} → ${r.to}`).join(", ")}`;
      case "dedupe":
        return spec.params.columns?.length
          ? `Dedupe on ${spec.params.columns.join(", ")}`
          : "Dedupe rows";
      case "fillDown":
        return spec.params.columns?.length
          ? `Fill down ${spec.params.columns.join(", ")}`
          : "Fill down empty cells";
      case "castNumber":
        return `Convert ${spec.params.columns.join(", ")} to number`;
      case "trim":
        return (
          (spec.params.columns?.length
            ? `Trim ${spec.params.columns.join(", ")}`
            : "Trim whitespace") + (spec.params.collapse ? " (collapse spaces)" : "")
        );
      case "splitColumn":
        return (
          `Split ${spec.params.column} by "${spec.params.delimiter}"` +
          (spec.params.into?.length ? ` → ${spec.params.into.join(", ")}` : "")
        );
      case "mergeColumns":
        return `Merge ${spec.params.columns.join(" + ")} → ${spec.params.into}`;
      case "replace":
        return (
          `Replace "${spec.params.find}" → "${spec.params.replace ?? ""}"` +
          (spec.params.columns?.length ? ` in ${spec.params.columns.join(", ")}` : " (all columns)")
        );
      case "dateExtract":
        return (
          `Extract ${spec.params.part} from ${spec.params.column}` +
          (spec.params.into ? ` → ${spec.params.into}` : "")
        );
      case "round":
        return (
          `Round to ${spec.params.decimals ?? 0} dp` +
          (spec.params.columns?.length ? ` in ${spec.params.columns.join(", ")}` : " (all columns)")
        );
      case "percentOfTotal":
        return (
          `% of total of ${spec.params.column}` +
          (spec.params.groupColumns?.length ? ` within ${spec.params.groupColumns.join(", ")}` : "")
        );
      default:
        return "Pass-through";
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

  const valuelessFilter = filterOp === "isEmpty" || filterOp === "notEmpty";

  const transformReady = useMemo(() => {
    switch (op) {
      case "pivot":
        return idColumns.length > 0 && !!pivotColumn && !!valueColumn;
      case "unpivot":
        return idColumns.length > 0;
      case "groupBy":
        return groupColumns.length > 0 && aggRows.some((r) => r.column);
      case "filter":
        return !!filterColumn && (valuelessFilter || filterValue.trim().length > 0);
      case "sort":
        return !!sortColumn;
      case "select":
        return selectColumns.length > 0;
      case "derive":
        return !!deriveAs.trim() && !!deriveLeft && !!deriveRight.trim();
      case "limit":
        return Number.isFinite(Number(limitCount)) && Number(limitCount) >= 0 && limitCount.trim() !== "";
      case "rename":
        return !!renameFrom && !!renameTo.trim();
      case "dedupe":
        return true;
      case "fillDown":
        return true;
      case "castNumber":
        return castColumns.length > 0;
      case "trim":
        return true;
      case "splitColumn":
        return !!splitCol && splitDelimiter.length > 0;
      case "mergeColumns":
        return mergeColumnsSel.length >= 2 && !!mergeInto.trim();
      case "replace":
        return replaceFind.length > 0;
      case "dateExtract":
        return !!dateExtractCol;
      case "round":
        return true;
      case "percentOfTotal":
        return !!percentOfTotalCol;
      default:
        return true;
    }
  }, [op, idColumns, groupColumns, aggRows, pivotColumn, valueColumn, filterColumn, valuelessFilter, filterValue, sortColumn, selectColumns, deriveAs, deriveLeft, deriveRight, limitCount, renameFrom, renameTo, castColumns, splitCol, splitDelimiter, mergeColumnsSel, mergeInto, replaceFind, dateExtractCol, percentOfTotalCol]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Data Reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull a dataset from a connector, reshape it (filter, sort, select, transpose, pivot,
          unpivot, group by, compute column, limit rows, rename column, dedupe, fill down, to number, trim, split column, merge columns, find &amp; replace, extract date parts, round numbers, percent of total) with a deterministic engine — chain several
          steps into a pipeline that runs in order — then view it here and store it locally as CSV or
          XLSX.
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

        {steps.length > 0 && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Pipeline · {steps.length} step{steps.length > 1 ? "s" : ""} (runs in order)
              </span>
              <button
                onClick={clearPipeline}
                disabled={loading}
                className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {steps.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                >
                  <span className="font-mono text-muted-foreground">{i + 1}</span>
                  {describeStep(s)}
                  <button
                    onClick={() => removeStep(i)}
                    disabled={loading}
                    aria-label={`Remove step ${i + 1}`}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {steps.length > 0
            ? "Add another step to keep chaining, or run the report to apply the whole pipeline."
            : "Configure a transform, then add it as a pipeline step or run it directly."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <OpTab active={op === "none"} onClick={() => setOp("none")} icon={<Rows3 className="h-4 w-4" />} label="None" />
          <OpTab active={op === "transpose"} onClick={() => setOp("transpose")} icon={<ArrowLeftRight className="h-4 w-4" />} label="Transpose" />
          <OpTab active={op === "unpivot"} onClick={() => setOp("unpivot")} icon={<Rows3 className="h-4 w-4" />} label="Unpivot" />
          <OpTab active={op === "pivot"} onClick={() => setOp("pivot")} icon={<Columns3 className="h-4 w-4" />} label="Pivot" />
          <OpTab active={op === "groupBy"} onClick={() => setOp("groupBy")} icon={<Sigma className="h-4 w-4" />} label="Group by" />
          <OpTab active={op === "filter"} onClick={() => setOp("filter")} icon={<Filter className="h-4 w-4" />} label="Filter" />
          <OpTab active={op === "sort"} onClick={() => setOp("sort")} icon={<ArrowDownUp className="h-4 w-4" />} label="Sort" />
          <OpTab active={op === "select"} onClick={() => setOp("select")} icon={<ListChecks className="h-4 w-4" />} label="Select cols" />
          <OpTab active={op === "derive"} onClick={() => setOp("derive")} icon={<Calculator className="h-4 w-4" />} label="Compute col" />
          <OpTab active={op === "limit"} onClick={() => setOp("limit")} icon={<Scissors className="h-4 w-4" />} label="Limit rows" />
          <OpTab active={op === "rename"} onClick={() => setOp("rename")} icon={<TextCursorInput className="h-4 w-4" />} label="Rename col" />
          <OpTab active={op === "dedupe"} onClick={() => setOp("dedupe")} icon={<CopyMinus className="h-4 w-4" />} label="Dedupe" />
          <OpTab active={op === "fillDown"} onClick={() => setOp("fillDown")} icon={<ArrowDownToLine className="h-4 w-4" />} label="Fill down" />
          <OpTab active={op === "castNumber"} onClick={() => setOp("castNumber")} icon={<Hash className="h-4 w-4" />} label="To number" />
          <OpTab active={op === "trim"} onClick={() => setOp("trim")} icon={<Eraser className="h-4 w-4" />} label="Trim" />
          <OpTab active={op === "splitColumn"} onClick={() => setOp("splitColumn")} icon={<TableColumnsSplit className="h-4 w-4" />} label="Split col" />
          <OpTab active={op === "mergeColumns"} onClick={() => setOp("mergeColumns")} icon={<TableCellsMerge className="h-4 w-4" />} label="Merge cols" />
          <OpTab active={op === "replace"} onClick={() => setOp("replace")} icon={<Replace className="h-4 w-4" />} label="Find & replace" />
          <OpTab active={op === "dateExtract"} onClick={() => setOp("dateExtract")} icon={<CalendarDays className="h-4 w-4" />} label="Date parts" />
          <OpTab active={op === "round"} onClick={() => setOp("round")} icon={<DecimalsArrowRight className="h-4 w-4" />} label="Round" />
          <OpTab active={op === "percentOfTotal"} onClick={() => setOp("percentOfTotal")} icon={<Percent className="h-4 w-4" />} label="% of total" />
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
                    options={AGG_OPTIONS}
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

        {op === "groupBy" && sourceColumns.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Load a source first to choose columns.
          </p>
        )}

        {op === "groupBy" && sourceColumns.length > 0 && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Group-by columns (one output row per unique combination)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {sourceColumns.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setGroupColumns((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      groupColumns.includes(c)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Aggregations</label>
              <div className="mt-2 space-y-2">
                {aggRows.map((rowSpec, idx) => (
                  <div key={idx} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Field label="Column">
                      <Select
                        value={rowSpec.column}
                        onChange={(v) =>
                          setAggRows((prev) => prev.map((r, i) => (i === idx ? { ...r, column: v } : r)))
                        }
                        options={sourceColumns}
                        placeholder="Choose…"
                      />
                    </Field>
                    <Field label="Function">
                      <Select
                        value={rowSpec.agg}
                        onChange={(v) =>
                          setAggRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, agg: v as Agg } : r)),
                          )
                        }
                        options={AGG_OPTIONS}
                      />
                    </Field>
                    <Field label="Name (optional)">
                      <input
                        value={rowSpec.as}
                        onChange={(e) =>
                          setAggRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, as: e.target.value } : r)),
                          )
                        }
                        placeholder={rowSpec.column ? `${rowSpec.agg}_${rowSpec.column}` : "auto"}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                      />
                    </Field>
                    <button
                      onClick={() =>
                        setAggRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
                      }
                      disabled={aggRows.length <= 1}
                      aria-label="Remove aggregation"
                      className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAggRows((prev) => [...prev, { column: "", agg: "sum", as: "" }])}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add aggregation
              </button>
            </div>
          </div>
        )}

        {(op === "filter" || op === "sort" || op === "select" || op === "derive" || op === "rename") &&
          sourceColumns.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Load a source first to choose columns.
            </p>
          )}

        {op === "filter" && sourceColumns.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Column">
              <Select value={filterColumn} onChange={setFilterColumn} options={sourceColumns} placeholder="Choose…" />
            </Field>
            <Field label="Condition">
              <Select
                value={filterOp}
                onChange={(v) => setFilterOp(v as FilterOp)}
                options={Object.keys(FILTER_OP_LABELS)}
                labels={FILTER_OP_LABELS}
              />
            </Field>
            {!valuelessFilter && (
              <Field label="Value">
                <input
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="e.g. North or 100"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
            )}
          </div>
        )}

        {op === "sort" && sourceColumns.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Column">
              <Select value={sortColumn} onChange={setSortColumn} options={sourceColumns} placeholder="Choose…" />
            </Field>
            <Field label="Direction">
              <Select
                value={sortDir}
                onChange={(v) => setSortDir(v as "asc" | "desc")}
                options={["asc", "desc"]}
                labels={{ asc: "Ascending (A→Z, 0→9)", desc: "Descending (Z→A, 9→0)" }}
              />
            </Field>
          </div>
        )}

        {op === "select" && sourceColumns.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Columns to keep (click order = output order)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {sourceColumns.map((c) => {
                const pos = selectColumns.indexOf(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setSelectColumns((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      pos >= 0
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {pos >= 0 ? `${pos + 1}. ${c}` : c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {op === "derive" && sourceColumns.length > 0 && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Build a new column from arithmetic on existing columns. Non-numeric or empty values
              produce a blank result; dividing by zero is blank too.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Left column">
                <Select value={deriveLeft} onChange={setDeriveLeft} options={sourceColumns} placeholder="Choose…" />
              </Field>
              <Field label="Operator">
                <Select
                  value={deriveOperator}
                  onChange={(v) => setDeriveOperator(v as DeriveOperator)}
                  options={Object.keys(DERIVE_OP_LABELS)}
                  labels={DERIVE_OP_LABELS}
                />
              </Field>
              <Field label="Right operand">
                <Select
                  value={deriveRightKind}
                  onChange={(v) => {
                    setDeriveRightKind(v as "column" | "const");
                    setDeriveRight("");
                  }}
                  options={["column", "const"]}
                  labels={{ column: "Another column", const: "Constant number" }}
                />
              </Field>
              {deriveRightKind === "column" ? (
                <Field label="Right column">
                  <Select value={deriveRight} onChange={setDeriveRight} options={sourceColumns} placeholder="Choose…" />
                </Field>
              ) : (
                <Field label="Constant value">
                  <input
                    value={deriveRight}
                    onChange={(e) => setDeriveRight(e.target.value)}
                    placeholder="e.g. 100 or 1.2"
                    inputMode="decimal"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                  />
                </Field>
              )}
            </div>
            <Field label="New column name (overwrites if it matches an existing column)">
              <input
                value={deriveAs}
                onChange={(e) => setDeriveAs(e.target.value)}
                placeholder="e.g. margin"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
            </Field>
          </div>
        )}

        {op === "limit" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Keep only the first N rows — chain it after a Sort step for a “top 10” report. Use
              Skip to page past the first rows.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Keep first N rows">
                <input
                  value={limitCount}
                  onChange={(e) => setLimitCount(e.target.value)}
                  placeholder="e.g. 10"
                  inputMode="numeric"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
              <Field label="Skip rows from top (optional)">
                <input
                  value={limitOffset}
                  onChange={(e) => setLimitOffset(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
            </div>
          </div>
        )}

        {op === "rename" && sourceColumns.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Give a column a clearer name — handy for tidying headers before export or after a
              pivot/compute step.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Column to rename">
                <Select
                  value={renameFrom}
                  onChange={setRenameFrom}
                  options={sourceColumns}
                  placeholder="Choose…"
                />
              </Field>
              <Field label="New name">
                <input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  placeholder="e.g. Revenue"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
            </div>
          </div>
        )}

        {op === "dedupe" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Remove duplicate rows, keeping the first occurrence and the original order. Pick
              columns to dedupe on — leave all unselected to match on the whole row.
            </p>
            {sourceColumns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sourceColumns.map((c) => {
                  const on = dedupeColumns.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setDedupeColumns((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose columns — or run as-is to dedupe whole rows.
              </p>
            )}
          </div>
        )}

        {op === "fillDown" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Forward-fill blank cells (empty or null) with the last value above them, per column.
              Useful for crosstab exports where group labels only appear on the first row of each
              block. Leave all unselected to fill every column; leading blanks stay blank.
            </p>
            {sourceColumns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sourceColumns.map((c) => {
                  const on = fillDownColumns.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setFillDownColumns((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose columns — or run as-is to fill every column.
              </p>
            )}
          </div>
        )}

        {op === "castNumber" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Convert messy text — currency symbols, %, thousands commas, (accounting negatives) —
              into real numbers so they can be aggregated, pivoted, or computed on. Pick the columns
              to convert; label columns are left untouched.
            </p>
            {sourceColumns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sourceColumns.map((c) => {
                  const on = castColumns.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setCastColumns((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose the columns to convert.
              </p>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                When a value can&apos;t be parsed
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCastOnError("null")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    castOnError === "null"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Blank it out
                </button>
                <button
                  onClick={() => setCastOnError("keep")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    castOnError === "keep"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Keep original text
                </button>
              </div>
            </div>
          </div>
        )}

        {op === "trim" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Strip stray spaces around values — fixes &quot;North &quot; vs &quot;North&quot; that
              silently split group by, dedupe, and joins. Leave every column unselected to clean the
              whole table; only text cells are touched.
            </p>
            {sourceColumns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sourceColumns.map((c) => {
                  const on = trimColumns.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setTrimColumns((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose columns, or run with none selected to clean every column.
              </p>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Inner whitespace</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTrimCollapse(false)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    !trimCollapse
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Edges only
                </button>
                <button
                  onClick={() => setTrimCollapse(true)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    trimCollapse
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Collapse inner runs
                </button>
              </div>
            </div>
          </div>
        )}

        {op === "splitColumn" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Split one compound text column into several — &quot;Leeds, West Yorkshire&quot; into city
              + region, &quot;2024-Q3&quot; into year + quarter. Only text cells are split. Leave the
              output names blank to auto-name them; name them to pin the column count (extra parts fold
              into the last column).
            </p>
            {sourceColumns.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Column to split">
                    <Select
                      value={splitCol}
                      onChange={setSplitCol}
                      options={sourceColumns}
                      placeholder="Choose…"
                    />
                  </Field>
                  <Field label="Delimiter">
                    <input
                      value={splitDelimiter}
                      onChange={(e) => setSplitDelimiter(e.target.value)}
                      placeholder='e.g. ", " or "-" or "|"'
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                    />
                  </Field>
                </div>
                <Field label="Output names (optional, comma-separated)">
                  <input
                    value={splitInto}
                    onChange={(e) => setSplitInto(e.target.value)}
                    placeholder="e.g. City, Region"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                  />
                </Field>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Source column</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSplitKeepOriginal(false)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        !splitKeepOriginal
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => setSplitKeepOriginal(true)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        splitKeepOriginal
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Keep original
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose a column to split.
              </p>
            )}
          </div>
        )}

        {op === "mergeColumns" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Concatenate several columns into one — first + last into a full name, year + quarter
              into &quot;2024-Q3&quot;, address parts into a single line. The inverse of split column.
              Click columns in the order you want them joined.
            </p>
            {sourceColumns.length > 0 ? (
              <>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Columns to merge (in click order)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sourceColumns.map((c) => {
                      const pos = mergeColumnsSel.indexOf(c);
                      const on = pos >= 0;
                      return (
                        <button
                          key={c}
                          onClick={() =>
                            setMergeColumnsSel((prev) =>
                              prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {on ? `${pos + 1}. ${c}` : c}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Separator">
                    <input
                      value={mergeSeparator}
                      onChange={(e) => setMergeSeparator(e.target.value)}
                      placeholder='e.g. " " or ", " or "-"'
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                    />
                  </Field>
                  <Field label="New column name">
                    <input
                      value={mergeInto}
                      onChange={(e) => setMergeInto(e.target.value)}
                      placeholder="e.g. Full name"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                    />
                  </Field>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Source columns</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMergeKeepOriginals(false)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        !mergeKeepOriginals
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => setMergeKeepOriginals(true)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        mergeKeepOriginals
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Keep originals
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Empty cells</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMergeSkipEmpty(false)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        !mergeSkipEmpty
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Keep gaps
                    </button>
                    <button
                      onClick={() => setMergeSkipEmpty(true)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        mergeSkipEmpty
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      Skip empty
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose columns to merge.
              </p>
            )}
          </div>
        )}

        {op === "replace" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Find and replace literal text inside cells — fix a recurring typo, blank out
              &quot;N/A&quot;, or standardise &quot;USA&quot; to &quot;United States&quot;. Only text
              cells are searched; numbers, booleans and blanks pass through untouched. Leave columns
              unselected to apply to every column.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Find">
                <input
                  value={replaceFind}
                  onChange={(e) => setReplaceFind(e.target.value)}
                  placeholder="e.g. N/A"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
              <Field label="Replace with">
                <input
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  placeholder="(leave blank to delete the match)"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
                />
              </Field>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Match case</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setReplaceMatchCase(false)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    !replaceMatchCase
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Ignore case
                </button>
                <button
                  onClick={() => setReplaceMatchCase(true)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    replaceMatchCase
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Match case
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Match scope</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setReplaceWholeCell(false)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    !replaceWholeCell
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Anywhere in cell
                </button>
                <button
                  onClick={() => setReplaceWholeCell(true)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    replaceWholeCell
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Whole cell only
                </button>
              </div>
            </div>
            {sourceColumns.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Columns (none selected = all columns)
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceColumns.map((c) => {
                    const on = replaceColumns.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setReplaceColumns((prev) =>
                            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to limit the replace to specific columns.
              </p>
            )}
          </div>
        )}

        {op === "dateExtract" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Pull a component out of an ISO date column (YYYY-MM-DD or YYYY/MM/DD, with an optional
              time suffix). Year, month, day and quarter come back as numbers so they sort and
              aggregate correctly; weekday, year-month and year-quarter come back as labels. Cells
              that aren&apos;t valid dates become blank. Add several steps to get more than one part
              side by side.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date column">
                <Select
                  value={dateExtractCol}
                  onChange={setDateExtractCol}
                  options={sourceColumns}
                  placeholder="Choose…"
                />
              </Field>
              <Field label="Part to extract">
                <Select
                  value={dateExtractPart}
                  onChange={(v) => setDateExtractPart(v as DatePart)}
                  options={[
                    "year",
                    "month",
                    "day",
                    "quarter",
                    "weekday",
                    "yearMonth",
                    "yearQuarter",
                  ]}
                  labels={{
                    year: "Year",
                    month: "Month (1–12)",
                    day: "Day of month",
                    quarter: "Quarter (1–4)",
                    weekday: "Weekday name",
                    yearMonth: "Year-Month (2024-03)",
                    yearQuarter: "Year-Quarter (2024-Q1)",
                  }}
                />
              </Field>
            </div>
            <Field label="New column name (optional)">
              <input
                value={dateExtractInto}
                onChange={(e) => setDateExtractInto(e.target.value)}
                placeholder={
                  dateExtractCol ? `${dateExtractCol} ${dateExtractPart}` : "e.g. Order Year"
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
            </Field>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Source column</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateExtractKeepOriginal(true)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    dateExtractKeepOriginal
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Keep original
                </button>
                <button
                  onClick={() => setDateExtractKeepOriginal(false)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    !dateExtractKeepOriginal
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  Replace it
                </button>
              </div>
            </div>
          </div>
        )}

        {op === "round" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Round numeric cells to a fixed number of decimal places — tidy up the long floats that
              averages, medians and computed columns produce. Uses round-half-away-from-zero (so 2.5
              → 3), matching spreadsheet ROUND. A negative decimal count rounds to tens, hundreds and
              beyond (−2 → nearest 100). Text, booleans and blanks pass through untouched. Leave
              columns unselected to round every numeric column.
            </p>
            <Field label="Decimal places">
              <input
                type="number"
                value={roundDecimals}
                onChange={(e) => setRoundDecimals(e.target.value)}
                placeholder="2"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
            </Field>
            {sourceColumns.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Columns (none selected = all columns)
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceColumns.map((c) => {
                    const on = roundColumns.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setRoundColumns((prev) =>
                            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to limit rounding to specific columns.
              </p>
            )}
          </div>
        )}

        {op === "percentOfTotal" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Express a numeric column as a share of its total — the "% of total" staple of BI
              reporting (Tableau's Percent of Total). Values are read tolerantly, so "$1,234",
              "1,234" and 1234 all count; non-numeric cells contribute nothing and get a blank
              percentage. A zero or empty total yields a blank rather than an error. Pick group-by
              columns to compute the share within each group (so each group sums to ~100%);
              otherwise it's the share of the grand total. The result is appended as a new column.
            </p>
            <Field label="Value column">
              <Select
                value={percentOfTotalCol}
                onChange={setPercentOfTotalCol}
                options={sourceColumns}
                placeholder="Choose…"
              />
            </Field>
            <Field label="Decimal places">
              <input
                type="number"
                value={percentOfTotalDecimals}
                onChange={(e) => setPercentOfTotalDecimals(e.target.value)}
                placeholder="2"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
            </Field>
            <Field label="New column name (optional)">
              <input
                type="text"
                value={percentOfTotalInto}
                onChange={(e) => setPercentOfTotalInto(e.target.value)}
                placeholder={percentOfTotalCol ? `${percentOfTotalCol} %` : "e.g. Share %"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              />
            </Field>
            {sourceColumns.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Group by (optional — share within each group)
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceColumns.map((c) => {
                    const on = percentOfTotalGroupCols.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setPercentOfTotalGroupCols((prev) =>
                            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Load a source first to choose group-by columns.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={addStep}
            disabled={!canRun || loading || op === "none" || !transformReady}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add as step
          </button>
          <button
            onClick={runTransform}
            disabled={!canRun || loading || (steps.length === 0 && !transformReady)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run report
          </button>
        </div>
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
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  labels?: Record<string, string>;
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
          {labels?.[o] ?? o}
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
