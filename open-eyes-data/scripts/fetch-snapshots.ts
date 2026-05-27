#!/usr/bin/env bun
/**
 * Pre-fetches all expensive API data and saves as daily snapshots.
 * Run via GitHub Actions cron or: bun run scripts/fetch-snapshots.ts
 *
 * Snapshots live in src/data/snapshots/ and are committed to the repo.
 * API routes read them first (withSnapshot), falling back to live fetch.
 */
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SNAPSHOT_DIR = join(process.cwd(), "src/data/snapshots");

// ─── helpers ─────────────────────────────────────────────────────────────────

async function saveSnapshot(key: string, data: unknown) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const path = join(SNAPSHOT_DIR, `${key}.json`);
  await writeFile(path, JSON.stringify({ data, fetchedAt: new Date().toISOString() }, null, 2));
  console.log(`  saved → ${key}.json`);
}

// ─── 1. Sewage ────────────────────────────────────────────────────────────────

const ARCGIS_BASE =
  "https://services3.arcgis.com/Bb8lfThdhugyc4G3/arcgis/rest/services/Storm_Overflow_EDM_Annual_Returns_2024/FeatureServer/0/query";
const ARCGIS_FIELDS =
  "waterCompanyName,siteNameEA,totalDurationAllSpillsHrs,countedSpills,recievingWaterName";
const PAGE_SIZE = 1000;

