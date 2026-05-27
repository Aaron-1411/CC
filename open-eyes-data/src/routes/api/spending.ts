import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptSpend = {
  department: string;
  totalSpendGBPbn: number;
  resourceSpendGBPbn: number;
  capitalSpendGBPbn: number;
  year: string;
};

export type SpendingData = {
  departments: DeptSpend[];
  totalGBPbn: number;
  year: string;
  source: string;
};

// ─── CSV helper (shared with other routes) ───────────────────────────────────

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) { fields.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  fields.push(cur.trim());
  return fields;
}

function numBn(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n / 1000; // PESA often published in £m → convert to £bn
}

// ─── GOV.UK Content API: fetch latest PESA CSV ───────────────────────────────

type GovUKContent = {
  links?: {
    documents?: Array<{ base_path: string; title: string; public_updated_at?: string }>;
  };
  details?: {
    attachments?: Array<{ url?: string; content_type?: string; filename?: string; title?: string }>;
  };
  title?: string;
};

// Hardcoded fallback: key PESA 2024 headline figures (£bn, 2023-24 outturn)
const PESA_FALLBACK: SpendingData = {
  year: "2023-24",
  source: "HM Treasury — PESA 2024 (hardcoded fallback figures)",
  totalGBPbn: 1220,
  departments: [
    { department: "Department of Health and Social Care", totalSpendGBPbn: 212.1, resourceSpendGBPbn: 200.3, capitalSpendGBPbn: 11.8, year: "2023-24" },
    { department: "Department for Work and Pensions", totalSpendGBPbn: 257.6, resourceSpendGBPbn: 257.2, capitalSpendGBPbn: 0.4, year: "2023-24" },
    { department: "Ministry of Defence", totalSpendGBPbn: 59.5, resourceSpendGBPbn: 47.4, capitalSpendGBPbn: 12.1, year: "2023-24" },
    { department: "Department for Education", totalSpendGBPbn: 115.7, resourceSpendGBPbn: 107.3, capitalSpendGBPbn: 8.4, year: "2023-24" },
    { department: "HM Treasury", totalSpendGBPbn: 114.8, resourceSpendGBPbn: 114.6, capitalSpendGBPbn: 0.2, year: "2023-24" },
    { department: "Home Office", totalSpendGBPbn: 23.1, resourceSpendGBPbn: 21.8, capitalSpendGBPbn: 1.3, year: "2023-24" },
    { department: "Ministry of Justice", totalSpendGBPbn: 14.0, resourceSpendGBPbn: 12.9, capitalSpendGBPbn: 1.1, year: "2023-24" },
    { department: "Department for Transport", totalSpendGBPbn: 37.7, resourceSpendGBPbn: 19.4, capitalSpendGBPbn: 18.3, year: "2023-24" },
    { department: "Department for Levelling Up, Housing and Communities", totalSpendGBPbn: 51.3, resourceSpendGBPbn: 49.8, capitalSpendGBPbn: 1.5, year: "2023-24" },
    { department: "Foreign, Commonwealth and Development Office", totalSpendGBPbn: 18.9, resourceSpendGBPbn: 15.6, capitalSpendGBPbn: 3.3, year: "2023-24" },
    { department: "Department for Business and Trade", totalSpendGBPbn: 22.1, resourceSpendGBPbn: 18.4, capitalSpendGBPbn: 3.7, year: "2023-24" },
    { department: "Department for Energy Security and Net Zero", totalSpendGBPbn: 14.8, resourceSpendGBPbn: 9.2, capitalSpendGBPbn: 5.6, year: "2023-24" },
    { department: "Cabinet Office", totalSpendGBPbn: 7.6, resourceSpendGBPbn: 5.2, capitalSpendGBPbn: 2.4, year: "2023-24" },
    { department: "Department for Science, Innovation and Technology", totalSpendGBPbn: 20.3, resourceSpendGBPbn: 12.8, capitalSpendGBPbn: 7.5, year: "2023-24" },
    { department: "Department for Environment, Food and Rural Affairs", totalSpendGBPbn: 12.2, resourceSpendGBPbn: 10.4, capitalSpendGBPbn: 1.8, year: "2023-24" },
  ].sort((a, b) => b.totalSpendGBPbn - a.totalSpendGBPbn),
};

