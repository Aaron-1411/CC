import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { fmtGBP, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Government Contracts — transparenC" },
      { name: "description", content: "Search UK government contracts. Direct awards and no-tender deals flagged." },
      { property: "og:title", content: "UK Government Contracts — transparenC" },
    ],
  }),
  component: ContractsPage,
});

const PRESETS = ["direct award", "NHS", "defence", "consultancy", "IT", "Capita", "Serco", "Palantir"];

type Notice = {
  id?: string;
  noticeId?: string;
  title?: string;
  organisationName?: string;
  description?: string;
  valueLow?: number;
  valueHigh?: number;
  awardedValue?: number;
  awardedSupplier?: string;
  awardedDate?: string;
  publishedDate?: string;
  procedureType?: string;
  noticeType?: string;
  status?: string;
  link?: string;
};

type SearchResp = { results?: Notice[]; noticesData?: Notice[]; totalResults?: number };

function ContractsPage() {
  const [keyword, setKeyword] = useState("");
  const m = useMutation({
    mutationFn: (kw: string) =>
      getJSON<SearchResp>("/api/contracts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: kw, size: 25, page: 1 }),
      }),
  });

  useEffect(() => {
    m.mutate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = m.data?.data.results ?? m.data?.data.noticesData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Contracts Database"
          title="Where the money goes"
          right={<LiveBadge timestamp={m.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Live search of UK government contracts via Contracts Finder. Direct awards and
          restricted procedures are flagged — they are legal but skip the open-tender process.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate(keyword);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search contract titles, suppliers, departments…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider hover:opacity-90"
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setKeyword(p);
                m.mutate(p);
              }}
              className="px-2.5 py-1 text-xs label-mono uppercase tracking-wider bg-surface-2 hover:bg-amber/10 hover:text-amber rounded border border-border"
            >
              {p}
            </button>
          ))}
        </div>
      </Card>

      {m.error && <ErrorNote>{(m.error as Error).message}</ErrorNote>}

      <div className="grid gap-3">
        {m.isPending
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-5 w-2/3 mb-2" /><Skeleton className="h-3 w-full" /></Card>
            ))
          : results.map((n, i) => <NoticeRow key={n.id ?? n.noticeId ?? i} n={n} />)}
        {!m.isPending && results.length === 0 && !m.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">No contracts found.</div>
        )}
      </div>

      <DataProvenance
        source="Contracts Finder — Cabinet Office"
        url="https://www.contractsfinder.service.gov.uk"
        fetchedAt={m.data?.meta.fetchedAt}
      />
    </div>
  );
}

function flagFor(proc?: string): { variant: "direct" | "no-tender" | "restricted" | "open" | "neutral"; label: string } {
  const p = (proc ?? "").toLowerCase();
  if (p.includes("direct")) return { variant: "direct", label: "Direct award" };
  if (p.includes("no")) return { variant: "no-tender", label: "No tender" };
  if (p.includes("restricted")) return { variant: "restricted", label: "Restricted" };
  if (p.includes("open")) return { variant: "open", label: "Open tender" };
  return { variant: "neutral", label: proc ?? "—" };
}

function NoticeRow({ n }: { n: Notice }) {
  const f = flagFor(n.procedureType);
  const value = n.awardedValue ?? n.valueHigh ?? n.valueLow;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <FlagPill variant={f.variant}>{f.label}</FlagPill>
            {n.noticeType && <FlagPill variant="neutral">{n.noticeType}</FlagPill>}
            {n.status && <FlagPill variant="neutral">{n.status}</FlagPill>}
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">{n.title ?? "Untitled notice"}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            <span className="text-foreground">{n.organisationName ?? "—"}</span>
            {n.awardedSupplier && <> → <span className="text-amber">{n.awardedSupplier}</span></>}
          </div>
          {n.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-amber">{fmtGBP(value)}</div>
          <div className="label-mono text-[10px] uppercase text-muted-foreground">
            {n.awardedDate ? `awarded ${relTime(n.awardedDate)}` : n.publishedDate ? `published ${relTime(n.publishedDate)}` : ""}
          </div>
        </div>
      </div>
    </Card>
  );
}