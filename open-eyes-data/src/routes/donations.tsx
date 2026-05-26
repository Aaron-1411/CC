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
import { fmtGBP, fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/donations")({
  head: () => ({
    meta: [
      { title: "Political Donations Register — transparenC" },
      {
        name: "description",
        content:
          "Electoral Commission register of donations to UK political parties, updated regularly.",
      },
      { property: "og:title", content: "Political Donations Register — transparenC" },
    ],
  }),
  component: DonationsPage,
});

type Donation = {
  id: string;
  party: string;
  donor: string;
  donorStatus: string;
  amount: number;
  receivedDate: string;
  type: string;
  nature: string;
};

type DonationsResp = {
  donations: Donation[];
  totalResults: number;
  totalValue: number;
};

type SortKey = "amount" | "date" | "party" | "donor";

function pillFor(donorStatus: string): { variant: "direct" | "neutral" | "restricted"; label: string } {
  const s = (donorStatus ?? "").toLowerCase();
  if (s.includes("impermissible")) return { variant: "direct", label: "Impermissible" };
  if (s.includes("company")) return { variant: "neutral", label: "Company" };
  if (s.includes("individual")) return { variant: "neutral", label: "Individual" };
  if (s.includes("trust")) return { variant: "restricted", label: "Trust" };
  if (s.includes("unincorporated")) return { variant: "neutral", label: "Association" };
  return { variant: "neutral", label: donorStatus || "—" };
}

function DonationsPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("amount");

  const q = useQuery({
    queryKey: ["donations"],
    queryFn: () => getJSON<DonationsResp>("/api/donations"),
    staleTime: 30 * 60_000,
  });

  const all = q.data?.data.donations ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (d) =>
          d.party.toLowerCase().includes(f) ||
          d.donor.toLowerCase().includes(f) ||
          d.type.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "date")
        return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
      if (sort === "party") return a.party.localeCompare(b.party);
      if (sort === "donor") return a.donor.localeCompare(b.donor);
      return 0;
    });
  }, [all, filter, sort]);

  const totalValue = displayed.reduce((s, d) => s + d.amount, 0);
  const largest = displayed.length > 0 ? Math.max(...displayed.map((d) => d.amount)) : 0;
  const parties = new Set(displayed.map((d) => d.party)).size;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Electoral Commission"
          title="Political Donations Register"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          The Electoral Commission register of donations to UK regulated political parties and
          campaign groups. All donations above the reporting threshold must be declared. Data is
          updated regularly as returns are submitted.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Donations shown"
          value={fmtNumber(displayed.length)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Total value"
          value={fmtGBP(totalValue)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Largest donation"
          value={fmtGBP(largest)}
          accent="flag"
          loading={q.isLoading}
        />
        <Stat
          label="Parties"
          value={fmtNumber(parties)}
          loading={q.isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by party or donor name…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <div className="flex gap-1 label-mono text-xs">
            {(["amount", "date", "party", "donor"] as SortKey[]).map((s) => (
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
            Showing {displayed.length} of {all.length} donations ·{" "}
            {fmtGBP(totalValue)} total
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-5 w-2/3 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {!q.isLoading && displayed.map((d) => <DonationRow key={d.id} d={d} />)}
        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">
            {filter ? "No donations match that filter." : "No donation data available."}
          </div>
        )}
      </div>

      <DataProvenance
        source="Electoral Commission — Register of Donations"
        url="https://search.electoralcommission.org.uk/Search/Donations"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function DonationRow({ d }: { d: Donation }) {
  const pill = pillFor(d.donorStatus);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <FlagPill variant={pill.variant}>{pill.label}</FlagPill>
            {d.nature && d.nature !== "—" && d.nature !== d.type && (
              <FlagPill variant="neutral">{d.nature}</FlagPill>
            )}
          </div>
          <div className="font-display text-lg font-semibold leading-snug">
            {d.donor}
          </div>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            → <span className="text-amber">{d.party}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            {d.receivedDate ? relTime(d.receivedDate) : ""}
            {d.purpose ? ` · ${d.purpose}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-amber">
            {fmtGBP(d.amount)}
          </div>
        </div>
      </div>
    </Card>
  );
}
