import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, DataProvenance, ErrorNote, LiveBadge, SectionHeader, Skeleton, Stat } from "@/components/primitives";
import { fmtGBP, fmtNumber, getJSON, relTime } from "@/lib/api";

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
  data: { attributes: { action: string; signature_count: number; url: string } }[];
};
type BillsResp = { items: Array<{ billId: number; shortTitle: string; lastUpdate?: string }> };
type SearchResp = { results?: Array<{ title?: string; organisationName?: string; awardedValue?: number; valueHigh?: number; valueLow?: number }>; noticesData?: Array<{ title?: string; organisationName?: string; awardedValue?: number; valueHigh?: number; valueLow?: number }> };

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

      <DataSnapshot />

      <section>
        <SectionHeader eyebrow="Investigate" title="Pick a thread to pull" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NavCard to="/petitions" eyebrow="Petitions" title="What the public is demanding" copy="Open petitions sorted by signatures, with progress to the 10k response and 100k debate thresholds." />
          <NavCard to="/contracts" eyebrow="Contracts" title="Where the money goes" copy="Every government contract over £1m in the last 10 months. Direct awards and no-tender deals flagged in red." />
          <NavCard to="/donations" eyebrow="Donations" title="Political party funding" copy="The Electoral Commission register of donations to UK political parties. See who is bankrolling whom." />
          <NavCard to="/parliament" eyebrow="Parliament" title="Bills in motion" copy="Active legislation, current stage, last updated — straight from the Bills API." />
          <NavCard to="/votes" eyebrow="Votes" title="How MPs actually vote" copy="Every House of Commons division live from Parliament. See the ayes, noes, and which way it went." />
          <NavCard to="/expenses" eyebrow="Expenses" title="What MPs are claiming" copy="IPSA expense data, searchable by MP, constituency and category." />
          <NavCard to="/meetings" eyebrow="Ministers" title="Who ministers are meeting" copy="Quarterly transparency returns showing which companies and lobbyists are getting access to government ministers." />
          <NavCard to="/lobbying" eyebrow="Lobbying" title="Who is paid to influence ministers" copy="The statutory register of consultant lobbyists — organisations legally required to disclose paid lobbying activity." />
          <NavCard to="/acoba" eyebrow="Revolving Door" title="Ministers into private sector" copy="ACOBA publishes every case of a minister or senior official taking a private sector role linked to their government work." />
          <NavCard to="/stop-search" eyebrow="Stop & Search" title="Racial disparity in policing" copy="Every stop and search logged in England and Wales, broken down by ethnicity, outcome and force. The data reveals stark racial disparities." />
          <NavCard to="/nhs" eyebrow="NHS" title="Waiting times & performance" copy="A&E four-hour target performance, waiting lists, and latest published NHS England statistics." />
          <NavCard to="/sewage" eyebrow="Sewage" title="Water companies dumping sewage" copy="Environment Agency data on storm overflow events — how many hours each water company spilled raw sewage into rivers and seas." />
          <NavCard to="/sanctions" eyebrow="Sanctions" title="Benefits cuts & conditionality" copy="DWP benefit sanctions applied to Universal Credit claimants. Critics argue the system disproportionately harms the most vulnerable." />
          <NavCard to="/foi" eyebrow="FOI" title="Freedom of Information refusals" copy="Which public bodies refuse the most information requests? The WhatDoTheyKnow refusal league table." />
          <NavCard to="/parties" eyebrow="Parties & Promises" title="Are they keeping their word?" copy="Track UK party pledges on NHS, Housing, Economy, Crime, Environment, Immigration and Education — with real status on each promise." />
          <NavCard to="/news" eyebrow="Impartial News" title="What the media is covering" copy="UK news ranked by multi-outlet coverage. Stories reported across more sources rise to the top. Filter by issue." />
          <NavCard to="/crossref" eyebrow="Xref" title="Follow the money — cross-reference" copy="Search a company or person across contracts, donations, the lobbying register and the revolving door simultaneously." />
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

function DataSnapshot() {
  const petitions = useQuery({
    queryKey: ["petitions-snapshot"],
    queryFn: () => getJSON<PetitionsResp>("/api/petitions?state=open&page=1"),
    staleTime: 5 * 60_000,
  });
  const bills = useQuery({
    queryKey: ["bills-snapshot"],
    queryFn: () => getJSON<BillsResp>("/api/bills?take=5"),
    staleTime: 5 * 60_000,
  });
  const contracts = useMutation({
    mutationFn: () =>
      getJSON<SearchResp>("/api/contracts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: "", size: 25, page: 1 }),
      }),
  });
  useEffect(() => {
    contracts.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topPetition = (petitions.data?.data.data ?? []).reduce<
    { attributes: { action: string; signature_count: number; url: string } } | null
  >((best, p) => {
    if (!best || p.attributes.signature_count > best.attributes.signature_count) return p;
    return best;
  }, null);

  const latestBill = (bills.data?.data.items ?? [])[0] ?? null;

  const contractResults = contracts.data?.data.results ?? contracts.data?.data.noticesData ?? [];
  const topContract = contractResults.reduce<typeof contractResults[number] | null>((best, c) => {
    const val = c.awardedValue ?? c.valueHigh ?? c.valueLow ?? 0;
    const bestVal = best ? (best.awardedValue ?? best.valueHigh ?? best.valueLow ?? 0) : -1;
    return val > bestVal ? c : best;
  }, null);

  return (
    <section>
      <SectionHeader eyebrow="Live snapshot" title="Real data, right now" />
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Top petition */}
        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Most Signed Petition
          </div>
          {petitions.isLoading && (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </>
          )}
          {petitions.error && <ErrorNote>{(petitions.error as Error).message}</ErrorNote>}
          {topPetition && (
            <>
              <div className="font-display text-3xl font-bold text-amber">
                {fmtNumber(topPetition.attributes.signature_count)}
              </div>
              <p className="text-sm text-muted-foreground leading-snug flex-1">
                {topPetition.attributes.action}
              </p>
              <Link
                to="/petitions"
                className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
              >
                View all petitions →
              </Link>
            </>
          )}
        </Card>

        {/* Latest bill */}
        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Latest Bill
          </div>
          {bills.isLoading && (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </>
          )}
          {bills.error && <ErrorNote>{(bills.error as Error).message}</ErrorNote>}
          {latestBill && (
            <>
              <div className="font-display text-xl font-bold text-amber leading-snug">
                {latestBill.shortTitle}
              </div>
              {latestBill.lastUpdate && (
                <p className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Updated {relTime(latestBill.lastUpdate)}
                </p>
              )}
              <Link
                to="/parliament"
                className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline mt-auto"
              >
                View all bills →
              </Link>
            </>
          )}
        </Card>

        {/* Biggest recent contract */}
        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Biggest Recent Contract
          </div>
          {contracts.isPending && (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </>
          )}
          {contracts.error && <ErrorNote>{(contracts.error as Error).message}</ErrorNote>}
          {topContract && (
            <>
              <div className="font-display text-3xl font-bold text-amber">
                {fmtGBP(topContract.awardedValue ?? topContract.valueHigh ?? topContract.valueLow)}
              </div>
              <p className="text-sm text-muted-foreground leading-snug flex-1 line-clamp-2">
                {topContract.title ?? "Untitled"}{topContract.organisationName ? ` — ${topContract.organisationName}` : ""}
              </p>
              <Link
                to="/contracts"
                className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
              >
                Search contracts →
              </Link>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
