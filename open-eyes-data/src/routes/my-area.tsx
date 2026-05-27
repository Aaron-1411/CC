import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";
import { useConstituency } from "@/hooks/useConstituency";
import { PostcodeWidget } from "@/components/postcode-widget";
import type { MPVote, MPInterest } from "@/routes/api/mp";

export const Route = createFileRoute("/my-area")({
  head: () => ({
    meta: [
      { title: "My Area — transparenC" },
      {
        name: "description",
        content:
          "Your MP's voting record, declared financial interests, local policing data and accountability issues — personalised to your constituency.",
      },
      { property: "og:title", content: "My Area — transparenC" },
    ],
  }),
  component: MyAreaPage,
});

type MPDetailData = {
  id: number;
  recentVotes: MPVote[];
  interests: MPInterest[];
};

// Map interest categories to plain English
function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    "Employment and earnings":                       "Paid employment",
    "Donations and other support for activities":   "Donations received",
    "Gifts, benefits and hospitality":              "Gifts & hospitality",
    "Shareholdings":                                "Share holdings",
    "Land and property":                            "Land & property",
    "Sponsorships":                                 "Sponsorships",
    "Overseas visits":                              "Overseas trips",
    "Overseas benefits and gifts":                  "Overseas gifts",
    "Family members employed":                      "Family employment",
    "Family members in lobbying":                   "Family in lobbying",
    "Miscellaneous":                                "Other",
  };
  for (const [k, v] of Object.entries(map)) {
    if (cat.toLowerCase().includes(k.toLowerCase().slice(0, 10))) return v;
  }
  return cat;
}

