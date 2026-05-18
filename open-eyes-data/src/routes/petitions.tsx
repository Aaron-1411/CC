import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton, ThresholdBar } from "@/components/primitives";
import { fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/petitions")({
  head: () => ({
    meta: [
      { title: "Petitions Tracker — transparenC" },
      { name: "description", content: "Live UK Parliament petitions, sorted by signatures, with progress to 10k and 100k thresholds." },
      { property: "og:title", content: "UK Petitions Tracker — transparenC" },
    ],
  }),
  component: PetitionsPage,
});

type Petition = {
  id: number;
  attributes: {
    action: string;
    background: string;
    signature_count: number;
    state: string;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    debate_threshold_reached_at: string | null;
    response_threshold_reached_at: string | null;
    scheduled_debate_date: string | null;
  };
  links: { self: string };
};

function PetitionsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"signatures" | "newest" | "threshold">("signatures");
  const [q, setQ] = useState("");

  const query = useQuery({
    queryKey: ["petitions", page],
    queryFn: () => getJSON<{ data: Petition[] }>(`/api/petitions?state=open&page=${page}`),
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    const list = query.data?.data.data ?? [];
    const filtered = q
      ? list.filter((p) => p.attributes.action.toLowerCase().includes(q.toLowerCase()))
      : list;
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "signatures") return b.attributes.signature_count - a.attributes.signature_count;
      if (sort === "newest")
        return new Date(b.attributes.created_at).getTime() - new Date(a.attributes.created_at).getTime();
      const aDist = distanceToThreshold(a.attributes.signature_count);
      const bDist = distanceToThreshold(b.attributes.signature_count);
      return aDist - bDist;
    });
    return sorted;
  }, [query.data, sort, q]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Petitions Tracker"
          title="What the public is demanding"
          right={<LiveBadge timestamp={query.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          At <span className="text-amber font-mono">10,000</span> signatures the government must respond.
          At <span className="text-ok font-mono">100,000</span> Parliament must consider a debate.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by keyword…"
            className="flex-1 min-w-[200px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <div className="flex gap-1 label-mono text-xs">
            {(["signatures", "newest", "threshold"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 rounded uppercase tracking-wider ${sort === s ? "bg-amber text-amber-foreground" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded bg-surface-2 disabled:opacity-40 label-mono text-xs"
            >
              ← prev
            </button>
            <span className="label-mono text-xs px-3 py-2">page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded bg-surface-2 label-mono text-xs"
            >
              next →
            </button>
          </div>
        </div>
      </Card>

      {query.error && <ErrorNote>{(query.error as Error).message}</ErrorNote>}

      <div className="grid gap-3">
        {query.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-6 w-2/3 mb-3" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-2 w-full" /></Card>
            ))
          : items.map((p) => <PetitionRow key={p.id} p={p} />)}
      </div>

      <DataProvenance
        source="UK Parliament Petitions API"
        url="https://petition.parliament.uk/petitions.json"
        fetchedAt={query.data?.meta.fetchedAt}
      />
    </div>
  );
}

function distanceToThreshold(c: number) {
  if (c < 10_000) return 10_000 - c;
  if (c < 100_000) return 100_000 - c;
  return Number.MAX_SAFE_INTEGER;
}

function PetitionRow({ p }: { p: Petition }) {
  const a = p.attributes;
  const url = `https://petition.parliament.uk/petitions/${p.id}`;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {a.scheduled_debate_date && <FlagPill variant="ok"><span>debate {new Date(a.scheduled_debate_date).toLocaleDateString("en-GB")}</span></FlagPill>}
            {a.debate_threshold_reached_at && !a.scheduled_debate_date && <FlagPill variant="open">100k reached</FlagPill>}
            {a.response_threshold_reached_at && <FlagPill variant="warn">10k · response due</FlagPill>}
            <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              opened {relTime(a.created_at)}
            </span>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="font-display text-lg font-semibold hover:text-amber leading-snug">
            {a.action}
          </a>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl font-bold text-amber">{fmtNumber(a.signature_count)}</div>
          <div className="label-mono text-[10px] uppercase text-muted-foreground">signatures</div>
        </div>
      </div>
      <div className="mt-4">
        <ThresholdBar value={a.signature_count} thresholds={[10_000, 100_000]} />
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="label-mono text-[10px] text-muted-foreground uppercase">updated {relTime(a.updated_at)}</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-amber hover:underline label-mono uppercase tracking-wider">
          Sign on petition.parliament.uk →
        </a>
      </div>
    </Card>
  );
}