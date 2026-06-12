import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, ErrorNote, LiveBadge, Skeleton } from "@/components/primitives";
import { fmtGBP, fmtNumber, getJSON, relTime } from "@/lib/api";
import { ISSUES, ISSUE_KEYS } from "@/data/issues";
import { PostcodeWidget } from "@/components/postcode-widget";
import { formatStatValue } from "@/contract/stats";
import { getSource } from "@/contract/sources";
import { TOTAL_TOOLS } from "@/data/tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "transparenC — UK Government Accountability" },
      {
        name: "description",
        content:
          "Live public data on UK government spending, party promises, parliament, lobbying, NHS performance and more.",
      },
      { property: "og:title", content: "transparenC — UK Gov Accountability" },
      {
        property: "og:description",
        content: "Holding government to account with live public data.",
      },
    ],
  }),
  component: HomePage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type PetitionsResp = { data: { attributes: { action: string; signature_count: number } }[] };
type BillsResp = { items: Array<{ billId: number; shortTitle: string; lastUpdate?: string }> };
type SearchResp = {
  results?: Array<{
    title?: string;
    organisationName?: string;
    awardedValue?: number;
    valueHigh?: number;
    valueLow?: number;
  }>;
  noticesData?: Array<{
    title?: string;
    organisationName?: string;
    awardedValue?: number;
    valueHigh?: number;
    valueLow?: number;
  }>;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <div className="space-y-14">
      <Hero />
      <LiveSnapshot />
      <IssueGrid />
      <TakeActionBanner />
      <PostcodeWidget />
      <BrowseTools />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-2">
      <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight max-w-2xl">
        The UK government, <span className="text-amber">held to account</span> with public data.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground text-base leading-relaxed">
        Live feeds from Parliament, the Electoral Commission, NHS England, the Environment Agency
        and more — surfaced in one place, free of spin.
      </p>
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
  useEffect(() => {
    contracts.mutate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const topPetition = (petitions.data?.data.data ?? []).reduce<{
    attributes: { action: string; signature_count: number };
  } | null>(
    (best, p) =>
      !best || p.attributes.signature_count > best.attributes.signature_count ? p : best,
    null,
  );
  const latestBill = (bills.data?.data.items ?? [])[0] ?? null;
  const contractResults = contracts.data?.data.results ?? contracts.data?.data.noticesData ?? [];
  const topContract = contractResults.reduce<(typeof contractResults)[number] | null>((best, c) => {
    const val = c.awardedValue ?? c.valueHigh ?? c.valueLow ?? 0;
    const bestVal = best ? (best.awardedValue ?? best.valueHigh ?? best.valueLow ?? 0) : -1;
    return val > bestVal ? c : best;
  }, null);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <LiveBadge timestamp={petitions.data?.meta.fetchedAt} />
          <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Three things happening right now
          </span>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Most signed petition
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
                View all →
              </Link>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Latest bill
          </div>
          {bills.isLoading && (
            <>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24 mt-1" />
            </>
          )}
          {bills.error && <ErrorNote>{(bills.error as Error).message}</ErrorNote>}
          {latestBill && (
            <>
              <div className="font-display text-xl font-bold text-amber leading-snug">
                {latestBill.shortTitle}
              </div>
              {latestBill.lastUpdate && (
                <p className="label-mono text-[10px] text-muted-foreground uppercase">
                  Updated {relTime(latestBill.lastUpdate)}
                </p>
              )}
              <Link
                to="/parliament"
                className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline mt-auto"
              >
                All bills →
              </Link>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Biggest recent contract
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
                {topContract.title ?? "Untitled"}
                {topContract.organisationName ? ` — ${topContract.organisationName}` : ""}
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
              <span className="text-2xl" aria-hidden="true">
                {def.icon}
              </span>
              <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-amber transition-colors leading-tight">
                {def.title}
              </span>
              <span className="text-[10px] text-muted-foreground/70 leading-snug line-clamp-2 group-hover:text-muted-foreground transition-colors">
                {def.question}
              </span>
              <span className="mt-auto flex flex-col items-center gap-0.5">
                <span className="font-display text-sm font-black text-amber/90 leading-none group-hover:text-amber transition-colors">
                  {formatStatValue(def.headlineStat)}
                </span>
                <span className="label-mono text-[8px] uppercase tracking-wider text-muted-foreground/60 leading-tight line-clamp-1">
                  {getSource(def.headlineStat.sourceId).name} ·{" "}
                  {new Date(def.headlineStat.asOf).getFullYear()}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* Quick briefing CTA */}
      <div className="rounded-lg border border-amber/20 bg-amber/5 p-5">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-2">
          AI Briefing
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Ask any question about UK government accountability — ministers named, real figures,
          department by department.
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

// ─── Take action banner ───────────────────────────────────────────────────────

function TakeActionBanner() {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber">
          Participation guide
        </div>
        <h2 className="font-display text-lg font-bold">
          Not sure how to use this? Or how to actually drive change?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A step-by-step guide for every age — from under-16 to 60+ — on how to engage, hold
          politicians accountable, and make your voice heard.
        </p>
      </div>
      <Link
        to="/take-action"
        className="shrink-0 px-5 py-2.5 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Take action →
      </Link>
    </section>
  );
}

// ─── Browse-all-tools card ────────────────────────────────────────────────────

function BrowseTools() {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {TOTAL_TOOLS} tools
        </div>
        <h2 className="font-display text-lg font-bold">Looking for something specific?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Contracts, donations, MP expenses, NHS performance, sewage, lobbying, FOI and more — the
          full directory in one place.
        </p>
      </div>
      <Link
        to="/tools"
        className="shrink-0 px-5 py-2.5 border border-amber/40 text-amber rounded label-mono text-xs uppercase tracking-wider hover:bg-amber/10 transition-colors whitespace-nowrap"
      >
        Browse all tools →
      </Link>
    </section>
  );
}
