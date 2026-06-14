import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RunInstructionInput = z.object({
  jobId: z.string().uuid(),
  workbookId: z.string().uuid(),
  instruction: z.string().min(1).max(4000),
});

export const runInstruction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunInstructionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fail fast before any DB write if AI isn't configured, so a missing key
    // can't orphan a user-message row and surface as a raw 500.
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error(
        "AI isn't enabled on this deployment (missing AI_GATEWAY_API_KEY), so this instruction can't run.",
      );
    }

    // Lazy-load server-only modules
    const { getAiModel } = await import("./ai-gateway.server");
    const eng = await import("./spreadsheet/engine.server");
    const { generateText, tool, stepCountIs } = await import("ai");

    // 1. Load source workbook
    const { data: wbRow, error: wbErr } = await supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (wbErr || !wbRow) throw new Error("Workbook not found");

    const { data: file, error: dlErr } = await supabase.storage
      .from("workbooks")
      .download(wbRow.storage_path);
    if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);
    const buf = await file.arrayBuffer();
    const workbook = await eng.loadWorkbook(buf);

    // 2. Persist user message
    await supabase.from("messages").insert({
      user_id: userId,
      job_id: data.jobId,
      role: "user",
      content: data.instruction,
    });

    // 3. Build tool catalog (closures over the in-memory workbook)
    type JsonValue =
      | string | number | boolean | null
      | { [k: string]: JsonValue } | JsonValue[];
    const stepLog: { tool: string; args: JsonValue; result: JsonValue }[] = [];
    const record = (toolName: string, args: unknown, result: unknown) => {
      stepLog.push({ tool: toolName, args: JSON.parse(JSON.stringify(args ?? null)) as JsonValue, result: JSON.parse(JSON.stringify(result ?? null)) as JsonValue });
    };

    const tools = {
      list_sheets: tool({
        description: "List all sheets in the workbook with row/column counts.",
        inputSchema: z.object({}),
        execute: async () => {
          const snap = eng.snapshot(workbook);
          const out = snap.sheets.map((s) => ({
            name: s.name,
            rows: s.rowCount,
            cols: s.colCount,
          }));
          record("list_sheets", {}, out);
          return out;
        },
      }),
      read_range: tool({
        description:
          "Read a range from a sheet. Use this to inspect data before transforming. Range is A1 notation like 'A1:D10'.",
        inputSchema: z.object({ sheet: z.string(), range: z.string() }),
        execute: async (args) => {
          const r = eng.opReadRange(workbook, args);
          record("read_range", args, r);
          return r;
        },
      }),
      create_sheet: tool({
        description: "Create a new empty sheet.",
        inputSchema: z.object({ name: z.string() }),
        execute: async (args) => {
          const r = eng.opCreateSheet(workbook, args.name);
          record("create_sheet", args, r);
          return r;
        },
      }),
      copy_range: tool({
        description:
          "Copy a rectangular range from one sheet to another. toStart is the top-left destination cell.",
        inputSchema: z.object({
          fromSheet: z.string(),
          fromRange: z.string(),
          toSheet: z.string(),
          toStart: z.string(),
        }),
        execute: async (args) => {
          const r = eng.opCopyRange(workbook, args);
          record("copy_range", args, r);
          return r;
        },
      }),
      set_values: tool({
        description:
          "Write a 2D array of literal values starting at a cell (no formulas — use write_formula for that).",
        inputSchema: z.object({
          sheet: z.string(),
          start: z.string(),
          values: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
        }),
        execute: async (args) => {
          const r = eng.opSetValues(workbook, args);
          record("set_values", args, r);
          return r;
        },
      }),
      write_formula: tool({
        description: "Write a single Excel formula into a cell. Formula can start with '=' or not.",
        inputSchema: z.object({ sheet: z.string(), cell: z.string(), formula: z.string() }),
        execute: async (args) => {
          const r = eng.opWriteFormula(workbook, args);
          record("write_formula", args, r);
          return r;
        },
      }),
      fill_down: tool({
        description:
          "Copy the formula in sourceCell down the same column through throughRow, adjusting relative references.",
        inputSchema: z.object({
          sheet: z.string(),
          sourceCell: z.string(),
          throughRow: z.number().int().positive(),
        }),
        execute: async (args) => {
          const r = eng.opFillDown(workbook, args);
          record("fill_down", args, r);
          return r;
        },
      }),
    };

    // 4. Run the agent
    const model = getAiModel("google/gemini-3-flash-preview");
    const snap = eng.snapshot(workbook);
    const systemPrompt = `You are a precise spreadsheet automation agent. The user will describe a transformation in natural language. Execute it deterministically using the available tools.

Current workbook structure:
${snap.sheets
  .map(
    (s) =>
      `- "${s.name}": ${s.rowCount} rows × ${s.colCount} cols. First-row sample: ${JSON.stringify(s.preview[0] ?? [])}`,
  )
  .join("\n")}

Rules:
- Always inspect data with list_sheets/read_range BEFORE writing or copying, unless the instruction is unambiguous.
- Prefer Excel formulas over literal numbers so the workbook remains live.
- Use fill_down for repeated formulas instead of write_formula in a loop.
- After all operations, write a brief plain-text summary of what you did. Do not call any more tools after that.`;

    let assistantText = "";
    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: data.instruction,
        tools,
        stopWhen: stepCountIs(50),
      });
      assistantText = result.text || "Done.";
    } catch (e) {
      assistantText = `I hit an error executing this: ${(e as Error).message}`;
    }

    // 5. Recalculate formulas and detect errors
    const { errors } = eng.recalc(workbook);

    // 5b. Validation pass
    const { validateWorkbook } = await import("./spreadsheet/validation.server");
    const report = validateWorkbook(workbook);

    // 6. Save updated workbook back to storage
    const outBuf = await eng.workbookToBuffer(workbook);
    const outPath = `${userId}/${data.jobId}/output-${Date.now()}.xlsx`;
    const { error: upErr } = await supabase.storage
      .from("workbooks")
      .upload(outPath, outBuf, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    const newSnap = eng.snapshot(workbook);
    const { data: newWb, error: insErr } = await supabase
      .from("workbooks")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        name: `output-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`,
        storage_path: outPath,
        kind: "output",
        size_bytes: outBuf.length,
        sheet_meta: newSnap.sheets.map((s) => ({
          name: s.name,
          rows: s.rowCount,
          cols: s.colCount,
        })),
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    // 7. Persist assistant message with step log + reference to validation
    const { data: msg } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        role: "assistant",
        content: assistantText,
        step_log: { steps: stepLog, errors, output_workbook_id: newWb.id, validation_status: report.scorecard.status },
      })
      .select()
      .single();

    // 7b. Persist validation report
    const { data: vr } = await supabase
      .from("validation_reports")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        message_id: msg?.id,
        workbook_id: newWb.id,
        status: "pending",
        scorecard: report.scorecard,
        reconciliation: report.reconciliation,
        lineage: report.lineage,
        anomalies: report.anomalies,
        formula_errors: report.formula_errors,
      })
      .select()
      .single();

    // Touch job updated_at
    await supabase.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", data.jobId);

    return {
      ok: true,
      assistantText,
      steps: stepLog,
      errors,
      outputWorkbook: newWb,
      snapshot: newSnap,
      validationReport: vr,
    };
  });

export const generateCommentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        workbookId: z.string().uuid(),
        focusSheet: z.string().optional(),
        tone: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getAiModel } = await import("./ai-gateway.server");
    const eng = await import("./spreadsheet/engine.server");
    const { generateText } = await import("ai");

    const { data: wbRow } = await supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (!wbRow) throw new Error("Workbook not found");
    const { data: file } = await supabase.storage.from("workbooks").download(wbRow.storage_path);
    if (!file) throw new Error("Download failed");
    const workbook = await eng.loadWorkbook(await file.arrayBuffer());
    const snap = eng.snapshot(workbook);
    const focus = data.focusSheet ? snap.sheets.find((s) => s.name === data.focusSheet) : snap.sheets[snap.sheets.length - 1];
    if (!focus) throw new Error("Sheet not found for commentary");

    const model = getAiModel("google/gemini-3-flash-preview");
    const { text } = await generateText({
      model,
      system: `You are a senior financial/business analyst writing concise commentary (${data.tone ?? "neutral, professional"}). Highlight the headline numbers, biggest movers, anomalies, and any obvious risks. Keep it under 250 words. Use markdown.`,
      prompt: `Sheet "${focus.name}" preview (first ${focus.preview.length} rows × ${focus.preview[0]?.length ?? 0} cols):\n\n${focus.preview.map((r) => r.join("\t")).join("\n")}`,
    });

    await supabase.from("messages").insert({
      user_id: userId,
      job_id: data.jobId,
      role: "assistant",
      content: text,
      step_log: { kind: "commentary", sheet: focus.name, workbook_id: data.workbookId },
    });

    return { commentary: text };
  });
