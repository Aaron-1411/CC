import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// Official Cabinet Office FOI statistics dataset (annual)
// Updated each year — this is the 2025 (data through 2025) release
const FOI_CSV_URL =
  "https://assets.publishing.service.gov.uk/media/69f310a60bb62e692c5d6e8a/foi-statistics-2025-published-data.csv";

type BodyStats = {
  bodyName: string;
  totalReceived: number;
  fullyWithheld: number;
  partiallyWithheld: number;
  notHeld: number;
  withheldPct: number;
};

type BodyRefusalCount = {
  bodyName: string;
  refusedCount: number;
  totalReceived: number;
  withheldPct: number;
};

type FOIData = {
  refusals: BodyRefusalCount[];
  year: number;
  totalRequests: number;
  totalWithheld: number;
};

/** Minimal CSV parser — handles quoted fields (but no escaped quotes in quoted fields) */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function numOrZero(s: string): number {
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

async function fetchFOIStats(): Promise<FOIData> {
  const r = await fetch(FOI_CSV_URL, { headers: { accept: "text/csv" } });
  if (!r.ok) throw new Error(`GOV.UK CSV returned ${r.status}`);
  const text = await r.text();

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV had no data rows");

  const header = parseCSVRow(lines[0]);

  // Find column indices
  const idx = {
    quarter: header.indexOf("Quarter"),
    body: header.indexOf("Government body"),
    received: header.indexOf("Total requests received"),
    fullyWithheld: header.indexOf("Initial Outcome  Fully withheld"), // two spaces before "Fully"
    partiallyWithheld: header.indexOf("Initial Outcome  Partially withheld"),
    notHeld: header.indexOf("Requests where information not held"),
    withheldPct: header.indexOf("Percentage of resolvable requests withheld in full"),
  };

  // Find the most recent year in the data
  const years = new Set<number>();
  for (const line of lines.slice(1)) {
    const fields = parseCSVRow(line);
    const y = Number(fields[idx.quarter]);
    if (!isNaN(y) && y > 2000) years.add(y);
  }
  const latestYear = Math.max(...Array.from(years));

  // Aggregate by body for the latest year
  const byBody = new Map<string, BodyStats>();

  for (const line of lines.slice(1)) {
    const fields = parseCSVRow(line);
    if (fields.length < 3) continue;

    const year = Number(fields[idx.quarter]);
    if (year !== latestYear) continue;

    const bodyName = fields[idx.body]?.trim();
    if (!bodyName || bodyName === "All government departments") continue;

    const existing = byBody.get(bodyName);
    const received = numOrZero(fields[idx.received]);
    const fullyWithheld = numOrZero(fields[idx.fullyWithheld]);
    const partiallyWithheld = numOrZero(fields[idx.partiallyWithheld]);
    const notHeld = numOrZero(fields[idx.notHeld]);
    const withheldPct = numOrZero(fields[idx.withheldPct]);

    if (existing) {
      existing.totalReceived += received;
      existing.fullyWithheld += fullyWithheld;
      existing.partiallyWithheld += partiallyWithheld;
      existing.notHeld += notHeld;
      existing.withheldPct = withheldPct; // take latest
    } else {
      byBody.set(bodyName, {
        bodyName,
        totalReceived: received,
        fullyWithheld,
        partiallyWithheld,
        notHeld,
        withheldPct,
      });
    }
  }

  const refusals: BodyRefusalCount[] = Array.from(byBody.values())
    .filter((b) => b.totalReceived > 0)
    .sort((a, b) => b.fullyWithheld - a.fullyWithheld)
    .slice(0, 30)
    .map((b) => ({
      bodyName: b.bodyName,
      refusedCount: b.fullyWithheld,
      totalReceived: b.totalReceived,
      withheldPct: Math.round(b.withheldPct * 10) / 10,
    }));

  const totalRequests = Array.from(byBody.values()).reduce(
    (s, b) => s + b.totalReceived,
    0,
  );
  const totalWithheld = Array.from(byBody.values()).reduce(
    (s, b) => s + b.fullyWithheld,
    0,
  );

  return { refusals, year: latestYear, totalRequests, totalWithheld };
}

export const Route = createFileRoute("/api/foi")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Annual stats — snapshot preferred, 6h in-memory fallback
          const data = await withSnapshot("foi_2025", () =>
            cached("foi:govuk:2025:v1", 6 * 60 * 60_000, fetchFOIStats),
          );
          return jsonResponse(
            envelope(
              data,
              "Cabinet Office — FOI Statistics",
              "https://www.gov.uk/government/statistics/freedom-of-information-statistics-annual-2025",
              "Open Government Licence v3.0",
            ),
          );
        } catch (e) {
          return errorResponse(`FOI fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
