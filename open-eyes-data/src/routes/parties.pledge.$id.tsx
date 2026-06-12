import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, FlagPill } from "@/components/primitives";
import { getPledgeById, toPledgeStatus } from "@/data/parties";
import { PLEDGE_STATUS_META } from "@/contract/pledges";

export const Route = createFileRoute("/parties/pledge/$id")({
  head: ({ params }) => {
    const pledge = getPledgeById(params.id);
    const title = pledge
      ? `${pledge.partyName}: ${pledge.promise} — transparenC`
      : "Pledge — transparenC";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: pledge
            ? `${pledge.partyName} pledge on ${pledge.issue}: "${pledge.promise}". Status and evidence on transparenC.`
            : "UK party pledge tracker — transparenC",
        },
        { property: "og:title", content: title },
      ],
    };
  },
  loader: ({ params }) => {
    const pledge = getPledgeById(params.id);
    if (!pledge) throw notFound();
    return { pledge };
  },
  component: PledgePage,
  notFoundComponent: () => (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Pledge not found</h1>
      <p className="text-muted-foreground">
        This pledge link doesn&apos;t resolve. It may have been renumbered.
      </p>
      <Link to="/parties" className="text-amber hover:underline label-mono text-xs uppercase">
        ← Back to all pledges
      </Link>
    </div>
  ),
});

function PledgePage() {
  const { id } = Route.useParams();
  const pledge = getPledgeById(id);
  if (!pledge) return null; // notFoundComponent handles the missing case
  const status = toPledgeStatus(pledge.status);
  const meta = PLEDGE_STATUS_META[status];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/parties"
          className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber"
        >
          ← All pledges
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="label-mono text-[10px] uppercase tracking-wider text-amber">
          {pledge.partyName}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <FlagPill variant={meta.tone}>
            <span aria-hidden="true">{meta.icon}</span> {meta.label}
          </FlagPill>
          <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {pledge.issue}
          </span>
        </div>

        {/* The pledge — verbatim quote when verified, else our tracked summary */}
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {pledge.quote ? "The pledge — verbatim" : "Pledge — as tracked by transparenC"}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          {pledge.promise}
        </h1>

        {pledge.quote && (
          <figure className="border-l-4 border-amber/50 pl-4 mt-2 space-y-2">
            <blockquote className="text-base text-foreground leading-relaxed italic">
              &ldquo;{pledge.quote}&rdquo;
            </blockquote>
            <figcaption className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {pledge.quoteSourceUrl ? (
                <a
                  href={pledge.quoteSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber hover:underline"
                >
                  {pledge.partyName} manifesto ↗
                </a>
              ) : (
                `${pledge.partyName} manifesto`
              )}
              {pledge.quoteDate
                ? ` · ${new Date(pledge.quoteDate).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </figcaption>
          </figure>
        )}
      </div>

      {/* Assessment / evidence */}
      <Card className="space-y-3">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber">
          Assessment &amp; evidence
        </div>
        {pledge.detail ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{pledge.detail}</p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            No assessment note recorded yet.
          </p>
        )}
        {pledge.sourceUrl && (
          <a
            href={pledge.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
          >
            Source: {pledge.sourceLabel ?? "official record"} ↗
          </a>
        )}
      </Card>

      {/* Methodology / challenge */}
      <Card className="bg-amber/5 border-amber/20 space-y-2">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber">
          How this is assessed
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Status is assigned against our published rubric and applied the same way to every party.
          Think this is wrong? You can challenge it with evidence.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/methodology"
            className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
          >
            Read the rubric →
          </Link>
          <Link
            to="/methodology"
            hash="challenge"
            className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber"
          >
            Challenge this assessment →
          </Link>
        </div>
      </Card>
    </div>
  );
}
