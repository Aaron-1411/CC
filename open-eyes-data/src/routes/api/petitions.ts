import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

type Petition = {
  id: number;
  attributes: {
    action: string;
    background: string;
    signature_count: number;
    state: string;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    debate_threshold_reached_at: string | null;
    response_threshold_reached_at: string | null;
    scheduled_debate_date: string | null;
    debate?: { debated_on?: string | null } | null;
  };
  links: { self: string };
};

export const Route = createFileRoute("/api/petitions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const page = url.searchParams.get("page") ?? "1";
          const state = url.searchParams.get("state") ?? "open";
          const upstream = `https://petition.parliament.uk/petitions.json?state=${encodeURIComponent(state)}&page=${encodeURIComponent(page)}`;
          const data = await cached(`petitions:${state}:${page}`, 60_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`upstream ${r.status}`);
            const j = (await r.json()) as { data: Petition[]; links?: Record<string, string | null> };
            return j;
          });
          return jsonResponse(
            envelope(data, "UK Parliament Petitions API", upstream),
          );
        } catch (e) {
          return errorResponse(`Petitions fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});