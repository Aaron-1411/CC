import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { TransformPlanSchema } from "./spreadsheet/plan";

// =============================================================
// Golden-file regression fixtures.
// Each fixture pins: a process → an input workbook → an expected
// output workbook → the typed plan that produced it. Running the
// fixture re-executes the plan on the input and diffs the result
// against the saved expected output.
// =============================================================

export const listFixtures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("process_fixtures")
      .select(
        "id, name, description, plan, tolerance_numeric, last_run_at, last_run_status, last_run_diff, input_workbook_id, expected_workbook_id, created_at, updated_at",
      )
      .eq("process_id", data.processId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { fixtures: rows ?? [] };
  });

export const createFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        processId: z.string().uuid(),
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        inputWorkbookId: z.string().uuid(),
        expectedWorkbookId: z.string().uuid(),
        plan: TransformPlanSchema,
        tolerance: z.number().min(0).max(1000).default(0.0001),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("process_fixtures")
      .insert({
        user_id: context.userId,
        process_id: data.processId,
        name: data.name,
        description: data.description ?? null,
        input_workbook_id: data.inputWorkbookId,
        expected_workbook_id: data.expectedWorkbookId,
        plan: data.plan as never,
        tolerance_numeric: data.tolerance,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("process_fixtures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function loadWorkbookFromId(supabase: any, id: string) {
  const eng = await import("./spreadsheet/engine.server");
  const { data: row } = await supabase.from("workbooks").select("storage_path").eq("id", id).maybeSingle();
  if (!row) throw new Error(`Workbook ${id} not found`);
  const { data: file } = await supabase.storage.from("workbooks").download(row.storage_path);
  if (!file) throw new Error(`Failed to download workbook ${id}`);
  return eng.loadWorkbook(await file.arrayBuffer());
}

export const runFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: fx, error } = await supabase
      .from("process_fixtures")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !fx) throw new Error("Fixture not found");
    if (!fx.input_workbook_id || !fx.expected_workbook_id) {
      throw new Error("Fixture is missing input or expected workbook");
    }

    const eng = await import("./spreadsheet/engine.server");
    const { executePlan } = await import("./spreadsheet/executor.server");
    const { diffWorkbooks } = await import("./spreadsheet/diff.server");

    const inputWb = await loadWorkbookFromId(supabase, fx.input_workbook_id);
    const expectedWb = await loadWorkbookFromId(supabase, fx.expected_workbook_id);

    const exec = await executePlan(inputWb, fx.plan);
    eng.recalc(inputWb);

    const diff = exec.ok
      ? diffWorkbooks(expectedWb, inputWb, { tolerance: Number(fx.tolerance_numeric) })
      : { pass: false, cellsCompared: 0, diffs: [], sheetSummary: [] };

    const status = !exec.ok ? "exec_error" : diff.pass ? "pass" : "fail";
    const summary = {
      status,
      exec_ok: exec.ok,
      exec_error: exec.error ?? null,
      cells_compared: diff.cellsCompared,
      diff_count: diff.diffs.length,
      sheet_summary: diff.sheetSummary,
      sample_diffs: diff.diffs.slice(0, 25),
      steps: exec.steps,
    };

    const serialized = JSON.parse(JSON.stringify(summary));
    await supabase
      .from("process_fixtures")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
        last_run_diff: serialized as never,
      })
      .eq("id", data.id);

    return { status, summary: serialized as unknown as string };
  });

export const runAllFixturesForProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: fixtures } = await context.supabase
      .from("process_fixtures")
      .select("id")
      .eq("process_id", data.processId);
    const results: { id: string; status: string; error?: string }[] = [];
    for (const fx of fixtures ?? []) {
      try {
        const r = (await runFixture({ data: { id: fx.id } })) as { status: string };
        results.push({ id: fx.id, status: r.status });
      } catch (e) {
        results.push({ id: fx.id, status: "error", error: (e as Error).message });
      }
    }
    const pass = results.filter((r) => r.status === "pass").length;
    return { results, pass, total: results.length };
  });
