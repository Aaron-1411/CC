import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActionBar, Card, ContextBlock, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { fmtGBP, fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Government Contracts — transparenC" },
      { name: "description", content: "All UK government contracts over £1m awarded in the last 10 months." },
      { property: "og:title", content: "UK Major Government Contracts — transparenC" },
    ],
  }),
  component: ContractsPage,
});

type Notice = {
  id: string;
  title: string;
  organisationName: string;
  description?: string;
  awardedValue: number;
  awardedSupplier: string;
  awardedDate?: string;
  publishedDate?: string;
  procedureType?: string;
  noticeType?: string;
  link?: string;
};

type ContractsResp = { results: Notice[]; totalResults: number; totalValue: number };

type SortKey = "value" | "date" | "department" | "supplier";

function flagFor(proc?: string): { variant: "direct" | "no-tender" | "restricted" | "open" | "neutral"; label: string } {
  const p = (proc ?? "").toLowerCase();
  if (p.includes("direct")) return { variant: "direct", label: "Direct award" };
  if (p.includes("negotiated") || p.includes("no competition")) return { variant: "no-tender", label: "No tender" };
  if (p.includes("restricted")) return { variant: "restricted", label: "Restricted" };
  if (p.includes("open")) return { variant: "open", label: "Open tender" };
  return { variant: "neutral", label: proc ?? "—" };
}

function ContractsPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("value");
  const [showDirect, setShowDirect] = useState(false);

  const q = useQuery({
    queryKey: ["contracts-major"],
    queryFn: () => getJSON<ContractsResp>("/api/contracts"),
    staleTime: 60 * 60_000,
  });

  const all = q.data?.data.results ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter((n) =>
        [n.title, n.organisationName, n.awardedSupplier, n.description]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(f)),
      );
    }
    if (showDirect) {
      list = list.filter((n) => {
        const p = (n.procedureType ?? "").toLowerCase();
        return p.includes("direct") || p.includes("negotiated") || p.includes("no competition");
      });
    }
    return [...list].sort((a, b) => {
      if (sort === "value") return b.awardedValue - a.awardedValue;
      if (sort === "date") {
        return new Date(b.awardedDate ?? b.publishedDate ?? 0).getTime() -
               new Date(a.awardedDate ?? a.publishedDate ?? 0).getTime();
      }
      if (sort === "department") return a.organisationName.localeCompare(b.organisationName);
      if (sort === "supplier") return a.awardedSupplier.localeCompare(b.awardedSupplier);
      return 0;
    });
  }, [all, filter, sort, showDirect]);

  const totalValue = displayed.reduce((s, n) => s + n.awardedValue, 0);
  const directCount = displayed.filter((n) => {
    const p = (n.procedureType ?? "").toLowerCase();
    return p.includes("direct") || p.includes("negotiated");
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Contracts Database"
          title="Major contracts awarded — last 10 months"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Every government contract award over <span className="text-amber font-mono">£1,000,000</span> from
          the last 10 months via Contracts Finder. Direct awards and restricted procedures flagged in red —
          they are legal but bypass open competition.
        </p>
      </div>

      {/* Summary stats */}
      {q.data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Contracts found</div>
            <div className="font-display text-3xl font-bold text-amber mt-1">{displayed.length.toLocaleString()}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Total value</div>
            <div className="font-display text-3xl font-bold text-amber mt-1">{fmtGBP(totalValue)}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Direct awards</div>
            <div className="font-display text-3xl font-bold text-flag mt-1">{directCount.toLocaleString()}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Scanned records</div>
            <div className="font-display text-3xl font-bold mt-1">{(q.data.data.results.length > 0 ? "2,000+" : "—")}</div>
          </div>
        </div>
      )}

      {/* Aggregation: top recipients + direct award breakdown */}
      {!q.isLoading && all.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Top 10 suppliers */}
          <Card>
            <h3 className="label-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              Top 10 suppliers by value
            </h3>
            <div className="space-y-1">
              {Object.entries(
                all.reduce<Record<string, number>>((acc, n) => {
                  if (!n.awardedSupplier || n.awardedSupplier === "—") return acc;
                  acc[n.awardedSupplier] = (acc[n.awardedSupplier] ?? 0) + n.awardedValue;
                  return acc;
                }, {}),
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([supplier, value]) => {
                  const maxVal = all.reduce((m, n) => Math.max(m, n.awardedValue), 0);
                  const pct = maxVal > 0 ? (value / (maxVal * 2)) * 100 : 0;
                  return (
                    <div key={supplier} className="flex items-center gap-2 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate" title={supplier}>{supplier}</div>
                        <div className="h-1 bg-surface-2 rounded-full mt-0.5 overflow-hidden">
                          <div className="h-full bg-amber/50 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      <div className="label-mono text-[10px] text-amber shrink-0 w-16 text-right">{fmtGBP(value)}</div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Direct award analysis */}
          <Card>
            <h3 className="label-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              Procedure type breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(
                all.reduce<Record<string, { count: number; value: number }>>((acc, n) => {
                  const key = (() => {
                    const p = (n.procedureType ?? "Unknown").toLowerCase();
                    if (p.includes("direct")) return "Direct award";
                    if (p.includes("negotiated") || p.includes("no competition")) return "Negotiated / no tender";
                    if (p.includes("open")) return "Open tender";
                    if (p.includes("restricted")) return "Restricted";
                    return "Other / unknown";
                  })();
                  const ex = acc[key] ?? { count: 0, value: 0 };
                  acc[key] = { count: ex.count + 1, value: ex.value + n.awardedValue };
                  return acc;
                }, {}),
              )
                .sort(([, a], [, b]) => b.value - a.value)
                .map(([proc, { count, value }]) => {
                  const isDirect = proc.toLowerCase().includes("direct") || proc.toLowerCase().includes("negotiated");
                  return (
                    <div key={proc} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isDirect ? "bg-flag" : "bg-muted-foreground/40"}`} />
                        <span className="text-sm">{proc}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="label-mono text-xs text-amber">{fmtGBP(value)}</div>
                        <div className="label-mono text-[9px] text-muted-foreground">{fmtNumber(count)} contracts</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* Context block */}
      {!q.isLoading && directCount > 0 && (
        <ContextBlock heading={`${directCount} contracts in this dataset were awarded directly — bypassing open competition`} variant="warn">
          <p>
            Direct awards are legal — they are permitted where only one supplier can do the work,
            for genuine emergencies, or for low-value contracts. But they remove competitive pressure
            on price and quality, and they create greater risk of conflicts of interest.
            The Public Accounts Committee has repeatedly criticised the government's overuse of
            direct awards, particularly during the pandemic.
          </p>
        </ContextBlock>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by department, supplier, or title…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <div className="flex gap-1 label-mono text-xs">
            {(["value", "date", "department", "supplier"] as SortKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 rounded uppercase tracking-wider ${sort === s ? "bg-amber text-amber-foreground" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDirect((d) => !d)}
            className={`px-3 py-2 rounded label-mono text-xs uppercase tracking-wider border ${showDirect ? "bg-flag/15 text-flag border-flag/30" : "bg-surface-2 border-border text-muted-foreground hover:text-foreground"}`}
          >
            Direct awards only
          </button>
        </div>
        {filter && (
          <div className="mt-2 label-mono text-xs text-muted-foreground">
            Showing {displayed.length} of {all.length} contracts · {fmtGBP(totalValue)} total
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <div className="space-y-2">
          <div className="label-mono text-xs text-muted-foreground text-center py-4">
            Scanning 2,000 contract records from Contracts Finder — this takes a few seconds…
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {!q.isLoading && displayed.map((n) => <NoticeRow key={n.id} n={n} />)}
        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">
            {filter ? "No contracts match that filter." : "No major contracts found in this period."}
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="government contract transparency and direct award practices"
        briefingTopic="UK government contract spending, direct awards and Contracts Finder transparency"
        shareText="Search every UK government contract over £1m — direct awards flagged"
      />

      <DataProvenance
        source="Contracts Finder — Cabinet Office (OCDS API)"
        url="https://www.contractsfinder.service.gov.uk"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function NoticeRow({ n }: { n: Notice }) {
  const f = flagFor(n.procedureType);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <FlagPill variant={f.variant}>{f.label}</FlagPill>
            {n.noticeType && <FlagPill variant="neutral">{n.noticeType}</FlagPill>}
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">
            {n.link ? (
              <a href={n.link} target="_blank" rel="noreferrer" className="hover:text-amber">
                {n.title}
              </a>
            ) : n.title}
          </h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            <span className="text-foreground">{n.organisationName}</span>
            {n.awardedSupplier && n.awardedSupplier !== "—" && (
              <> → <span className="text-amber">{n.awardedSupplier}</span></>
            )}
          </div>
          {n.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-amber">{fmtGBP(n.awardedValue)}</div>
          <div className="label-mono text-[10px] uppercase text-muted-foreground mt-1">
            {n.awardedDate ? `awarded ${relTime(n.awardedDate)}` : n.publishedDate ? `published ${relTime(n.publishedDate)}` : ""}
          </div>
        </div>
      </div>
    </Card>
  );
}
