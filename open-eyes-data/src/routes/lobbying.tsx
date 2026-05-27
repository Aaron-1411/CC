import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActionBar, Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/lobbying")({
  head: () => ({
    meta: [
      { title: "Lobbying Register — transparenC" },
      { name: "description", content: "The statutory register of consultant lobbyists — organisations paid to communicate with ministers on behalf of clients." },
      { property: "og:title", content: "Lobbying Register — transparenC" },
    ],
  }),
  component: LobbyingPage,
});

type LobbyingResp = {
  publications: Array<{ title: string; description?: string; url: string; date: string }>;
  registerEntries?: Array<{ name: string; clients?: string[]; activities?: string }>;
};

function LobbyingPage() {
  const q = useQuery({
    queryKey: ["lobbying"],
    queryFn: () => getJSON<LobbyingResp>("/api/lobbying"),
    staleTime: 5 * 60_000,
  });

  const publications = q.data?.data.publications ?? [];
  const registerEntries = q.data?.data.registerEntries ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Lobbying Register"
          title="Who is paid to influence ministers"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          The statutory register of consultant lobbyists — organisations paid to communicate with
          ministers and permanent secretaries on behalf of clients. Required by law since 2015.
        </p>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!q.isLoading && registerEntries.length > 0 && (
        <section className="space-y-3">
          <h3 className="label-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Register Entries
          </h3>
          <div className="grid gap-3">
            {registerEntries.map((entry, i) => (
              <Card key={i}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <FlagPill variant="warn">Lobbyist</FlagPill>
                </div>
                <h3 className="font-display text-lg font-semibold">{entry.name}</h3>
                {entry.clients && entry.clients.length > 0 && (
                  <div className="mt-2">
                    <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Clients
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.clients.map((client, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 bg-surface-2 border border-border rounded text-xs label-mono"
                        >
                          {client}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {entry.activities && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {entry.activities}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {!q.isLoading && publications.length > 0 && (
        <section className="space-y-3">
          <h3 className="label-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Publications
          </h3>
          <div className="grid gap-3">
            {publications.map((pub, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <FlagPill variant="warn">Publication</FlagPill>
                    </div>
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-display text-lg font-semibold hover:text-amber leading-snug"
                    >
                      {pub.title}
                    </a>
                    {pub.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {pub.description}
                      </p>
                    )}
                  </div>
                  <div className="label-mono text-[10px] uppercase text-muted-foreground shrink-0">
                    {relTime(pub.date)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!q.isLoading && publications.length === 0 && registerEntries.length === 0 && !q.error && (
        <div className="text-muted-foreground text-sm py-12 text-center">No lobbying data found.</div>
      )}

      <ActionBar
        mpTopic="lobbying transparency, consultant lobbyists register and influence on government"
        briefingTopic="UK lobbying register, consultant lobbyists and access to ministers"
        shareText="See who is paid to lobby UK government ministers — the statutory register"
      />

      <DataProvenance
        source="Office of the Registrar of Consultant Lobbyists"
        url="https://registrarofconsultantlobbyists.org.uk"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
