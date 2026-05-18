import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, DataProvenance, ErrorNote, LiveBadge, SectionHeader, Skeleton, Stat } from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";
import { Markdown } from "@/components/markdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "transparenC — Live UK Government Accountability" },
      {
        name: "description",
        content:
          "Live dashboard of UK petitions, bills, government contracts, MP expenses and AI accountability briefings.",
      },
      { property: "og:title", content: "transparenC — UK Gov Accountability" },
      { property: "og:description", content: "Holding government to account with live public data." },
    ],
  }),
  component: HomePage,
});

type Kpi = { label: string; value: string; period: string; source: string };
type PetitionsResp = {
  data: { attributes: { signature_count: number } }[];
};

function HomePage() {
  const kpis = useQuery({
    queryKey: ["kpis"],
    queryFn: () => getJSON<{ kpis: Kpi[] }>("/api/kpis"),
    staleTime: 5 * 60_000,
  });
  const petitions = useQuery({
    queryKey: ["petitions-count"],
    queryFn: () => getJSON<PetitionsResp>("/api/petitions?state=open&page=1"),
    staleTime: 60_000,
  });
  const totalSignaturesOnPage = (petitions.data?.data.data ?? []).reduce(
    (s, p) => s + (p.attributes.signature_count ?? 0),
    0,
  );

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center gap-3 mb-3">
          <LiveBadge timestamp={kpis.data?.meta.fetchedAt ?? petitions.data?.meta.fetchedAt} />
          <span className="label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            UK · public data
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
          Holding the UK government <span className="text-amber">to account</span>,
          one data point at a time.
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground text-lg">
          transparenC pulls live public data from Parliament, Contracts Finder, IPSA
          and other open sources to show you what's actually happening — petitions
          gathering steam, bills moving through the Commons, contracts awarded
          without tender, and money spent in your name.
        </p>
      </section>

      <section>
        <SectionHeader
          eyebrow="Headline indicators"
          title="The state of the nation, today"
          right={<LiveBadge timestamp={kpis.data?.meta.fetchedAt} />}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border bg-surface rounded-lg p-4">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40 mt-2" />
                </div>
              ))
            : (kpis.data?.data.kpis ?? []).map((k, i) => (
                <Stat
                  key={i}
                  label={k.label}
                  value={k.value}
                  accent={i % 3 === 0 ? "amber" : i % 3 === 1 ? "flag" : "ok"}
                  hint={`${k.period} · ${k.source}`}
                />
              ))}
          <Stat
            label="Top petitions · signatures"
            value={fmtNumber(totalSignaturesOnPage)}
            accent="amber"
            hint={`${petitions.data?.data.data.length ?? 0} open petitions · page 1`}
            loading={petitions.isLoading}
          />
        </div>
        {kpis.error && <div className="mt-3"><ErrorNote>{(kpis.error as Error).message}</ErrorNote></div>}
        <DataProvenance
          source="Lovable AI · synthesised from ONS, NHS England, OBR, Home Office"
          url="https://ai.gateway.lovable.dev"
          licence="AI-synthesised; verify with primary sources"
          fetchedAt={kpis.data?.meta.fetchedAt}
        />
      </section>

      <TopStories />

      <section>
        <SectionHeader eyebrow="Investigate" title="Pick a thread to pull" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NavCard to="/petitions" eyebrow="Petitions" title="What the public is demanding" copy="Open petitions sorted by signatures, with progress to the 10k response and 100k debate thresholds." />
          <NavCard to="/contracts" eyebrow="Contracts" title="Where the money goes" copy="Search government contracts. Direct awards and no-tender deals flagged in red." />
          <NavCard to="/parliament" eyebrow="Parliament" title="Bills in motion" copy="Active legislation, current stage, last updated — straight from the Bills API." />
          <NavCard to="/expenses" eyebrow="Expenses" title="What MPs are claiming" copy="IPSA expense data, searchable by MP, constituency and category." />
          <NavCard to="/briefing" eyebrow="AI Briefing" title="Ask the dashboard" copy="Generate a non-partisan briefing on any UK accountability topic." />
        </div>
      </section>
    </div>
  );
}

function NavCard({ to, eyebrow, title, copy }: { to: string; eyebrow: string; title: string; copy: string }) {
  return (
    <Link
      to={to}
      className="group block bg-surface border border-border rounded-lg p-5 hover:border-amber/50 hover:bg-surface-2 transition-colors"
    >
      <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">{eyebrow}</div>
      <h3 className="font-display text-xl font-bold mt-1 group-hover:text-amber transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{copy}</p>
    </Link>
  );
}

function TopStories() {
  const [topic] = useState(
    "The biggest current UK government accountability stories this week — major scandals, overspends, contract controversies or policy failures.",
  );
  const q = useQuery({
    queryKey: ["top-stories"],
    queryFn: async () =>
      getJSON<{ markdown: string }>("/api/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      }),
    staleTime: 30 * 60_000,
  });
  return (
    <section>
      <SectionHeader
        eyebrow="AI accountability briefing"
        title="Top stories right now"
        right={<LiveBadge timestamp={q.data?.meta.fetchedAt} label="AI" />}
      />
      <Card>
        {q.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        )}
        {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}
        {q.data && (
          <div className="text-[15px] leading-7">
            <Markdown source={q.data.data.markdown} />
          </div>
        )}
        <DataProvenance
          source="Lovable AI Gateway (Gemini)"
          url="https://ai.gateway.lovable.dev"
          licence="AI-generated; verify against primary sources"
          fetchedAt={q.data?.meta.fetchedAt}
        />
      </Card>
    </section>
  );
}
