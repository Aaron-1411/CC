import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type CellRef = { sheet: string; addr: string };
export type LineageNode = {
  sheet: string;
  addr: string;
  formula: string;
  refs: CellRef[]; // cells/ranges this formula reads from
};

export type TabMapEntry = {
  name: string;
  rows: number;
  cols: number;
  formula_count: number;
  hardcoded_input_count: number;
  external_links: number;
  sample_headers: string[];
  purpose?: string; // filled by AI
  inputs?: string[];
  outputs?: string[];
};

// Extract references from an A1 formula. Handles Sheet!A1, 'My Sheet'!A1:B2, A1, A1:B2.
function extractRefs(formula: string, currentSheet: string): CellRef[] {
  const out: CellRef[] = [];
  const re = /(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_]*))?!?(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/g;
  let m: RegExpExecArray | null;
  // Two-pass: first explicit sheet refs (with !), then bare A1 refs.
  const explicitRe = /(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_.]*))!(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/g;
  const seen = new Set<string>();
  while ((m = explicitRe.exec(formula))) {
    const sheet = m[1] ?? m[2];
    const addr = m[3];
    const key = `${sheet}!${addr}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ sheet, addr });
    }
  }
  const stripped = formula.replace(explicitRe, "");
  const bareRe = /\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?/g;
  while ((m = bareRe.exec(stripped))) {
    const addr = m[0];
    const key = `${currentSheet}!${addr}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ sheet: currentSheet, addr });
    }
  }
  return out;
}

export const createSheetAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(200),
        storagePath: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) {
      throw new Error("Storage path must be inside the user's folder");
    }
    const { data: row, error } = await context.supabase
      .from("sheet_analyses")
      .insert({
        user_id: context.userId,
        name: data.name,
        storage_path: data.storagePath,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listSheetAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sheet_analyses")
      .select("id, name, status, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { analyses: data ?? [] };
  });

export const getSheetAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: analysis, error } = await context.supabase
      .from("sheet_analyses")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !analysis) throw new Error("Not found");
    const { data: thread } = await context.supabase
      .from("sheet_analysis_questions")
      .select("*")
      .eq("analysis_id", data.id)
      .order("created_at", { ascending: true });
    return { analysis, thread: thread ?? [] };
  });

export const postAnalysisMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), content: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sheet_analysis_questions").insert({
      analysis_id: data.id,
      user_id: context.userId,
      role: "user",
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Phase 1: scan the workbook -> tab_map + lineage skeleton (deterministic, no AI yet).
export const scanSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const eng = await import("./spreadsheet/engine.server");
    const ExcelJS = (await import("exceljs")).default;

    const { data: analysis, error } = await context.supabase
      .from("sheet_analyses")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !analysis) throw new Error("Not found");

    await context.supabase
      .from("sheet_analyses")
      .update({ status: "scanning", error: null })
      .eq("id", data.id);

    try {
      const { data: file, error: dlErr } = await context.supabase.storage
        .from("workbooks")
        .download(analysis.storage_path);
      if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);
      const wb = await eng.loadWorkbook(await file.arrayBuffer());

      const tabs: TabMapEntry[] = [];
      const lineage: LineageNode[] = [];

      wb.eachSheet((ws) => {
        let formulaCount = 0;
        let hardcoded = 0;
        let external = 0;
        const headers: string[] = [];

        // sample headers from row 1
        const colMax = Math.min(ws.actualColumnCount ?? ws.columnCount ?? 0, 15);
        for (let c = 1; c <= colMax; c++) {
          const v = ws.getCell(1, c).value;
          if (v && typeof v === "string") headers.push(v);
          else if (v && typeof v === "object" && "richText" in (v as object))
            headers.push((v as any).richText.map((p: any) => p.text).join(""));
        }

        ws.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell({ includeEmpty: false }, (cell) => {
            const v = cell.value as any;
            if (v && typeof v === "object" && "formula" in v) {
              formulaCount++;
              const f = String(v.formula);
              if (/\[[^\]]+\]/.test(f)) external++;
              const refs = extractRefs(f, ws.name);
              if (lineage.length < 1500) {
                lineage.push({
                  sheet: ws.name,
                  addr: cell.address,
                  formula: "=" + f,
                  refs,
                });
              }
            } else if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
              hardcoded++;
            }
          });
        });

        tabs.push({
          name: ws.name,
          rows: ws.actualRowCount ?? ws.rowCount ?? 0,
          cols: ws.actualColumnCount ?? ws.columnCount ?? 0,
          formula_count: formulaCount,
          hardcoded_input_count: hardcoded,
          external_links: external,
          sample_headers: headers,
        });
      });

      void ExcelJS;

      await context.supabase
        .from("sheet_analyses")
        .update({
          tab_map: tabs as any,
          lineage: lineage as any,
          status: "questioning",
        })
        .eq("id", data.id);

      return { tabs, lineageCount: lineage.length };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase
        .from("sheet_analyses")
        .update({ status: "failed", error: msg })
        .eq("id", data.id);
      throw new Error(msg);
    }
  });