async function fetchSpillPage(offset: number) {
  const url = `${ARCGIS_BASE}?where=1%3D1&outFields=${ARCGIS_FIELDS}&f=json&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`ArcGIS ${r.status}`);
  const j = await r.json() as { features?: Array<{ attributes: Record<string, unknown> }> };
  return j.features ?? [];
}

async function fetchSewage() {
  console.log("  Fetching sewage (ArcGIS EDM 2024)…");
  const all: Array<{ attributes: Record<string, unknown> }> = [];
  let offset = 0;
  for (let page = 0; page < 20; page++) {
    const batch = await fetchSpillPage(offset);
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  if (!all.length) throw new Error("No ArcGIS features");
  const spills = all
    .map((f) => ({
      company: (f.attributes.waterCompanyName as string) ?? "Unknown",
      site: (f.attributes.siteNameEA as string) ?? "Unknown",
      spillHours: Number(f.attributes.totalDurationAllSpillsHrs ?? 0),
      spillCount: Number(f.attributes.countedSpills ?? 0),
      receivingWater: (f.attributes.recievingWaterName as string) ?? "—",
    }))
    .sort((a, b) => b.spillHours - a.spillHours);
  return {
    spills,
    totalHours: spills.reduce((s, x) => s + x.spillHours, 0),
    totalCount: spills.reduce((s, x) => s + x.spillCount, 0),
    year: 2024,
  };
}

// ─── 2. FOI ───────────────────────────────────────────────────────────────────

const FOI_CSV_URL =
  "https://assets.publishing.service.gov.uk/media/69f310a60bb62e692c5d6e8a/foi-statistics-2025-published-data.csv";

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) { fields.push(cur); cur = ""; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

function numOrZero(s: string): number {
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

async function fetchFOI() {
  console.log("  Fetching FOI statistics (Cabinet Office CSV)…");
  const r = await fetch(FOI_CSV_URL, { headers: { accept: "text/csv" } });
  if (!r.ok) throw new Error(`FOI CSV ${r.status}`);
  const text = await r.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const header = parseCSVRow(lines[0]);
  const idx = {
    quarter: header.indexOf("Quarter"),
    body: header.indexOf("Government body"),
    received: header.indexOf("Total requests received"),
    fullyWithheld: header.indexOf("Initial Outcome  Fully withheld"),
    withheldPct: header.indexOf("Percentage of resolvable requests withheld in full"),
  };
  const years = new Set<number>();
  for (const line of lines.slice(1)) {
    const y = Number(parseCSVRow(line)[idx.quarter]);
    if (!isNaN(y) && y > 2000) years.add(y);
  }
  const latestYear = Math.max(...Array.from(years));
  const byBody = new Map<string, { totalReceived: number; fullyWithheld: number; withheldPct: number }>();
  for (const line of lines.slice(1)) {
    const f = parseCSVRow(line);
    if (Number(f[idx.quarter]) !== latestYear) continue;
    const body = f[idx.body]?.trim();
    if (!body || body === "All government departments") continue;
    const ex = byBody.get(body);
    const received = numOrZero(f[idx.received]);
    const fw = numOrZero(f[idx.fullyWithheld]);
    if (ex) { ex.totalReceived += received; ex.fullyWithheld += fw; ex.withheldPct = numOrZero(f[idx.withheldPct]); }
    else byBody.set(body, { totalReceived: received, fullyWithheld: fw, withheldPct: numOrZero(f[idx.withheldPct]) });
  }
  const refusals = Array.from(byBody.entries())
    .filter(([, b]) => b.totalReceived > 0)
    .sort(([, a], [, b]) => b.fullyWithheld - a.fullyWithheld)
    .slice(0, 30)
    .map(([bodyName, b]) => ({ bodyName, refusedCount: b.fullyWithheld, totalReceived: b.totalReceived, withheldPct: Math.round(b.withheldPct * 10) / 10 }));
  const all = Array.from(byBody.values());
  return {
    refusals,
    year: latestYear,
    totalRequests: all.reduce((s, b) => s + b.totalReceived, 0),
    totalWithheld: all.reduce((s, b) => s + b.fullyWithheld, 0),
  };
}

// ─── 3. Expenses ─────────────────────────────────────────────────────────────

const IPSA_URL = "https://www.theipsa.org.uk/api/download?type=totalSpend&year=24_25";

function parsePounds(s: string): number {
  if (!s || s === "N/A") return 0;
  const n = Number(s.replace(/[£,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

async function fetchExpenses() {
  console.log("  Fetching MP expenses (IPSA 2024-25)…");
  const r = await fetch(IPSA_URL, { headers: { accept: "text/csv" } });
  if (!r.ok) throw new Error(`IPSA ${r.status}`);
  const text = await r.text();
  const csv = text.replace(/^﻿/, "");
  const lines = csv.split("\n").filter((l) => l.trim());
  const expenses = [];
  for (const line of lines.slice(1)) {
    const f = parseCSVRow(line);
    if (f.length < 10) continue;
    const name = f[0]?.trim();
    if (!name || name.toLowerCase().includes("total")) continue;
    const constituency = (f[2] ?? f[1] ?? "").trim();
    const officeSpend = parsePounds(f[5] ?? "");
    const staffingSpend = parsePounds(f[9] ?? "");
    const accommodationSpend = parsePounds(f[17] ?? "");
    const travelSpend = parsePounds(f[19] ?? "");
    const otherSpend = parsePounds(f[20] ?? "");
    const parliamentId = (f[21] ?? "").trim();
    const totalSpend = officeSpend + staffingSpend + accommodationSpend + travelSpend + otherSpend;
    if (totalSpend === 0 && !parliamentId) continue;
    expenses.push({ name, constituency, officeSpend, staffingSpend, accommodationSpend, travelSpend, otherSpend, totalSpend, parliamentId });
  }
  expenses.sort((a, b) => b.totalSpend - a.totalSpend);
  return { expenses, year: "2024-25", total: expenses.reduce((s, e) => s + e.totalSpend, 0) };
}

// ─── 4. NHS ───────────────────────────────────────────────────────────────────

async function fetchNHS() {
  console.log("  Fetching NHS publications…");
  const publications: Array<{ title: string; link: string; date: string; summary: string }> = [];
  try {
    const r = await fetch(
      "https://www.england.nhs.uk/wp-json/wp/v2/posts?search=A%26E+waiting+times&per_page=5&_fields=id,title,date,link,excerpt",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) },
    );
    if (r.ok) {
      const posts = await r.json() as Array<{ title: { rendered: string }; date: string; link: string; excerpt: { rendered: string } }>;
      for (const p of posts) {
        publications.push({
          title: p.title?.rendered?.replace(/&#\d+;/g, (m: string) => String.fromCharCode(parseInt(m.slice(2, -1), 10))) ?? "Untitled",
          link: p.link,
          date: p.date,
          summary: (p.excerpt?.rendered ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 200),
        });
      }
    }
  } catch { /* fallthrough */ }
  return {
    publications: publications.slice(0, 15),
    stats: [
      { label: "4-hour A&E target performance", value: "~76%", target: "95%", context: "Approx. Feb 2025 published figure — NHS has missed the 95% target every month since 2015." },
      { label: "Average A&E wait", value: "~2h 30m", context: "Approximate average wait in type 1 emergency departments as of early 2025 publications" },
      { label: "Monthly A&E attendances", value: "~2.4m", context: "Approximate monthly attendances across all A&E types in England" },
    ],
  };
}

// ─── 5. News ──────────────────────────────────────────────────────────────────

const FEEDS = [
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/uk/rss.xml", bias: "Centre", lean: 0 },
  { name: "The Guardian", url: "https://www.theguardian.com/uk-news/rss", bias: "Centre-Left", lean: -2 },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml", bias: "Centre", lean: 0 },
  { name: "The Independent", url: "https://www.independent.co.uk/news/uk/rss", bias: "Centre-Left", lean: -1 },
];

const TOPICS: Record<string, string[]> = {
  NHS: ["nhs", "hospital", "health", "waiting list", "gp", "ambulance", "cancer", "surgery"],
  Housing: ["housing", "rent", "landlord", "mortgage", "home", "property", "eviction", "planning"],
  Economy: ["economy", "inflation", "gdp", "budget", "tax", "cost of living", "unemployment", "wages", "growth"],
  Crime: ["crime", "knife", "murder", "police", "stabbing", "drugs", "gang", "prison", "court"],
  Environment: ["sewage", "climate", "energy", "flood", "pollution", "net zero", "water company"],
  Immigration: ["immigration", "migration", "asylum", "refugee", "border", "channel", "visa"],
  Education: ["school", "teacher", "university", "ofsted", "pupil", "curriculum", "tuition"],
};

function stripCdata(text: string): string { return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(); }
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s{2,}/g, " ").trim();
}

function parseRssItems(xml: string) {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const title = b.match(/<title>([\s\S]*?)<\/title>/i);
    const desc = b.match(/<description>([\s\S]*?)<\/description>/i);
    const link = b.match(/<link>([\s\S]*?)<\/link>/i) ?? b.match(/<link\s+[^>]*href="([^"]+)"/i);
    const date = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) ?? b.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    const t = title ? stripHtml(stripCdata(title[1])) : "";
    if (!t) continue;
    items.push({ title: t, description: desc ? stripHtml(stripCdata(desc[1])) : "", link: link ? stripCdata(link[1]).trim() : "", pubDate: date ? stripCdata(date[1]).trim() : "" });
  }
  return items;
}

function matchTopic(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, kws] of Object.entries(TOPICS)) if (kws.some((k) => lower.includes(k))) return topic;
  return null;
}

function titleWords(t: string) { return t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3); }

function titlesSimilar(a: string, b: string): boolean {
  const wa = titleWords(a), wb = titleWords(b), setB = new Set(wb);
  for (let i = 0; i <= wa.length - 4; i++) if (wa.slice(i, i + 4).every((w) => setB.has(w))) return true;
  const setA = new Set(wa);
  for (let i = 0; i <= wb.length - 4; i++) if (wb.slice(i, i + 4).every((w) => setA.has(w))) return true;
  return false;
}

function toIso(d: string): string {
  try { const p = new Date(d); if (!isNaN(p.getTime())) return p.toISOString(); } catch { /* */ }
  return new Date().toISOString();
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

async function fetchNews() {
  console.log("  Fetching news RSS feeds…");
  const results = await Promise.allSettled(FEEDS.map(async (feed) => {
    try {
      const r = await fetch(feed.url, {
        headers: { "user-agent": "transparenC/1.0 snapshot-builder", accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) { console.warn(`    ${feed.name}: HTTP ${r.status}`); return []; }
      const xml = await r.text();
      const items = parseRssItems(xml);
      console.log(`    ${feed.name}: ${items.length} items`);
      return items.map((item) => ({ ...item, source: feed }));
    } catch (e) { console.warn(`    ${feed.name}: ${(e as Error).message}`); return []; }
  }));
  const allItems = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  const clusters: Array<{
    title: string; description: string; pubDate: string; topic: string | null;
    sources: Array<{ name: string; url: string; bias: string; lean: number }>;
  }> = [];
  for (const item of allItems) {
    const ex = clusters.find((c) => titlesSimilar(c.title, item.title));
    if (ex) {
      if (!ex.sources.some((s) => s.name === item.source.name))
        ex.sources.push({ name: item.source.name, url: item.link, bias: item.source.bias, lean: item.source.lean });
      if (item.pubDate && toIso(item.pubDate) < toIso(ex.pubDate)) ex.pubDate = item.pubDate;
    } else {
      clusters.push({ title: item.title, description: item.description, pubDate: item.pubDate, topic: matchTopic(`${item.title} ${item.description}`), sources: [{ name: item.source.name, url: item.link, bias: item.source.bias, lean: item.source.lean }] });
    }
  }
  return clusters
    .map((c, i) => ({ id: `${slugify(c.title)}-${i}`, title: c.title, description: c.description, topic: c.topic, sources: c.sources, pubDate: toIso(c.pubDate), coverage: c.sources.length }))
    .sort((a, b) => b.coverage !== a.coverage ? b.coverage - a.coverage : new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 40);
}

// ─── 6. IPA GMPP Projects ─────────────────────────────────────────────────────

type MajorProject = {
  name: string;
  department: string;
  dca: string;
  dcaNormalized: "green" | "amber-green" | "amber-red" | "red" | "reset" | "unknown";
  wholeLifeCostGBPm: number | null;
  description: string;
  deliveryPhase: string;
};

function normalizeDca(raw: string): MajorProject["dcaNormalized"] {
  const s = raw.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (s.includes("green")) {
    if (s.includes("amber")) return "amber-green";
    return "green";
  }
  if (s.includes("amber")) {
    if (s.includes("red")) return "amber-red";
    return "amber-green";
  }
  if (s.includes("red")) return "red";
  if (s.includes("reset")) return "reset";
  return "unknown";
}

function findColIndex(header: string[], keyword: string): number {
  const kw = keyword.toLowerCase();
  return header.findIndex((h) => h.toLowerCase().includes(kw));
}

function parseProjectsCsv(text: string): MajorProject[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCSVRow(lines[0]).map((h) => h.trim());

  const iName = findColIndex(header, "project") !== -1
    ? findColIndex(header, "project")
    : findColIndex(header, "name");
  const iDept = findColIndex(header, "department");
  const iDca = findColIndex(header, "dca");
  const iCost = findColIndex(header, "whole") !== -1
    ? findColIndex(header, "whole")
    : findColIndex(header, "cost");
  const iDesc = findColIndex(header, "description");
  const iPhase = findColIndex(header, "phase");

  const projects: MajorProject[] = [];
  for (const line of lines.slice(1)) {
    const f = parseCSVRow(line).map((v) => v.trim());
    if (!f[iName]) continue;
    const rawCost = iCost >= 0 ? f[iCost] ?? "" : "";
    const costStr = rawCost.replace(/[£,\s]/g, "");
    const costNum = costStr ? parseFloat(costStr) : null;
    projects.push({
      name: f[iName] ?? "",
      department: iDept >= 0 ? (f[iDept] ?? "") : "",
      dca: iDca >= 0 ? (f[iDca] ?? "") : "",
      dcaNormalized: normalizeDca(iDca >= 0 ? (f[iDca] ?? "") : ""),
      wholeLifeCostGBPm: costNum && !isNaN(costNum) ? costNum : null,
      description: iDesc >= 0 ? (f[iDesc] ?? "") : "",
      deliveryPhase: iPhase >= 0 ? (f[iPhase] ?? "") : "",
    });
  }
  // Sort: red → amber-red → amber-green → green → reset → unknown
  const ORDER: Record<string, number> = { red: 0, "amber-red": 1, "amber-green": 2, green: 3, reset: 4, unknown: 5 };
  return projects.sort((a, b) => (ORDER[a.dcaNormalized] ?? 5) - (ORDER[b.dcaNormalized] ?? 5));
}

async function fetchProjects(): Promise<{ projects: MajorProject[]; source: string; year: string }> {
  console.log("  Fetching IPA GMPP projects (GOV.UK)…");
  // Step 1: get the collection page to find the latest publication
  const collectionResp = await fetch("https://www.gov.uk/api/content/government/collections/government-major-projects-portfolio-data", {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!collectionResp.ok) throw new Error(`Collection API ${collectionResp.status}`);
  const collection = await collectionResp.json() as {
    links?: { documents?: Array<{ api_url?: string; base_path?: string; title?: string }> };
  };
  const docs = collection.links?.documents ?? [];
  // Find the most recent GMPP publication
  const gmppDoc = docs.find((d) => d.title?.toLowerCase().includes("government major projects portfolio")) ?? docs[0];
  if (!gmppDoc?.api_url) throw new Error("No GMPP publication found in collection");

  // Step 2: get the publication page to find CSV attachments
  const pubResp = await fetch(gmppDoc.api_url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!pubResp.ok) throw new Error(`Publication API ${pubResp.status}`);
  const pub = await pubResp.json() as {
    details?: { attachments?: Array<{ url?: string; content_type?: string; title?: string }> };
    title?: string;
  };
  const attachments = pub.details?.attachments ?? [];
  const csvAttachment = attachments.find((a) =>
    a.content_type?.includes("csv") || a.url?.endsWith(".csv")
  );
  if (!csvAttachment?.url) throw new Error("No CSV attachment found in GMPP publication");

  // Step 3: download and parse the CSV
  const csvResp = await fetch(csvAttachment.url, {
    headers: { accept: "text/csv,*/*" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!csvResp.ok) throw new Error(`CSV download ${csvResp.status}`);
  const csvText = await csvResp.text();
  const projects = parseProjectsCsv(csvText);
  if (projects.length === 0) throw new Error("CSV parsed to 0 projects");
  // Extract year from the publication title
  const yearMatch = (pub.title ?? "").match(/\b(20\d\d)\b/);
  return {
    projects,
    source: pub.title ?? "IPA GMPP",
    year: yearMatch ? yearMatch[1] : new Date().getFullYear().toString(),
  };
}

// ─── 7. Economy (ONS) ─────────────────────────────────────────────────────────

type ONSResponse = {
  months?: Array<{ date: string; value: string }>;
  quarters?: Array<{ date: string; value: string }>;
  years?: Array<{ date: string; value: string }>;
};

async function fetchONSSeries(
  dataset: string,
  seriesId: string,
  label: string,
  description: string,
  unit: string,
  granularity: "months" | "quarters" | "years" = "quarters",
) {
  const url = `https://api.ons.gov.uk/v1/datasets/${dataset}/timeseries/${seriesId}/data`;
  const r = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`ONS ${seriesId}: HTTP ${r.status}`);
  const json = (await r.json()) as ONSResponse;
  const points = (json[granularity] ?? [])
    .filter((p) => p.value !== "" && p.value !== ".")
    .map((p) => ({ date: p.date, value: parseFloat(p.value) }))
    .filter((p) => !isNaN(p.value));
  const latest = points[points.length - 1];
  return {
    label, description, unit,
    latestValue: latest ? latest.value.toFixed(1) : "—",
    latestDate: latest?.date ?? "—",
    trend: points.slice(-12),
    source: `ONS — ${dataset.toUpperCase()} series ${seriesId}`,
    sourceId: seriesId,
  };
}

