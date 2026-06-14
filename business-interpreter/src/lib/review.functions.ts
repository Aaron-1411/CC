import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Approve / request changes / reject for a gate (validation or commentary)
export const recordApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      jobId: z.string().uuid(),
      gate: z.enum(["validation", "commentary"]),
      targetId: z.string().uuid(),
      decision: z.enum(["approve", "changes", "reject"]),
      note: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app, error } = await supabase
      .from("approvals")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        gate: data.gate,
        target_id: data.targetId,
        decision: data.decision,
        note: data.note,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Mirror decision on the target row
    if (data.gate === "validation") {
      await supabase.from("validation_reports").update({
        status: data.decision === "approve" ? "approved" : data.decision === "reject" ? "rejected" : "changes_requested",
      }).eq("id", data.targetId);
    } else {
      await supabase.from("commentary_drafts").update({
        status: data.decision === "approve" ? "approved" : data.decision === "reject" ? "rejected" : "changes_requested",
      }).eq("id", data.targetId);
    }

    return { approval: app };
  });

// Apply an inline cell edit & rerun validation
export const editCellAndRevalidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      jobId: z.string().uuid(),
      workbookId: z.string().uuid(),
      validationReportId: z.string().uuid(),
      sheet: z.string(),
      cell: z.string(),
      newValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      isFormula: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const eng = await import("./spreadsheet/engine.server");
    const { validateWorkbook } = await import("./spreadsheet/validation.server");

    const { data: wb } = await supabase.from("workbooks").select("*").eq("id", data.workbookId).maybeSingle();
    if (!wb) throw new Error("Workbook not found");
    const { data: file } = await supabase.storage.from("workbooks").download(wb.storage_path);
    if (!file) throw new Error("Download failed");
    const workbook = await eng.loadWorkbook(await file.arrayBuffer());

    if (data.isFormula && typeof data.newValue === "string") {
      eng.opWriteFormula(workbook, { sheet: data.sheet, cell: data.cell, formula: data.newValue });
    } else {
      eng.opSetValues(workbook, { sheet: data.sheet, start: data.cell, values: [[data.newValue]] });
    }
    eng.recalc(workbook);
    const report = validateWorkbook(workbook);

    // Save as new output workbook revision
    const outBuf = await eng.workbookToBuffer(workbook);
    const outPath = `${userId}/${data.jobId}/edit-${Date.now()}.xlsx`;
    await supabase.storage.from("workbooks").upload(outPath, outBuf, {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const snap = eng.snapshot(workbook);
    const { data: newWb } = await supabase.from("workbooks").insert({
      user_id: userId,
      job_id: data.jobId,
      name: `edit-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`,
      storage_path: outPath,
      kind: "output",
      size_bytes: outBuf.length,
      sheet_meta: snap.sheets.map((s) => ({ name: s.name, rows: s.rowCount, cols: s.colCount })),
    }).select().single();

    const { data: newReport } = await supabase.from("validation_reports").insert({
      user_id: userId,
      job_id: data.jobId,
      workbook_id: newWb?.id,
      status: "pending",
      scorecard: report.scorecard,
      reconciliation: report.reconciliation,
      lineage: report.lineage,
      anomalies: report.anomalies,
      formula_errors: report.formula_errors,
    }).select().single();

    return { workbook: newWb, validationReport: newReport, snapshot: snap };
  });

// Draft commentary from an approved validation report
export const draftCommentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      jobId: z.string().uuid(),
      workbookId: z.string().uuid(),
      validationReportId: z.string().uuid(),
      tone: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getAiModel } = await import("./ai-gateway.server");
    const eng = await import("./spreadsheet/engine.server");
    const { generateText, Output } = await import("ai");

    const { data: vr } = await supabase.from("validation_reports").select("*").eq("id", data.validationReportId).maybeSingle();
    if (!vr) throw new Error("Validation report not found");

    const { data: wb } = await supabase.from("workbooks").select("*").eq("id", data.workbookId).maybeSingle();
    if (!wb) throw new Error("Workbook not found");
    const { data: file } = await supabase.storage.from("workbooks").download(wb.storage_path);
    if (!file) throw new Error("Download failed");
    const workbook = await eng.loadWorkbook(await file.arrayBuffer());
    const snap = eng.snapshot(workbook);

    const summaryPreviews = snap.sheets.slice(-2).map(
      (s) => `Sheet "${s.name}" (${s.rowCount}×${s.colCount}):\n${s.preview.slice(0, 15).map((r) => r.join("\t")).join("\n")}`,
    ).join("\n\n");

    const model = getAiModel("google/gemini-3-flash-preview");
    const CitationSchema = z.object({
      body_markdown: z.string(),
      citations: z.array(z.object({
        label: z.string(),
        value: z.string(),
        sheet: z.string(),
        cell: z.string(),
      })).default([]),
    });

    const { experimental_output } = await generateText({
      model,
      experimental_output: Output.object({ schema: CitationSchema }),
      system: `You are a senior business analyst. Write concise commentary (${data.tone ?? "neutral, professional"}, under 350 words, markdown). Cite each headline number with [sheet!cell]. Use validation report context to flag mismatches & anomalies.`,
      prompt: `Validation scorecard: ${JSON.stringify(vr.scorecard)}\nReconciliation issues: ${JSON.stringify((vr.reconciliation as unknown[]).slice(0, 10))}\nAnomalies: ${JSON.stringify((vr.anomalies as unknown[]).slice(0, 10))}\n\nWorkbook preview:\n${summaryPreviews}`,
    });

    const out = experimental_output as z.infer<typeof CitationSchema>;

    const { data: draft } = await supabase.from("commentary_drafts").insert({
      user_id: userId,
      job_id: data.jobId,
      workbook_id: data.workbookId,
      validation_report_id: data.validationReportId,
      body_markdown: out.body_markdown,
      citations: out.citations,
      tone: data.tone,
      status: "draft",
    }).select().single();

    return { draft };
  });

// Save reviewer-edited commentary
export const updateCommentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      body_markdown: z.string().max(20000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("commentary_drafts")
      .update({ body_markdown: data.body_markdown })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// List validation reports + commentary drafts for a job
export const getJobReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [vr, cd] = await Promise.all([
      context.supabase.from("validation_reports").select("*").eq("job_id", data.jobId).order("created_at", { ascending: false }),
      context.supabase.from("commentary_drafts").select("*").eq("job_id", data.jobId).order("created_at", { ascending: false }),
    ]);
    return { validationReports: vr.data ?? [], commentaryDrafts: cd.data ?? [] };
  });
