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

export const Route = createFileRoute("/carbon-intensity")({
  head: () => ({
    meta: [
      { title: "Carbon Intensity — transparenC" },
      {
        name: "description",
        content:
          "How clean is Britain's electricity right now? Live carbon intensity (gCO2/kWh) and generation mix for Great Britain from National Grid ESO — renewables, nuclear and fossil fuels, and which region is cleanest.",
      },
      { property: "og:title", content: "Carbon Intensity — transparenC" },
    ],
  }),
  component: CarbonIntensityPage,
});

type FuelMix = { fuel: string; perc: number };
type Region = {
  regionid: number;
  shortname: string;
  dnoregion: string;
  forecast: number;
  index: string;
  topFuel: string;
  topPerc: number;
  renewablePerc: number;
  mix: FuelMix[];
};
type CarbonResp = {
  from: string;
  to: string;
  forecast: number | null;
  actual: number | null;
  index: string;
  mix: FuelMix[];
  renewablePerc: number;
  fossilPerc: number;
  nuclearPerc: number;
  lowCarbonPerc: number;
  cleanest: Region | null;
  dirtiest: Region | null;
  regions: Region[];
  updatedAt: string;
};

type SortKey = "intensity" | "renewable" | "name";

const FUEL_LABEL: Record<string, string> = {
  wind: "Wind",
  solar: "Solar",
  hydro: "Hydro",
  biomass: "Biomass",
  nuclear: "Nuclear",
  gas: "Gas",
  coal: "Coal",
  imports: "Imports",
  other: "Other",
};

// Three buckets keep the bar honest: green = renewable, teal = nuclear (low
// carbon but not renewable), red = fossil, muted = imports/other.
function fuelClass(fuel: string): string {
  if (["wind", "solar", "hydro", "biomass"].includes(fuel)) return "bg-ok";
  if (fuel === "nuclear") return "bg-ok/55";
  if (["gas", "coal"].includes(fuel)) return "bg-flag";
  return "bg-muted-foreground/40";
}

function indexVariant(index: string): "ok" | "open" | "warn" | "direct" | "neutral" {
  switch (index.toLowerCase()) {
    case "very low":
      return "ok";
    case "low":
      return "open";
    case "moderate":
      return "warn";
    case "high":
    case "very high":
      return "direct";
    default:
      return "neutral";
  }
}

function CarbonIntensityPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("intensity");

  const q = useQuery({
    queryKey: ["carbon-intensity"],
    queryFn: () => getJSON<CarbonResp>("/api/carbon-intensity"),
    staleTime: 10 * 60_000,
  });

  const d = q.data?.data;
  const regions = d?.regions ?? [];

  const displayed = useMemo(() => {
    let list = regions;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (r) =>
          r.shortname.toLowerCase().includes(f) || r.dnoregion.toLowerCase().includes(f),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "intensity") return a.forecast - b.forecast;
      if (sort === "renewable") return b.renewablePerc - a.renewablePerc;
      return a.shortname.localeCompare(b.shortname);
    });
  }, [regions, filter, sort]);

  const current = d?.actual ?? d?.forecast ?? null;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Energy"
          title="How clean is Britain's electricity right now?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Live carbon intensity and generation mix for Great Britain's electricity, from National
          Grid ESO. Carbon intensity is how much CO₂ is emitted per unit of electricity used right
          now — lower is cleaner, and it swings with how windy, sunny and gas-reliant the grid is.
        </p>
      </div>

      {!q.isLoading && !q.error && (
        <ContextBlock heading="What the number means" variant="warn">
          <p>
            Carbon intensity is measured in <strong className="text-foreground">grams of CO₂ per
            kilowatt-hour (gCO₂/kWh)</strong>. National Grid ESO bands it from{" "}
            <strong className="text-foreground">very low</strong> to{" "}
            <strong className="text-foreground">very high</strong>. It falls when wind, solar, hydro
            and nuclear dominate the mix, and rises when gas has to fill the gap.
          </p>
          <p>
            Britain's long-term decarbonisation target — a clean power system by 2030 — depends on
            pushing this number down for good: more renewables and grid storage, less gas. The
            regional breakdown below shows the same grid is far cleaner in some parts of the country
            than others at any given moment.
          </p>
        </ContextBlock>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Carbon intensity"
          value={fmtNumber(current)}
          hint={`gCO₂/kWh · ${d?.index ?? "—"}`}
          accent={
            d ? (indexVariant(d.index) === "direct" ? "flag" : indexVariant(d.index) === "warn" ? "amber" : "ok") : undefined
          }
          loading={q.isLoading}
          shareable={!!d}
          shareText={`Britain's electricity is running at ${fmtNumber(current)} gCO₂/kWh right now (${d?.index}) — ${d?.lowCarbonPerc}% low-carbon (National Grid ESO)`}
        />
        <Stat
          label="Low-carbon share"
          value={d ? `${d.lowCarbonPerc}%` : "—"}
          hint="renewables + nuclear"
          accent="ok"
          loading={q.isLoading}
        />
        <Stat
          label="Renewables"
          value={d ? `${d.renewablePerc}%` : "—"}
          hint="wind · solar · hydro · biomass"
          accent="ok"
          loading={q.isLoading}
        />
        <Stat
          label="Fossil fuels"
          value={d ? `${d.fossilPerc}%` : "—"}
          hint="gas · coal"
          accent="flag"
          loading={q.isLoading}
        />
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <Card>
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-5 w-full mb-3" />
          <Skeleton className="h-3 w-2/3" />
        </Card>
      )}

      {/* National generation mix */}
      {d && (
        <Card>
          <h3 className="font-display text-lg font-semibold mb-1">
            What's powering the grid right now
          </h3>
          <p className="text-xs text-muted-foreground mb-3 label-mono">
            Share of generation, Great Britain
          </p>
          <div className="flex h-5 w-full overflow-hidden rounded">
            {d.mix
              .filter((m) => m.perc > 0)
              .map((m) => (
                <div
                  key={m.fuel}
                  className={fuelClass(m.fuel)}
                  style={{ width: `${m.perc}%` }}
                  title={`${FUEL_LABEL[m.fuel] ?? m.fuel}: ${m.perc}%`}
                />
              ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3">
            {d.mix.map((m) => (
              <div key={m.fuel} className="flex items-center gap-2 text-sm">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${fuelClass(m.fuel)}`} />
                <span className="text-foreground">{FUEL_LABEL[m.fuel] ?? m.fuel}</span>
                <span className="text-muted-foreground label-mono ml-auto">{m.perc}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cleanest vs dirtiest region */}
      {d?.cleanest && d?.dirtiest && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <FlagPill variant="ok">Cleanest region</FlagPill>
            </div>
            <h3 className="font-display text-base font-semibold">{d.cleanest.shortname}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-foreground font-medium">{fmtNumber(d.cleanest.forecast)}</span>{" "}
              gCO₂/kWh · {d.cleanest.renewablePerc}% renewable
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <FlagPill variant="direct">Most carbon-heavy</FlagPill>
            </div>
            <h3 className="font-display text-base font-semibold">{d.dirtiest.shortname}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-foreground font-medium">{fmtNumber(d.dirtiest.forecast)}</span>{" "}
              gCO₂/kWh · {d.dirtiest.renewablePerc}% renewable
            </p>
          </Card>
        </div>
      )}

      {/* Regional grid */}
      {d && (
        <>
          <Card>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by region…"
                className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
              />
              <div className="flex gap-1 label-mono text-xs">
                {(["intensity", "renewable", "name"] as SortKey[]).map((s) => (
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
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {displayed.map((r) => (
              <RegionRow key={r.regionid} r={r} />
            ))}
            {displayed.length === 0 && (
              <div className="text-muted-foreground text-sm py-12 text-center sm:col-span-2">
                No regions match that filter.
              </div>
            )}
          </div>
        </>
      )}

      <ActionBar
        mpTopic="grid decarbonisation, renewable energy and the 2030 clean power target in our area"
        briefingTopic="UK electricity decarbonisation, the clean power 2030 target and grid investment"
        shareText="See how clean Britain's electricity is right now — live carbon intensity and generation mix"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent who cares about how quickly Britain decarbonises its electricity.

The carbon intensity of our electricity — how much CO₂ is emitted per unit used — still swings sharply with how much gas the grid has to burn. The Government has committed to a clean power system by 2030, which depends on faster build-out of renewables, grid connections and storage.

I would like to know:
1. What renewable energy and grid projects are planned or underway in our constituency?
2. Will you support faster grid connection reform so clean projects are not stuck in the queue?
3. How is the Government ensuring the move off gas lowers, rather than raises, household bills?
4. What is being done to make sure the benefits of cheaper clean power reach our area?

I would be grateful for your response.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="National Grid ESO — Carbon Intensity API"
        url="https://carbonintensity.org.uk/"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function RegionRow({ r }: { r: Region }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FlagPill variant={indexVariant(r.index)}>{r.index}</FlagPill>
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">{r.shortname}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            Top source: <span className="text-foreground">{FUEL_LABEL[r.topFuel] ?? r.topFuel}</span>{" "}
            {r.topPerc}% · {r.renewablePerc}% renewable
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold">{fmtNumber(r.forecast)}</div>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            gCO₂/kWh
          </div>
        </div>
      </div>
    </Card>
  );
}
