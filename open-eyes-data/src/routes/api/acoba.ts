import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export const Route = createFileRoute("/api/acoba")({
  server: {
    handlers: {
      GET: async ({ request: _request }) => {
        try {
          const upstream =
            "https://www.gov.uk/api/search.json?filter_organisations[]=advisory-committee-on-business-appointments&count=25&order=updated-newest&fields[]=title,description,public_timestamp,link,content_id";

          const data = await cached("acoba:v1", 1_800_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            const json = await r.json();

            const cases: Array<{
              title: string;
              description?: string;
              url: string;
              date: string;
            }> = (json.results ?? []).map((item: Record<string, string>) => ({
              title: item.title ?? "",
              description: item.description,
              url: item.link ? `https://www.gov.uk${item.link}` : "",
              date: item.public_timestamp ?? "",
            }));

            return { cases };
          });

          return jsonResponse(
            envelope(
              data,
              "ACOBA via GOV.UK",
              "https://www.gov.uk/government/organisations/advisory-committee-on-business-appointments"
            )
          );
        } catch (e) {
          return errorResponse(`ACOBA fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
