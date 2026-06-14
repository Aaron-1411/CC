import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getSheetAnalysis,
  scanSheet,
  askAnalyzerQuestions,
  finalizeAnalysis,
  postAnalysisMessage,
  type TabMapEntry,
  type LineageNode,
} from "@/lib/sheet-analyzer.functions";
import { Play, Sparkles, FileText, Send } from "lucide-react";

export const Route = createFileRoute("/app/analyzer/$id")({
  component: AnalyzerPage,
});

function AnalyzerPage() {
  const { id } = Route.useParams();
  const get = useServerFn(getSheetAnalysis);
  const scan = useServerFn(scanSheet);
  const ask = useServerFn(askAnalyzerQuestions);
  const finalize = useServerFn(finalizeAnalysis);
  const post = useServerFn(postAnalysisMessage);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => get({ data: { id } }),
    refetchInterval: (q) => {
      const s = (q.state.data?.analysis as any)?.status;
      return s === "scanning" || s === "analyzing" ? 1500 : false;
    },
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const a = data.analysis as any;
  const tabs: TabMapEntry[] = (a.tab_map as TabMapEntry[]) ?? [];
  const lineage: LineageNode[] = (a.lineage as LineageNode[]) ?? [];

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    try {
      await fn();
      refetch();
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    if (!msg.trim()) return;
    const text = msg;
    setMsg("");
    await post({ data: { id, content: text } });
    refetch();
  }

  const crossSheetRefs = lineage.reduce(
    (acc, n) => acc + n.refs.filter((r) => r.sheet !== n.sheet).length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/app/analyzer" className="text-xs text-muted-foreground hover:underline">
            ← All analyses
          </Link>
          <h1 className="text-xl font-semibold">{a.name}</h1>
          <div className="text-xs text-muted-foreground">
            Status: <span className="font-medium">{a.status}</span>
            {a.error ? ` · ${a.error}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!!busy}
            onClick={() => run("scan", () => scan({ data: { id } }))}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> {busy === "scan" ? "Scanning…" : "1. Scan workbook"}
          </button>
          <button
            disabled={!!busy || tabs.length === 0}
            onClick={() => run("ask", () => ask({ data: { id } }))}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {busy === "ask" ? "Thinking…" : "2. Ask context questions"}
          </button>
          <button
            disabled={!!busy || tabs.length === 0}
            onClick={() => run("final", () => finalize({ data: { id } }))}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            {busy === "final" ? "Writing…" : "3. Finalize narrative"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          {tabs.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-2 text-sm font-semibold">Tab map</div>
              <div className="divide-y divide-border">
                {tabs.map((t) => (
                  <div key={t.name} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.rows}r × {t.cols}c · {t.formula_count} formulas ·{" "}
                        {t.hardcoded_input_count} inputs
                        {t.external_links ? ` · ${t.external_links} ext` : ""}
                      </span>
                    </div>
                    {t.purpose && <p className="text-sm">{t.purpose}</p>}
                    {(t.inputs?.length || t.outputs?.length) && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Inputs</div>
                          <div>{t.inputs?.join(", ") || "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Outputs</div>
                          <div>{t.outputs?.join(", ") || "—"}</div>
                        </div>
                      </div>
                    )}
                    {t.sample_headers.length > 0 && !t.purpose && (
                      <div className="text-xs text-muted-foreground">
                        Headers: {t.sample_headers.slice(0, 10).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lineage.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-2 text-sm font-semibold">
                Lineage · {lineage.length} formulas · {crossSheetRefs} cross-sheet edges
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                <ul className="space-y-1 font-mono text-xs">
                  {lineage.slice(0, 80).map((n, i) => (
                    <li key={i} className="rounded px-2 py-1 hover:bg-accent/30">
                      <span className="text-primary">
                        {n.sheet}!{n.addr}
                      </span>{" "}
                      <span className="text-muted-foreground">{n.formula}</span>
                      {n.refs.length > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ← {n.refs.map((r) => `${r.sheet}!${r.addr}`).join(", ")}
                        </span>
                      )}
                    </li>
                  ))}
                  {lineage.length > 80 && (
                    <li className="px-2 text-muted-foreground">
                      …and {lineage.length - 80} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {a.narrative && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-2 text-sm font-semibold">
                Narrative
              </div>
              <div className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{a.narrative}</div>
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">
            Context thread
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
            {data.thread.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Scan the workbook then click "Ask context questions" — the agent will post here.
              </p>
            )}
            {data.thread.map((m: any) => (
              <div
                key={m.id}
                className={`rounded-md px-3 py-2 text-sm ${
                  m.role === "ai" ? "bg-muted/50" : "bg-primary/10"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {m.role}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Answer or add context…"
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
            <button
              onClick={send}
              className="rounded-md bg-primary px-2.5 py-1.5 text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
