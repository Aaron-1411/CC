import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

type RefusalRecord = {
  id: number;
  title: string;
  bodyName: string;
  state: string;
  date: string;
  url: string;
};

type BodyRefusalCount = {
  bodyName: string;
  refusedCount: number;
  requests: RefusalRecord[];
};

type FOIData = {
  refusals: BodyRefusalCount[];
  recentRefusals: RefusalRecord[];
};

type WDTKRequest = {
  id: number;
  title: string;
  described_state: string;
  url: string;
  created_at: string;
  public_body_name: string;
  public_body_url_name: string;
};

function normaliseWDTK(req: WDTKRequest): RefusalRecord {
  return {
    id: req.id,
    title: req.title,
    bodyName: req.public_body_name ?? "Unknown body",
    state: req.described_state,
    date: req.created_at,
    url: req.url?.startsWith("http") ? req.url : `https://www.whatdotheyknow.com${req.url}`,
  };
}

async function fetchState(state: string): Promise<WDTKRequest[]> {
  const results: WDTKRequest[] = [];
  for (let page = 1; page <= 3; page++) {
    const r = await fetch(
      `https://www.whatdotheyknow.com/api/v3/info_request.json?described_state=${state}&per_page=100&page=${page}`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) },
    );
    if (!r.ok) break;
    const data = (await r.json()) as { info_requests?: WDTKRequest[] };
    const batch = data.info_requests ?? [];
    results.push(...batch);
    if (batch.length < 100) break;
  }
  return results;
}

async function fetchFOIRefusals(): Promise<FOIData> {
  const allRecords: RefusalRecord[] = [];

  const [notHeld, refused] = await Promise.allSettled([
    fetchState("not_held"),
    fetchState("refused"),
  ]);

  const seen = new Set<number>();
  for (const result of [notHeld, refused]) {
    if (result.status === "fulfilled") {
      for (const req of result.value) {
        if (!seen.has(req.id)) {
          seen.add(req.id);
          allRecords.push(normaliseWDTK(req));
        }
      }
    }
  }

  // Group by public body to create league table
  const byBody = new Map<string, RefusalRecord[]>();
  for (const record of allRecords) {
    const key = record.bodyName;
    if (!byBody.has(key)) byBody.set(key, []);
    byBody.get(key)!.push(record);
  }

  const refusals: BodyRefusalCount[] = Array.from(byBody.entries())
    .map(([bodyName, requests]) => ({
      bodyName,
      refusedCount: requests.length,
      requests,
    }))
    .sort((a, b) => b.refusedCount - a.refusedCount)
    .slice(0, 20);

  // Recent refusals sorted by date descending
  const recentRefusals = [...allRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return { refusals, recentRefusals };
}

export const Route = createFileRoute("/api/foi")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("foi:v1", 30 * 60_000, fetchFOIRefusals);
          return jsonResponse(
            envelope(
              data,
              "WhatDoTheyKnow — mySociety",
              "https://www.whatdotheyknow.com",
              "Creative Commons Attribution License",
            ),
          );
        } catch (e) {
          return errorResponse(`FOI fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
