import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type StepKind = "manual" | "ai_check" | "gate" | "input";

export interface ProcessStep {
  id: string;
  kind: StepKind;
  title: string;
  description?: string;
  // ai_check: criteria the agent must verify
  criteria?: string[];
  // input: label for what user supplies
  inputLabel?: string;
  // manual/tool hint
  toolHint?: "excel" | "research" | null;
}

export interface StepResult {
  step_id: string;
  status: "passed" | "failed" | "skipped" | "awaiting";
  output?: string;
  note?: string;
  user_input?: string;
  issues?: string[];
  at: string;
}

const ToolEnum = z.enum(["excel", "research"]);

const StepSchema = z.object({
  id: z.string(),
  kind: z.enum(["manual", "ai_check", "gate", "input"]),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  criteria: z.array(z.string().max(500)).max(20).optional(),
  inputLabel: z.string().max(200).optional(),
  toolHint: z.enum(["excel", "research"]).nullable().optional(),
});

export const listProcesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("processes")
      .select("id, tool, subject, name, version, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { processes: data ?? [] };
  });

export const getProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("processes")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Not found");
    const { data: runs } = await context.supabase
      .from("process_runs")
      .select("id, status, current_step, created_at, updated_at")
      .eq("process_id", data.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: corrections } = await context.supabase
      .from("process_corrections")
      .select("*")
      .eq("process_id", data.id)
      .order("created_at", { ascending: false });
    return { process: row, runs: runs ?? [], corrections: corrections ?? [] };
  });

export const createProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tool: ToolEnum,
        subject: z.string().max(200).optional(),
        name: z.string().min(1).max(200),
        sop_text: z.string().max(20000).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("processes")
      .insert({
        user_id: context.userId,
        tool: data.tool,
        subject: data.subject ?? null,
        name: data.name,
        sop_text: data.sop_text,
        steps: [],
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        subject: z.string().max(200).nullable().optional(),
        sop_text: z.string().max(20000).optional(),
        steps: z.array(StepSchema).max(100).optional(),
        bumpVersion: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.sop_text !== undefined) patch.sop_text = data.sop_text;
    if (data.steps !== undefined) patch.steps = data.steps;
    if (data.bumpVersion) {
      const { data: cur } = await context.supabase
        .from("processes")
        .select("version")
        .eq("id", data.id)
        .single();
      patch.version = (cur?.version ?? 1) + 1;
    }
    const { error } = await context.supabase.from("processes").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("processes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AI: SOP -> structured steps ============

export const parseSopToSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        sop_text: z.string().min(1).max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { getLovableModel } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");

    const { data: proc } = await context.supabase
      .from("processes")
      .select("tool, subject, name")
      .eq("id", data.id)
      .single();

    // Pull recent corrections so the parser learns from them
    const { data: corr } = await context.supabase
      .from("process_corrections")
      .select("note, corrected, original")
      .eq("process_id", data.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const correctionsBlock = (corr ?? [])
      .map(
        (c, i) =>
          `${i + 1}. note=${c.note ?? ""} | original=${JSON.stringify(c.original ?? null)} | corrected=${JSON.stringify(c.corrected)}`,
      )
      .join("\n");

    const sys = `You convert SOPs into an ordered checklist for an AI agent + human reviewer.
Tool: ${proc?.tool}. Subject: ${proc?.subject ?? "(none)"}. Process: ${proc?.name ?? ""}.

Step kinds:
- "manual": something the agent or user just does (loads data, runs a tool action)
- "ai_check": a verification with concrete criteria the agent must confirm before passing
- "gate": a hard human approval pause (signoff, send-to-stakeholder)
- "input": a step that needs the user to supply a value (period, filename, recipient)

Rules:
- Be precise. Each step has ONE clear outcome.
- For ai_check, list 1-5 measurable criteria as bullet strings.
- Insert gates after risky transformations or before sending anything.
- Reflect prior corrections (do not repeat past mistakes).
- 4-15 steps total.

Prior corrections to respect:
${correctionsBlock || "(none yet)"}`;

    const { output } = await generateText({
      model: getLovableModel(),
      output: Output.object({
        schema: z.object({
          steps: z
            .array(
              z.object({
                kind: z.enum(["manual", "ai_check", "gate", "input"]),
                title: z.string(),
                description: z.string().optional(),
                criteria: z.array(z.string()).optional(),
                inputLabel: z.string().optional(),
              }),
            )
            .min(1)
            .max(20),
        }),
      }),
      system: sys,
      prompt: data.sop_text,
    });

    const steps: ProcessStep[] = output.steps.map((s, i) => ({
      id: `s${Date.now()}_${i}`,
      kind: s.kind,
      title: s.title,
      description: s.description,
      criteria: s.criteria,
      inputLabel: s.inputLabel,
      toolHint: null,
    }));

    await context.supabase
      .from("processes")
      .update({ steps: steps as any, sop_text: data.sop_text })
      .eq("id", data.id);

    return { steps };
  });

// ============ Runs ============

export const startRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: proc, error } = await context.supabase
      .from("processes")
      .select("steps, version")
      .eq("id", data.processId)
      .single();
    if (error || !proc) throw new Error("Process not found");
    if (!Array.isArray(proc.steps) || proc.steps.length === 0)
      throw new Error("Process has no steps yet — parse the SOP first");

    const { data: run, error: rErr } = await context.supabase
      .from("process_runs")
      .insert({
        user_id: context.userId,
        process_id: data.processId,
        process_version: proc.version,
        steps_snapshot: proc.steps as any,
        status: "running",
        current_step: 0,
        step_results: [],
      })
      .select("id")
      .single();
    if (rErr) throw new Error(rErr.message);
    return { runId: run.id };
  });

