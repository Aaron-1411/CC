import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parliament")({
  head: () => ({
    meta: [
      { title: "Parliament Watch — transparenC" },
      { name: "description", content: "Active UK bills and their progress through Parliament." },
      { property: "og:title", content: "Parliament Watch — transparenC" },
    ],
  }),
  component: ParliamentPage,
});

const STAGES = ["First Reading", "Committee", "Third Reading", "Lords", "Royal Assent"];

function mapStage(s?: string): number {
  const x = (s ?? "").toLowerCase();
  if (x.includes("royal")) return 4;
  if (x.includes("lord")) return 3;
  if (x.includes("third")) return 2;
  if (x.includes("report") || x.includes("committee")) return 1;
  return 0;
}

type Bill = {
  billId: number;
  shortTitle: string;
  longTitle?: string;
  currentHouse?: string;
  originatingHouse?: string;
  lastUpdate?: string;
  isAct?: boolean;
  isDefeated?: boolean;
  currentStage?: { description?: string; house?: string };
};

function ParliamentPage() {
  const q = useQuery({
    queryKey: ["bills"],
    queryFn: () => getJSON<{ items: Bill[] }>("/api/bills?take=30"),
    staleTime: 5 * 60_000,
  });
  const [filter, setFilter] = useState<string>("all");
  const items = useMemo(() => {
    const list = q.data?.data.items ?? [];
    if (filter === "all") return list;
    return list.filter((b) => (b.currentStage?.description ?? "").toLowerCase().includes(filter));
  }, [q.data, filter]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Parliament Watch"
          title="Bills moving through Westminster"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Live legislation from the UK Parliament Bills API, sorted by most recently updated.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 label-mono text-xs">
          {[
            { k: "all", l: "All" },
            { k: "first", l: "First Reading" },
            { k: "committee", l: "Committee" },
            { k: "third", l: "Third Reading" },
            { k: "lord", l: "Lords" },
            { k: "royal", l: "Royal Assent" },
          ].map((o) => (
            <button
              key={o.k}
              onClick={() => setFilter(o.k)}
              className={cn(
                "px-3 py-1.5 rounded uppercase tracking-wider",
                filter === o.k ? "bg-amber text-amber-foreground" : "bg-surface-2 text-muted-foreground hover:text-foreground",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      <div className="grid gap-3">
        {q.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-5 w-2/3 mb-2" /><Skeleton className="h-3 w-full mb-3" /><Skeleton className="h-2 w-full" /></Card>
            ))
          : items.map((b) => <BillRow key={b.billId} b={b} />)}
      </div>

      <DataProvenance
        source="UK Parliament Bills API"
        url="https://bills-api.parliament.uk"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function BillRow({ b }: { b: Bill }) {
  const stageIdx = mapStage(b.currentStage?.description);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {b.isAct && <FlagPill variant="ok">Act</FlagPill>}
            {b.isDefeated && <FlagPill variant="direct">Defeated</FlagPill>}
            {b.currentHouse && <FlagPill variant="neutral">{b.currentHouse}</FlagPill>}
          </div>
          <a
            href={`https://bills.parliament.uk/bills/${b.billId}`}
            target="_blank"
            rel="noreferrer"
            className="font-display text-lg font-semibold hover:text-amber leading-snug"
          >
            {b.shortTitle}
          </a>
          {b.longTitle && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.longTitle}</p>
          )}
        </div>
        <div className="text-right shrink-0 label-mono text-[10px] text-muted-foreground uppercase">
          updated {relTime(b.lastUpdate)}
        </div>
      </div>
      <div className="mt-4">
        <StagePipeline stageIdx={stageIdx} current={b.currentStage?.description ?? ""} />
      </div>
    </Card>
  );
}

function StagePipeline({ stageIdx, current }: { stageIdx: number; current: string }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-1">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= stageIdx ? "bg-amber" : "bg-surface-2",
              )}
            />
            {i < STAGES.length - 1 && <div className="w-1 h-1 rounded-full bg-border" />}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 label-mono text-[9px] uppercase tracking-wider">
        {STAGES.map((s, i) => (
          <span key={s} className={cn(i <= stageIdx ? "text-amber" : "text-muted-foreground")}>{s}</span>
        ))}
      </div>
      {current && (
        <div className="text-xs text-muted-foreground mt-2 label-mono">
          Current stage: <span className="text-foreground">{current}</span>
        </div>
      )}
    </div>
  );
}