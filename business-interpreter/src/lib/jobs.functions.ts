import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ type: z.enum(["spreadsheet", "research"]), title: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({ user_id: userId, type: data.type, title: data.title ?? "Untitled job" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return job;
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: job }, { data: messages }, { data: workbooks }] = await Promise.all([
      context.supabase.from("jobs").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("messages")
        .select("*")
        .eq("job_id", data.id)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("workbooks")
        .select("*")
        .eq("job_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (!job) throw new Error("Job not found");
    return { job, messages: messages ?? [], workbooks: workbooks ?? [] };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("jobs")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Returns a signed URL for the client to download a workbook file.
export const getWorkbookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workbookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: wb, error } = await context.supabase
      .from("workbooks")
      .select("*")
      .eq("id", data.workbookId)
      .maybeSingle();
    if (error || !wb) throw new Error("Workbook not found");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("workbooks")
      .createSignedUrl(wb.storage_path, 60 * 10);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Could not sign URL");
    return { url: signed.signedUrl, name: wb.name };
  });
