import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  parseCsv,
  applyPipeline,
  previewTable,
  type Table,
  type TransformSpec,
  type Cell,
} from "./reporting/reshape";

/* ------------------------------------------------------------------ */
/* Input schema                                                        */
/* ------------------------------------------------------------------ */

const SourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("csv-text"), text: z.string().min(1).max(25_000_000) }),
  z.object({ kind: z.literal("csv-url"), url: z.string().url() }),
  z.object({
    kind: z.literal("tableau-vds"),
    datasourceLuid: z.string().min(1),
  }),
]);

const TransformSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("none") }),
  z.object({ op: z.literal("transpose") }),
  z.object({
    op: z.literal("unpivot"),
    params: z.object({
      idColumns: z.array(z.string()).min(1),
      valueColumns: z.array(z.string()).optional(),
      varName: z.string().optional(),
      valueName: z.string().optional(),
    }),
  }),
  z.object({
    op: z.literal("pivot"),
    params: z.object({
      indexColumns: z.array(z.string()).min(1),
      pivotColumn: z.string().min(1),
      valueColumn: z.string().min(1),
      agg: z
        .enum(["sum", "count", "mean", "min", "max", "first", "last", "median", "countDistinct"])
        .optional(),
    }),
  }),
  z.object({
    op: z.literal("groupBy"),
    params: z.object({
      groupColumns: z.array(z.string()).min(1),
      aggregations: z
        .array(
          z.object({
            column: z.string().min(1),
            agg: z.enum(["sum", "count", "mean", "min", "max", "first", "last", "median", "countDistinct"]),
            as: z.string().optional(),
          }),
        )
        .min(1),
    }),
  }),
  z.object({
    op: z.literal("filter"),
    params: z.object({
      column: z.string().min(1),
      op: z.enum([
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
      ]),
      value: z.string().optional(),
    }),
  }),
  z.object({
    op: z.literal("sort"),
    params: z.object({
      column: z.string().min(1),
      direction: z.enum(["asc", "desc"]).optional(),
    }),
  }),
  z.object({
    op: z.literal("select"),
    params: z.object({
      columns: z.array(z.string()).min(1),
    }),
  }),
  z.object({
    op: z.literal("derive"),
    params: z.object({
      as: z.string().min(1),
      left: z.string().min(1),
      operator: z.enum(["+", "-", "*", "/"]),
      rightKind: z.enum(["column", "const"]),
      right: z.string().min(1),
    }),
  }),
  z.object({
    op: z.literal("limit"),
    params: z.object({
      count: z.number().int().nonnegative().max(20_000_000),
      offset: z.number().int().nonnegative().max(20_000_000).optional(),
    }),
  }),
]);

const RunReportInput = z.object({
  source: SourceSchema,
  transform: TransformSchema.optional(),
  transforms: z.array(TransformSchema).max(20).optional(),
});

// Hard cap on what we ship back so a runaway dataset can't blow the Worker
// response. Deterministic engine still ran on the full set for aggregation;
// only the returned table is capped (flagged via `truncated`).
const MAX_RETURN_ROWS = 20_000;
const MAX_FETCH_BYTES = 25_000_000;

/* ------------------------------------------------------------------ */
/* Connectors                                                          */
/* ------------------------------------------------------------------ */

async function loadCsvFromUrl(url: string): Promise<Table> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "text/csv,text/plain,*/*" } });
  } catch (e) {
    throw new Error(`Couldn't fetch that URL: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`Source URL returned HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_FETCH_BYTES)
    throw new Error(`Source is too large (${(buf.byteLength / 1e6).toFixed(1)}MB; max 25MB).`);
  return parseCsv(new TextDecoder().decode(buf));
}

/**
 * Tableau VizQL Data Service read. This is the only Workers-compatible pull
 * path for Tableau (Hyper API is native; Metadata API is schema-only). It
 * degrades gracefully: if creds aren't configured it throws a friendly,
 * non-500-shaped error instead of crashing.
 */
