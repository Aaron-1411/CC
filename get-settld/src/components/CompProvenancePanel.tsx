import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, Database } from "lucide-react";
import { fmt } from "@/lib/format";
import type { Comparable, SubjectProperty, SimilarityCriteria } from "@/lib/avm";

interface RejectedComp {
  comp: Comparable;
  reasons: string[];
}

interface Props {
  subject: SubjectProperty;
  accepted: Comparable[];
  rejected: RejectedComp[];
  criteria: SimilarityCriteria;
}

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

// Re-derive each similarity check so we can render Pass/Fail per rule per comp.
const evaluateChecks = (
  c: Comparable,
  s: SubjectProperty,
  cr: SimilarityCriteria,
): CheckResult[] => {
  const ageMonths = Math.max(
    0,
    (Date.now() - new Date(c.soldDate).getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  const sqftDiff = Math.abs(c.sqft - s.sqft) / Math.max(1, s.sqft);
  const bedsDiff = Math.abs(c.beds - s.beds);
  return [
    {
      label: "Distance",
      ok: c.distanceMiles <= cr.maxDistanceMiles,
      detail: `${c.distanceMiles}mi (max ${cr.maxDistanceMiles}mi)`,
    },
    {
      label: "Recency",
      ok: ageMonths <= cr.maxAgeMonths,
      detail: `${ageMonths.toFixed(1)}mo (max ${cr.maxAgeMonths}mo)`,
    },
    {
      label: "Sqft",
      ok: sqftDiff <= cr.sqftTolerancePct,
      detail: `Δ ${(sqftDiff * 100).toFixed(0)}% (max ±${Math.round(cr.sqftTolerancePct * 100)}%)`,
    },
    {
      label: "Beds",
      ok: bedsDiff <= cr.bedsTolerance,
      detail: `Δ ${bedsDiff} (max ±${cr.bedsTolerance})`,
    },
    {
      label: "Tenure",
      ok: cr.tenureMatch.includes(c.tenure),
      detail: c.tenure,
    },
  ];
};

// Field-level provenance per dataset for a single comp.
const datasetFields = (c: Comparable) => [
  {
    dataset: "HM Land Registry - Price Paid",
    fields: [
      { f: "price_paid", v: fmt(c.soldPrice) },
      { f: "transfer_date", v: c.soldDate },
      { f: "property_type", v: `${c.beds}-bed` },
      { f: "tenure", v: c.tenure },
    ],
  },
  {
    dataset: "EPC Open Data (Domestic)",
    fields: [
      { f: "current_energy_rating", v: c.epc },
      { f: "total_floor_area", v: `${c.sqft} sqft` },
    ],
  },
  {
    dataset: "Royal Mail PAF · Geocoder",
    fields: [
      { f: "address", v: c.address },
      { f: "distance_to_subject", v: `${c.distanceMiles} mi` },
    ],
  },
];

function ProvenanceRow({
  c,
  checks,
  rejectedReasons,
}: {
  c: Comparable;
  checks: CheckResult[];
  rejectedReasons?: string[];
}) {
  const [open, setOpen] = useState(false);
  const passed = checks.filter((x) => x.ok).length;
  const isAccepted = !rejectedReasons;

  return (
    <li className="border-b last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-12 items-center gap-2 py-3 text-left hover:bg-muted/30 transition-colors px-2 -mx-2 rounded"
        aria-expanded={open}
      >
        <span className="col-span-5 text-sm text-foreground truncate">{c.address}</span>
        <span className="col-span-2 font-mono text-xs text-right">{fmt(c.soldPrice)}</span>
        <span className="col-span-2 font-mono text-xs text-right text-muted-foreground">
          {c.sqft}sqft
        </span>
        <span className="col-span-2 text-right">
          <Badge
            className={`border-0 text-[10px] ${
              isAccepted
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {passed}/{checks.length} {isAccepted ? "pass" : "checks"}
          </Badge>
        </span>
        <ChevronDown
          className={`col-span-1 w-4 h-4 text-muted-foreground justify-self-end transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="grid md:grid-cols-2 gap-4 pb-4 px-2">
          {/* Similarity checks */}
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Similarity-filter results
            </p>
            <ul className="space-y-1.5">
              {checks.map((chk) => (
                <li
                  key={chk.label}
                  className="flex items-start justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-foreground">
                    {chk.ok ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <X className="w-3 h-3 text-destructive" />
                    )}
                    {chk.label}
                  </span>
                  <span className="font-mono text-muted-foreground text-right">
                    {chk.detail}
                  </span>
                </li>
              ))}
            </ul>
            {rejectedReasons && rejectedReasons.length > 0 && (
              <p className="mt-2 text-[10px] text-destructive">
                Rejected: {rejectedReasons.join(" · ")}
              </p>
            )}
          </div>

          {/* Field-level dataset provenance */}
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <Database className="w-3 h-3" /> Live-data provenance
            </p>
            <div className="space-y-2">
              {datasetFields(c).map((d) => (
                <div key={d.dataset}>
                  <p className="text-[10px] font-semibold text-brand">{d.dataset}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {d.fields.map((fv) => (
                      <li
                        key={fv.f}
                        className="grid grid-cols-12 gap-2 text-[11px]"
                      >
                        <code className="col-span-5 font-mono text-foreground">
                          {fv.f}
                        </code>
                        <span className="col-span-1 text-muted-foreground text-center">
                          →
                        </span>
                        <span className="col-span-6 text-muted-foreground font-mono">
                          {fv.v}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export default function CompProvenancePanel({
  subject,
  accepted,
  rejected,
  criteria,
}: Props) {
  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h4 className="font-serif font-bold text-brand">
          Per-comparable provenance
        </h4>
        <Badge className="bg-brand-muted text-brand border-0 text-[10px]">
          {accepted.length} accepted · {rejected.length} rejected
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Click any row to see the exact fields pulled from each live dataset and
        which similarity rules passed or failed.
      </p>

      {accepted.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-widest text-success mt-2 mb-1">
            Accepted ({accepted.length})
          </p>
          <ul>
            {accepted.map((c) => (
              <ProvenanceRow
                key={c.id}
                c={c}
                checks={evaluateChecks(c, subject, criteria)}
              />
            ))}
          </ul>
        </>
      )}

      {rejected.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-widest text-destructive mt-4 mb-1">
            Rejected ({rejected.length})
          </p>
          <ul>
            {rejected.map(({ comp, reasons }) => (
              <ProvenanceRow
                key={comp.id}
                c={comp}
                checks={evaluateChecks(comp, subject, criteria)}
                rejectedReasons={reasons}
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
