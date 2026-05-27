import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, DataProvenance, ErrorNote, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { Markdown } from "@/components/markdown";
import { getJSON } from "@/lib/api";

export const Route = createFileRoute("/briefing")({
  validateSearch: (s: Record<string, unknown>) => ({ topic: typeof s.topic === "string" ? s.topic : "" }),
  head: () => ({
    meta: [
      { title: "AI Accountability Briefing — transparenC" },
      { name: "description", content: "Generate a non-partisan AI briefing on any UK government accountability topic." },
      { property: "og:title", content: "AI Accountability Briefing — transparenC" },
    ],
  }),
  component: BriefingPage,
});

const QUICK = [
  "NHS England waiting list",
  "HS2 overspend",
  "Asylum system backlog",
  "UK government net debt",
  "Housing target progress",
  "Defence procurement",
  "Water company sewage discharges",
  "Government AI contracts",
];

function BriefingPage() {
  const search = useSearch({ from: "/briefing" });
  const [topic, setTopic] = useState(search.topic ?? "");
  const m = useMutation({
    mutationFn: (t: string) =>
      getJSON<{ markdown: string; topic: string }>("/api/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: t }),
      }),
  });

  // Auto-submit if topic arrived via URL param
  useEffect(() => {
    if (search.topic && search.topic.trim().length > 2 && !m.data && !m.isPending) {
      m.mutate(search.topic.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.topic]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="AI Briefing"
          title="Ask about any UK accountability topic"
          right={<LiveBadge timestamp={m.data?.meta.fetchedAt} label="AI" />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Type any UK accountability topic and get a non-partisan briefing with named ministers, real figures and named departments. Verify against primary sources before publishing.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) m.mutate(topic.trim());
          }}
          className="space-y-3"
        >
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Post Office Horizon scandal — current status, named ministers, what compensation has actually been paid"
            className="w-full min-h-[100px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setTopic(q);
                    m.mutate(q);
                  }}
                  className="px-2.5 py-1 text-xs label-mono uppercase tracking-wider bg-surface-2 hover:bg-amber/10 hover:text-amber rounded border border-border"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={m.isPending || topic.trim().length < 2}
              className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {m.isPending ? "Generating…" : "Generate briefing"}
            </button>
          </div>
        </form>
      </Card>

      {m.error && <ErrorNote>{(m.error as Error).message}</ErrorNote>}

      {m.isPending && (
        <Card>
          <Skeleton className="h-6 w-2/3 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-11/12 mb-2" />
          <Skeleton className="h-4 w-10/12 mb-2" />
          <Skeleton className="h-4 w-9/12" />
        </Card>
      )}

      {m.data && (
        <Card>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-2">Briefing</div>
          <h3 className="font-display text-2xl font-bold mb-4">{m.data.data.topic}</h3>
          <div className="text-[15px] leading-7"><Markdown source={m.data.data.markdown} /></div>
          <DataProvenance
            source="Lovable AI Gateway (Gemini)"
            url="https://ai.gateway.lovable.dev"
            licence="AI-generated; verify against primary sources"
            fetchedAt={m.data.meta.fetchedAt}
          />
        </Card>
      )}
    </div>
  );
}