async function loadFromTableauVds(datasourceLuid: string): Promise<Table> {
  const server = process.env.TABLEAU_SERVER_URL;
  const patName = process.env.TABLEAU_PAT_NAME;
  const patSecret = process.env.TABLEAU_PAT_SECRET;
  const site = process.env.TABLEAU_SITE ?? ""; // contentUrl; "" = Default site
  const apiVersion = process.env.TABLEAU_API_VERSION ?? "3.21";
  if (!server || !patName || !patSecret) {
    throw new Error(
      "Tableau isn't configured on this deployment (set TABLEAU_SERVER_URL, TABLEAU_PAT_NAME, TABLEAU_PAT_SECRET). CSV sources work without it.",
    );
  }
  const base = server.replace(/\/+$/, "");

  // 1. Sign in with the Personal Access Token to get a credentials token.
  const signinRes = await fetch(`${base}/api/${apiVersion}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      credentials: {
        personalAccessTokenName: patName,
        personalAccessTokenSecret: patSecret,
        site: { contentUrl: site },
      },
    }),
  });
  if (!signinRes.ok)
    throw new Error(`Tableau sign-in failed (HTTP ${signinRes.status}). Check the PAT and site.`);
  const signin = (await signinRes.json()) as {
    credentials?: { token?: string };
  };
  const token = signin.credentials?.token;
  if (!token) throw new Error("Tableau sign-in returned no token.");

  // 2. Read the published data source via VizQL Data Service.
  const readRes = await fetch(`${base}/api/v1/vizql-data-service/read-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Tableau-Auth": token,
    },
    body: JSON.stringify({
      datasource: { datasourceLuid },
      options: { returnFormat: "OBJECTS", debug: false },
    }),
  });
  if (!readRes.ok)
    throw new Error(`Tableau VDS read failed (HTTP ${readRes.status}) for data source ${datasourceLuid}.`);
  const payload = (await readRes.json()) as { data?: Record<string, Cell>[] };
  const data = Array.isArray(payload.data) ? payload.data : [];
  return objectsToTable(data);
}

function objectsToTable(objs: Record<string, Cell>[]): Table {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const o of objs) {
    for (const k of Object.keys(o)) {
      if (!seen.has(k)) {
        seen.add(k);
        columns.push(k);
      }
    }
  }
  const rows: Cell[][] = objs.map((o) => columns.map((c) => (o[c] ?? null) as Cell));
  return { columns, rows };
}

async function loadSource(source: z.infer<typeof SourceSchema>): Promise<Table> {
  switch (source.kind) {
    case "csv-text":
      return parseCsv(source.text);
    case "csv-url":
      return loadCsvFromUrl(source.url);
    case "tableau-vds":
      return loadFromTableauVds(source.datasourceLuid);
  }
}

/* ------------------------------------------------------------------ */
/* Server functions                                                    */
/* ------------------------------------------------------------------ */

export const runReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunReportInput.parse(d))
  .handler(async ({ data }) => {
    const input = await loadSource(data.source);
    const specs: TransformSpec[] =
      data.transforms && data.transforms.length
        ? (data.transforms as TransformSpec[])
        : [(data.transform ?? { op: "none" }) as TransformSpec];
    const result = applyPipeline(input, specs);

    const truncated = result.rows.length > MAX_RETURN_ROWS;
    const table: Table = truncated
      ? { columns: result.columns, rows: result.rows.slice(0, MAX_RETURN_ROWS) }
      : result;

    return {
      ok: true as const,
      table,
      preview: previewTable(result),
      sourceColumns: input.columns,
      sourceRowCount: input.rows.length,
      sourceColCount: input.columns.length,
      rowCount: result.rows.length,
      colCount: result.columns.length,
      truncated,
    };
  });

const ExportInput = z.object({
  table: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  }),
  sheetName: z.string().max(31).optional(),
});

export const exportXlsx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExportInput.parse(d))
  .handler(async ({ data }) => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet((data.sheetName || "Report").slice(0, 31));
    ws.addRow(data.table.columns);
    for (const row of data.table.rows) ws.addRow(row as ExcelJS.CellValue[]);
    ws.getRow(1).font = { bold: true };
    const buf = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return {
      ok: true as const,
      base64,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });
