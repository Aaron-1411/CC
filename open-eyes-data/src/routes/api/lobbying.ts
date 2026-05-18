import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export const Route = createFileRoute("/api/lobbying")({
  server: {
    handlers: {
      GET: async ({ request: _request }) => {
        try {
          const data = await cached("lobbying:v1", 1_800_000, async () => {
            const govUkUrl =
              "https://www.gov.uk/api/search.json?filter_organisations[]=office-of-the-registrar-of-consultant-lobbyists&count=20&order=updated-newest&fields[]=title,description,public_timestamp,link";

            const govUkRes = await fetch(govUkUrl, { headers: { accept: "application/json" } });
            if (!govUkRes.ok) throw new Error(`GOV.UK upstream ${govUkRes.status}`);
            const govUkJson = await govUkRes.json();

            const publications: Array<{
              title: string;
              description?: string;
              url: string;
              date: string;
            }> = (govUkJson.results ?? []).map((item: Record<string, string>) => ({
              title: item.title ?? "",
              description: item.description,
              url: item.link ? `https://www.gov.uk${item.link}` : "",
              date: item.public_timestamp ?? "",
            }));

            let registerEntries:
              | Array<{ name: string; clients?: string[]; activities?: string }>
              | undefined;

            try {
              const orclRes = await fetch(
                "https://registrationoflobbying.com/register/search.json?q=&page=1",
                { headers: { accept: "application/json" } }
              );
              if (orclRes.ok) {
                const orclJson = await orclRes.json();
                const entries = orclJson.entries ?? orclJson.results ?? orclJson;
                if (Array.isArray(entries) && entries.length > 0) {
                  registerEntries = entries.map(
                    (e: Record<string, unknown>) => ({
                      name: (e.name as string) ?? "",
                      clients: Array.isArray(e.clients)
                        ? (e.clients as string[])
                        : undefined,
                      activities:
                        typeof e.activities === "string" ? e.activities : undefined,
                    })
                  );
                }
              }
            } catch {
              // ORCL is optional — swallow failures
            }

            return { publications, ...(registerEntries ? { registerEntries } : {}) };
          });

          return jsonResponse(
            envelope(data, "ORCL · GOV.UK", "https://registrationoflobbying.com")
          );
        } catch (e) {
          return errorResponse(`Lobbying fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