async function fetchEconomyONS() {
  console.log("  Fetching ONS economic indicators…");
  const SERIES: Array<[string, string, string, string, string, "months" | "quarters" | "years"]> = [
    ["qna", "IHYQ", "GDP growth", "Quarter-on-quarter GDP growth (seasonally adjusted)", "%", "quarters"],
    ["mm23", "D7G7", "CPI inflation", "Consumer Prices Index — 12-month rate", "%", "months"],
    ["lms", "MGSX", "Unemployment", "ILO unemployment rate (16+)", "%", "months"],
    ["earn", "KAB9", "Real wage growth", "Real regular pay — 3 month on year change (CPIH adjusted)", "%", "months"],
    ["pusf", "HF6W", "Public debt", "Public sector net debt excluding Bank of England (£bn)", "£bn", "months"],
    ["pusf", "J5II", "Government deficit", "Public sector net borrowing (PSNB), rolling 12 months (£bn)", "£bn", "months"],
  ];
  const results = await Promise.allSettled(
    SERIES.map(([d, s, l, desc, u, g]) => fetchONSSeries(d, s, l, desc, u, g)),
  );
  const series = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const [, seriesId, label, description, unit] = SERIES[i];
    console.warn(`    ONS ${seriesId} failed: ${(r.reason as Error).message}`);
    return { label, description, unit, latestValue: "—", latestDate: "—", trend: [], source: `ONS — ${SERIES[i][0].toUpperCase()} series ${seriesId}`, sourceId: seriesId };
  });
  return { series, updatedAt: new Date().toISOString() };
}

