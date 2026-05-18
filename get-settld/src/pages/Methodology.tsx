import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AccuracyPanel from "@/components/AccuracyPanel";
import { METHODOLOGY_VERSION, METHODOLOGY_VERSION_DATE, METHODOLOGY_CHANGELOG } from "@/data/methodologyVersion";
import { Database, Calculator, MapPinned, Train, ShieldAlert, GraduationCap, Home, PoundSterling, Landmark } from "lucide-react";

interface Source {
  icon: typeof Database;
  name: string;
  what: string;
  freshness: string;
  url: string;
}

const SOURCES: Source[] = [
  { icon: PoundSterling, name: "HM Land Registry — Price Paid", what: "Sold prices for England & Wales used in our AVM and area benchmarks.", freshness: "Monthly", url: "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads" },
  { icon: Landmark, name: "ONS — UK House Price Index", what: "Year-on-year change used for appreciation and growth bands.", freshness: "Monthly", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest" },
  { icon: Calculator, name: "Bank of England — Bank Rate", what: "Powers the live mortgage-rate banner and stress tests.", freshness: "Per BoE meeting", url: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate" },
  { icon: Home, name: "EPC Open Data Communities", what: "Energy efficiency rating used in true-cost running bills.", freshness: "Monthly", url: "https://epc.opendatacommunities.org/" },
  { icon: ShieldAlert, name: "Environment Agency — Flood maps", what: "Flood-risk overlay on the Risk Report.", freshness: "Quarterly", url: "https://environment.data.gov.uk/" },
  { icon: ShieldAlert, name: "police.uk", what: "Crime stats by postcode used in Risk Report and Areas.", freshness: "Monthly", url: "https://data.police.uk/" },
  { icon: Train, name: "TfL / NaPTAN", what: "Nearest stations, lines and journey-time estimates.", freshness: "Daily", url: "https://api.tfl.gov.uk/" },
  { icon: GraduationCap, name: "DfE — Schools performance", what: "School ratings used in family-friendliness scores.", freshness: "Annual", url: "https://www.compare-school-performance.service.gov.uk/" },
  { icon: MapPinned, name: "Postcodes.io", what: "Postcode lookup, lat/long and admin areas.", freshness: "Real-time", url: "https://postcodes.io/" },
];

interface Calc {
  title: string;
  what: string;
  inputs: string[];
}
const CALCS: Calc[] = [
  {
    title: "Affordability",
    what: "Standard amortising mortgage payment formula M = P·r(1+r)ⁿ ÷ ((1+r)ⁿ−1) plus FCA stress-rate at +3% above pay rate.",
    inputs: ["Price", "Deposit", "Term", "Product rate", "Income"],
  },
  {
    title: "Stamp duty / LBTT / LTT",
    what: "Banded calculation per region, including FTB relief, additional-dwelling and non-resident surcharges. England rules effective post-April 2025.",
    inputs: ["Price", "Region", "First-time buyer flag", "Additional dwelling", "Non-resident"],
  },
  {
    title: "True cost (year 1)",
    what: "Mortgage payment + council tax band estimate + EPC-derived energy cost + service charge/ground rent (if leasehold) + insurance + maintenance reserve (1% of value).",
    inputs: ["Mortgage payment", "EPC rating", "Tenure", "Council band"],
  },
  {
    title: "AVM",
    what: "Comparable-sales regression on Land Registry sold prices within radius, adjusted for type, beds, and time decay against ONS HPI.",
    inputs: ["Postcode", "Property type", "Bedrooms", "Sold comps"],
  },
  {
    title: "Appreciation / growth",
    what: "Geometric mean of 5y and 10y ONS HPI for the LSOA, capped at sensible bounds and presented with a confidence band.",
    inputs: ["Postcode", "ONS HPI"],
  },
  {
    title: "Verdict (decide)",
    what: "Weighted score across affordability, area, risk and right-fit pillars. Each input has an explicit weight shown in the verdict drawer.",
    inputs: ["All scenario inputs"],
  },
];

export default function Methodology() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Methodology & data sources"
        description="Every number, formula and dataset behind the toolkit — versioned, dated and citable."
        documentTitle="Methodology & data sources"
        actions={
          <Badge className="bg-brand-muted text-brand border-0">
            v{METHODOLOGY_VERSION} · {METHODOLOGY_VERSION_DATE}
          </Badge>
        }
      />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <AccuracyPanel />
        {/* Sources */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand mb-1">Where the data comes from</h2>
          <p className="text-muted-foreground text-sm mb-5">
            We blend public, free-to-use UK datasets. Every number you see in the app is traceable
            back to one of these sources via the Citations panel.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {SOURCES.map(({ icon: Icon, ...s }) => (
              <Card key={s.name} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-brand-muted text-brand p-2 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{s.what}</p>
                    <div className="flex gap-2 mt-2 items-center">
                      <Badge variant="outline" className="text-[10px]">Refresh: {s.freshness}</Badge>
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-brand underline">
                        Source ↗
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Calculations */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand mb-1">How the numbers are calculated</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Plain-English formulas behind each of the headline tools.
          </p>
          <div className="space-y-3">
            {CALCS.map((c) => (
              <Card key={c.title} className="p-4">
                <div className="font-semibold text-sm text-brand">{c.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{c.what}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.inputs.map((i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Confidence */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand mb-1">Confidence & freshness</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Where a number depends on a small comparable set, low-volume area data or a stale
            dataset, you'll see a Confidence Meter and a Freshness Pill. Treat low-confidence
            numbers as a starting point and corroborate with a broker, valuer or surveyor.
          </p>
        </section>

        {/* Changelog */}
        <section id="changelog">
          <h2 className="font-serif text-2xl font-bold text-brand mb-3">Changelog</h2>
          <div className="space-y-4">
            {METHODOLOGY_CHANGELOG.map((e) => (
              <Card key={e.version} className="p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold text-brand">v{e.version}</span>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </div>
                <div className="font-semibold text-sm mt-1">{e.summary}</div>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                  {e.changes.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
