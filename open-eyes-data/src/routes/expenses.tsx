import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { fmtGBP, getJSON } from "@/lib/api";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "MP Expenses — transparenC" },
      { name: "description", content: "Searchable IPSA data on MP expense claims by name and category." },
      { property: "og:title", content: "MP Expenses — transparenC" },
    ],
  }),
  component: ExpensesPage,
});

type Expense = {
  MP_NAME?: string;
  CONSTITUENCY?: string;
  CATEGORY?: string;
  EXPENSE_TYPE?: string;
  AMOUNT_CLAIMED?: number;
  AMOUNT_PAID?: number;
  DATE?: string;
  YEAR?: string;
  SUPPLIER?: string;
};

const FLAG_THRESHOLD = 5_000;

function ExpensesPage() {
  const [mp, setMp] = useState("");
  const [category, setCategory] = useState("");
  const [submitted, setSubmitted] = useState({ mp: "", category: "" });
  const [sortDesc, setSortDesc] = useState(true);

  const q = useQuery({
    queryKey: ["expenses", submitted],
    queryFn: () => {
      const params = new URLSearchParams();
      if (submitted.mp) params.set("mp", submitted.mp);
      if (submitted.category) params.set("category", submitted.category);
      return getJSON<Expense[] | { value: Expense[] }>(`/api/expenses?${params.toString()}`);
    },
    staleTime: 5 * 60_000,
  });

  const items = useMemo(() => {
    const raw = q.data?.data;
    const list = Array.isArray(raw) ? raw : raw?.value ?? [];
    return [...list].sort((a, b) => {
      const av = a.AMOUNT_CLAIMED ?? 0;
      const bv = b.AMOUNT_CLAIMED ?? 0;
      return sortDesc ? bv - av : av - bv;
    });
  }, [q.data, sortDesc]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="MP Expenses"
          title="What MPs are claiming"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Search the IPSA database. Claims over <span className="text-flag font-mono">{fmtGBP(FLAG_THRESHOLD)}</span> are flagged for review.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted({ mp, category });
          }}
          className="grid sm:grid-cols-[1fr_1fr_auto] gap-2"
        >
          <input value={mp} onChange={(e) => setMp(e.target.value)} placeholder="MP name (e.g. Rishi Sunak)" className="bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Travel, Office Costs)" className="bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none" />
          <button type="submit" className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider">Search</button>
        </form>
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">MP</th>
                <th className="text-left px-4 py-3">Constituency</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3 cursor-pointer" onClick={() => setSortDesc((d) => !d)}>
                  Amount {sortDesc ? "↓" : "↑"}
                </th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                    ))}
                  </tr>
                ))}
              {!q.isLoading &&
                items.slice(0, 100).map((e, i) => {
                  const amount = e.AMOUNT_CLAIMED ?? 0;
                  const flagged = amount >= FLAG_THRESHOLD;
                  return (
                    <tr key={i} className="border-t border-border hover:bg-surface-2/50">
                      <td className="px-4 py-3 font-medium">{e.MP_NAME ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.CONSTITUENCY ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.CATEGORY ?? e.EXPENSE_TYPE ?? "—"}</td>
                      <td className="px-4 py-3 label-mono text-xs text-muted-foreground">{e.DATE ?? e.YEAR ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          {flagged && <FlagPill variant="warn">over {fmtGBP(FLAG_THRESHOLD)}</FlagPill>}
                          <span className={flagged ? "text-flag font-bold" : ""}>{fmtGBP(amount)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!q.isLoading && items.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No expense claims found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DataProvenance
        source="IPSA — Independent Parliamentary Standards Authority"
        url="https://www.theipsa.org.uk/"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}