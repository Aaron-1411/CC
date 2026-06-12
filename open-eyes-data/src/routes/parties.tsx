import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";
import { toPledgeStatus } from "@/data/parties";
import type { Issue, Party, PartyPromise, PromiseStatus } from "@/data/parties";
import { PLEDGE_STATUS_META } from "@/contract/pledges";

const slugIssue = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Recompute a pledge's stable permalink id from the party's full (unfiltered)
 * pledge list, matching the scheme in data/parties.ts ALL_PLEDGES.
 */
function pledgeId(partyId: string, fullList: PartyPromise[], pledge: PartyPromise): string {
  const idx = fullList.indexOf(pledge);
  let n = 0;
  for (let i = 0; i <= idx; i++) if (fullList[i].issue === pledge.issue) n++;
  return `${partyId}-${slugIssue(pledge.issue)}-${n}`;
}

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Parties & Promises — transparenC" },
      {
        name: "description",
        content:
          "Track UK political party pledges on NHS, Housing, Economy, Crime, Environment, Immigration and Education. See what was promised and what has been delivered.",
      },
      { property: "og:title", content: "Parties & Promises — transparenC" },
    ],
  }),
  component: PartiesPage,
});

const ISSUES: Issue[] = [
  "NHS",
  "Housing",
  "Economy",
  "Crime",
  "Environment",
  "Immigration",
  "Education",
];

type PartiesData = {
  parties: Party[];
  pledges: Record<string, PartyPromise[]>;
};

function statusVariant(status: PromiseStatus): React.ComponentProps<typeof FlagPill>["variant"] {
  switch (status) {
    case "done":
      return "ok";
    case "in-progress":
      return "neutral";
    case "behind-target":
      return "warn";
    case "stalled":
      return "direct";
    case "contested":
      return "warn";
    case "proposed":
      return "neutral";
    default:
      return "neutral";
  }
}

function statusLabel(status: PromiseStatus): string {
  switch (status) {
    case "done":
      return "Done";
    case "in-progress":
      return "In progress";
    case "behind-target":
      return "Behind target";
    case "stalled":
      return "Stalled";
    case "contested":
      return "Contested";
    case "proposed":
      return "Proposed";
  }
}

