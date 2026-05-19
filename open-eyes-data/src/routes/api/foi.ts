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

async function fetchFOIRefusals(): Promise<FOIData> {
  const allRecords: RefusalRecord[] = [];

  // Fetch not_held requests
  try {
    const r1 = await fetch(
      "https://www.whatdotheyknow.com/api/v3/info_request.json?described_state=not_held&per_page=20&page=1",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) },
    );
    if (r1.ok) {
      const data = (await r1.json()) as { info_requests?: WDTKRequest[] };
      for (const req of data.info_requests ?? []) {
        allRecords.push({
          id: req.id,
          title: req.title,
          bodyName: req.public_body_name ?? "Unknown body",
          state: req.described_state,
          date: req.created_at,
          url: req.url?.startsWith("http")
            ? req.url
            : `https://www.whatdotheyknow.com${req.url}`,
        });
      }
    }
  } catch {
    // fallthrough
  }

  // Fetch refused requests
  try {
    const r2 = await fetch(
      "https://www.whatdotheyknow.com/api/v3/info_request.json?described_state=refused&per_page=20&page=1",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) },
    );
    if (r2.ok) {
      const data = (await r2.json()) as { info_requests?: WDTKRequest[] };
      for (const req of data.info_requests ?? []) {
        // avoid duplicates by id
        if (!allRecords.some((r) => r.id === req.id)) {
          allRecords.push({
            id: req.id,
            title: req.title,
            bodyName: req.public_body_name ?? "Unknown body",
            state: req.described_state,
            date: req.created_at,
            url: req.url?.startsWith("http")
              ? req.url
              : `https://www.whatdotheyknow.com${req.url}`,
          });
        }
      }
    }
  } catch {
    // ignore
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
