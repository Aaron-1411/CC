import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  LiveBadge,
  SectionHeader,
  Skeleton,
  Stat,
} from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";
import type { DeptSpend, SpendingData } from "@/routes/api/spending";

export const Route = createFileRoute("/spending")({
  head: () => ({
    meta: [
      { title: "Government Spending — transparenC" },
      {
        name: "description",
        content:
          "Where does your £1.2 trillion go? HM Treasury PESA data — departmental spending totals, resource vs capital breakdown.",
      },
      { property: "og:title", content: "Government Spending by Department — transparenC" },
    ],
  }),
  component: SpendingPage,
});

function fmtBn(v: number): string {
  if (v >= 1000) return `£${(v / 1000).toFixed(1)}tn`;
  return `£${v.toFixed(1)}bn`;
}

function SpendRow({ d, maxSpend }: { d: DeptSpend; maxSpend: number }) {
  const pct = maxSpend > 0 ? (d.totalSpendGBPbn / maxSpend) * 100 : 0;
  const sharePct = maxSpend > 0 ? (d.totalSpendGBPbn / maxSpend) * 100 : 0;
  return (
    <Card className="py-3 px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="font-display text-sm font-semibold leading-snug flex-1 min-w-0 pr-4">
          {d.department}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-amber">{fmtBn(d.totalSpendGBPbn)}</div>
        </div>
      </div>
      {/* Bar */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-amber/60 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {/* Resource / Capital breakdown */}
      <div className="flex gap-4 label-mono text-[10px] text-muted-foreground">
        {d.resourceSpendGBPbn > 0 && (
          <span>Resource: {fmtBn(d.resourceSpendGBPbn)}</span>
        )}
        {d.capitalSpendGBPbn > 0 && (
          <span>Capital: {fmtBn(d.capitalSpendGBPbn)}</span>
        )}
        <span className="ml-auto">{sharePct.toFixed(1)}% of shown total</span>
      </div>
    </Card>
  );
}

function SpendingPage() {
  const [filter, setFilter] = useState("");

  const q = useQuery({
    queryKey: ["spending"],
    queryFn: () => getJSON<SpendingData>("/api/spending"),
    staleTime: 24 * 60 * 60_000,
  });

  const all = q.data?.data.departments ?? [];
  const totalGBPbn = q.data?.data.totalGBPbn ?? 0;
  const year = q.data?.data.year ?? "";

  const displayed = useMemo(() => {
    if (!filter) return all;
    const f = filter.toLowerCase();
    return all.filter((d) => d.department.toLowerCase().includes(f));
  }, [all, filter]);

  const maxSpend = displayed.reduce((m, d) => Math.max(m, d.totalSpendGBPbn), 0);

  // Top 3 by spend
  const top3 = all.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Public Spending"
          title="Where does your money go?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          HM Treasury PESA data — total managed expenditure by government department.
          {year ? ` Figures are ${year} outturn or latest available.` : ""}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total shown" value={fmtBn(totalGBPbn)} accent="amber" loading={q.isLoading} />
        {top3.map((d) => (
          <Stat
            key={d.department}
            label={d.department.replace("Department for ", "Dept: ").replace("Department of ", "Dept: ").slice(0, 28)}
            value={fmtBn(d.totalSpendGBPbn)}
            loading={q.isLoading}
          />
        ))}
      </div>

      {/* Context */}
      {!q.isLoading && (
        <ContextBlock heading="DWP and DHSC together account for nearly 40% of all government spending" variant="default">
          <p>
            The UK government spends roughly{" "}
            <strong className="text-foreground">{fmtBn(totalGBPbn)}</strong> per year.
            The two largest departments are the Department for Work and Pensions (welfare, pensions,
            Universal Credit) and the Department of Health and Social Care (NHS and adult social care).
            Together they account for more than a third of all public spending.
          </p>
          <p>
            Capital spending (investment in infrastructure, buildings and equipment) is distinct from
            resource spending (day-to-day running costs and public services). Cuts to capital
            spending reduce future productivity. Cuts to resource spending affect current service delivery.
          </p>
        </ContextBlock>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by department name…"
          className="flex-1 max-w-md bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
        />
        {filter && (
          <button
            onClick={() => setFilter("")}
            className="label-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Spending bars */}
      <div className="space-y-2">
        {q.isLoading &&
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        {!q.isLoading && displayed.map((d) => (
          <SpendRow key={d.department} d={d} maxSpend={maxSpend} />
        ))}
        {!q.isLoading && displayed.length === 0 && (
          <div className="text-muted-foreground text-sm py-8 text-center">
            No departments match that filter.
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="government spending priorities, departmental budgets and public services"
        briefingTopic="UK government departmental spending totals, PESA and budget allocation"
        shareText="Where does the UK government spend £1.2 trillion? PESA departmental breakdown"
      />

      <DataProvenance
        source="HM Treasury — Public Expenditure Statistical Analyses (PESA)"
        url="https://www.gov.uk/government/collections/public-expenditure-statistical-analyses-pesa"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
