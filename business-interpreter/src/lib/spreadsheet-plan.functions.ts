import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { TransformPlanSchema } from "./spreadsheet/plan";

// =============================================================
// Plan-first spreadsheet agent: the LLM emits a typed
// TransformPlan; a deterministic executor runs it. The plan
// itself is the audit trail and can be re-executed identically
// on future runs (used by golden-file regression fixtures).
// =============================================================

const PlanInput = z.object({
  jobId: z.string().uuid(),
  workbookId: z.string().uuid(),
  instruction: z.string().min(1).max(4000),
});

export const planTransformation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getLovableModel } = await import("./ai-gateway.server");
    const eng = await import("./spreadsheet/engine.server");
    const { generateText, Output } = await import("ai");

    const { data: wbRow } = await supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (!wbRow) throw new Error("Workbook not found");
    const { data: file } = await supabase.storage.from("workbooks").download(wbRow.storage_path);
    if (!file) throw new Error("Download failed");
    const wb = await eng.loadWorkbook(await file.arrayBuffer());
    const snap = eng.snapshot(wb);

    const sheetSummary = snap.sheets
      .map(
        (s) =>
          `- "${s.name}" (${s.rowCount}r × ${s.colCount}c). Headers (row 1): ${JSON.stringify(s.preview[0] ?? [])}`,
      )
      .join("\n");

    const { output } = await generateText({
      model: getLovableModel(),
      output: Output.object({ schema: TransformPlanSchema }),
      system: `You translate a natural-language spreadsheet task into a TYPED transformation plan that a deterministic executor will run. Always start with load_sheet for every input sheet you read. Use intermediate table names (e.g. "raw", "clean", "by_region"). Only use the supported ops. Never invent columns — use the exact header strings from row 1. End with write_sheet (or write_formula/fill_down_formula) so the user sees output.

Available ops:
- load_sheet, select_columns, rename_columns, coerce_types, filter_rows,
  sort_rows, derive_column (arithmetic with {col} placeholders), group_aggregate,
  join, pivot, write_sheet, write_formula, fill_down_formula.`,
      prompt: `Workbook structure:\n${sheetSummary}\n\nTask:\n${data.instruction}`,
    });

    return { plan: output };
  });

export const executePlanOnWorkbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        workbookId: z.string().uuid(),
        plan: TransformPlanSchema,
        label: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const eng = await import("./spreadsheet/engine.server");
    const { executePlan } = await import("./spreadsheet/executor.server");
    const { validateWorkbook } = await import("./spreadsheet/validation.server");

    const { data: wbRow } = await supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (!wbRow) throw new Error("Workbook not found");
    const { data: file } = await supabase.storage.from("workbooks").download(wbRow.storage_path);
    if (!file) throw new Error("Download failed");
    const wb = await eng.loadWorkbook(await file.arrayBuffer());

    const exec = await executePlan(wb, data.plan);
    const { errors } = eng.recalc(wb);
    const report = validateWorkbook(wb);

    const out = await eng.workbookToBuffer(wb);
    const outPath = `${userId}/${data.jobId}/planned-${Date.now()}.xlsx`;
    const { error: upErr } = await supabase.storage
      .from("workbooks")
      .upload(outPath, out, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    if (upErr) throw new Error(upErr.message);

    const newSnap = eng.snapshot(wb);
    const { data: newWb } = await supabase
      .from("workbooks")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        name: `${data.label ?? "planned"}-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`,
        storage_path: outPath,
        kind: "output",
        size_bytes: out.length,
        sheet_meta: newSnap.sheets.map((s) => ({ name: s.name, rows: s.rowCount, cols: s.colCount })),
      })
      .select()
      .single();

    const summaryLines = exec.steps.map(
      (s) => `${s.index + 1}. ${s.op}${s.as ? ` → ${s.as}` : ""} (${s.rowsOut ?? "-"} rows, ${s.durationMs}ms)${s.error ? ` — ERROR: ${s.error}` : ""}`,
    );
    const assistantText = exec.ok
      ? `Plan executed (${exec.steps.length} steps).\n\n${summaryLines.join("\n")}`
      : `Plan failed: ${exec.error}\n\n${summaryLines.join("\n")}`;

    const { data: msg } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        role: "assistant",
        content: assistantText,
        step_log: JSON.parse(
          JSON.stringify({
            mode: "typed_plan",
            plan: data.plan,
            steps: exec.steps,
            tables: exec.tables,
            errors,
            output_workbook_id: newWb?.id ?? null,
            validation_status: report.scorecard.status,
          }),
        ),
      })
      .select()
      .single();

    await supabase
      .from("validation_reports")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        message_id: msg?.id ?? null,
        workbook_id: newWb?.id ?? null,
        status: "pending",
        scorecard: report.scorecard,
        reconciliation: report.reconciliation,
        lineage: report.lineage,
        anomalies: report.anomalies,
        formula_errors: report.formula_errors,
      });

    await supabase.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", data.jobId);

    return {
      ok: exec.ok,
      assistantText,
      execution: JSON.parse(JSON.stringify(exec)) as unknown as string,
      outputWorkbook: newWb,
      validationStatus: report.scorecard.status,
    };
  });