async function fetchSpending(): Promise<SpendingData> {
  // Try to fetch latest PESA CSV from GOV.UK Content API
  try {
    const collectionRes = await fetch(
      "https://www.gov.uk/api/content/government/collections/public-expenditure-statistical-analyses-pesa",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!collectionRes.ok) return PESA_FALLBACK;
    const collection = (await collectionRes.json()) as GovUKContent;
    const docs = collection.links?.documents ?? [];
    const sorted = [...docs].sort((a, b) =>
      (b.public_updated_at ?? "").localeCompare(a.public_updated_at ?? ""),
    );
    if (!sorted[0]?.base_path) return PESA_FALLBACK;

    const pubRes = await fetch(
      `https://www.gov.uk/api/content${sorted[0].base_path}`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!pubRes.ok) return PESA_FALLBACK;
    const pub = (await pubRes.json()) as GovUKContent;
    const attachments = pub.details?.attachments ?? [];
    // Look for the departmental totals table (usually titled "Table 1" or similar)
    const csvAtt = attachments.find(
      (a) => (a.content_type?.includes("csv") || a.filename?.endsWith(".csv")) &&
              (a.title?.toLowerCase().includes("table") || a.filename?.toLowerCase().includes("table")) &&
              a.url,
    ) ?? attachments.find((a) => (a.content_type?.includes("csv") || a.filename?.endsWith(".csv")) && a.url);
    if (!csvAtt?.url) return PESA_FALLBACK;

    const csvRes = await fetch(csvAtt.url, { signal: AbortSignal.timeout(30_000) });
    if (!csvRes.ok) return PESA_FALLBACK;
    const csv = await csvRes.text();
    const lines = csv.replace(/^﻿/, "").split("\n").filter((l) => l.trim());
    if (lines.length < 5) return PESA_FALLBACK;

    const header = parseCSVRow(lines[0]);
    const deptIdx = header.findIndex((h) => h.toLowerCase().includes("department") || h.toLowerCase().includes("organisation"));
    const totalIdx = header.findIndex((h) => h.toLowerCase().includes("total"));
    if (deptIdx < 0 || totalIdx < 0) return PESA_FALLBACK;

    const departments: DeptSpend[] = [];
    const yearMatch = (pub.title ?? "").match(/20\d\d[–-]?\d{0,2}/);
    const year = yearMatch?.[0] ?? "latest";

    for (const line of lines.slice(1)) {
      const f = parseCSVRow(line);
      const dept = f[deptIdx]?.trim();
      if (!dept || dept.toLowerCase().startsWith("total") || dept.toLowerCase() === "department") continue;
      const total = numBn(f[totalIdx] ?? "");
      if (total === 0) continue;
      const resourceIdx = header.findIndex((h) => h.toLowerCase().includes("resource") || h.toLowerCase().includes("rdel"));
      const capitalIdx  = header.findIndex((h) => h.toLowerCase().includes("capital") || h.toLowerCase().includes("cdel"));
      departments.push({
        department: dept,
        totalSpendGBPbn: total,
        resourceSpendGBPbn: resourceIdx >= 0 ? numBn(f[resourceIdx] ?? "") : 0,
        capitalSpendGBPbn:  capitalIdx  >= 0 ? numBn(f[capitalIdx]  ?? "") : 0,
        year,
      });
    }
    if (departments.length < 5) return PESA_FALLBACK;
    departments.sort((a, b) => b.totalSpendGBPbn - a.totalSpendGBPbn);
    return {
      departments,
      totalGBPbn: departments.reduce((s, d) => s + d.totalSpendGBPbn, 0),
      year,
      source: pub.title ?? "PESA",
    };
  } catch {
    return PESA_FALLBACK;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/spending")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await withSnapshot("spending_pesa", () =>
            cached("spending:pesa:v1", 24 * 60 * 60_000, fetchSpending),
          );
          return jsonResponse(
            envelope(
              data,
              "HM Treasury — Public Expenditure Statistical Analyses (PESA)",
              "https://www.gov.uk/government/collections/public-expenditure-statistical-analyses-pesa",
            ),
          );
        } catch (e) {
          return errorResponse(`Spending fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
