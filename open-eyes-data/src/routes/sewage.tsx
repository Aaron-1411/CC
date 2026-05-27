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

export const Route = createFileRoute("/sewage")({
  head: () => ({
    meta: [
      { title: "Sewage Discharges — transparenC" },
      {
        name: "description",
        content:
          "Annual EDM data showing hours water companies discharged sewage into UK waterways via storm overflows.",
      },
      { property: "og:title", content: "Sewage Discharges — Storm Overflows — transparenC" },
    ],
  }),
  component: SewagePage,
});

type SpillRecord = {
  company: string;
  site: string;
  spillHours: number;
  spillCount: number;
  receivingWater: string;
};

type SewageResp = {
  spills: SpillRecord[];
  totalHours: number;
  totalCount: number;
};

type SortKey = "hours" | "count" | "company";

function SewagePage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("hours");

  const q = useQuery({
    queryKey: ["sewage"],
    queryFn: () => getJSON<SewageResp>("/api/sewage"),
    staleTime: 30 * 60_000,
  });

  const all = q.data?.data.spills ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (s) =>
          s.company.toLowerCase().includes(f) ||
          s.site.toLowerCase().includes(f) ||
          s.receivingWater.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "hours") return b.spillHours - a.spillHours;
      if (sort === "count") return b.spillCount - a.spillCount;
      if (sort === "company") return a.company.localeCompare(b.company);
      return 0;
    });
  }, [all, filter, sort]);

  const totalHours = q.data?.data.totalHours ?? 0;
  const totalCount = q.data?.data.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Water Quality"
          title="Water companies pumping raw sewage into rivers and seas"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Every storm overflow site in England where a water company discharged untreated sewage in 2024 —
          how many hours it spilled and which waterway it went into.
        </p>
      </div>

      {/* What this means */}
      {!q.isLoading && totalHours > 0 && (
        <ContextBlock heading="Water bills went up while sewage went into your rivers" variant="critical">
          <p>
            Water companies are permitted to use storm overflows during heavy rainfall to stop sewage
            backing up into homes. But regulators and campaigners say these permits are exploited as a
            routine disposal method. In 2024 there were{" "}
            <strong className="text-foreground">{fmtNumber(totalCount)} separate spill events</strong>{" "}
            across England — roughly one every 9 minutes, around the clock.
          </p>
          <p>
            In the same year, water companies paid out over{" "}
            <strong className="text-foreground">£1.4 billion in dividends</strong>{" "}
            to shareholders while missing Environment Agency improvement targets. The average household
            water bill rose above £500/year. Only one company has faced criminal prosecution for
            unpermitted discharges.
          </p>
        </ContextBlock>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Sites shown"
          value={fmtNumber(displayed.length)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Total spill hours"
          value={fmtNumber(totalHours)}
          accent="flag"
          loading={q.isLoading}
        />
        <Stat
          label="Total spill events"
          value={fmtNumber(totalCount)}
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
            placeholder="Filter by company, site, or water body…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <div className="flex gap-1 label-mono text-xs">
            {(["hours", "count", "company"] as SortKey[]).map((s) => (
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
        {filter && (
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
        {!q.isLoading && displayed.map((s, i) => <SpillRow key={`${s.company}-${s.site}-${i}`} s={s} />)}
        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">
            {filter ? "No sites match that filter." : "No spill data available."}
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="water company sewage discharges and accountability"
        briefingTopic="UK water company sewage pollution, regulation and accountability 2024"
        shareText="UK water companies spilled sewage for millions of hours in 2024"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent who is deeply concerned about sewage pollution in our waterways.

Environment Agency data shows that in 2024, water companies across England discharged untreated or partially-treated sewage for over 3.6 million hours. This equates to roughly one spill event every 9 minutes, around the clock, for the entire year.

During the same period, water companies paid out over £1.4 billion in dividends to shareholders — while failing to meet their own improvement targets set by the Environment Agency.

I would like to know:
1. Which water company serves our constituency, and how many hours did they spill sewage in 2024?
2. What enforcement action has been taken against water companies failing their targets?
3. Will you support criminal prosecution for unpermitted discharges, not just civil penalties?
4. What will you do to ensure water bill increases are linked to actual improvement, not shareholder returns?

I would be grateful for your response.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="Environment Agency — Storm Overflow EDM Annual Returns 2024"
        url="https://www.gov.uk/government/collections/storm-overflow-data"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function SpillRow({ s }: { s: SpillRecord }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FlagPill variant="direct">Sewage overflow</FlagPill>
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">{s.site}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            <span className="text-foreground">{s.company}</span>
            {" · "}
            {s.receivingWater}
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div>
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Spill hours
            </div>
            <div className="font-display text-2xl font-bold text-amber">
              {s.spillHours > 0 ? fmtNumber(s.spillHours) : "—"}
            </div>
          </div>
          <div>
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Events
            </div>
            <div className="font-display text-lg font-semibold text-muted-foreground">
              {s.spillCount > 0 ? fmtNumber(s.spillCount) : "—"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
