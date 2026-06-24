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
import { fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/flood-warnings")({
  head: () => ({
    meta: [
      { title: "Flood Warnings — transparenC" },
      {
        name: "description",
        content:
          "Live flood warnings and alerts for England from the Environment Agency — severe warnings, warnings and alerts in force right now, with the river or sea and county affected.",
      },
      { property: "og:title", content: "Flood Warnings — transparenC" },
    ],
  }),
  component: FloodWarningsPage,
});

type FloodWarning = {
  id: string;
  severityLevel: number;
  severity: string;
  area: string;
  county: string;
  riverOrSea: string;
  eaArea: string;
  isTidal: boolean;
  message: string;
  raised: string;
  updated: string;
};

type FloodResp = {
  warnings: FloodWarning[];
  total: number;
  severe: number;
  warning: number;
  alert: number;
  removed: number;
  updatedAt: string;
};

type SortKey = "severity" | "updated" | "area";

function FloodWarningsPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("severity");
  const [activeOnly, setActiveOnly] = useState(true);

  const q = useQuery({
    queryKey: ["flood-warnings"],
    queryFn: () => getJSON<FloodResp>("/api/flood-warnings"),
    staleTime: 10 * 60_000,
  });

  const all = q.data?.data.warnings ?? [];

  const displayed = useMemo(() => {
    let list = all;
    // "Active" hides level-4 (no longer in force) entries by default.
    if (activeOnly) list = list.filter((w) => w.severityLevel <= 3);
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (w) =>
          w.area.toLowerCase().includes(f) ||
          w.county.toLowerCase().includes(f) ||
          w.riverOrSea.toLowerCase().includes(f) ||
          w.eaArea.toLowerCase().includes(f) ||
          w.message.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "severity") {
        if (a.severityLevel !== b.severityLevel) return a.severityLevel - b.severityLevel;
        return (b.updated || "").localeCompare(a.updated || "");
      }
      if (sort === "updated") return (b.updated || "").localeCompare(a.updated || "");
      if (sort === "area") return a.area.localeCompare(b.area);
      return 0;
    });
  }, [all, filter, sort, activeOnly]);

  const d = q.data?.data;
  const severe = d?.severe ?? 0;
  const warning = d?.warning ?? 0;
  const alert = d?.alert ?? 0;
  const activeTotal = severe + warning + alert;
  const allClear = !q.isLoading && !q.error && activeTotal === 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Flooding"
          title="Where is flooding expected right now?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Live flood warnings and alerts for England, issued by the Environment Agency. Severe
          warnings mean danger to life; warnings mean flooding is expected; alerts mean it's possible
          — be prepared.
        </p>
      </div>

      {/* What this means */}
      {!q.isLoading && !q.error && (
        <ContextBlock heading="Three levels, from possible to life-threatening" variant="warn">
          <p>
            The Environment Agency issues three live levels.{" "}
            <strong className="text-foreground">Flood alerts</strong> mean flooding is possible —
            stay alert.{" "}
            <strong className="text-foreground">Flood warnings</strong> mean flooding is expected —
            act now.{" "}
            <strong className="text-foreground">Severe flood warnings</strong> mean danger to life.
          </p>
          <p>
            An empty board is the good outcome: it means no flooding is currently expected anywhere
            in England. When warnings are in force, each one names the river, coast or area affected
            and when it was last reviewed. For the official map and to check your own postcode, use
            the GOV.UK flood service linked below.
          </p>
        </ContextBlock>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Active in total"
          value={fmtNumber(activeTotal)}
          accent={activeTotal > 0 ? "amber" : "ok"}
          loading={q.isLoading}
        />
        <Stat
          label="Severe warnings"
          value={fmtNumber(severe)}
          accent="flag"
          loading={q.isLoading}
          shareable={severe > 0}
          shareText={`${fmtNumber(severe)} SEVERE flood warning(s) in force in England right now — danger to life (Environment Agency)`}
        />
        <Stat label="Flood warnings" value={fmtNumber(warning)} accent="flag" loading={q.isLoading} />
        <Stat label="Flood alerts" value={fmtNumber(alert)} accent="amber" loading={q.isLoading} />
      </div>

      {/* All-clear banner */}
      {allClear && (
        <Card>
          <div className="py-8 text-center space-y-2">
            <FlagPill variant="ok">All clear</FlagPill>
            <h3 className="font-display text-xl font-semibold">
              No active flood warnings in England right now
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The Environment Agency is not expecting flooding anywhere in England at the moment. This
              page updates automatically — check back, or look up your own postcode on the GOV.UK
              flood service.
            </p>
          </div>
        </Card>
      )}

      {/* Filters — only meaningful when there's something to filter */}
      {!allClear && (
        <Card>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by area, river, sea or county…"
              className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
            />
            <button
              onClick={() => setActiveOnly((v) => !v)}
              className={`px-3 py-2 rounded label-mono text-xs uppercase tracking-wider ${
                activeOnly
                  ? "bg-amber text-amber-foreground"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              Active only
            </button>
            <div className="flex gap-1 label-mono text-xs">
              {(["severity", "updated", "area"] as SortKey[]).map((s) => (
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
          {(filter || !activeOnly) && (
            <div className="mt-2 label-mono text-xs text-muted-foreground">
              Showing {displayed.length} of {all.length} entries
            </div>
          )}
        </Card>
      )}

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {!allClear && (
        <div className="grid gap-3">
          {!q.isLoading &&
            displayed.map((w) => <WarningRow key={w.id} w={w} />)}
          {!q.isLoading && displayed.length === 0 && !q.error && (
            <div className="text-muted-foreground text-sm py-12 text-center">
              {filter ? "No warnings match that filter." : "No warnings in this view."}
            </div>
          )}
        </div>
      )}

      <ActionBar
        mpTopic="flood risk, flood defences and the Environment Agency's response in our area"
        briefingTopic="UK flood warnings, flood defence investment and Environment Agency accountability"
        shareText="Check live flood warnings for England — and what's being done about flood risk"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent concerned about flood risk in our area.

The Environment Agency issues flood alerts and warnings when flooding is possible or expected. Whether or not warnings are in force today, the long-term picture depends on investment in flood defences, maintenance of rivers and drainage, and planning decisions about building on flood plains.

I would like to know:
1. How many properties in our constituency are at significant risk of flooding?
2. What flood defence schemes are planned or underway locally, and are they funded?
3. How is the Environment Agency maintaining rivers, culverts and drainage in our area?
4. Will you support sustained investment in flood defences and resist development on high-risk flood plains?

I would be grateful for your response.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="Environment Agency — Flood warnings"
        url="https://check-for-flooding.service.gov.uk/"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function severityVariant(level: number): "ok" | "open" | "warn" | "direct" | "neutral" {
  switch (level) {
    case 1:
      return "direct"; // Severe — danger to life
    case 2:
      return "warn"; // Warning — flooding expected
    case 3:
      return "open"; // Alert — flooding possible
    default:
      return "neutral"; // No longer in force
  }
}

function WarningRow({ w }: { w: FloodWarning }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FlagPill variant={severityVariant(w.severityLevel)}>{w.severity}</FlagPill>
            {w.isTidal && <FlagPill variant="neutral">Tidal</FlagPill>}
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">{w.area}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            {w.riverOrSea && w.riverOrSea !== "—" ? (
              <>
                <span className="text-foreground">{w.riverOrSea}</span>
                {" · "}
              </>
            ) : null}
            {w.county && w.county !== "—" ? w.county : w.eaArea}
          </div>
          {w.message && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{w.message}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Updated
          </div>
          <div className="text-sm font-medium">{w.updated ? relTime(w.updated) : "—"}</div>
        </div>
      </div>
    </Card>
  );
}
