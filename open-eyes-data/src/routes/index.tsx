import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, ErrorNote, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { fmtGBP, fmtNumber, getJSON, relTime } from "@/lib/api";
import { ISSUES, ISSUE_KEYS } from "@/data/issues";
import { PostcodeWidget } from "@/components/postcode-widget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "transparenC — UK Government Accountability" },
      { name: "description", content: "Live public data on UK government spending, party promises, parliament, lobbying, NHS performance and more." },
      { property: "og:title", content: "transparenC — UK Gov Accountability" },
      { property: "og:description", content: "Holding government to account with live public data." },
    ],
  }),
  component: HomePage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type PetitionsResp = { data: { attributes: { action: string; signature_count: number } }[] };
type BillsResp = { items: Array<{ billId: number; shortTitle: string; lastUpdate?: string }> };
type SearchResp = {
  results?: Array<{ title?: string; organisationName?: string; awardedValue?: number; valueHigh?: number; valueLow?: number }>;
  noticesData?: Array<{ title?: string; organisationName?: string; awardedValue?: number; valueHigh?: number; valueLow?: number }>;
};

// ─── Tool groups ─────────────────────────────────────────────────────────────

const TOOL_GROUPS = [
  {
    id: "landscape",
    eyebrow: "Today's picture",
    title: "What's happening & what was promised",
    description: "Know the political landscape before diving into the data.",
    tools: [
      { to: "/parties", eyebrow: "Parties & Promises", title: "Are they keeping their word?", copy: "Track every UK party pledge on NHS, Housing, Economy, Crime, Environment, Immigration and Education — with real delivery status." },
      { to: "/news", eyebrow: "News", title: "What the media is covering", copy: "UK news ranked by how many outlets are covering each story. Filter by issue to see what's dominating each area." },
      { to: "/petitions", eyebrow: "Petitions", title: "What the public is demanding", copy: "Open petitions sorted by signatures, with progress to the 10k response and 100k debate thresholds." },
    ],
  },
  {
    id: "democracy",
    eyebrow: "Democracy in motion",
    title: "Parliament, votes & legislation",
    description: "What's being passed, who voted which way, and what it means.",
    tools: [
      { to: "/parliament", eyebrow: "Bills", title: "Legislation in motion", copy: "Every active bill — current stage, last updated — straight from the Parliament Bills API." },
      { to: "/votes", eyebrow: "Votes", title: "How MPs actually vote", copy: "Every House of Commons division live from Parliament. See the ayes, noes, and which way it went." },
    ],
  },
  {
    id: "economy",
    eyebrow: "The economic scorecard",
    title: "How is the economy actually performing?",
    description: "Live ONS data — the numbers behind the political debate.",
    tools: [
      { to: "/economy", eyebrow: "Indicators", title: "GDP, inflation, wages & debt", copy: "Live ONS time-series: GDP growth, CPI, unemployment, real wages, government deficit and national debt — the full scorecard." },
      { to: "/spending", eyebrow: "Public spending", title: "Where your £1.2 trillion goes", copy: "HM Treasury PESA data — total managed expenditure by government department. Health, welfare, defence, education." },
    ],
  },
  {
    id: "money",
    eyebrow: "Follow the money",
    title: "Contracts, donations & influence",
    description: "Where public money goes, who funds parties, and who has access.",
    tools: [
      { to: "/contracts", eyebrow: "Contracts", title: "Top recipients & direct awards", copy: "Every contract over £1m — including aggregated view of top suppliers, procedure breakdowns, and direct awards flagged." },
      { to: "/donations", eyebrow: "Donations", title: "Who funds the parties", copy: "The Electoral Commission register of donations. See who is bankrolling which party and by how much." },
      { to: "/expenses", eyebrow: "Expenses", title: "What MPs are claiming", copy: "IPSA 2024-25 expense totals per MP — sorted by total spend, filterable by name or constituency." },
      { to: "/meetings", eyebrow: "Ministers", title: "Who ministers are meeting", copy: "Quarterly returns showing which companies and lobbyists are getting access to government ministers." },
      { to: "/lobbying", eyebrow: "Lobbying", title: "Paid influence register", copy: "Organisations legally required to disclose paid lobbying activity — who's paying whom to lobby government." },
      { to: "/acoba", eyebrow: "Revolving Door", title: "Ministers into private sector", copy: "Every case of a minister or senior official moving into a private sector role connected to their government work." },
    ],
  },
  {
    id: "services",
    eyebrow: "Public services",
    title: "NHS, environment, policing & welfare",
    description: "Real-world data on the services that affect everyone.",
    tools: [
      { to: "/nhs", eyebrow: "NHS", title: "Waiting times & performance", copy: "A&E four-hour target (last hit: never since 2015), waiting lists, and latest NHS England statistics." },
      { to: "/sewage", eyebrow: "Sewage", title: "Water companies dumping raw sewage", copy: "Environment Agency EDM data — how many hours each water company spilled untreated sewage into rivers and seas in 2024." },
      { to: "/stop-search", eyebrow: "Stop & Search", title: "Racial disparity in policing", copy: "Every stop and search in England and Wales, broken down by ethnicity, outcome and force." },
      { to: "/sanctions", eyebrow: "Sanctions", title: "Benefits conditionality", copy: "DWP Universal Credit sanctions data. Critics argue the system disproportionately harms the most vulnerable." },
      { to: "/foi", eyebrow: "FOI", title: "Freedom of Information refusals", copy: "Which public bodies refuse the most requests? The Cabinet Office league table of withheld information." },
    ],
  },
  {
    id: "investigate",
    eyebrow: "Investigate",
    title: "Connect the dots",
    description: "Power tools for cross-referencing data and generating briefings.",
    tools: [
      { to: "/crossref", eyebrow: "Cross-reference", title: "Follow the money — in depth", copy: "Search a company or person across contracts, donations, ACOBA and the lobbying register at once." },
      { to: "/briefing", eyebrow: "AI Briefing", title: "Ask about any UK issue", copy: "Generate a non-partisan briefing on any UK accountability topic — ministers named, real figures, department by department." },
      { to: "/projects", eyebrow: "Major Projects", title: "HS2, Hinkley & beyond", copy: "Every IPA Government Major Projects Portfolio entry — budget, delivery confidence RAG status, and named department." },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <div className="space-y-16">
      <Hero />
      <PostcodeWidget />
      <IssueGrid />
      <LiveSnapshot />
      {TOOL_GROUPS.map((group) => (
        <ToolGroup key={group.id} group={group} />
      ))}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-2">
      <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight max-w-2xl">
        The UK government,{" "}
        <span className="text-amber">held to account</span>{" "}
        with public data.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground text-base leading-relaxed">
        Live feeds from Parliament, the Electoral Commission, NHS England, the Environment Agency
        and more — surfaced in one place, free of spin.
      </p>
    </section>
  );
}

// ─── Issue grid ───────────────────────────────────────────────────────────────

function IssueGrid() {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  return (
    <section className="space-y-5">
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Explore by issue
        </div>
        <h2 className="font-display text-2xl font-bold">What do you want to understand?</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl">
          Pick an issue to see the data, what parties promised, and how to take action.
        </p>
      </div>

      {/* Issue chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ISSUE_KEYS.map((key) => {
          const def = ISSUES[key];
          return (
            <Link
              key={key}
              to="/issues/$issue"
              params={{ issue: key }}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 hover:border-amber/50 hover:bg-surface-2 transition-colors text-center"
            >
              <span className="text-2xl">{def.icon}</span>
              <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-amber transition-colors leading-tight">
                {def.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Quick briefing CTA */}
      <div className="rounded-lg border border-amber/20 bg-amber/5 p-5">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-2">AI Briefing</div>
        <p className="text-sm text-muted-foreground mb-3">
          Ask any question about UK government accountability — ministers named, real figures, department by department.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) {
              router.navigate({ to: "/briefing", search: { topic: topic.trim() } });
            }
          }}
          className="flex gap-2"
        >
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. NHS waiting list progress, HS2 overspend, asylum backlog…"
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={topic.trim().length < 2}
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider disabled:opacity-50 shrink-0"
          >
            Ask →
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── Live snapshot ────────────────────────────────────────────────────────────

