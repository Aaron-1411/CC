import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  Stat,
} from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";
import type { MajorProject, ProjectsData } from "@/routes/api/projects";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Government Projects — transparenC" },
      {
        name: "description",
        content:
          "IPA Delivery Confidence Assessments for every major UK government project — HS2, Hinkley Point C, defence programmes, NHS IT systems and more.",
      },
      { property: "og:title", content: "Government Projects — transparenC" },
    ],
  }),
  component: ProjectsPage,
});

type DCAFilter = "all" | "green" | "amber-green" | "amber-red" | "red" | "reset" | "unknown";

const DCA_LABELS: Record<string, string> = {
  green: "On track",
  "amber-green": "Some concerns",
  "amber-red": "At risk",
  red: "In serious trouble",
  reset: "Reset",
  unknown: "Not rated",
};

const DCA_PILL_VARIANT: Record<string, React.ComponentProps<typeof FlagPill>["variant"]> = {
  green: "ok",
  "amber-green": "warn",
  "amber-red": "warn",
  red: "direct",
  reset: "neutral",
  unknown: "neutral",
};

function dcaLabel(dca: MajorProject["dcaNormalized"]): string {
  return DCA_LABELS[dca] ?? "Not rated";
}

function fmtCost(gbpm: number | null): string {
  if (gbpm === null) return "—";
  if (gbpm >= 1000) return `£${(gbpm / 1000).toFixed(1)}bn`;
  return `£${fmtNumber(Math.round(gbpm))}m`;
}

function ProjectsPage() {
  const [filter, setFilter] = useState("");
  const [dcaFilter, setDcaFilter] = useState<DCAFilter>("all");

  const q = useQuery({
    queryKey: ["projects"],
    queryFn: () => getJSON<ProjectsData>("/api/projects"),
    staleTime: 6 * 60 * 60_000,
  });

  const all: MajorProject[] = q.data?.data.projects ?? [];

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(f) ||
          p.department.toLowerCase().includes(f) ||
          p.description.toLowerCase().includes(f),
      );
    }
    if (dcaFilter !== "all") {
      list = list.filter((p) => p.dcaNormalized === dcaFilter);
    }
    return list;
  }, [all, filter, dcaFilter]);

  const redCount = all.filter((p) => p.dcaNormalized === "red").length;
  const atRiskCount = all.filter((p) => p.dcaNormalized === "amber-red").length;
  const totalCost = all.reduce((s, p) => s + (p.wholeLifeCostGBPm ?? 0), 0);

  const dcaFilterOptions: Array<{ value: DCAFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "red", label: "In serious trouble" },
    { value: "amber-red", label: "At risk" },
    { value: "amber-green", label: "Some concerns" },
    { value: "green", label: "On track" },
    { value: "reset", label: "Reset" },
    { value: "unknown", label: "Not rated" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Government Major Projects"
          title="Is the government delivering its big projects?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          The Infrastructure Projects Authority independently rates every major government project
          from Green (on track) to Red (in serious trouble). These are the projects your taxes are
          funding — and whether they're being delivered on time and on budget.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Projects shown" value={fmtNumber(displayed.length)} accent="amber" loading={q.isLoading} />
        <Stat label="In serious trouble" value={fmtNumber(redCount)} accent="flag" loading={q.isLoading} />
        <Stat label="At risk" value={fmtNumber(atRiskCount)} accent="flag" loading={q.isLoading} />
        <Stat label="Total known cost" value={fmtCost(totalCost)} accent="amber" loading={q.isLoading} />
      </div>

      {/* Context */}
      {!q.isLoading && (
        <ContextBlock heading="What is a Delivery Confidence Assessment (DCA)?" variant="default">
          <p>
            The IPA rates every project on a five-point scale. <strong className="text-foreground">Green</strong> means it's on track to
            deliver on time and within budget. <strong className="text-foreground">Amber/Green</strong> has some concerns but nothing that
            can't be managed. <strong className="text-foreground">Amber/Red</strong> means there are significant issues — the project will
            likely need intervention to stay on track. <strong className="text-foreground">Red</strong> means the project has major
            problems and is unlikely to deliver as planned without major changes. <strong className="text-foreground">Reset</strong> means
            the project has been fundamentally restructured after failing.
          </p>
          <p>
            Historically, around 40% of major government projects have been rated Amber/Red or Red at some point.
            Cost overruns and schedule delays are the norm, not the exception.
          </p>
        </ContextBlock>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by project name, department or description…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {dcaFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDcaFilter(opt.value)}
              className={`px-2.5 py-1.5 rounded label-mono text-[10px] uppercase tracking-wider border transition-colors ${
                dcaFilter === opt.value
                  ? "bg-amber/10 border-amber/40 text-amber"
                  : "border-border text-muted-foreground hover:text-foreground bg-surface"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(filter || dcaFilter !== "all") && (
          <div className="mt-2 label-mono text-xs text-muted-foreground">
            Showing {displayed.length} of {all.length} projects
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Project cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {q.isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}

        {!q.isLoading &&
          displayed.map((p, i) => (
            <Card key={`${p.name}-${i}`}>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <FlagPill variant={DCA_PILL_VARIANT[p.dcaNormalized] ?? "neutral"}>
                  {dcaLabel(p.dcaNormalized)}
                </FlagPill>
                {p.department && (
                  <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {p.department}
                  </span>
                )}
              </div>

              <h3 className="font-display text-base font-bold leading-snug">{p.name}</h3>

              {p.description && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                  {p.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-3">
                {p.wholeLifeCostGBPm !== null && (
                  <div>
                    <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">Whole life cost</div>
                    <div className="font-display text-xl font-bold text-amber">{fmtCost(p.wholeLifeCostGBPm)}</div>
                  </div>
                )}
                {p.deliveryPhase && (
                  <div>
                    <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground">Phase</div>
                    <div className="text-sm font-medium mt-0.5">{p.deliveryPhase}</div>
                  </div>
                )}
              </div>
            </Card>
          ))}

        {!q.isLoading && displayed.length === 0 && !q.error && (
          <div className="col-span-2 text-muted-foreground text-sm py-12 text-center">
            {filter || dcaFilter !== "all" ? "No projects match those filters." : "No project data available."}
          </div>
        )}
      </div>

      <ActionBar
        mpTopic="government major project delivery and cost overruns"
        briefingTopic="UK government major projects portfolio — HS2, Hinkley, delivery confidence"
        shareText="UK Government Major Projects — see which ones are in trouble"
      />

      <DataProvenance
        source="Infrastructure Projects Authority — Government Major Projects Portfolio"
        url="https://www.gov.uk/government/collections/government-major-projects-portfolio-data"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
