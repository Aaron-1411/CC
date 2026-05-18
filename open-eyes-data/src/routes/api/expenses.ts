import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export const Route = createFileRoute("/api/expenses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const mp = url.searchParams.get("mp") ?? "";
          const category = url.searchParams.get("category") ?? "";
          const year = url.searchParams.get("year") ?? "";
          const params = new URLSearchParams();
          if (mp) params.set("MP_NAME", mp);
          if (category) params.set("CATEGORY", category);
          if (year) params.set("YEAR", year);
          params.set("$top", "200");
          const upstream = `https://www.theipsa.org.uk/api/expense?${params.toString()}`;
          const data = await cached(`exp:${params.toString()}`, 300_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            return r.json();
          });
          return jsonResponse(
            envelope(data, "IPSA — Independent Parliamentary Standards Authority", upstream),
          );
        } catch (e) {
          return errorResponse(`Expenses fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});