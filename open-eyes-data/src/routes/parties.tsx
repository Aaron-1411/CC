import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { getJSON } from "@/lib/api";
import type { Issue, Party, PartyPromise, PromiseStatus } from "@/data/parties";

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
  const totalPolling = parties.reduce((s, p) => s + p.polling, 0);

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

      {/* Polling bar */}
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Indicative polling — {totalPolling}% of vote share shown (approx.)
        </div>
        <div className="flex h-4 rounded overflow-hidden gap-px">
          {parties.map((p) => (
            <div
              key={p.id}
              title={`${p.name}: ~${p.polling}%`}
              style={{
                width: `${p.polling}%`,
                backgroundColor: p.colour,
                opacity: 0.8,
              }}
              className="shrink-0"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {parties.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: p.colour, opacity: 0.8 }}
              />
              <span className="label-mono text-[10px] text-muted-foreground">
                {p.name}: ~{p.polling}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
          How are the UK's political parties performing against their own pledges? Track
          commitments on the issues that matter most — from NHS waiting lists to net migration
          and the housing crisis.
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
                      <div className="font-display text-2xl font-bold" style={{ color: party.colour }}>
                        {party.seats}
                      </div>
                      <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        seats
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-amber">
                        ~{party.polling}%
                      </div>
                      <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        polling
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promises */}
                <div className="space-y-2">
                  {filtered.map((pledge, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-start gap-2 py-2.5 border-t border-border first:border-0"
                    >
                      <FlagPill variant={statusVariant(pledge.status)}>
                        {statusLabel(pledge.status)}
                      </FlagPill>
                      <span className="label-mono text-[10px] uppercase tracking-wider text-amber shrink-0 mt-0.5">
                        {pledge.issue}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{pledge.promise}</p>
                        {pledge.detail && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {pledge.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
      </div>

      <p className="text-xs text-muted-foreground label-mono">
        Polling figures are indicative only — aggregated across various pollsters (YouGov, Ipsos,
        Savanta et al.). Seat counts reflect the 2024 general election result. Promise status
        assessments are editorial judgements based on publicly available information as of May 2026.
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
