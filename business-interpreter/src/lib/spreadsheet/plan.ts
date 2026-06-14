import { z } from "zod";

// =============================================================
// Typed transformation plan for the spreadsheet agent.
// A plan is an ordered list of typed steps the deterministic
// executor (executor.server.ts) consumes. Each step has a narrow,
// validated shape so the LLM can only emit operations we know
// how to run and verify.
// =============================================================

export const ColRefSchema = z.union([
  z.object({ kind: z.literal("name"), name: z.string().min(1).max(200) }),
  z.object({ kind: z.literal("index"), index: z.number().int().min(0).max(1024) }),
]);
export type ColRef = z.infer<typeof ColRefSchema>;

export const ColTypeSchema = z.enum([
  "string",
  "number",
  "integer",
  "boolean",
  "date",
]);
export type ColType = z.infer<typeof ColTypeSchema>;

const TableRef = z.string().min(1).max(120); // logical table name in the plan namespace

export const StepSchemas = {
  load_sheet: z.object({
    op: z.literal("load_sheet"),
    sheet: z.string().min(1),
    headerRow: z.number().int().min(1).default(1),
    as: TableRef,
  }),
  select_columns: z.object({
    op: z.literal("select_columns"),
    from: TableRef,
    columns: z.array(ColRefSchema).min(1).max(200),
    as: TableRef,
  }),
  rename_columns: z.object({
    op: z.literal("rename_columns"),
    from: TableRef,
    map: z.record(z.string(), z.string()),
    as: TableRef,
  }),
  coerce_types: z.object({
    op: z.literal("coerce_types"),
    from: TableRef,
    types: z.record(z.string(), ColTypeSchema),
    dateFormat: z.string().optional(),
    as: TableRef,
  }),
  filter_rows: z.object({
    op: z.literal("filter_rows"),
    from: TableRef,
    where: z.array(
      z.object({
        column: z.string(),
        op: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in", "notnull", "isnull"]),
        value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number()]))]).optional(),
      }),
    ).min(1).max(20),
    as: TableRef,
  }),
  sort_rows: z.object({
    op: z.literal("sort_rows"),
    from: TableRef,
    by: z.array(z.object({ column: z.string(), dir: z.enum(["asc", "desc"]).default("asc") })).min(1).max(10),
    as: TableRef,
  }),
  derive_column: z.object({
    op: z.literal("derive_column"),
    from: TableRef,
    name: z.string().min(1),
    // A safe arithmetic mini-DSL. Use {col} placeholders for column references.
    // Supported tokens: numbers, + - * / ( ), and {column-name}.
    expr: z.string().min(1).max(500),
    as: TableRef,
  }),
  group_aggregate: z.object({
    op: z.literal("group_aggregate"),
    from: TableRef,
    by: z.array(z.string()).min(1).max(10),
    agg: z.array(
      z.object({
        column: z.string(),
        fn: z.enum(["sum", "mean", "min", "max", "count", "first", "last"]),
        as: z.string().min(1),
      }),
    ).min(1).max(20),
    as: TableRef,
  }),
  join: z.object({
    op: z.literal("join"),
    left: TableRef,
    right: TableRef,
    on: z.array(z.object({ left: z.string(), right: z.string() })).min(1).max(5),
    how: z.enum(["inner", "left", "right", "outer"]).default("inner"),
    as: TableRef,
  }),
  pivot: z.object({
    op: z.literal("pivot"),
    from: TableRef,
    index: z.array(z.string()).min(1).max(5),
    columns: z.string(),
    values: z.string(),
    agg: z.enum(["sum", "mean", "first", "count"]).default("sum"),
    as: TableRef,
  }),
  write_sheet: z.object({
    op: z.literal("write_sheet"),
    from: TableRef,
    sheet: z.string().min(1),
    start: z.string().regex(/^[A-Z]+\d+$/).default("A1"),
    includeHeader: z.boolean().default(true),
    replaceSheet: z.boolean().default(true),
  }),
  write_formula: z.object({
    op: z.literal("write_formula"),
    sheet: z.string().min(1),
    cell: z.string().regex(/^[A-Z]+\d+$/),
    formula: z.string().min(1).max(1000),
  }),
  fill_down_formula: z.object({
    op: z.literal("fill_down_formula"),
    sheet: z.string().min(1),
    sourceCell: z.string().regex(/^[A-Z]+\d+$/),
    throughRow: z.number().int().positive(),
  }),
};

export const PlanStepSchema = z.discriminatedUnion("op", [
  StepSchemas.load_sheet,
  StepSchemas.select_columns,
  StepSchemas.rename_columns,
  StepSchemas.coerce_types,
  StepSchemas.filter_rows,
  StepSchemas.sort_rows,
  StepSchemas.derive_column,
  StepSchemas.group_aggregate,
  StepSchemas.join,
  StepSchemas.pivot,
  StepSchemas.write_sheet,
  StepSchemas.write_formula,
  StepSchemas.fill_down_formula,
]);
export type PlanStep = z.infer<typeof PlanStepSchema>;

export const TransformPlanSchema = z.object({
  version: z.literal(1).default(1),
  description: z.string().max(2000).optional(),
  steps: z.array(PlanStepSchema).min(1).max(50),
});
export type TransformPlan = z.infer<typeof TransformPlanSchema>;
