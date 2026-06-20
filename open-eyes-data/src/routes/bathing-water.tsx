import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
  Stat,
} from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";

export const Route = createFileRoute("/bathing-water")({
  head: () => ({
    meta: [
      { title: "Bathing Water Quality — transparenC" },
      {
        name: "description",
        content:
          "Every designated bathing water in England rated Excellent to Poor by the Environment Agency — with live pollution-risk forecasts and the water company responsible for each.",
      },
      { property: "og:title", content: "Bathing Water Quality — transparenC" },
    ],
  }),
  component: BathingWaterPage,
});

type Classification = "Excellent" | "Good" | "Sufficient" | "Poor" | "Closed" | "Unknown";

type BathingWater = {
  name: string;
  company: string;
  region: string;
  district: string;
  classification: Classification;
  classYear: number | null;
  riskLevel: "normal" | "increased" | "none" | "unknown";
  heavyRainImpacted: boolean;
};

type BathingResp = {
  waters: BathingWater[];
  total: number;
  excellent: number;
  good: number;
  sufficient: number;
  poor: number;
  closed: number;
  increasedRisk: number;
};

type SortKey = "rating" | "name" | "company";

const CLASS_RANK: Record<Classification, number> = {
  Poor: 0,
  Sufficient: 1,
  Good: 2,
  Excellent: 3,
  Closed: 4,
  Unknown: 5,
};

function BathingWaterPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [poorOnly, setPoorOnly] = useState(false);

  const q = useQuery({
    queryKey: ["bathing-water"],
    queryFn: () => getJSON<BathingResp>("/api/bathing-water"),
    staleTime: 30 * 60_000,
  });

  const all = q.data?.data.waters ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (poorOnly) list = list.filter((w) => w.classification === "Poor");
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(f) ||
          w.company.toLowerCase().includes(f) ||
          w.region.toLowerCase().includes(f) ||
          w.district.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "rating") return CLASS_RANK[a.classification] - CLASS_RANK[b.classification];
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "company") return a.company.localeCompare(b.company);
      return 0;
    });
  }, [all, filter, sort, poorOnly]);

  const d = q.data?.data;
  const poor = d?.poor ?? 0;
  const excellent = d?.excellent ?? 0;
  const increasedRisk = d?.increasedRisk ?? 0;
  const total = d?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Water Quality"
          title="How clean is the water where you swim?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Every designated bathing water in England, rated from Excellent to Poor by the Environment
          Agency — plus a live pollution-risk forecast and the water company responsible for the
          sewerage nearby.
        </p>
      </div>

      {/* What this means */}
      {!q.isLoading && total > 0 && (
        <ContextBlock heading="A rating is only as good as what's discharged upstream" variant="warn">
          <p>
            Bathing waters are classified each year on four levels — Excellent, Good, Sufficient and
            Poor — using bacteria readings taken across the season. A{" "}
            <strong className="text-foreground">Poor</strong> rating means the water repeatedly failed
            minimum safety standards, and the Environment Agency advises against bathing there.
          </p>
          <p>
            Of {fmtNumber(total)} designated sites, {fmtNumber(poor)} are currently rated{" "}
            <strong className="text-foreground">Poor</strong>. The same water companies pumping
            untreated sewage through storm overflows are the ones whose discharges most directly
            affect these ratings — which is why each site below is tagged with the company responsible.
            The <strong className="text-foreground">live pollution risk</strong> flag reflects
            short-term forecasts (after heavy rain, storm overflows are more likely to spill).
          </p>
        </ContextBlock>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Sites shown" value={fmtNumber(displayed.length)} accent="amber" loading={q.isLoading} />
        <Stat
          label="Rated Excellent"
          value={fmtNumber(excellent)}
          accent="ok"
          loading={q.isLoading}
        />
        <Stat
          label="Rated Poor"
          value={fmtNumber(poor)}
          accent="flag"
          loading={q.isLoading}
          shareable
          shareText={`${fmtNumber(poor)} of England's bathing waters are rated POOR — the Environment Agency advises against swimming there`}
        />
        <Stat
          label="Live pollution alerts"
          value={fmtNumber(increasedRisk)}
          accent="flag"
          loading={q.isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by beach, company, region or district…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <button
            onClick={() => setPoorOnly((v) => !v)}
            className={`px-3 py-2 rounded label-mono text-xs uppercase tracking-wider ${
              poorOnly
                ? "bg-flag text-white"
                : "bg-surface-2 text-muted-foreground hover:text-foreground"
            }`}
          >
            Poor only
          </button>
          <div className="flex gap-1 label-mono text-xs">
            {(["rating", "name", "company"] as SortKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 rounded uppercase tracking-wider ${
                  sort === s
                    ? "bg-amber text-amber-foreground"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {(filter || poorOnly) && (
          <div className="mt-2 label-mono text-xs text-muted-foreground">
            Showing {displayed.length} of {all.length} sites
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {!q.isLoading &&
          displayed.map((w, i) => <WaterRow key={`${w.name}-${w.company}-${i}`} w={w} />)}
        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">
            {filter || poorOnly ? "No sites match that filter." : "No bathing water data available."}
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="bathing water quality and sewage discharges affecting local beaches"
        briefingTopic="UK bathing water quality classifications, sewage pollution and accountability"
        shareText="See how clean the water is where you swim — and which company is responsible"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent concerned about the quality of bathing water in our area.

The Environment Agency classifies designated bathing waters each year from Excellent to Poor. Sites rated "Poor" repeatedly fail minimum safety standards, and the public is advised not to swim there. These ratings are directly affected by sewage discharged through storm overflows by water companies.

I would like to know:
1. How are the designated bathing waters in our constituency currently rated?
2. Which water company is responsible for the sewerage affecting them, and what is its discharge record?
3. What action is being taken to move any "Poor" or "Sufficient" sites up to "Good" or "Excellent"?
4. Will you support stronger, enforceable targets that tie water company performance to bathing water improvement?

I would be grateful for your response.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="Environment Agency — Bathing Water Quality"
        url="https://environment.data.gov.uk/bwq/profiles/"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function ratingVariant(c: Classification): "ok" | "open" | "warn" | "direct" | "neutral" {
  switch (c) {
    case "Excellent":
      return "ok";
    case "Good":
      return "open";
    case "Sufficient":
      return "warn";
    case "Poor":
      return "direct";
    default:
      return "neutral";
  }
}

function WaterRow({ w }: { w: BathingWater }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FlagPill variant={ratingVariant(w.classification)}>{w.classification}</FlagPill>
            {w.riskLevel === "increased" && <FlagPill variant="warn">Pollution risk now</FlagPill>}
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">{w.name}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            <span className="text-foreground">{w.company}</span>
            {" · "}
            {w.district}
            {w.region && w.region !== "—" ? ` · ${w.region}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {w.classYear ? `${w.classYear} rating` : "Rating"}
          </div>
          <div className="font-display text-2xl font-bold text-amber">{w.classification}</div>
        </div>
      </div>
    </Card>
  );
}