export const getRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase
      .from("process_runs")
      .select("*, processes!inner(name, tool, subject)")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !run) throw new Error(error?.message ?? "Not found");
    return { run };
  });

async function aiCheckStep(
  step: ProcessStep,
  contextBlob: Record<string, unknown>,
): Promise<{ pass: boolean; issues: string[]; summary: string }> {
  const { getLovableModel } = await import("./ai-gateway.server");
  const { generateText, Output } = await import("ai");

  const { output } = await generateText({
    model: getLovableModel(),
    output: Output.object({
      schema: z.object({
        pass: z.boolean(),
        issues: z.array(z.string()).default([]),
        summary: z.string(),
      }),
    }),
    system:
      "You verify a checklist step. Return pass=true ONLY when every criterion is clearly satisfied by the supplied context. List specific issues if not.",
    prompt: `Step: ${step.title}
Description: ${step.description ?? ""}
Criteria:
${(step.criteria ?? []).map((c) => `- ${c}`).join("\n")}

Run context (JSON):
${JSON.stringify(contextBlob, null, 2)}`,
  });
  return output;
}

// Advance: execute steps from current_step until a gate/input is hit, an ai_check fails, or end.
export const advanceRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase
      .from("process_runs")
      .select("*")
      .eq("id", data.runId)
      .single();
    if (error || !run) throw new Error("Run not found");
    if (run.status === "completed" || run.status === "failed") return { run };

    const steps = run.steps_snapshot as unknown as ProcessStep[];
    const results: StepResult[] = Array.isArray(run.step_results)
      ? (run.step_results as unknown as StepResult[])
      : [];
    let cursor: number = run.current_step;
    let status: string = "running";
    const ctx = (run.context as unknown as Record<string, unknown>) ?? {};

    while (cursor < steps.length) {
      const step = steps[cursor];
      if (step.kind === "gate" || step.kind === "input") {
        status = "awaiting_gate";
        results[cursor] = {
          step_id: step.id,
          status: "awaiting",
          at: new Date().toISOString(),
        };
        break;
      }
      if (step.kind === "manual") {
        results[cursor] = {
          step_id: step.id,
          status: "passed",
          output: step.description ?? "Done",
          at: new Date().toISOString(),
        };
        cursor++;
        continue;
      }
      if (step.kind === "ai_check") {
        const check = await aiCheckStep(step, { ...ctx, prior: results.slice(-5) });
        results[cursor] = {
          step_id: step.id,
          status: check.pass ? "passed" : "failed",
          output: check.summary,
          issues: check.issues,
          at: new Date().toISOString(),
        };
        if (!check.pass) {
          status = "awaiting_gate";
          break;
        }
        cursor++;
        continue;
      }
      cursor++;
    }

    if (cursor >= steps.length) status = "completed";

    const { error: uErr } = await context.supabase
      .from("process_runs")
      .update({ current_step: cursor, status, step_results: results as any })
      .eq("id", data.runId);
    if (uErr) throw new Error(uErr.message);

    const { data: updated } = await context.supabase
      .from("process_runs")
      .select("*")
      .eq("id", data.runId)
      .single();
    return { run: updated };
  });

// Resolve a paused gate/input/failed-check and continue.
export const resolveStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        runId: z.string().uuid(),
        decision: z.enum(["approve", "reject", "skip"]),
        userInput: z.string().max(4000).optional(),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase
      .from("process_runs")
      .select("*")
      .eq("id", data.runId)
      .single();
    if (error || !run) throw new Error("Run not found");

    const steps = run.steps_snapshot as unknown as ProcessStep[];
    const results: StepResult[] = (run.step_results as unknown as StepResult[]) ?? [];
    const ctx = ((run.context as unknown as Record<string, unknown>) ?? {}) as Record<string, unknown>;
    const idx = run.current_step;
    const step = steps[idx];
    if (!step) throw new Error("No current step");

    if (data.decision === "reject") {
      results[idx] = {
        step_id: step.id,
        status: "failed",
        note: data.note,
        at: new Date().toISOString(),
      };
      await context.supabase
        .from("process_runs")
        .update({
          status: "failed",
          step_results: results as any,
          error: data.note ?? "Rejected by user",
        })
        .eq("id", data.runId);
      return { ok: true };
    }

    results[idx] = {
      step_id: step.id,
      status: data.decision === "skip" ? "skipped" : "passed",
      user_input: data.userInput,
      note: data.note,
      at: new Date().toISOString(),
    };
    if (step.kind === "input" && data.userInput) {
      ctx[step.inputLabel || step.title] = data.userInput;
    }

    await context.supabase
      .from("process_runs")
      .update({
        current_step: idx + 1,
        status: "running",
        step_results: results as any,
        context: ctx as any,
      })
      .eq("id", data.runId);

    return { ok: true };
  });

// Record a correction tied to a step. Will be re-applied next time the SOP is re-parsed.
export const recordCorrection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        processId: z.string().uuid(),
        runId: z.string().uuid().optional(),
        stepIndex: z.number().int().min(0),
        original: z.unknown().optional(),
        corrected: z.unknown(),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("process_corrections").insert({
      user_id: context.userId,
      process_id: data.processId,
      run_id: data.runId ?? null,
      step_index: data.stepIndex,
      original: (data.original ?? null) as any,
      corrected: data.corrected as any,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
