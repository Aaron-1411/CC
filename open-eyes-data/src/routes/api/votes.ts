import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

// votes.parliament.uk is Cloudflare-protected (returns 403 from server).
// commonsvotes-api.parliament.uk is the open data API.
const CV_BASE = "https://commonsvotes-api.parliament.uk/data";

export const Route = createFileRoute("/api/votes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const divisionId = url.searchParams.get("divisionId");
          const memberId = url.searchParams.get("memberId");

          if (divisionId) {
            const upstream = `${CV_BASE}/division/${divisionId}/votes.json?skip=0&take=500`;
            const data = await cached(`votes:division:${divisionId}`, 600_000, async () => {
              const r = await fetch(upstream, { headers: { accept: "application/json" } });
              if (!r.ok) throw new Error(`upstream ${r.status}`);
              return r.json();
            });
            return jsonResponse(envelope(data, "UK Parliament Commons Votes API", CV_BASE));
          }

          if (memberId) {
            const upstream = `${CV_BASE}/divisions.json/membervoting?memberId=${memberId}&skip=0&take=25`;
            const data = await cached(`votes:member:${memberId}`, 300_000, async () => {
              const r = await fetch(upstream, { headers: { accept: "application/json" } });
              if (!r.ok) throw new Error(`upstream ${r.status}`);
              return r.json();
            });
            return jsonResponse(envelope(data, "UK Parliament Commons Votes API", CV_BASE));
          }

          const take = url.searchParams.get("take") ?? "25";
          const skip = url.searchParams.get("skip") ?? "0";
          const upstream = `${CV_BASE}/divisions.json/search?skip=${skip}&take=${take}`;
          const data = await cached(`votes:divisions:v2:${skip}:${take}`, 300_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            return r.json();
          });
          return jsonResponse(envelope(data, "UK Parliament Commons Votes API", CV_BASE));
        } catch (e) {
          return errorResponse(`Votes fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
