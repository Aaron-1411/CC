import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const IPSA_BASE = "https://www.theipsa.org.uk/api/expense";

async function fetchIpsa(upstream: string): Promise<unknown[]> {
  const r = await fetch(upstream, { headers: { accept: "application/json" } });
  if (!r.ok) {
    throw new Error(
      `IPSA returned ${r.status}. Data is sourced from the IPSA published API (${IPSA_BASE}). ` +
        `The service may be temporarily unavailable — check ${IPSA_BASE} directly.`,
    );
  }
  const json = await r.json();
  if (Array.isArray(json)) return json as unknown[];
  if (json && typeof json === "object" && Array.isArray((json as Record<string, unknown>).value)) {
    return (json as { value: unknown[] }).value;
  }
  return [];
}

export const Route = createFileRoute("/api/expenses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const mp = url.searchParams.get("mp") ?? "";
          const category = url.searchParams.get("category") ?? "";
          const year = url.searchParams.get("year") ?? "";

          const cacheKey = `exp:${mp}:${category}`;

          let upstream: string;

          if (mp) {
            // OData filter by MP name
            const filter = `$filter=contains(tolower(MP_NAME),'${mp.toLowerCase()}')`;
            const params = new URLSearchParams({ $top: "200" });
            if (category) params.set("CATEGORY", category);
            if (year) params.set("YEAR", year);
            upstream = `${IPSA_BASE}?${params.toString()}&${filter}`;
          } else {
            // No mp param — use published summary endpoint, fall back to OData top-200
            upstream = `${IPSA_BASE}/claims?limit=200`;
          }

          const data = await cached(cacheKey, 300_000, async () => {
            try {
              return await fetchIpsa(upstream);
            } catch (primaryErr) {
              if (!mp) {
                // Try OData fallback
                const fallback = `${IPSA_BASE}?$top=200&$orderby=AMOUNT_CLAIMED desc`;
                try {
                  return await fetchIpsa(fallback);
                } catch {
                  // Re-throw the original error
                  throw primaryErr;
                }
              }
              throw primaryErr;
            }
          });

          return jsonResponse(
            envelope(
              { expenses: data, total: (data as unknown[]).length },
              "IPSA — Independent Parliamentary Standards Authority",
              IPSA_BASE,
            ),
          );
        } catch (e) {
          return errorResponse(`Expenses fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
