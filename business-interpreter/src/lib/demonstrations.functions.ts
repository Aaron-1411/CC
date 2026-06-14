import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const registerDemonstration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        processId: z.string().uuid(),
        storagePath: z.string().min(1),
        mimeType: z.string().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) {
      throw new Error("Storage path must be inside the user's folder");
    }
    const { data: row, error } = await context.supabase
      .from("process_demonstrations")
      .insert({
        process_id: data.processId,
        user_id: context.userId,
        storage_path: data.storagePath,
        mime_type: data.mimeType,
        status: "uploaded",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listDemonstrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("process_demonstrations")
      .select("id, status, mime_type, created_at, updated_at, transcript, outline, error")
      .eq("process_id", data.processId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { demos: rows ?? [] };
  });

// Transcribe via the multimodal AI gateway, then outline into ProcessStep[].
export const processDemonstration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getAiModel } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");

    const { data: demo, error } = await context.supabase
      .from("process_demonstrations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !demo) throw new Error("Demonstration not found");

    await context.supabase
      .from("process_demonstrations")
      .update({ status: "transcribing", error: null })
      .eq("id", data.id);

    try {
      // Download file -> base64 for multimodal input
      const { data: file, error: dlErr } = await context.supabase.storage
        .from("workbooks")
        .download(demo.storage_path);
      if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);

      const ab = await file.arrayBuffer();
      const b64 = Buffer.from(ab).toString("base64");
      const mime = demo.mime_type || "video/mp4";
      const dataUrl = `data:${mime};base64,${b64}`;

      // 1. Transcribe / describe
      const transcribe = await generateText({
        model: getAiModel("google/gemini-2.5-flash"),
        system:
          "You are watching a screen recording of a person demonstrating a workflow. Transcribe their narration AND describe each on-screen action in chronological order. Be specific about clicks, files opened, sheets, columns, formulas typed, navigation paths, and any decisions they explain. Output a single chronological log.",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Produce a detailed action+narration log of this recording." },
              { type: "file", data: dataUrl, mediaType: mime },
            ] as any,
          },
        ],
      });

      const transcript = transcribe.text;

      await context.supabase
        .from("process_demonstrations")
        .update({ status: "outlining", transcript })
        .eq("id", data.id);

      // 2. Outline into structured steps
      const outline = await generateText({
        model: getAiModel(),
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
              .max(25),
            summary: z.string(),
          }),
        }),
        system:
          "Convert this demonstrated workflow into an ordered SOP for an AI agent + human reviewer. Use 'manual' for actions the agent performs, 'ai_check' with criteria for verifications, 'gate' for human approvals, 'input' for values the user supplies at run time. Be faithful to what was demonstrated.",
        prompt: transcript,
      });

      await context.supabase
        .from("process_demonstrations")
        .update({
          status: "ready",
          outline: outline.output as any,
        })
        .eq("id", data.id);

      return { ok: true, transcript, outline: outline.output };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase
        .from("process_demonstrations")
        .update({ status: "failed", error: msg })
        .eq("id", data.id);
      throw new Error(msg);
    }
  });

// Append a demo's outline into the process steps (deduped by title), bump version.
export const applyDemonstrationToProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ demoId: z.string().uuid(), mode: z.enum(["replace", "append"]).default("append") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: demo } = await context.supabase
      .from("process_demonstrations")
      .select("process_id, outline")
      .eq("id", data.demoId)
      .single();
    if (!demo || !demo.outline) throw new Error("Demo has no outline yet");
    if (!demo.process_id) throw new Error("Demo is not linked to a process");

    const { data: proc } = await context.supabase
      .from("processes")
      .select("steps, version")
      .eq("id", demo.process_id)
      .single();

    const newSteps = ((demo.outline as any).steps ?? []).map(
      (s: any, i: number) => ({ id: `d${Date.now()}_${i}`, ...s }),
    );

    const existing = Array.isArray(proc?.steps) ? (proc!.steps as any[]) : [];
    const merged = data.mode === "replace" ? newSteps : [...existing, ...newSteps];

    await context.supabase
      .from("processes")
      .update({ steps: merged as any, version: (proc?.version ?? 1) + 1 })
      .eq("id", demo.process_id);

    return { ok: true, total: merged.length };
  });

export const deleteDemonstration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: demo } = await context.supabase
      .from("process_demonstrations")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (demo?.storage_path) {
      await context.supabase.storage.from("workbooks").remove([demo.storage_path]);
    }
    await context.supabase.from("process_demonstrations").delete().eq("id", data.id);
    return { ok: true };
  });
