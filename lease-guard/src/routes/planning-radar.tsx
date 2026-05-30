import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Loader2, MapPin, Info } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/SiteNav";
import { searchPlanning, type PlanningResult } from "@/lib/planning.functions";

export const Route = createFileRoute("/planning-radar")({
  head: () => ({
    meta: [
      { title: "Planning Radar — Nearby Planning Applications & Constraints | LeaseSense Pro" },
      {
        name: "description",
        content:
          "Enter a UK postcode and see nearby planning applications, conservation areas, listed buildings, TPOs and Article 4 Directions from live DLUHC data.",
      },
    ],
  }),
  component: PlanningRadarPage,
});

function PlanningRadarPage() {
  const [postcode, setPostcode] = useState("");
  const searchFn = useServerFn(searchPlanning);

  const mutation = useMutation({
    mutationFn: (pc: string) => searchFn({ data: { postcode: pc } }),
    onError: (err: Error) => toast.error(err.message ?? "Search failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pc = postcode.trim();
    if (pc.length < 3) {
      toast.error("Enter a valid UK postcode.");
      return;
    }
    mutation.mutate(pc);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <SiteNav />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!mutation.isSuccess ? (
          <SearchPanel
            postcode={postcode}
            setPostcode={setPostcode}
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
          />
        ) : (
          <ResultsPanel
            result={mutation.data}
            onReset={() => { mutation.reset(); setPostcode(""); }}
          />
        )}
      </main>

      <footer className="mt-20 border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Data source: DLUHC planning.data.gov.uk · Coverage varies by local authority · Always verify with your LPA.
        </div>
      </footer>
    </div>
  );
}

function SearchPanel({
  postcode,
  setPostcode,
  onSubmit,
  isLoading,
}: {
  postcode: string;
  setPostcode: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-10 py-6 lg:grid-cols-12">
      <section className="lg:col-span-5 animate-reveal">
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Live planning data · England
        </span>
        <h2 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight">
          What's being planned<br />
          <span className="text-muted-foreground">near your property?</span>
        </h2>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          Enter a UK postcode to see nearby planning applications, decisions, and the constraints
          that affect what can be built — conservation areas, listed buildings, TPOs, Article 4 Directions —
          pulled directly from DLUHC live data.
        </p>
        <ul className="mt-10 space-y-3 text-sm">
          {[
            "Planning applications and appeal decisions nearby",
            "Conservation area and listed building status",
            "Tree Preservation Orders that restrict development",
            "Article 4 Directions removing permitted development rights",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-[7px] block h-1 w-3 shrink-0 bg-foreground" />
              <span className="text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-start gap-3 border border-border bg-surface p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>Coverage is England-primary. Scotland and Wales use separate planning systems. Application data varies by council — constraint layers (conservation areas, listed buildings, TPOs) are more comprehensive.</span>
        </div>
      </section>

      <div className="lg:col-span-7 animate-reveal [animation-delay:120ms]">
        <form onSubmit={onSubmit}>
          <div className="border border-border bg-surface">
            <div className="border-b border-border px-5 py-3">
              <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                Postcode Lookup
              </span>
            </div>
            <div className="p-6">
              <label className="mb-2 block font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                UK Postcode
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder="e.g. SW1A 1AA"
                className="w-full border border-border bg-background px-4 py-3 font-mono-ui text-lg uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                autoComplete="postal-code"
              />
              <p className="mt-2 font-mono-ui text-[10px] text-muted-foreground">
                Full or partial postcode accepted. Results within ~500m radius.
              </p>
            </div>
            <div className="flex justify-end border-t border-border bg-background/40 px-5 py-3">
              <button
                type="submit"
                disabled={isLoading || postcode.trim().length < 3}
                className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />Searching</>
                ) : (
                  <>Search Planning Data <ArrowRight className="h-3 w-3" /></>
                )}
              </button>
            </div>
          </div>
        </form>

        {isLoading && (
          <div className="mt-4 border border-border bg-surface px-5 py-4 font-mono-ui text-[11px] text-muted-foreground">
            <span className="text-foreground">›</span> Resolving postcode · querying DLUHC datasets · checking constraints…
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsPanel({
  result,
  onReset,
}: {
  result: PlanningResult;
  onReset: () => void;
}) {
  const hasApplications = result.applications.length > 0;
  const hasConstraints = Object.values(result.layers).some((v) => v > 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
            Planning Radar · {result.location.district}
          </span>
          <h2 className="flex items-center gap-3 font-display text-3xl tracking-tight">
            <MapPin className="h-5 w-5 text-accent" />
            {result.postcode}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-foreground"
        >
          New Search
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 border border-border bg-surface p-6">
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Planning Context Summary
        </span>
        <p className="mt-3 text-sm leading-relaxed">{result.summary}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          {/* Applications */}
          <section>
            <div className="mb-4 flex items-center justify-between border-b border-foreground pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">Planning Applications</h3>
              <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {result.applications.length} shown
              </span>
            </div>
            {hasApplications ? (
              <div className="space-y-3">
                {result.applications.map((app, i) => (
                  <ApplicationRow key={i} app={app} />
                ))}
              </div>
            ) : (
              <div className="border border-border bg-surface px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No planning applications found in the DLUHC dataset for this postcode.</p>
                <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  This may indicate your council hasn't submitted data yet — check directly with your LPA.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-4">
          {/* Constraint layers */}
          <div className="border border-border bg-surface p-6">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest">
              Planning Constraints
            </h3>
            <div className="space-y-3">
              {[
                { label: "Conservation Areas", count: result.layers.conservationAreas, warning: true },
                { label: "Listed Buildings", count: result.layers.listedBuildings, warning: true },
                { label: "Tree Preservation Orders", count: result.layers.treePreservationOrders, warning: true },
                { label: "Article 4 Directions", count: result.layers.article4Directions, warning: true },
                { label: "Brownfield Sites", count: result.layers.brownfieldSites, warning: false },
              ].map(({ label, count, warning }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={`font-mono-ui text-[11px] font-bold ${
                      count > 0 && warning ? "text-risk-caution" : count > 0 ? "text-foreground" : "text-risk-safe"
                    }`}
                  >
                    {count > 0 ? count : "None"}
                  </span>
                </div>
              ))}
            </div>
            {hasConstraints && (
              <div className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-risk-caution" />
                <span>Constraints flagged above may restrict permitted development or require additional consent.</span>
              </div>
            )}
          </div>

          {/* Coverage note */}
          <div className="border border-border bg-surface p-5">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Data Coverage</span>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{result.coverageNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ApplicationRow({ app }: { app: PlanningResult["applications"][number] }) {
  const statusTone =
    app.status?.toLowerCase().includes("approved") || app.status?.toLowerCase().includes("granted")
      ? "text-risk-safe bg-risk-safe/10"
      : app.status?.toLowerCase().includes("refused") || app.status?.toLowerCase().includes("rejected")
        ? "text-risk-critical bg-risk-critical/10"
        : "text-muted-foreground bg-muted";

  return (
    <div className="border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-foreground">
          {app.reference}
        </span>
        {app.status && (
          <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone}`}>
            {app.status}
          </span>
        )}
        {app.entryDate && (
          <span className="font-mono-ui text-[10px] text-muted-foreground">{app.entryDate}</span>
        )}
      </div>
      <p className="text-sm text-foreground/90">{app.description}</p>
      {app.documentUrl && (
        <a
          href={app.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono-ui text-[10px] uppercase tracking-wider text-accent hover:underline"
        >
          View document <ArrowRight className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}
