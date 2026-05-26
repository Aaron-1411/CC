import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { PARTIES, PLEDGES } from "@/data/parties";

export const Route = createFileRoute("/api/parties")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("parties:static:v1", 24 * 60 * 60_000, async () => ({
            parties: PARTIES,
            pledges: PLEDGES,
          }));
          return jsonResponse(
            envelope(
              data,
              "transparenC — curated party data, accurate as of May 2026",
              "https://www.electoralcalculus.co.uk",
            ),
          );
        } catch (e) {
          return errorResponse(`Parties fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
