import { createFileRoute, Link } from "@tanstack/react-router";
import { FlagPill } from "@/components/primitives";
import { LICENCE_LABELS } from "@/contract/sources";
import { PLEDGE_STATUS_META } from "@/contract/pledges";
import {
  CITATION_TOTALS,
  CIVIC_REFERENCES,
  HEADLINE_CITATIONS,
  PLEDGE_CITATIONS_BY_PARTY,
  SOURCES_BY_LICENCE,
} from "@/data/citations";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Citations — transparenC" },
      {
        name: "description",
        content:
          "Every source and citation behind the facts on transparenC, in one place: the data registry, the headline figure on each issue, the evidence behind every tracked party pledge, and the civics references in our explainers.",
      },
      { property: "og:title", content: "Citations — transparenC" },
    ],
  }),
  component: CitationsPage,
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format an ISO date (YYYY-MM-DD) without timezone drift. */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function CitationsPage() {
  return (
    <div className="max-w-3xl space-y-14">
      {/* Hero */}
      <section className="pt-2">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-3">
          Citations
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
          Every fact, traced to its source
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          transparenC's rule is simple: every figure on the site links to the official record it
          comes from and carries the date it describes. This page gathers that evidence base in one
          place — the upstream data sources, the headline figure on each issue, the citation behind
          every tracked party pledge, and the official guidance referenced in our explainers.
        </p>
        <nav className="mt-5 flex flex-wrap gap-x-6 gap-y-2 label-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <a href="#sources" className="hover:text-amber">
            <span className="text-foreground">{CITATION_TOTALS.sources}</span> data sources
          </a>
          <a href="#headline" className="hover:text-amber">
            <span className="text-foreground">{CITATION_TOTALS.headlineFigures}</span> headline
            figures
          </a>
          <a href="#pledges" className="hover:text-amber">
            <span className="text-foreground">
              {CITATION_TOTALS.pledgesCited}/{CITATION_TOTALS.pledges}
            </span>{" "}
            pledges cited
          </a>
          <a href="#civics" className="hover:text-amber">
            <span className="text-foreground">{CITATION_TOTALS.civicReferences}</span> civics
            references
          </a>
        </nav>
      </section>

      {/* 1. Primary data sources */}
      <section id="sources" className="space-y-4 scroll-mt-24">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Primary data sources
          </div>
          <h2 className="font-display text-2xl font-bold">The upstreams behind the live data</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Every dataset the site reads from, with its update cadence and licence. Each live tool
            on transparenC draws from one or more of these. Parliament data is under the Open
            Parliament Licence; most government data under the Open Government Licence v3.0.
          </p>
        </div>
        {Object.entries(SOURCES_BY_LICENCE).map(([licence, list]) => (
          <div key={licence} className="space-y-2">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {LICENCE_LABELS[licence as keyof typeof LICENCE_LABELS]}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 align-top">
                        <a
                          href={s.homepage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber hover:underline"
                        >
                          {s.name}
                        </a>
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground whitespace-nowrap label-mono text-[11px] uppercase tracking-wider">
                        {s.cadence}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <a
                          href={s.termsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-amber underline"
                        >
                          terms ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* 2. Headline figures */}
      <section id="headline" className="space-y-4 scroll-mt-24">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Headline figures
          </div>
          <h2 className="font-display text-2xl font-bold">The number on each issue</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Each issue hub leads with a single figure. Here is that figure, the source it links to,
            and the date it describes.
          </p>
        </div>
        <div className="space-y-2">
          {HEADLINE_CITATIONS.map((c) => (
            <div key={c.issueKey} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to="/issues/$issue"
                    params={{ issue: c.issueKey }}
                    className="font-display text-base font-semibold hover:text-amber"
                  >
                    {c.issueTitle}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-0.5">{c.stat.label}</div>
                </div>
                <div className="font-display text-2xl font-bold text-amber shrink-0 tabular-nums">
                  {c.formatted}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 label-mono text-[10px] uppercase tracking-wider">
                <a
                  href={c.stat.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber hover:underline"
                >
                  {c.source.name} ↗
                </a>
                <span className="text-muted-foreground">As of {fmtDate(c.stat.asOf)}</span>
                <span className="text-muted-foreground">{LICENCE_LABELS[c.source.licence]}</span>
              </div>
              {c.stat.methodologyNote && (
                <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
                  {c.stat.methodologyNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Party pledge citations */}
      <section id="pledges" className="space-y-4 scroll-mt-24">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Party pledges
          </div>
          <h2 className="font-display text-2xl font-bold">Evidence behind every tracked pledge</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Each pledge we track carries its status and the source behind that assessment. Verbatim
            manifesto wording is shown in quotation marks with its citation. Where we could not
            locate a verifiable source, we mark the pledge <em>Not yet assessable</em> rather than
            guess.
          </p>
        </div>
        {PLEDGE_CITATIONS_BY_PARTY.map((party) => (
          <div key={party.partyId} className="space-y-2">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {party.partyName} · {party.pledges.length} pledges
            </div>
            <div className="space-y-2">
              {party.pledges.map((p) => {
                const meta = PLEDGE_STATUS_META[p.status];
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border bg-surface p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          {p.issue}
                        </div>
                        <p className="text-sm font-medium leading-snug">{p.promise}</p>
                      </div>
                      <FlagPill variant={meta.tone}>
                        {meta.icon} {meta.label}
                      </FlagPill>
                    </div>
                    {p.quote && (
                      <blockquote className="border-l-2 border-amber/40 pl-3 text-sm text-muted-foreground italic">
                        “{p.quote}”
                      </blockquote>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 label-mono text-[10px] uppercase tracking-wider">
                      {p.sourceUrl ? (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber hover:underline"
                        >
                          {p.sourceLabel ?? "Source"} ↗
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60">No source on file</span>
                      )}
                      {p.quoteSourceUrl && (
                        <a
                          href={p.quoteSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber hover:underline"
                        >
                          Manifesto{p.quoteDate ? ` (${fmtDate(p.quoteDate)})` : ""} ↗
                        </a>
                      )}
                      <Link
                        to="/parties/pledge/$id"
                        params={{ id: p.id }}
                        className="text-muted-foreground hover:text-amber"
                      >
                        Permalink →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* 4. Civics & guidance references */}
      <section id="civics" className="space-y-4 scroll-mt-24">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Civics & guidance
          </div>
          <h2 className="font-display text-2xl font-bold">Official references in our explainers</h2>
          <p className="text-muted-foreground text-sm mt-1">
            The Learn modules and the democratic-rights index point only to official guidance. Each
            reference below is deduplicated, with where on the site it is used.
          </p>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {CIVIC_REFERENCES.map((r) => (
                <tr key={r.url} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 align-top">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber hover:underline"
                    >
                      {r.label}
                    </a>
                  </td>
                  <td className="px-3 py-2 align-top text-right text-muted-foreground label-mono text-[10px] uppercase tracking-wider">
                    {r.contexts.join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cross-links */}
      <div className="pt-4 border-t border-border flex flex-wrap gap-4">
        <Link
          to="/methodology"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          ← Methodology
        </Link>
        <Link
          to="/about"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          Corrections log →
        </Link>
      </div>
    </div>
  );
}
