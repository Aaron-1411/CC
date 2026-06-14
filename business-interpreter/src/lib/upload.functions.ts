import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Register an already-uploaded workbook file (uploaded client-side via signed URL or
// directly via the Supabase storage SDK using the user's bearer token).
export const registerWorkbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        name: z.string().min(1).max(255),
        storagePath: z.string().min(1),
        sizeBytes: z.number().int().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const eng = await import("./spreadsheet/engine.server");

    if (!data.storagePath.startsWith(`${userId}/`)) {
      throw new Error("Storage path must be inside the user's folder");
    }

    const { data: file, error: dlErr } = await supabase.storage
      .from("workbooks")
      .download(data.storagePath);
    if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);
    const wb = await eng.loadWorkbook(await file.arrayBuffer());
    const snap = eng.snapshot(wb);

    const { data: row, error } = await supabase
      .from("workbooks")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        name: data.name,
        storage_path: data.storagePath,
        kind: "source",
        size_bytes: data.sizeBytes,
        sheet_meta: snap.sheets.map((s) => ({ name: s.name, rows: s.rowCount, cols: s.colCount })),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { workbook: row, snapshot: snap };
  });

// Re-read a workbook and return its snapshot (used after the agent runs).
export const previewWorkbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workbookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const eng = await import("./spreadsheet/engine.server");
    const { data: wbRow, error } = await context.supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (error || !wbRow) throw new Error("Workbook not found");
    const { data: file, error: dlErr } = await context.supabase.storage
      .from("workbooks")
      .download(wbRow.storage_path);
    if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);
    const wb = await eng.loadWorkbook(await file.arrayBuffer());
    return { workbook: wbRow, snapshot: eng.snapshot(wb) };
  });
