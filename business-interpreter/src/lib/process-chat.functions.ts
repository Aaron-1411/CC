import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listProcessThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("process_questions")
      .select("*")
      .eq("process_id", data.processId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

export const postProcessMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        processId: z.string().uuid(),
        content: z.string().min(1).max(8000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("process_questions").insert({
      process_id: data.processId,
      user_id: context.userId,
      role: "user",
      kind: "answer",
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// AI: read current SOP + steps + thread, then ask up to 3 clarifying questions or say done.
export const askClarifyingQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getLovableModel } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");

    const [{ data: proc }, { data: thread }] = await Promise.all([
      context.supabase.from("processes").select("*").eq("id", data.processId).single(),
      context.supabase
        .from("process_questions")
        .select("role,content,kind")
        .eq("process_id", data.processId)
        .order("created_at", { ascending: true })
        .limit(40),
    ]);
    if (!proc) throw new Error("Process not found");

    const threadText = (thread ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const { output } = await generateText({
      model: getLovableModel(),
      output: Output.object({
        schema: z.object({
          done: z.boolean(),
          summary: z.string(),
          questions: z.array(z.string()).max(3).default([]),
        }),
      }),
      system: `You are onboarding a new process for an AI agent. Your job is to find ambiguities or missing detail that would cause the agent to make mistakes when running the SOP. Ask AT MOST 3 sharp, specific questions. If the SOP is clear enough, set done=true and ask none.

Prefer questions about: inputs/sources, thresholds, edge cases, who approves what, naming/formatting, exact outputs.

Never ask vague open-ended questions. Each question must be answerable in 1-2 sentences.`,
      prompt: `Tool: ${proc.tool}
Subject: ${proc.subject ?? ""}
Process: ${proc.name}

SOP:
${proc.sop_text ?? ""}

Current steps (JSON):
${JSON.stringify(proc.steps ?? [], null, 2)}

Prior thread:
${threadText || "(empty)"}`,
    });

    // Persist AI messages
    const inserts: Array<Record<string, unknown>> = [];
    if (output.summary) {
      inserts.push({
        process_id: data.processId,
        user_id: context.userId,
        role: "ai",
        kind: "message",
        content: output.summary,
      });
    }
    for (const q of output.questions) {
      inserts.push({
        process_id: data.processId,
        user_id: context.userId,
        role: "ai",
        kind: "question",
        content: q,
      });
    }
    if (inserts.length) {
      await context.supabase.from("process_questions").insert(inserts as any);
    }
    return { done: output.done, asked: output.questions.length };
  });

// AI: rewrite the SOP incorporating the latest thread answers, return new SOP text.
export const refineSopFromThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ processId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getLovableModel } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const [{ data: proc }, { data: thread }] = await Promise.all([
      context.supabase.from("processes").select("*").eq("id", data.processId).single(),
      context.supabase
        .from("process_questions")
        .select("role,content,kind")
        .eq("process_id", data.processId)
        .order("created_at", { ascending: true }),
    ]);
    if (!proc) throw new Error("Process not found");

    const threadText = (thread ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const { text } = await generateText({
      model: getLovableModel(),
      system:
        "Rewrite the SOP to incorporate every answer in the thread. Keep the user's voice. Add specifics, thresholds, and edge cases the answers reveal. Do not invent details. Output ONLY the new SOP text.",
      prompt: `Existing SOP:\n${proc.sop_text ?? ""}\n\nThread:\n${threadText}`,
    });

    await context.supabase.from("processes").update({ sop_text: text }).eq("id", data.processId);
    await context.supabase
      .from("process_questions")
      .update({ resolved: true })
      .eq("process_id", data.processId)
      .eq("resolved", false);

    return { sop_text: text };
  });