// Phase 2: AI asks contextual questions (iterative refine).
export const askAnalyzerQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getLovableModel } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");

    const [{ data: analysis }, { data: thread }] = await Promise.all([
      context.supabase.from("sheet_analyses").select("*").eq("id", data.id).single(),
      context.supabase
        .from("sheet_analysis_questions")
        .select("role, content")
        .eq("analysis_id", data.id)
        .order("created_at", { ascending: true })
        .limit(60),
    ]);
    if (!analysis) throw new Error("Not found");

    const tabSummary = (analysis.tab_map as TabMapEntry[] | null)
      ?.map(
        (t) =>
          `- ${t.name}: ${t.rows}r × ${t.cols}c, ${t.formula_count} formulas, ${t.hardcoded_input_count} inputs${t.external_links ? `, ${t.external_links} external links` : ""}. Headers: [${t.sample_headers.slice(0, 8).join(", ")}]`,
      )
      .join("\n");

    const threadText = (thread ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const { output } = await generateText({
      model: getLovableModel(),
      output: Output.object({
        schema: z.object({
          done: z.boolean(),
          summary: z.string(),
          questions: z.array(z.string()).max(4).default([]),
        }),
      }),
      system: `You analyze an unknown spreadsheet. Your goal is to understand its purpose, inputs, outputs, and any business logic that ISN'T obvious from formulas alone (e.g. what real-world thing a tab represents, what period it covers, what assumptions matter). Ask at most 4 sharp questions targeted at the gaps. If you have enough to write a full narrative, set done=true with no questions.`,
      prompt: `Workbook: ${analysis.name}

Tab summary:
${tabSummary}

User context so far:
${JSON.stringify(analysis.context, null, 2)}

Conversation:
${threadText || "(empty)"}`,
    });

    const inserts: Array<Record<string, unknown>> = [];
    if (output.summary)
      inserts.push({
        analysis_id: data.id,
        user_id: context.userId,
        role: "ai",
        content: output.summary,
      });
    for (const q of output.questions)
      inserts.push({
        analysis_id: data.id,
        user_id: context.userId,
        role: "ai",
        content: q,
        topic: "question",
      });
    if (inserts.length) await context.supabase.from("sheet_analysis_questions").insert(inserts as any);

    return { done: output.done, asked: output.questions.length };
  });

// Phase 3: final narrative + per-tab purpose using thread context.
export const finalizeAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getLovableModel } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");

    await context.supabase.from("sheet_analyses").update({ status: "analyzing" }).eq("id", data.id);

    const [{ data: analysis }, { data: thread }] = await Promise.all([
      context.supabase.from("sheet_analyses").select("*").eq("id", data.id).single(),
      context.supabase
        .from("sheet_analysis_questions")
        .select("role, content")
        .eq("analysis_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (!analysis) throw new Error("Not found");

    const tabs = (analysis.tab_map as TabMapEntry[]) ?? [];
    const lineage = (analysis.lineage as LineageNode[]) ?? [];
    const threadText = (thread ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // Compute outputs per tab (cells with no incoming refs from elsewhere = leaves? actually outputs = cells referenced by nothing OR final aggregations). Use heuristic: formulas that contain SUM/AVG/IF + are not referenced by other formulas.
    const referenced = new Set<string>();
    for (const n of lineage)
      for (const r of n.refs) referenced.add(`${r.sheet}!${r.addr.replace(/\$/g, "")}`);
    const outputsPerTab: Record<string, string[]> = {};
    for (const n of lineage) {
      const key = `${n.sheet}!${n.addr}`;
      if (!referenced.has(key)) (outputsPerTab[n.sheet] ??= []).push(n.addr);
    }

    const { output: tabsOut } = await generateText({
      model: getLovableModel(),
      output: Output.object({
        schema: z.object({
          tabs: z.array(
            z.object({
              name: z.string(),
              purpose: z.string(),
              inputs: z.array(z.string()).max(8),
              outputs: z.array(z.string()).max(8),
            }),
          ),
        }),
      }),
      system:
        "For each tab in this workbook, write a one-sentence purpose and list its main inputs and outputs (column headers or named concepts, not cell addresses). Use the user context from the thread.",
      prompt: `Tabs:
${JSON.stringify(tabs, null, 2)}

Sample lineage outputs per tab (terminal formulas, max 10):
${Object.entries(outputsPerTab)
  .map(([s, addrs]) => `${s}: ${addrs.slice(0, 10).join(", ")}`)
  .join("\n")}

User context thread:
${threadText}`,
    });

    const tabsEnriched: TabMapEntry[] = tabs.map((t) => {
      const ai = tabsOut.tabs.find((x) => x.name === t.name);
      return { ...t, purpose: ai?.purpose, inputs: ai?.inputs, outputs: ai?.outputs };
    });

    const { text: narrative } = await generateText({
      model: getLovableModel(),
      system:
        "Write a clear, structured plain-English explanation of what this spreadsheet does. Cover: overall purpose, how data flows tab to tab, key assumptions, main outputs, and any risks or fragile areas you noticed. Use headings and bullet points. 300-600 words.",
      prompt: `Workbook: ${analysis.name}

Tabs (enriched):
${JSON.stringify(tabsEnriched, null, 2)}

Lineage edges sampled: ${lineage.length}
Cross-sheet references found: ${lineage.reduce((acc, n) => acc + n.refs.filter((r) => r.sheet !== n.sheet).length, 0)}

User context thread:
${threadText}`,
    });

    await context.supabase
      .from("sheet_analyses")
      .update({
        status: "ready",
        tab_map: tabsEnriched as any,
        narrative,
      })
      .eq("id", data.id);

    return { ok: true };
  });

export const deleteSheetAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: a } = await context.supabase
      .from("sheet_analyses")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (a?.storage_path) await context.supabase.storage.from("workbooks").remove([a.storage_path]);
    await context.supabase.from("sheet_analyses").delete().eq("id", data.id);
    return { ok: true };
  });