// ─── 8. Committees (Parliament) ───────────────────────────────────────────────

async function fetchCommittees() {
  console.log("  Fetching Parliament select committee reports…");
  const urls = [
    "https://committees.api.parliament.uk/api/v1/Publications?publicationTypes=4&House=Commons&take=30&skip=0",
    "https://committees.api.parliament.uk/api/v1/Publications?publicationTypes=4&House=Lords&take=15&skip=0",
  ];
  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) }).then(
        (r) => {
          if (!r.ok) throw new Error(`Committees API: ${r.status}`);
          return r.json() as Promise<{
            items: Array<{
              id: number; title: string; summary?: string; publicationDate: string;
              links: Array<{ url: string; contentType: string }>;
              inquiry?: { title: string };
              committee: { id: number; name: string; house: number };
            }>;
          }>;
        },
      ),
    ),
  );
  const reports: Array<{
    id: number; title: string; summary: string; publishedAt: string;
    committee: string; committeeId: number; house: string; url: string; inquiry?: string;
  }> = [];
  for (const result of results) {
    if (result.status !== "fulfilled") { console.warn("    Committee fetch failed:", result.reason); continue; }
    for (const item of result.value.items ?? []) {
      const house = item.committee.house === 1 ? "Commons" : item.committee.house === 2 ? "Lords" : "Joint";
      const link = item.links?.find((l) => l.contentType?.includes("html") || l.url?.includes("parliament.uk"))?.url
        ?? `https://committees.parliament.uk/committee/${item.committee.id}/publications/`;
      reports.push({
        id: item.id, title: item.title,
        summary: (item.summary ?? "").slice(0, 300),
        publishedAt: item.publicationDate,
        committee: item.committee.name,
        committeeId: item.committee.id,
        house, url: link,
        inquiry: item.inquiry?.title,
      });
    }
  }
  reports.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return { reports: reports.slice(0, 40) };
}

