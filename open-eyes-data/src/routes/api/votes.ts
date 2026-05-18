import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export const Route = createFileRoute("/api/votes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const divisionId = url.searchParams.get("divisionId");
          const memberId = url.searchParams.get("memberId");

          if (divisionId) {
            const upstream = `https://votes.parliament.uk/votes/commons/division/${divisionId}/votes?skip=0&take=500`;
            const data = await cached(`votes:division:${divisionId}`, 600_000, async () => {
              const r = await fetch(upstream, { headers: { accept: "application/json" } });
              if (!r.ok) throw new Error(`upstream ${r.status}`);
              return r.json();
            });
            return jsonResponse(envelope(data, "UK Parliament Votes API", "https://votes.parliament.uk"));
          }

          if (memberId) {
            const upstream = `https://votes.parliament.uk/votes/commons/member/${memberId}/divisions?skip=0&take=25`;
            const data = await cached(`votes:member:${memberId}`, 300_000, async () => {
              const r = await fetch(upstream, { headers: { accept: "application/json" } });
              if (!r.ok) throw new Error(`upstream ${r.status}`);
              return r.json();
            });
            return jsonResponse(envelope(data, "UK Parliament Votes API", "https://votes.parliament.uk"));
          }

          const take = url.searchParams.get("take") ?? "25";
          const skip = url.searchParams.get("skip") ?? "0";
          const upstream = `https://votes.parliament.uk/votes/commons/division?skip=${skip}&take=${take}&queryParameters.includeWhenMember=`;
          const data = await cached(`votes:divisions:${skip}:${take}`, 300_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            return r.json();
          });
          return jsonResponse(envelope(data, "UK Parliament Votes API", "https://votes.parliament.uk"));
        } catch (e) {
          return errorResponse(`Votes fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
