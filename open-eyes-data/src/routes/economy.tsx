import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { getJSON } from "@/lib/api";
import type { EconSeries, EconomyData } from "@/routes/api/economy";

export const Route = createFileRoute("/economy")({
  head: () => ({
    meta: [
      { title: "UK Economic Indicators — transparenC" },
      {
        name: "description",
        content:
          "Live ONS data: GDP growth, CPI inflation, unemployment, real wages, government deficit and national debt — the real scorecard for UK economic management.",
      },
      { property: "og:title", content: "UK Economic Indicators — transparenC" },
    ],
  }),
  component: EconomyPage,
});

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ points, accent = false }: { points: number[]; accent?: boolean }) {
  if (points.length < 2) return <div className="h-10" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const px = (i: number) => (i / (points.length - 1)) * w;
  const py = (v: number) => h - ((v - min) / range) * (h - 4) - 2;
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const up = last >= prev;
  const color = accent ? (up ? "#f59e0b" : "#f59e0b") : "#6b7280";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={px(points.length - 1).toFixed(1)} cy={py(last).toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Indicator card ───────────────────────────────────────────────────────────

function IndicatorCard({ s, loading }: { s?: EconSeries; loading: boolean }) {
  if (loading || !s) {
    return (
      <Card>
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const latestNum = parseFloat(s.latestValue);
  const trend = s.trend.map((p) => p.value);

  return (
    <Card className="flex flex-col gap-2">
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
        <div className="flex items-end gap-2 mt-1">
          <span className="font-display text-3xl font-bold text-amber">
            {s.latestValue}{s.unit === "%" ? "%" : ""}
          </span>
          {s.unit !== "%" && (
            <span className="text-sm text-muted-foreground mb-0.5">{s.unit}</span>
          )}
        </div>
        <div className="label-mono text-[10px] text-muted-foreground">{s.latestDate}</div>
      </div>
      <div className="text-xs text-muted-foreground leading-snug">{s.description}</div>
      {trend.length > 1 && (
        <div className="mt-auto">
          <Sparkline points={trend} accent={!isNaN(latestNum)} />
          <div className="flex justify-between label-mono text-[9px] text-muted-foreground mt-0.5">
            <span>{s.trend[0]?.date}</span>
            <span>{s.trend[s.trend.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function EconomyPage() {
  const q = useQuery({
    queryKey: ["economy"],
    queryFn: () => getJSON<EconomyData>("/api/economy"),
    staleTime: 6 * 60 * 60_000,
  });

  const series = q.data?.data.series ?? [];

  // Named lookups
  const gdp        = series.find((s) => s.sourceId === "IHYQ");
  const cpi        = series.find((s) => s.sourceId === "D7G7");
  const unemploy   = series.find((s) => s.sourceId === "MGSX");
  const wages      = series.find((s) => s.sourceId === "KAB9");
  const debt       = series.find((s) => s.sourceId === "HF6W");
  const deficit    = series.find((s) => s.sourceId === "J5II");

  const gdpVal = parseFloat(gdp?.latestValue ?? "0");
  const cpiVal = parseFloat(cpi?.latestValue ?? "0");
  const wageVal = parseFloat(wages?.latestValue ?? "0");

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Economic Indicators"
          title="Is the economy working?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Live data from the Office for National Statistics — GDP growth, inflation, employment, wages
          and public finances. The real scorecard for economic management.
        </p>
      </div>

      {/* Key context */}
      {!q.isLoading && (
        <ContextBlock
          heading={
            gdpVal > 0
              ? `The economy is growing at ${gdp?.latestValue}% — but real wages and productivity tell a more complex story`
              : `GDP growth is flat or negative — the economy is under pressure`
          }
          variant={gdpVal >= 0.3 ? "default" : gdpVal >= 0 ? "warn" : "critical"}
        >
          <p>
            The UK's growth performance since 2008 has been the weakest of any major economy except
            Italy. Labour inherited this trend and has pledged the{" "}
            <strong className="text-foreground">highest sustained growth in the G7</strong> — a target
            that requires roughly 2.5% GDP growth per year. The six indicators below show whether that
            trajectory is materialising.
          </p>
          <p>
            Real wage growth (wages minus inflation) tells you whether people are actually getting
            better off. The deficit tells you whether the government is borrowing to cover spending.
            National debt as a share of GDP tells you whether that borrowing is sustainable.
          </p>
        </ContextBlock>
      )}

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Indicator grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <IndicatorCard s={gdp} loading={q.isLoading} />
        <IndicatorCard s={cpi} loading={q.isLoading} />
        <IndicatorCard s={unemploy} loading={q.isLoading} />
        <IndicatorCard s={wages} loading={q.isLoading} />
        <IndicatorCard s={deficit} loading={q.isLoading} />
        <IndicatorCard s={debt} loading={q.isLoading} />
      </div>

      {/* What it means */}
      {!q.isLoading && cpiVal > 0 && wageVal > 0 && (
        <ContextBlock
          heading={
            wageVal > cpiVal
              ? `Real wages are rising — people are ${(wageVal - cpiVal).toFixed(1)}pp ahead of inflation`
              : `Wages are not keeping up with inflation — living standards are being squeezed`
          }
          variant={wageVal > cpiVal ? "default" : "warn"}
        >
          <p>
            Real wage growth is the single most important number for living standards. When wage growth
            exceeds inflation, workers are getting materially better off. When it falls behind,
            living standards are squeezed even if headline GDP is growing — growth is going
            disproportionately to capital rather than labour.
          </p>
          <p>
            The UK experienced negative real wage growth for most of 2022–2023 during the cost-of-living
            crisis. Recovery since has been uneven across sectors and income levels.
          </p>
        </ContextBlock>
      )}

      {/* G7 comparison context — hardcoded 2025 OBR/IMF data */}
      {!q.isLoading && (
        <div>
          <h3 className="font-display text-lg font-bold mb-3">G7 GDP growth comparison (2025 IMF forecast)</h3>
          <div className="grid gap-2">
            {[
              { country: "United States", growth: 2.7, target: false },
              { country: "Canada",        growth: 2.2, target: false },
              { country: "France",        growth: 1.3, target: false },
              { country: "Germany",       growth: 0.8, target: false },
              { country: "United Kingdom", growth: parseFloat(gdp?.latestValue ?? "1.0"), target: true },
              { country: "Italy",         growth: 0.7, target: false },
              { country: "Japan",         growth: 1.1, target: false },
            ]
              .sort((a, b) => b.growth - a.growth)
              .map((c) => {
                const pct = Math.max(0, ((c.growth + 1) / 4.7) * 100);
                return (
                  <div
                    key={c.country}
                    className={`flex items-center gap-3 py-1.5 ${c.target ? "font-semibold" : ""}`}
                  >
                    <div className={`w-36 shrink-0 text-sm ${c.target ? "text-amber" : "text-muted-foreground"}`}>
                      {c.country}
                      {c.target && <span className="label-mono text-[9px] ml-1 text-amber">← UK</span>}
                    </div>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${c.target ? "bg-amber" : "bg-muted-foreground/30"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className={`label-mono text-xs w-14 text-right shrink-0 ${c.growth < 1 ? "text-flag" : c.target ? "text-amber" : "text-foreground"}`}>
                      {c.growth > 0 ? `+${c.growth}%` : `${c.growth}%`}
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="label-mono text-[10px] text-muted-foreground mt-2">
            Source: IMF World Economic Outlook 2025. UK bar uses latest ONS quarterly data.
          </p>
        </div>
      )}

      <ActionBar
        mpTopic="economic growth, cost of living, government deficit and national debt"
        briefingTopic="UK economic performance — GDP growth, inflation, wages and public finances 2025"
        shareText="UK economic scorecard: GDP, inflation, wages and debt — live ONS data"
      />

      <DataProvenance
        source="Office for National Statistics — QNA, MM23, LMS, EARN, PUSF series"
        url="https://www.ons.gov.uk/economy"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
