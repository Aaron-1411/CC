import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

export type MajorProject = {
  name: string;
  department: string;
  dca: string;
  dcaNormalized: "green" | "amber-green" | "amber-red" | "red" | "reset" | "unknown";
  wholeLifeCostGBPm: number | null;
  description: string;
  deliveryPhase: string;
};

export type ProjectsData = {
  projects: MajorProject[];
  source: string;
  year: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDCA(raw: string): MajorProject["dcaNormalized"] {
  const s = raw.toLowerCase().trim();
  if (s === "green") return "green";
  if (s.includes("amber") && s.includes("green")) return "amber-green";
  if (s.includes("amber") && s.includes("red")) return "amber-red";
  if (s === "red") return "red";
  if (s.includes("reset")) return "reset";
  return "unknown";
}

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

function findColIndex(headers: string[], ...keywords: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  return lower.findIndex((h) => keywords.every((kw) => h.includes(kw)));
}

function parseCSV(text: string): MajorProject[] {
  const lines = text.replace(/^﻿/, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);

  // Find column indices
  const colName = findColIndex(headers, "name") !== -1
    ? findColIndex(headers, "name")
    : findColIndex(headers, "project");
  const colDept = findColIndex(headers, "dept") !== -1
    ? findColIndex(headers, "dept")
    : findColIndex(headers, "department");
  const colDCA = findColIndex(headers, "dca") !== -1
    ? findColIndex(headers, "dca")
    : findColIndex(headers, "delivery", "confidence");
  const colWLC = findColIndex(headers, "whole", "life");
  const colDesc = findColIndex(headers, "description");
  const colPhase = findColIndex(headers, "phase");

  const projects: MajorProject[] = [];
  for (const line of lines.slice(1)) {
    const f = parseCSVRow(line);
    if (f.length < 3) continue;
    const name = (colName >= 0 ? f[colName] : f[0])?.trim() ?? "";
    if (!name || name.toLowerCase().startsWith("total")) continue;

    const rawWLC = colWLC >= 0 ? f[colWLC]?.replace(/[£,\s]/g, "") : "";
    const wlc = rawWLC ? parseFloat(rawWLC) : null;

    projects.push({
      name,
      department: (colDept >= 0 ? f[colDept] : "")?.trim() ?? "",
      dca: (colDCA >= 0 ? f[colDCA] : "")?.trim() ?? "",
      dcaNormalized: normalizeDCA((colDCA >= 0 ? f[colDCA] : "")?.trim() ?? ""),
      wholeLifeCostGBPm: wlc && !isNaN(wlc) ? wlc : null,
      description: (colDesc >= 0 ? f[colDesc] : "")?.trim() ?? "",
      deliveryPhase: (colPhase >= 0 ? f[colPhase] : "")?.trim() ?? "",
    });
  }
  return projects;
}

// ─── GOV.UK Content API approach ─────────────────────────────────────────────

type GovUKContent = {
  links?: {
    documents?: Array<{ base_path: string; title: string; public_updated_at?: string }>;
  };
  details?: {
    attachments?: Array<{
      url?: string;
      content_type?: string;
      filename?: string;
    }>;
    body?: string;
  };
  title?: string;
};

async function fetchCSVFromContentAPI(): Promise<{ csv: string; source: string } | null> {
  try {
    // Step 1: Get the collection
    const collectionRes = await fetch(
      "https://www.gov.uk/api/content/government/collections/government-major-projects-portfolio-data",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!collectionRes.ok) return null;
    const collection = (await collectionRes.json()) as GovUKContent;

    // Step 2: Find the most recently updated publication (first in the list)
    const docs = collection.links?.documents ?? [];
    if (!docs.length) return null;

    // Sort by public_updated_at descending to get the most recent
    const sorted = [...docs].sort((a, b) =>
      (b.public_updated_at ?? "").localeCompare(a.public_updated_at ?? ""),
    );
    const latestDoc = sorted[0];

    // Step 3: Fetch its content
    const pubRes = await fetch(
      `https://www.gov.uk/api/content${latestDoc.base_path}`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!pubRes.ok) return null;
    const pub = (await pubRes.json()) as GovUKContent;

    // Step 4: Find CSV attachment
    const attachments = pub.details?.attachments ?? [];
    const csvAttachment = attachments.find(
      (a) =>
        (a.content_type?.includes("csv") || a.filename?.endsWith(".csv")) && a.url,
    );
    if (!csvAttachment?.url) return null;

    // Step 5: Download CSV
    const csvRes = await fetch(csvAttachment.url, { signal: AbortSignal.timeout(30_000) });
    if (!csvRes.ok) return null;
    const csv = await csvRes.text();

    return { csv, source: latestDoc.title ?? "GMPP data" };
  } catch {
    return null;
  }
}

async function fetchCSVFromSearch(): Promise<{ csv: string; source: string } | null> {
  try {
    const searchRes = await fetch(
      "https://www.gov.uk/api/search.json?filter_organisations%5B%5D=infrastructure-and-projects-authority&q=government+major+projects+portfolio+data&count=5&fields%5B%5D=title,description,public_timestamp,link",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!searchRes.ok) return null;
    const results = (await searchRes.json()) as { results?: Array<{ title?: string; link?: string }> };
    const first = results.results?.[0];
    if (!first?.link) return null;

    // Try to get the page content via content API to find CSV
    const path = first.link.startsWith("/") ? first.link : new URL(first.link).pathname;
    const pubRes = await fetch(
      `https://www.gov.uk/api/content${path}`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!pubRes.ok) return null;
    const pub = (await pubRes.json()) as GovUKContent;
    const csvAttachment = (pub.details?.attachments ?? []).find(
      (a) => (a.content_type?.includes("csv") || a.filename?.endsWith(".csv")) && a.url,
    );
    if (!csvAttachment?.url) return null;
    const csvRes = await fetch(csvAttachment.url, { signal: AbortSignal.timeout(30_000) });
    if (!csvRes.ok) return null;
    return { csv: await csvRes.text(), source: first.title ?? "GMPP data" };
  } catch {
    return null;
  }
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

async function fetchProjects(): Promise<ProjectsData> {
  // Try content API first, then search fallback
  const result = await fetchCSVFromContentAPI() ?? await fetchCSVFromSearch();

  if (!result) {
    throw new Error("Could not retrieve GMPP data from GOV.UK");
  }

  const projects = parseCSV(result.csv);
  if (!projects.length) {
    throw new Error("GMPP CSV parsed but contained no project rows");
  }

  // Sort: red first, then amber-red, amber-green, green, unknown
  const order: Record<string, number> = { red: 0, "amber-red": 1, reset: 2, "amber-green": 3, green: 4, unknown: 5 };
  projects.sort((a, b) => (order[a.dcaNormalized] ?? 5) - (order[b.dcaNormalized] ?? 5));

  // Attempt to extract year from source title
  const yearMatch = result.source.match(/20\d\d(?:[–-]20?\d{2})?/);
  const year = yearMatch?.[0] ?? new Date().getFullYear().toString();

  return { projects, source: result.source, year };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await withSnapshot("projects_gmpp", () =>
            cached("projects:ipa:v1", 6 * 60 * 60_000, fetchProjects),
          );
          return jsonResponse(
            envelope(
              data,
              "Infrastructure Projects Authority — Government Major Projects Portfolio",
              "https://www.gov.uk/government/collections/government-major-projects-portfolio-data",
            ),
          );
        } catch (e) {
          return errorResponse(`Projects fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
