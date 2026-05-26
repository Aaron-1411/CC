import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// IPSA moved from an OData API (/api/expense) to a download endpoint.
// Total spend per MP for the 2024-25 financial year.
const IPSA_DOWNLOAD_URL =
  "https://www.theipsa.org.uk/api/download?type=totalSpend&year=24_25";

type MPExpense = {
  name: string;
  constituency: string;
  officeSpend: number;
  staffingSpend: number;
  accommodationSpend: number;
  travelSpend: number;
  otherSpend: number;
  totalSpend: number;
  parliamentId: string;
};

type ExpensesResponse = {
  expenses: MPExpense[];
  year: string;
  total: number;
};

/** Strip BOM and parse a £-prefixed currency value */
function parsePounds(s: string): number {
  if (!s || s === "N/A") return 0;
  const n = Number(s.replace(/[£,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Minimal CSV row parser that handles quoted fields */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
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

async function fetchExpenses(mp?: string): Promise<ExpensesResponse> {
  const r = await fetch(IPSA_DOWNLOAD_URL, { headers: { accept: "text/csv" } });
  if (!r.ok) throw new Error(`IPSA returned ${r.status}`);
  const text = await r.text();

  // Strip BOM
  const csv = text.replace(/^﻿+/, "");
  const lines = csv.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("IPSA CSV had no data rows");

  // Columns (0-indexed):
  // 0: MP's name
  // 1: Previous constituency
  // 2: Constituency since 5 July 2024
  // 3: Office budget  4: Reason  5: Office spend  6: Remaining
  // 7: Staffing budget  8: Reason  9: Staffing spend  10: Remaining
  // 11: Winding-up budget  12: Reason  13: Winding-up spend  14: Remaining
  // 15: Accommodation budget  16: Reason  17: Accommodation spend  18: Remaining
  // 19: Travel and subsistence (uncapped)
  // 20: Other costs (uncapped)
  // 21: pID

  const expenses: MPExpense[] = [];

  for (const line of lines.slice(1)) {
    const f = parseCSVRow(line);
    if (f.length < 21) continue;

    const name = f[0].trim();
    if (!name) continue;

    // Filter by MP name if requested
    if (mp && !name.toLowerCase().includes(mp.toLowerCase())) continue;

    const constituency = f[2].trim() !== "N/A" ? f[2].trim() : f[1].trim();
    const officeSpend = parsePounds(f[5]);
    const staffingSpend = parsePounds(f[9]);
    const accommodationSpend = parsePounds(f[17]);
    const travelSpend = parsePounds(f[19]);
    const otherSpend = parsePounds(f[20]);
    const totalSpend = officeSpend + staffingSpend + accommodationSpend + travelSpend + otherSpend;
    const parliamentId = f[21]?.trim() ?? "";

    expenses.push({
      name,
      constituency,
      officeSpend,
      staffingSpend,
      accommodationSpend,
      travelSpend,
      otherSpend,
      totalSpend,
      parliamentId,
    });
  }

  expenses.sort((a, b) => b.totalSpend - a.totalSpend);

  return { expenses, year: "2024-25", total: expenses.length };
}

export const Route = createFileRoute("/api/expenses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const mp = url.searchParams.get("mp") ?? undefined;

          const cacheKey = `exp:ipsa:v3:${mp ?? "all"}`;
          // For the all-MPs snapshot, prefer the pre-built daily file; per-MP stays live
          const data = mp
            ? await cached(cacheKey, 4 * 60 * 60_000, () => fetchExpenses(mp))
            : await withSnapshot("expenses_2425", () =>
                cached(cacheKey, 4 * 60 * 60_000, () => fetchExpenses(mp)),
              );

          return jsonResponse(
            envelope(
              data,
              "IPSA — Independent Parliamentary Standards Authority",
              "https://www.theipsa.org.uk/mp-staffing-business-costs/annual-publications",
              "Open Government Licence v3.0",
            ),
          );
        } catch (e) {
          return errorResponse(`Expenses fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