function CoverageBar({ parties }: { parties: Party[] }) {
  const totalSeats = parties.reduce((s, p) => s + p.seats, 0);

  return (
    <div className="space-y-4">
      {/* Seat share */}
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Current seat share — {totalSeats} seats shown
        </div>
        <div className="flex h-5 rounded overflow-hidden gap-px">
          {parties.map((p) => (
            <div
              key={p.id}
              title={`${p.name}: ${p.seats} seats (${((p.seats / 650) * 100).toFixed(1)}%)`}
              style={{
                width: `${(p.seats / 650) * 100}%`,
                backgroundColor: p.colour,
              }}
              className="shrink-0"
            />
          ))}
          {/* empty seats */}
          <div
            title="Other / vacant"
            style={{ width: `${((650 - totalSeats) / 650) * 100}%` }}
            className="shrink-0 bg-border"
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {parties.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: p.colour }}
              />
              <span className="label-mono text-[10px] text-muted-foreground">
                {p.name}: {p.seats}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live data callouts per issue ────────────────────────────────────────────

type NHSStats = {
  stats: Array<{ label: string; value: string; target?: string; context: string }>;
};
type SewageData = { totalHours: number; totalCount: number; year: number };
type StopSearchData =
  | { totalStops: number; year?: string }
  | Array<{ month: string; stops?: number }>;

function LiveDataCallout({ issue }: { issue: Issue | "All" }) {
  const nhsQ = useQuery({
    queryKey: ["nhs-live"],
    queryFn: () => getJSON<NHSStats>("/api/nhs"),
    staleTime: 60 * 60_000,
    enabled: issue === "NHS" || issue === "All",
  });
  const sewageQ = useQuery({
    queryKey: ["sewage-live-summary"],
    queryFn: () => getJSON<SewageData>("/api/sewage"),
    staleTime: 24 * 60 * 60_000,
    enabled: issue === "Environment" || issue === "All",
  });
  const stopQ = useQuery({
    queryKey: ["stop-search-live"],
    queryFn: () => getJSON<StopSearchData>("/api/stop-search"),
    staleTime: 60 * 60_000,
    enabled: issue === "Crime" || issue === "All",
  });

  const stats: Array<{ label: string; value: string; sub?: string; to: string }> = [];

  if ((issue === "NHS" || issue === "All") && nhsQ.data) {
    const ae = nhsQ.data.data.stats?.find((s) => s.label.includes("4-hour"));
    if (ae)
      stats.push({
        label: "A&E 4h target",
        value: ae.value,
        sub: `target ${ae.target ?? "95%"}`,
        to: "/nhs",
      });
  }
  if ((issue === "Environment" || issue === "All") && sewageQ.data) {
    const d = sewageQ.data.data;
    const hrs = typeof d.totalHours === "number" ? d.totalHours : 0;
    stats.push({
      label: `Sewage spill hours (${(d as SewageData).year ?? 2024})`,
      value: fmtNumber(Math.round(hrs)),
      sub: `${fmtNumber((d as SewageData).totalCount)} events`,
      to: "/sewage",
    });
  }
  if ((issue === "Crime" || issue === "All") && stopQ.data) {
    const raw = stopQ.data.data;
    // raw could be an array of monthly records or a summary object
    let total = 0;
    if (Array.isArray(raw)) {
      total = (raw as Array<{ stops?: number }>).reduce((s, m) => s + (m.stops ?? 0), 0);
    } else if (typeof (raw as { totalStops?: number }).totalStops === "number") {
      total = (raw as { totalStops: number }).totalStops;
    }
    if (total > 0)
      stats.push({
        label: "Stop & search (latest year)",
        value: fmtNumber(total),
        sub: "England & Wales",
        to: "/stop-search",
      });
  }

  if (stats.length === 0) return null;

  return (
    <Card className="border-amber/20 bg-amber/5">
      <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-3">
        Live data · what the numbers actually say
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="group">
            <div className="text-2xl font-display font-bold text-amber group-hover:opacity-80 transition-opacity">
              {s.value}
            </div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
            {s.sub && <div className="label-mono text-[10px] text-muted-foreground">{s.sub}</div>}
            <div className="label-mono text-[10px] text-amber/70 mt-1 group-hover:text-amber transition-colors">
              See full data →
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function PartiesPage() {
  const [activeIssue, setActiveIssue] = useState<Issue | "All">("All");

  const q = useQuery({
    queryKey: ["parties"],
    queryFn: () => getJSON<PartiesData>("/api/parties"),
    staleTime: 24 * 60 * 60_000,
  });

  const parties: Party[] = (q.data?.data.parties ?? [])
    .filter((p) => p.seats > 0)
    .sort((a, b) => b.seats - a.seats);

  const pledges: Record<string, PartyPromise[]> = q.data?.data.pledges ?? {};

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="UK Politics 2026"
          title="Parties & Promises"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          How are the UK's political parties performing against their own pledges? Track commitments
          on the issues that matter most — from NHS waiting lists to net migration and the housing
          crisis.
        </p>
      </div>

      {q.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!q.isLoading && parties.length > 0 && (
        <Card>
          <CoverageBar parties={parties} />
        </Card>
      )}

      {/* Issue filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...ISSUES] as (Issue | "All")[]).map((issue) => (
          <button
            key={issue}
            onClick={() => setActiveIssue(issue)}
            className={[
              "px-3 py-1.5 rounded text-[11px] label-mono uppercase tracking-wider border transition-colors",
              activeIssue === issue
                ? "bg-amber/10 border-amber/40 text-amber"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-surface",
            ].join(" ")}
          >
            {issue}
          </button>
        ))}
      </div>

      {/* Live data callout */}
      <LiveDataCallout issue={activeIssue} />

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Party cards */}
      <div className="space-y-5">
        {q.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </Card>
          ))}

        {!q.isLoading &&
          parties.map((party) => {
            const partyPledges = pledges[party.id] ?? [];
            const filtered =
              activeIssue === "All"
                ? partyPledges
                : partyPledges.filter((p) => p.issue === activeIssue);

            if (filtered.length === 0) return null;

            return (
              <Card key={party.id}>
                {/* Party header */}
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: party.colour }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-bold">{party.name}</h3>
                      <span
                        className="label-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${party.colour}20`,
                          color: party.colour,
                          border: `1px solid ${party.colour}40`,
                        }}
                      >
                        {party.ideology}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Leader: {party.leader}
                      </span>
                      <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        · {party.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <div className="text-right">
                      <div
                        className="font-display text-2xl font-bold"
                        style={{ color: party.colour }}
                      >
                        {party.seats}
                      </div>
                      <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        seats
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-sm font-bold text-foreground leading-tight max-w-[10rem]">
                        {party.role}
                      </div>
                      <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {party.leader}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promises */}
                <div className="space-y-2">
                  {filtered.map((pledge) => {
                    const pid = pledgeId(party.id, partyPledges, pledge);
                    const meta = PLEDGE_STATUS_META[toPledgeStatus(pledge.status)];
                    return (
                      <div
                        key={pid}
                        className="flex flex-wrap items-start gap-2 py-2.5 border-t border-border first:border-0"
                      >
                        <FlagPill variant={meta.tone}>
                          <span aria-hidden="true">{meta.icon}</span> {meta.label}
                        </FlagPill>
                        <span className="label-mono text-[10px] uppercase tracking-wider text-amber shrink-0 mt-0.5">
                          {pledge.issue}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link
                            to="/parties/pledge/$id"
                            params={{ id: pid }}
                            className="text-sm font-medium leading-snug hover:text-amber transition-colors"
                          >
                            {pledge.promise}
                          </Link>
                          {pledge.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {pledge.detail}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {pledge.sourceUrl && (
                              <a
                                href={pledge.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 hover:text-amber inline-block"
                              >
                                Source: {pledge.sourceLabel ?? "official record"} ↗
                              </a>
                            )}
                            <Link
                              to="/parties/pledge/$id"
                              params={{ id: pid }}
                              className="label-mono text-[9px] uppercase tracking-wider text-amber/70 hover:text-amber inline-block"
                            >
                              Permalink →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
      </div>

      <p className="text-xs text-muted-foreground label-mono">
        Seat counts reflect the 2024 general election result. Pledge status assessments are made
        against our published{" "}
        <Link to="/methodology" className="text-amber hover:underline">
          rubric
        </Link>
        ; each status shows its own evidence and can be challenged. All parties are assessed the
        same way.
      </p>

      <DataProvenance
        source="Electoral Commission · Parliament · ONS · Party manifestos and press releases"
        url="https://www.electoralcommission.org.uk"
        licence="Open Government Licence v3.0 (government data) · Editorial (party assessments)"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
