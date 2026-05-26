import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { fmtGBP, fmtNumber, getJSON } from "@/lib/api";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "MP Expenses — transparenC" },
      {
        name: "description",
        content:
          "IPSA published totals of MP staffing and business costs by MP, 2024-25.",
      },
      { property: "og:title", content: "MP Expenses — transparenC" },
    ],
  }),
  component: ExpensesPage,
});

type MPExpense = {
  name: string;
  constituency: string;
  officeSpend: number;
  staffingSpend: number;
  accommodationSpend: number;
  travelSpend: number;
  otherSpend: number;
  totalSpend: number;
  parliamentId: string;
};

type ExpensesResponse = {
  expenses: MPExpense[];
  year: string;
  total: number;
};

const HIGH_THRESHOLD = 400_000;

type SortKey = "total" | "office" | "staffing" | "accommodation" | "travel";

function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("total");

  const q = useQuery({
    queryKey: ["expenses-v3"],
    queryFn: () => getJSON<ExpensesResponse>("/api/expenses"),
    staleTime: 4 * 60 * 60_000,
  });

  const all = q.data?.data.expenses ?? [];
  const year = q.data?.data.year ?? "2024-25";

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(f) ||
          e.constituency.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "total") return b.totalSpend - a.totalSpend;
      if (sort === "office") return b.officeSpend - a.officeSpend;
      if (sort === "staffing") return b.staffingSpend - a.staffingSpend;
      if (sort === "accommodation") return b.accommodationSpend - a.accommodationSpend;
      if (sort === "travel") return b.travelSpend - a.travelSpend;
      return 0;
    });
  }, [all, filter, sort]);

  const totalSpend = displayed.reduce((s, e) => s + e.totalSpend, 0);
  const highest = displayed.length > 0 ? displayed[0].totalSpend : 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="MP Expenses"
          title="What MPs are claiming"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          IPSA published totals of MPs' staffing and business costs for {year}. Sorted by total spend —
          claims over <span className="text-flag font-mono">{fmtGBP(HIGH_THRESHOLD)}</span> are highlighted.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="MPs shown"
          value={fmtNumber(displayed.length)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Total spend"
          value={fmtGBP(totalSpend)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Highest total"
          value={fmtGBP(highest)}
          accent="flag"
          loading={q.isLoading}
        />
        <Stat
          label="Year"
          value={q.isLoading ? "—" : year}
          loading={q.isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by MP name or constituency…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <div className="flex gap-1 label-mono text-xs">
            {(["total", "office", "staffing", "accommodation", "travel"] as SortKey[]).map((s) => (
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
            Showing {displayed.length} of {all.length} MPs
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">MP</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Constituency</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">Office</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">Staffing</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Accommodation</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Travel</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-3 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!q.isLoading &&
                displayed.slice(0, 200).map((e, i) => {
                  const flagged = e.totalSpend >= HIGH_THRESHOLD;
                  return (
                    <tr key={i} className="border-t border-border hover:bg-surface-2/50">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {flagged && <FlagPill variant="warn">High</FlagPill>}
                          {e.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {e.constituency || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden lg:table-cell">
                        {fmtGBP(e.officeSpend)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden lg:table-cell">
                        {fmtGBP(e.staffingSpend)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                        {fmtGBP(e.accommodationSpend)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                        {fmtGBP(e.travelSpend)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${flagged ? "text-flag" : ""}`}>
                        {fmtGBP(e.totalSpend)}
                      </td>
                    </tr>
                  );
                })}
              {!q.isLoading && displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    {filter ? "No MPs match that filter." : "No expense data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!q.isLoading && displayed.length > 200 && (
          <div className="px-4 py-3 border-t border-border label-mono text-xs text-muted-foreground">
            Showing 200 of {fmtNumber(displayed.length)} MPs · use the filter to narrow down
          </div>
        )}
      </Card>

      <DataProvenance
        source="IPSA — Independent Parliamentary Standards Authority"
        url="https://www.theipsa.org.uk/mp-staffing-business-costs/annual-publications"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
