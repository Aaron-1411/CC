import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Card,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
  Stat,
} from "@/components/primitives";
import { fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/stop-search")({
  head: () => ({
    meta: [
      { title: "Police Stop & Search — transparenC" },
      {
        name: "description",
        content:
          "Every stop and search recorded in England and Wales, broken down by ethnicity, outcome and object of search. Data shows racial disparity in who gets stopped.",
      },
    ],
  }),
  component: StopSearchPage,
});

type StopRecord = {
  age_range: string | null;
  outcome: string | null;
  self_defined_ethnicity: string | null;
  gender: string | null;
  legislation: string | null;
  datetime: string | null;
  location: { latitude: string; longitude: string; street?: { name?: string } } | null;
  object_of_search: string | null;
  officer_defined_ethnicity: string | null;
  type: string | null;
};

type Summary = {
  total: number;
  byEthnicity: Record<string, number>;
  byOutcome: Record<string, number>;
  byObject: Record<string, number>;
};

type StopSearchResp = {
  stops: StopRecord[];
  summary: Summary;
  force: string;
  date: string;
  forces: Array<{ id: string; name: string }>;
};

function getLastSixMonths(): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

function defaultDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function outcomeFlag(outcome: string | null): "direct" | "neutral" {
  if (!outcome) return "neutral";
  const o = outcome.toLowerCase();
  if (o.includes("arrest") || o.includes("summons") || o.includes("caution")) return "direct";
  return "neutral";
}

function BreakdownBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-48 shrink-0 text-sm text-muted-foreground truncate" title={label}>
        {label}
      </div>
      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="label-mono text-xs text-right w-20 shrink-0">
        <span className="text-foreground">{fmtNumber(count)}</span>
        <span className="text-muted-foreground ml-1">({pct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

function StopSearchPage() {
  const monthOptions = useMemo(() => getLastSixMonths(), []);
  const [force, setForce] = useState("metropolitan");
  const [date, setDate] = useState(defaultDate);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const q = useQuery({
    queryKey: ["stop-search", force, date],
    queryFn: () =>
      getJSON<StopSearchResp>(`/api/stop-search?force=${encodeURIComponent(force)}&date=${encodeURIComponent(date)}`),
    staleTime: 4 * 60 * 60_000,
  });

  const data = q.data?.data;
  const forces = data?.forces ?? [];
  const summary = data?.summary;
  const stops = data?.stops ?? [];

  // Stats
  const noFurtherAction = useMemo(() => {
    if (!summary) return 0;
    const nfa = Object.entries(summary.byOutcome).find(([k]) =>
      k.toLowerCase().includes("no further action"),
    );
    return nfa ? nfa[1] : 0;
  }, [summary]);

  const blackStops = useMemo(() => {
    if (!summary) return 0;
    return Object.entries(summary.byEthnicity)
      .filter(([k]) => k.toLowerCase().includes("black"))
      .reduce((s, [, v]) => s + v, 0);
  }, [summary]);

  const nfaPct =
    summary && summary.total > 0
      ? ((noFurtherAction / summary.total) * 100).toFixed(1)
      : "—";

  const blackPct =
    summary && summary.total > 0
      ? ((blackStops / summary.total) * 100).toFixed(1)
      : "—";

  const paginatedStops = stops.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(stops.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Policing Data"
          title="Police Stop & Search"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Every stop and search recorded in England and Wales, broken down by ethnicity, outcome and
          object of search. Data shows racial disparity in who gets stopped.
        </p>
      </div>

      {/* Selectors */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Police Force
            </label>
            <select
              value={force}
              onChange={(e) => { setForce(e.target.value); setPage(0); }}
              className="bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
            >
              {forces.length === 0 && (
                <option value="metropolitan">Metropolitan Police</option>
              )}
              {forces.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Month
            </label>
            <select
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(0); }}
              className="bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Summary stats */}
      {q.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface rounded-lg p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat
            label="Total stops"
            value={fmtNumber(summary.total)}
            accent="amber"
          />
          <Stat
            label="No further action"
            value={`${nfaPct}%`}
            hint={`${fmtNumber(noFurtherAction)} stops`}
          />
          <Stat
            label="Black / Black British"
            value={`${blackPct}%`}
            hint={`${fmtNumber(blackStops)} stops — racial disparity`}
            accent="flag"
          />
        </div>
      ) : null}

      {/* Breakdown charts */}
      {q.isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-40 mb-4" />
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full mb-2" />
              ))}
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <h3 className="label-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              By Self-Defined Ethnicity
            </h3>
            <div className="space-y-0.5">
              {Object.entries(summary.byEthnicity).slice(0, 15).map(([eth, count]) => (
                <BreakdownBar
                  key={eth}
                  label={eth}
                  count={count}
                  total={summary.total}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="label-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              By Outcome
            </h3>
            <div className="space-y-0.5">
              {Object.entries(summary.byOutcome).slice(0, 15).map(([outcome, count]) => (
                <BreakdownBar
                  key={outcome}
                  label={outcome}
                  count={count}
                  total={summary.total}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {/* Object of search breakdown */}
      {!q.isLoading && summary && (
        <Card>
          <h3 className="label-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            By Object of Search
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0.5">
            {Object.entries(summary.byObject).slice(0, 20).map(([obj, count]) => (
              <BreakdownBar
                key={obj}
                label={obj}
                count={count}
                total={summary.total}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Individual records */}
      {!q.isLoading && stops.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Individual Records
            </h3>
            <span className="label-mono text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, stops.length)} of {fmtNumber(stops.length)}
            </span>
          </div>

          <div className="grid gap-2">
            {paginatedStops.map((stop, i) => (
              <StopRow key={`${stop.datetime}-${i}`} stop={stop} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-surface-2 border border-border rounded label-mono text-xs uppercase tracking-wider disabled:opacity-40 hover:border-amber"
              >
                Previous
              </button>
              <span className="label-mono text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-surface-2 border border-border rounded label-mono text-xs uppercase tracking-wider disabled:opacity-40 hover:border-amber"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {!q.isLoading && stops.length === 0 && !q.error && (
        <div className="text-muted-foreground text-sm py-12 text-center">
          No stop and search records found for this force and date.
        </div>
      )}

      <DataProvenance
        source="data.police.uk — Home Office"
        url="https://data.police.uk"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function StopRow({ stop }: { stop: StopRecord }) {
  const flag = outcomeFlag(stop.outcome);
  const streetName = stop.location?.street?.name;

  return (
    <Card className="py-3 px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <FlagPill variant={flag}>
              {stop.outcome ?? "Outcome unknown"}
            </FlagPill>
            {stop.type && (
              <FlagPill variant="neutral">{stop.type}</FlagPill>
            )}
          </div>
          <div className="text-sm">
            <span className="font-medium">
              {stop.self_defined_ethnicity ?? stop.officer_defined_ethnicity ?? "Ethnicity not recorded"}
            </span>
            {stop.gender && (
              <span className="text-muted-foreground ml-2">· {stop.gender}</span>
            )}
            {stop.age_range && (
              <span className="text-muted-foreground ml-2">· Age {stop.age_range}</span>
            )}
          </div>
          {stop.object_of_search && (
            <div className="label-mono text-xs text-muted-foreground">
              Searching for: {stop.object_of_search}
            </div>
          )}
          {stop.legislation && (
            <div className="label-mono text-[10px] text-muted-foreground/70">
              {stop.legislation}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 label-mono text-xs text-muted-foreground space-y-0.5">
          {stop.datetime && (
            <div>{new Date(stop.datetime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</div>
          )}
          {streetName && <div className="text-[10px]">{streetName}</div>}
        </div>
      </div>
    </Card>
  );
}
