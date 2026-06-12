import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/primitives";
import { PLEDGE_STATUS_LABEL, type PledgeStatus } from "@/contract/pledges";
import { SOURCES, LICENCE_LABELS, type DataSource } from "@/contract/sources";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — transparenC" },
      {
        name: "description",
        content:
          "How transparenC assesses pledges, sources its data, and corrects its mistakes. The rubric, the evidence rule, and how to challenge an assessment.",
      },
      { property: "og:title", content: "Methodology — transparenC" },
    ],
  }),
  component: MethodologyPage,
});

const STATUS_DEFINITIONS: Record<PledgeStatus, string> = {
  delivered: "The pledge has been met in full, evidenced by official data or the public record.",
  on_track:
    "Measurable progress is consistent with hitting the target by its date, on current trajectory.",
  in_progress:
    "Action has started and is under way, but it is too early to say whether the target will be met.",
  stalled: "The pledge was started but has since made little or no measurable progress.",
  off_track:
    "On current data the target will not be met by its date, or the policy has been reversed.",
  not_assessable:
    "The pledge is not yet measurable, or we could not locate a verifiable official source. We say so rather than guess.",
};

const STATUS_ORDER: PledgeStatus[] = [
  "delivered",
  "on_track",
  "in_progress",
  "stalled",
  "off_track",
  "not_assessable",
];

function MethodologyPage() {
  // Group sources by licence for the licence table.
  const byLicence = Object.values(SOURCES).reduce<Record<string, DataSource[]>>((acc, s) => {
    (acc[s.licence] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-14">
      {/* Hero */}
      <section className="pt-2">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-3">
          Methodology
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
          How we judge, source, and correct
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          This site is built to survive its own scrutiny. Where a number can settle a question, the
          number does — every figure links to its official source and carries the date it describes.
          Where judgement is unavoidable, the rubric and the evidence are published here, and anyone
          can challenge an assessment.
        </p>
      </section>

      {/* Pledge rubric */}
      <section className="space-y-4">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Pledge rubric
          </div>
          <h2 className="font-display text-2xl font-bold">What each status means</h2>
          <p className="text-muted-foreground text-sm mt-1">
            We assign one of six statuses to each tracked pledge. A status only changes when a
            logged status-change records the date, the reason, and links to the evidence.
          </p>
        </div>
        <div className="space-y-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
              <span className="label-mono text-[10px] uppercase tracking-wider text-amber shrink-0 w-28 pt-0.5">
                {PLEDGE_STATUS_LABEL[s]}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {STATUS_DEFINITIONS[s]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Honesty statement */}
      <section className="space-y-3">
        <Card className="bg-amber/5 border-amber/20 space-y-2">
          <div className="label-mono text-[10px] uppercase tracking-wider text-amber">
            Where judgement is unavoidable
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Not every pledge reduces to a single number. Assessing whether something is "on track"
            is a judgement. We make it openly: applied by us, against the rubric above, with the
            evidence cited on each pledge and every status change logged. We hold all parties to the
            same standard. Where we cannot locate a verifiable source for a pledge, we mark it
            <em> Not yet assessable</em> rather than guess.
          </p>
        </Card>
      </section>

      {/* Contest route */}
      <section className="space-y-3">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Challenge an assessment
          </div>
          <h2 className="font-display text-2xl font-bold">Think we got it wrong?</h2>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Any party, MP, official or reader can contest a pledge status or any figure on the site by
          sending the evidence. We commit to reviewing it against the source and logging the outcome
          — including in our public corrections log if we were wrong.
        </p>
        <a
          href="mailto:corrections@transparenc.uk?subject=Challenge%20to%20a%20transparenC%20assessment"
          className="inline-block px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider"
        >
          Submit a challenge
        </a>
        <p className="text-[11px] text-muted-foreground/70">
          (Contact address is provisional pending the custom domain.)
        </p>
      </section>

      {/* Sources & licences */}
      <section className="space-y-4">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Data sources
          </div>
          <h2 className="font-display text-2xl font-bold">Where the data comes from</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Every dataset, its update cadence, and its licence. Parliament data is under the Open
            Parliament Licence; most government data under the Open Government Licence v3.0.
          </p>
        </div>
        {Object.entries(byLicence).map(([licence, list]) => (
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

      <div className="pt-4 border-t border-border flex flex-wrap gap-4">
        <Link
          to="/about"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          ← About & corrections log
        </Link>
        <Link
          to="/parties"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          Pledge tracker →
        </Link>
      </div>
    </div>
  );
}