function MyAreaPage() {
  const { data: constituency, clear } = useConstituency();

  const mpId = constituency?.mp?.id;

  const mpQ = useQuery({
    queryKey: ["mp-detail", mpId],
    queryFn: () => getJSON<MPDetailData>(`/api/mp?id=${mpId}`),
    enabled: !!mpId,
    staleTime: 4 * 60 * 60_000,
  });

  const mpDetail = mpQ.data?.data;

  if (!constituency) {
    return (
      <div className="space-y-6">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            My Area
          </div>
          <h1 className="font-display text-3xl font-black">Your local accountability hub</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Enter your postcode to see your MP's voting record, declared financial interests, local policing data and more.
          </p>
        </div>
        <PostcodeWidget />
        <ContextBlock heading="What you'll see once you enter your postcode" variant="default">
          <ul className="space-y-1 list-disc list-inside">
            <li>Your MP's name, party and recent votes in the Commons</li>
            <li>Your MP's declared financial interests (shareholdings, second jobs, paid lobbying)</li>
            <li>Your local police force's stop and search data</li>
            <li>Links to write to your MP on any issue</li>
            <li>Your MP's expenses claim totals</li>
          </ul>
        </ContextBlock>
      </div>
    );
  }

  const { mp, constituency: constituencyName, policeForceId, localAuthority, region } = constituency;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="border-l-4 border-amber pl-5 py-1">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          My Area
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">
          {constituencyName}
        </h1>
        <p className="mt-2 text-muted-foreground">{localAuthority}{region ? ` · ${region}` : ""}</p>
        <button
          onClick={clear}
          className="mt-2 label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ✕ Change postcode
        </button>
      </section>

      {/* MP card */}
      {mp && (
        <section>
          <SectionHeader eyebrow="Your MP" title={mp.name} />
          <Card>
            <div className="flex flex-wrap items-start gap-5">
              {mp.thumbnailUrl && (
                <img
                  src={mp.thumbnailUrl}
                  alt={mp.name}
                  className="w-20 h-24 object-cover rounded border border-border shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: mp.partyColour }} />
                  <span className="font-display text-xl font-bold">{mp.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">{mp.party} MP for {mp.constituency}</div>
                {mp.membershipFrom && (
                  <div className="label-mono text-[10px] text-muted-foreground">
                    Member of Parliament since {mp.membershipFrom}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={`https://www.writetothem.com/?a=W&pc=${encodeURIComponent(constituency.postcode)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber text-amber-foreground rounded label-mono text-[10px] uppercase tracking-wider hover:opacity-90"
                  >
                    ✉ Write to {mp.name.split(" ")[0]}
                  </a>
                  <a
                    href={`https://members.parliament.uk/member/${mp.id}/career`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-border rounded label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    Parliament profile →
                  </a>
                  {mp.email && (
                    <a
                      href={`mailto:${mp.email}`}
                      className="px-3 py-1.5 border border-border rounded label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Email directly →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Voting record */}
      {mp && (
        <section>
          <SectionHeader
            eyebrow="Voting record"
            title={`How ${mp.name.split(",")[0]} has voted`}
            right={<LiveBadge timestamp={mpQ.data?.meta.fetchedAt} />}
          />
          {mpQ.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {mpQ.error && <ErrorNote>{(mpQ.error as Error).message}</ErrorNote>}
          {!mpQ.isLoading && mpDetail && mpDetail.recentVotes.length === 0 && (
            <p className="text-muted-foreground text-sm">No recent votes recorded.</p>
          )}
          {!mpQ.isLoading && mpDetail && mpDetail.recentVotes.length > 0 && (
            <div className="space-y-2">
              {mpDetail.recentVotes.map((v) => (
                <Card key={v.divisionId} className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <FlagPill variant={v.votedAye ? "ok" : "direct"}>
                      {v.votedAye ? "Aye" : "No"}
                    </FlagPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{v.title}</p>
                      <p className="label-mono text-[10px] text-muted-foreground mt-0.5">
                        {relTime(v.date)}
                        {v.actedAsTeller && " · Acted as teller"}
                        {v.tiedVote && " · Tied vote"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-3">
            <Link
              to="/votes"
              className="label-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
            >
              See all Commons divisions →
            </Link>
          </div>
        </section>
      )}

      {/* Financial interests */}
      {mp && (
        <section>
          <SectionHeader
            eyebrow="Declared financial interests"
            title="Second jobs, shares, gifts & more"
          />
          <p className="text-muted-foreground text-sm -mt-2 mb-4 max-w-xl">
            MPs must declare all financial interests in the Register of Members' Financial Interests.
            These are updated when changes occur.
          </p>
          {mpQ.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {!mpQ.isLoading && mpDetail && mpDetail.interests.length === 0 && (
            <Card>
              <p className="text-sm text-muted-foreground">
                No interests currently declared in the register.
              </p>
            </Card>
          )}
          {!mpQ.isLoading && mpDetail && mpDetail.interests.length > 0 && (
            <div className="space-y-2">
              {mpDetail.interests.map((interest) => (
                <Card key={interest.interestId} className="py-3 px-4">
                  <div className="flex flex-wrap items-start gap-2">
                    <FlagPill variant="neutral">
                      {categoryLabel(interest.category)}
                    </FlagPill>
                    {interest.registeredLate && (
                      <FlagPill variant="warn">Registered late</FlagPill>
                    )}
                  </div>
                  <p className="text-sm mt-2 leading-relaxed">{interest.description}</p>
                </Card>
              ))}
            </div>
          )}
          {!mpQ.isLoading && (
            <div className="mt-3">
              <a
                href={`https://members.parliament.uk/member/${mp.id}/registeredinterests`}
                target="_blank"
                rel="noreferrer"
                className="label-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
              >
                Full register on parliament.uk →
              </a>
            </div>
          )}
        </section>
      )}

      {/* Local policing */}
      <section>
        <SectionHeader eyebrow="Local policing" title="Stop & search in your area" />
        <Card>
          <p className="text-sm text-muted-foreground mb-3">
            Your local force: <strong className="text-foreground">{policeForceId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
          </p>
          <Link
            to="/stop-search"
            className="inline-flex items-center gap-1 px-3 py-2 bg-surface-2 border border-border rounded label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber hover:border-amber/40"
          >
            View stop &amp; search data for your force →
          </Link>
        </Card>
      </section>

      {/* Related tools */}
      <section>
        <SectionHeader eyebrow="Explore further" title="Data relevant to your area" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: "/contracts", label: "Government contracts", copy: "Search contracts awarded by government departments" },
            { to: "/petitions", label: "Active petitions", copy: "Sign or share petitions on issues that matter to you" },
            { to: "/nhs", label: "NHS performance", copy: "A&E wait times and NHS England statistics" },
            { to: "/parties", label: "Party promises", copy: "What every party promised and how they're delivering" },
            { to: "/briefing", label: "AI briefing", copy: "Ask about any local or national accountability issue" },
            { to: "/expenses", label: "MP expenses", copy: "Find your MP in the IPSA expenses data" },
          ].map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group block bg-surface border border-border rounded-lg p-4 hover:border-amber/40 hover:bg-surface-2 transition-colors"
            >
              <h3 className="font-display text-sm font-bold group-hover:text-amber transition-colors">{tool.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <DataProvenance
        source="UK Parliament Members API · postcodes.io · data.police.uk"
        url="https://members-api.parliament.uk"
        licence="Open Parliament Licence · Open Government Licence v3.0"
        fetchedAt={mpQ.data?.meta.fetchedAt}
      />
    </div>
  );
}