function LiveSnapshot() {
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
  useEffect(() => { contracts.mutate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const topPetition = (petitions.data?.data.data ?? []).reduce<{ attributes: { action: string; signature_count: number } } | null>(
    (best, p) => (!best || p.attributes.signature_count > best.attributes.signature_count ? p : best),
    null,
  );
  const latestBill = (bills.data?.data.items ?? [])[0] ?? null;
  const contractResults = contracts.data?.data.results ?? contracts.data?.data.noticesData ?? [];
  const topContract = contractResults.reduce<typeof contractResults[number] | null>((best, c) => {
    const val = c.awardedValue ?? c.valueHigh ?? c.valueLow ?? 0;
    const bestVal = best ? (best.awardedValue ?? best.valueHigh ?? best.valueLow ?? 0) : -1;
    return val > bestVal ? c : best;
  }, null);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <LiveBadge timestamp={petitions.data?.meta.fetchedAt} />
        <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Right now</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">Most signed petition</div>
          {petitions.isLoading && <><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-full" /></>}
          {petitions.error && <ErrorNote>{(petitions.error as Error).message}</ErrorNote>}
          {topPetition && (
            <>
              <div className="font-display text-3xl font-bold text-amber">{fmtNumber(topPetition.attributes.signature_count)}</div>
              <p className="text-sm text-muted-foreground leading-snug flex-1">{topPetition.attributes.action}</p>
              <Link to="/petitions" className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline">View all →</Link>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">Latest bill</div>
          {bills.isLoading && <><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-24 mt-1" /></>}
          {bills.error && <ErrorNote>{(bills.error as Error).message}</ErrorNote>}
          {latestBill && (
            <>
              <div className="font-display text-xl font-bold text-amber leading-snug">{latestBill.shortTitle}</div>
              {latestBill.lastUpdate && <p className="label-mono text-[10px] text-muted-foreground uppercase">Updated {relTime(latestBill.lastUpdate)}</p>}
              <Link to="/parliament" className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline mt-auto">All bills →</Link>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">Biggest recent contract</div>
          {contracts.isPending && <><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-full" /></>}
          {contracts.error && <ErrorNote>{(contracts.error as Error).message}</ErrorNote>}
          {topContract && (
            <>
              <div className="font-display text-3xl font-bold text-amber">{fmtGBP(topContract.awardedValue ?? topContract.valueHigh ?? topContract.valueLow)}</div>
              <p className="text-sm text-muted-foreground leading-snug flex-1 line-clamp-2">
                {topContract.title ?? "Untitled"}{topContract.organisationName ? ` — ${topContract.organisationName}` : ""}
              </p>
              <Link to="/contracts" className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline">Search contracts →</Link>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

// ─── Tool group ───────────────────────────────────────────────────────────────

type ToolGroupDef = typeof TOOL_GROUPS[number];

function ToolGroup({ group }: { group: ToolGroupDef }) {
  return (
    <section>
      <SectionHeader eyebrow={group.eyebrow} title={group.title} />
      {group.description && (
        <p className="text-muted-foreground text-sm mb-4 -mt-2 max-w-xl">{group.description}</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.tools.map((tool) => (
          <NavCard key={tool.to} {...tool} />
        ))}
      </div>
    </section>
  );
}

function NavCard({ to, eyebrow, title, copy }: { to: string; eyebrow: string; title: string; copy: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col bg-surface border border-border rounded-lg p-5 hover:border-amber/40 hover:bg-surface-2 transition-colors"
    >
      <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">{eyebrow}</div>
      <h3 className="font-display text-lg font-bold mt-1 group-hover:text-amber transition-colors leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{copy}</p>
    </Link>
  );
}
