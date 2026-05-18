import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export const Route = createFileRoute("/api/bills")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const take = url.searchParams.get("take") ?? "25";
          const skip = url.searchParams.get("skip") ?? "0";
          const upstream = `https://bills-api.parliament.uk/api/v1/Bills?Take=${take}&Skip=${skip}&SortOrder=DateUpdatedDescending`;
          const data = await cached(`bills:${take}:${skip}`, 120_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            return r.json();
          });
          return jsonResponse(envelope(data, "UK Parliament Bills API", upstream));
        } catch (e) {
          return errorResponse(`Bills fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});