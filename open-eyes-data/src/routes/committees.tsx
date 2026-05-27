import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";
import type { CommitteeReport, CommitteesData } from "@/routes/api/committees";

export const Route = createFileRoute("/committees")({
  head: () => ({
    meta: [
      { title: "Select Committee Reports — transparenC" },
      {
        name: "description",
        content:
          "The most rigorous parliamentary scrutiny of government — Public Accounts Committee, Health Committee, Home Affairs and more.",
      },
      { property: "og:title", content: "Select Committees — transparenC" },
    ],
  }),
  component: CommitteesPage,
});

const HOUSE_VARIANT = {
  Commons: "direct" as const,
  Lords: "neutral" as const,
  Joint: "warn" as const,
};

function CommitteesPage() {
  const [filter, setFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState<"All" | "Commons" | "Lords">("All");

  const q = useQuery({
    queryKey: ["committees"],
    queryFn: () => getJSON<CommitteesData>("/api/committees"),
    staleTime: 6 * 60 * 60_000,
  });

  const all: CommitteeReport[] = q.data?.data.reports ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (houseFilter !== "All") list = list.filter((r) => r.house === houseFilter);
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(f) ||
          r.committee.toLowerCase().includes(f) ||
          r.summary.toLowerCase().includes(f) ||
          (r.inquiry ?? "").toLowerCase().includes(f),
      );
    }
    return list;
  }, [all, filter, houseFilter]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Parliamentary Scrutiny"
          title="Select committee reports"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Select committees are the most rigorous form of parliamentary scrutiny. They take evidence
          from ministers, civil servants and experts, then publish independent assessments with
          recommendations the government must respond to.
        </p>
      </div>

      {!q.isLoading && (
        <ContextBlock
          heading="Select committees have powers governments find uncomfortable — but their reports are widely ignored"
          variant="default"
        >
          <p>
            Committees like the <strong className="text-foreground">Public Accounts Committee</strong> and{" "}
            <strong className="text-foreground">Health and Social Care Committee</strong> regularly
            expose government waste, policy failure and ministerial evasion. They can summon ministers
            and civil servants to give evidence under oath. Their reports carry significant media
            weight — but the government's formal responses often reject the most critical recommendations.
          </p>
          <p>
            These reports are some of the best-researched documents in British public life — and
            they are almost never read by the public. Every report below represents parliamentary
            oversight of government that most people never see.
          </p>
        </ContextBlock>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search reports, committees, inquiries…"
          className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
        />
        <div className="flex gap-1">
          {(["All", "Commons", "Lords"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHouseFilter(h)}
              className={`px-3 py-2 rounded label-mono text-xs uppercase tracking-wider ${
                houseFilter === h
                  ? "bg-amber text-amber-foreground"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        {(filter || houseFilter !== "All") && (
          <span className="label-mono text-xs text-muted-foreground">
            {displayed.length} of {all.length}
          </span>
        )}
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Reports */}
      <div className="space-y-3">
        {q.isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-40 mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}

        {!q.isLoading &&
          displayed.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <FlagPill variant={HOUSE_VARIANT[r.house]}>{r.house}</FlagPill>
                    <span className="label-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      {r.committee}
                    </span>
                    <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      {relTime(r.publishedAt)}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-amber"
                    >
                      {r.title}
                    </a>
                  </h3>
                  {r.inquiry && r.inquiry !== r.title && (
                    <p className="label-mono text-[10px] text-muted-foreground mt-1">
                      Inquiry: {r.inquiry}
                    </p>
                  )}
                  {r.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                      {r.summary}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline whitespace-nowrap"
                  >
                    Read →
                  </a>
                </div>
              </div>
            </Card>
          ))}

        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">
            {filter || houseFilter !== "All" ? "No reports match those filters." : "No reports available."}
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="select committee scrutiny and parliamentary accountability"
        briefingTopic="UK parliamentary select committees — scrutiny of government and key recent reports"
        shareText="Select committees are the most rigorous parliamentary scrutiny of government. Read the latest reports."
      />

      <DataProvenance
        source="UK Parliament — Committees API"
        url="https://committees.parliament.uk"
        licence="Open Parliament Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