// ─── 9. Spending (PESA hardcoded fallback) ────────────────────────────────────

const PESA_HARDCODED = {
  year: "2023-24",
  source: "HM Treasury — PESA 2024 (hardcoded outturn figures)",
  totalGBPbn: 1220,
  departments: [
    { department: "Department for Work and Pensions", totalSpendGBPbn: 257.6, resourceSpendGBPbn: 257.2, capitalSpendGBPbn: 0.4, year: "2023-24" },
    { department: "Department of Health and Social Care", totalSpendGBPbn: 212.1, resourceSpendGBPbn: 200.3, capitalSpendGBPbn: 11.8, year: "2023-24" },
    { department: "Department for Education", totalSpendGBPbn: 115.7, resourceSpendGBPbn: 107.3, capitalSpendGBPbn: 8.4, year: "2023-24" },
    { department: "HM Treasury", totalSpendGBPbn: 114.8, resourceSpendGBPbn: 114.6, capitalSpendGBPbn: 0.2, year: "2023-24" },
    { department: "Ministry of Defence", totalSpendGBPbn: 59.5, resourceSpendGBPbn: 47.4, capitalSpendGBPbn: 12.1, year: "2023-24" },
    { department: "Department for Levelling Up, Housing and Communities", totalSpendGBPbn: 51.3, resourceSpendGBPbn: 49.8, capitalSpendGBPbn: 1.5, year: "2023-24" },
    { department: "Department for Transport", totalSpendGBPbn: 37.7, resourceSpendGBPbn: 19.4, capitalSpendGBPbn: 18.3, year: "2023-24" },
    { department: "Home Office", totalSpendGBPbn: 23.1, resourceSpendGBPbn: 21.8, capitalSpendGBPbn: 1.3, year: "2023-24" },
    { department: "Department for Business and Trade", totalSpendGBPbn: 22.1, resourceSpendGBPbn: 18.4, capitalSpendGBPbn: 3.7, year: "2023-24" },
    { department: "Department for Science, Innovation and Technology", totalSpendGBPbn: 20.3, resourceSpendGBPbn: 12.8, capitalSpendGBPbn: 7.5, year: "2023-24" },
    { department: "Foreign, Commonwealth and Development Office", totalSpendGBPbn: 18.9, resourceSpendGBPbn: 15.6, capitalSpendGBPbn: 3.3, year: "2023-24" },
    { department: "Department for Energy Security and Net Zero", totalSpendGBPbn: 14.8, resourceSpendGBPbn: 9.2, capitalSpendGBPbn: 5.6, year: "2023-24" },
    { department: "Ministry of Justice", totalSpendGBPbn: 14.0, resourceSpendGBPbn: 12.9, capitalSpendGBPbn: 1.1, year: "2023-24" },
    { department: "Department for Environment, Food and Rural Affairs", totalSpendGBPbn: 12.2, resourceSpendGBPbn: 10.4, capitalSpendGBPbn: 1.8, year: "2023-24" },
    { department: "Cabinet Office", totalSpendGBPbn: 7.6, resourceSpendGBPbn: 5.2, capitalSpendGBPbn: 2.4, year: "2023-24" },
  ],
};

async function fetchSpending() {
  console.log("  Using PESA hardcoded outturn data (2023-24)…");
  // The PESA CSV format changes each year making reliable parsing difficult.
  // Hardcoded figures match PESA 2024 Table 1.14 outturn. Update annually.
  return PESA_HARDCODED;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function run(label: string, key: string, fn: () => Promise<unknown>) {
  console.log(`\n[${label}]`);
  try {
    const data = await fn();
    await saveSnapshot(key, data);
    console.log(`  ✓ done`);
  } catch (e) {
    console.error(`  ✗ failed: ${(e as Error).message}`);
  }
}

async function main() {
  console.log("=== transparenC daily snapshot builder ===");
  await run("1/9 Sewage", "sewage_edm_2024", fetchSewage);
  await run("2/9 FOI", "foi_2025", fetchFOI);
  await run("3/9 Expenses", "expenses_2425", fetchExpenses);
  await run("4/9 NHS", "nhs_publications", fetchNHS);
  await run("5/9 News", "news_uk_v1", fetchNews);
  await run("6/9 Projects", "projects_gmpp", fetchProjects);
  await run("7/9 Economy", "economy_ons", fetchEconomyONS);
  await run("8/9 Committees", "committees_reports", fetchCommittees);
  await run("9/9 Spending", "spending_pesa", fetchSpending);
  console.log("\n=== All snapshots complete ===");
}

main().catch((e) => { console.error(e); process.exit(1); });
