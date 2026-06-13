#!/usr/bin/env node
/**
 * harvest-evidence.mjs — peer-reviewed evidence harvester (Pattern B, editorial back-office)
 * ---------------------------------------------------------------------------------------------
 * Pulls real, citable literature for each content-pack concern from two FREE, NO-KEY sources:
 *   • Europe PMC REST  (https://europepmc.org/RestfulWebService) — reviews / meta-analyses / guidelines
 *   • OpenAlex         (https://docs.openalex.org/)              — reviews, relevance-ranked
 *
 * It writes a structured, fully-provenanced JSON evidence map to research/evidence/<pack>.json.
 *
 * ── WHY THIS LIVES IN scripts/ AND WRITES TO research/ (NOT src/) ────────────────────────────
 * This is a build-time / editorial tool, deliberately OUTSIDE the patient runtime:
 *   • It is NEVER imported by the app — nothing under src/ references research/, so vite never
 *     bundles it and no byte of it reaches a patient surface.
 *   • Real journal titles legitimately contain herb/remedy names ("turmeric", "St John's wort")
 *     and efficacy words ("efficacy", "cures", "proven"). Those are FINE in a back-office
 *     literature map but would (correctly) trip scripts/lint-content.mjs if they lived in
 *     src/data/packs. Keeping the harvest in research/ keeps the content linter honest.
 *   • It uses NO LLM and NO paid service — pure HTTP + JSON parsing. It costs $0 to run and
 *     honours the "no LLM on any patient surface" guard by construction.
 *
 * ── COMPLIANCE: PRESENCE ≠ ENDORSEMENT ───────────────────────────────────────────────────────
 * Listing a study here is NOT a claim that any approach treats, cures, or works, and NOT a
 * ranking of one tradition over another. Many harvested reviews report null / mixed / negative
 * findings — that is the point. This map exists so the clinic's *human* content team can cite
 * real provenance; only vetted, honestly-framed provenance should ever be surfaced to patients,
 * via a later, separately-reviewed increment.
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────────────────────────
 *   node scripts/harvest-evidence.mjs                 # all packs
 *   node scripts/harvest-evidence.mjs --pack integrative
 *   node scripts/harvest-evidence.mjs --per 12        # results per query per source (default 8)
 *   OPENALEX_MAILTO=you@example.com node scripts/...   # opt into OpenAlex "polite pool"
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHC_ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(WHC_ROOT, "research/evidence");

/* ── config ───────────────────────────────────────────────────────────────────────────────── */
const EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const OPENALEX = "https://api.openalex.org/works";
const EPMC_PUBTYPES = '(PUB_TYPE:"systematic-review" OR PUB_TYPE:"meta-analysis" OR PUB_TYPE:"guideline")';
const REQUEST_TIMEOUT_MS = 20_000;
const REQUEST_RETRIES = 2;
const POLITE_DELAY_MS = 250; // be a good API citizen — sequential, gently spaced
const MAX_AUTHORS = 6;
const MAILTO = process.env.OPENALEX_MAILTO || ""; // optional polite-pool identifier

const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const ONLY_PACK = argVal("--pack");
const PER_QUERY = Math.max(1, Math.min(25, Number(argVal("--per")) || 8));

/* ── query manifest — keyed to the content-pack concern ids (see src/data/packs/*.ts) ─────────
   `condition`  : the clinical phrase, phrase-matched against the literature (neutral, not a remedy)
   `angles`     : optional modality lenses relevant to THIS app's multi-tradition framing. Each is
                  searched honestly — the result set includes positive, null and negative reviews.
   The catch-all "something-else" concern is intentionally omitted (no meaningful evidence query). */
const QUERIES = [
  /* ── integrative pack ── */
  { pack: "integrative", concernId: "low-energy-sleep", label: "Low energy & poor sleep",
    condition: "chronic insomnia", angles: ["acupuncture", "mindfulness"] },
  { pack: "integrative", concernId: "stress-anxiety", label: "Stress, anxiety & overwhelm",
    condition: "generalised anxiety disorder", angles: ["mindfulness", "yoga"] },
  { pack: "integrative", concernId: "digestion", label: "Digestive discomfort",
    condition: "irritable bowel syndrome", angles: ["acupuncture", "probiotics"] },
  { pack: "integrative", concernId: "aches-pains", label: "Persistent aches & pains",
    condition: "chronic musculoskeletal pain", angles: ["acupuncture"] },
  { pack: "integrative", concernId: "hormonal", label: "Hormonal & menstrual changes",
    condition: "menopausal symptoms", angles: ["acupuncture"] },
  { pack: "integrative", concernId: "headaches", label: "Headaches & migraines",
    condition: "migraine", angles: ["acupuncture"] },
  { pack: "integrative", concernId: "low-mood", label: "Low mood & motivation",
    condition: "depression", angles: ["exercise", "mindfulness"] },
  { pack: "integrative", concernId: "immune", label: "Frequent colds & low resilience",
    condition: "recurrent upper respiratory tract infection", angles: [] },

  /* ── musculoskeletal pack ── */
  { pack: "musculoskeletal", concernId: "low-back-pain", label: "Low back pain",
    condition: "low back pain", angles: ["acupuncture", "spinal manipulation", "exercise therapy"] },
  { pack: "musculoskeletal", concernId: "neck-shoulder", label: "Neck & shoulder pain",
    condition: "mechanical neck pain", angles: ["manual therapy"] },
  { pack: "musculoskeletal", concernId: "knee-hip", label: "Knee or hip pain",
    condition: "knee osteoarthritis", angles: ["exercise therapy"] },
  { pack: "musculoskeletal", concernId: "recurrent-strain", label: "Recurrent strains & overuse",
    condition: "tendinopathy", angles: [] },
  { pack: "musculoskeletal", concernId: "desk-posture", label: "Desk & posture tension",
    condition: "work-related neck pain", angles: [] },
];

/* ── http helper: timeout + small backoff, never throws to the caller ─────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "whole-health-compass-evidence-harvester/1.0" },
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return { error: `HTTP ${res.status}` };
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === REQUEST_RETRIES) return { error: String(err.message || err) };
      await sleep(400 * (attempt + 1)); // linear backoff
    }
  }
  return { error: "unreachable" };
}

/* ── normalisers → one unified record shape ───────────────────────────────────────────────────── */
const bareDoi = (doi) => (doi ? String(doi).replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null);

function epmcType(pubTypeList) {
  const t = (pubTypeList?.pubType || []).join(" ").toLowerCase();
  if (t.includes("meta-analysis")) return "meta-analysis";
  if (t.includes("systematic")) return "systematic-review";
  if (t.includes("guideline")) return "guideline";
  return "review";
}

function splitAuthorString(s) {
  if (!s) return [];
  const list = String(s).replace(/\.$/, "").split(/,\s*/).filter(Boolean);
  return list.length > MAX_AUTHORS ? [...list.slice(0, MAX_AUTHORS), "et al."] : list;
}

async function searchEuropePMC(condition, modality) {
  const q = modality ? `${modality} AND "${condition}"` : `"${condition}"`;
  const url =
    `${EPMC}?query=${encodeURIComponent(`${q} AND ${EPMC_PUBTYPES}`)}` +
    `&format=json&resultType=core&pageSize=${PER_QUERY}`;
  const json = await fetchJson(url);
  if (json.error) return { error: json.error, records: [] };
  const rows = json.resultList?.result || [];
  const records = rows.map((r) => {
    const doi = bareDoi(r.doi);
    return {
      title: (r.title || "").replace(/\.$/, ""),
      authors: splitAuthorString(r.authorString),
      year: r.pubYear ? Number(r.pubYear) : null,
      venue: r.journalInfo?.journal?.title || null,
      type: epmcType(r.pubTypeList),
      doi,
      url: doi ? `https://doi.org/${doi}` : `https://europepmc.org/article/${r.source}/${r.id}`,
      openAccess: r.isOpenAccess === "Y",
      citedByCount: typeof r.citedByCount === "number" ? r.citedByCount : null,
      source: "europepmc",
    };
  });
  return { error: null, records };
}

async function searchOpenAlex(condition, modality) {
  const search = modality ? `${modality} ${condition}` : `${condition} management`;
  const url =
    `${OPENALEX}?search=${encodeURIComponent(search)}&filter=type:review&per_page=${PER_QUERY}` +
    `&select=${encodeURIComponent("id,doi,title,publication_year,type,cited_by_count,primary_location,authorships")}` +
    (MAILTO ? `&mailto=${encodeURIComponent(MAILTO)}` : "");
  const json = await fetchJson(url);
  if (json.error) return { error: json.error, records: [] };
  const rows = json.results || [];
  const records = rows.map((r) => {
    const doi = bareDoi(r.doi);
    const authors = (r.authorships || []).map((a) => a.author?.display_name).filter(Boolean);
    return {
      title: (r.title || "").replace(/\.$/, ""),
      authors: authors.length > MAX_AUTHORS ? [...authors.slice(0, MAX_AUTHORS), "et al."] : authors,
      year: r.publication_year || null,
      venue: r.primary_location?.source?.display_name || null,
      type: "review",
      doi,
      url: doi ? `https://doi.org/${doi}` : r.id,
      openAccess: null,
      citedByCount: typeof r.cited_by_count === "number" ? r.cited_by_count : null,
      source: "openalex",
    };
  });
  return { error: null, records };
}

/* ── dedup + merge within a concern (a paper found in both sources is a quality signal) ────────── */
function mergeInto(map, records, matchedQuery) {
  for (const rec of records) {
    if (!rec.title) continue;
    const key = rec.doi || rec.title.toLowerCase().replace(/\s+/g, " ").trim();
    const existing = map.get(key);
    if (existing) {
      if (!existing.sources.includes(rec.source)) existing.sources.push(rec.source);
      if (!existing.matchedQueries.includes(matchedQuery)) existing.matchedQueries.push(matchedQuery);
      // prefer a populated venue / citation count if the first hit lacked it
      existing.venue = existing.venue || rec.venue;
      existing.citedByCount = existing.citedByCount ?? rec.citedByCount;
      if (rec.openAccess === true) existing.openAccess = true;
    } else {
      const { source, ...rest } = rec;
      map.set(key, { ...rest, sources: [source], matchedQueries: [matchedQuery] });
    }
  }
}

/* ── orchestration ────────────────────────────────────────────────────────────────────────────── */
async function harvestConcern(entry) {
  const map = new Map();
  const queryLog = [];
  // base condition query + each modality angle, across both sources
  const passes = [{ modality: null, label: entry.condition }, ...entry.angles.map((m) => ({ modality: m, label: `${m} — ${entry.condition}` }))];
  for (const pass of passes) {
    for (const search of [searchEuropePMC, searchOpenAlex]) {
      const { error, records } = await search(entry.condition, pass.modality);
      queryLog.push({ query: pass.label, source: search === searchEuropePMC ? "europepmc" : "openalex", returned: records.length, error: error || undefined });
      mergeInto(map, records, pass.label);
      await sleep(POLITE_DELAY_MS);
    }
  }
  const evidence = [...map.values()].sort((a, b) => {
    const cross = b.sources.length - a.sources.length; // both-source papers first
    if (cross) return cross;
    const yr = (b.year || 0) - (a.year || 0); // then most recent
    if (yr) return yr;
    return (b.citedByCount || 0) - (a.citedByCount || 0); // then most cited
  });
  return { concernId: entry.concernId, label: entry.label, condition: entry.condition, queries: queryLog, evidenceCount: evidence.length, evidence };
}

const DISCLAIMER =
  "Editorial back-office literature map. NOT patient-facing, NEVER imported into the app, NEVER " +
  "linted as patient content. The presence of a study here is NOT a claim that any approach treats, " +
  "cures, or works, NOT a statement of safety, and NOT a ranking of one tradition over another — many " +
  "listed reviews report null, mixed or negative findings. For the clinic's human content team only; " +
  "any patient-facing use requires separate, named-clinician review.";

async function main() {
  const packs = [...new Set(QUERIES.map((q) => q.pack))].filter((p) => !ONLY_PACK || p === ONLY_PACK);
  if (ONLY_PACK && !packs.length) {
    console.error(`No queries for pack "${ONLY_PACK}". Known packs: ${[...new Set(QUERIES.map((q) => q.pack))].join(", ")}`);
    process.exit(2);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const index = { generatedAt, sources: ["Europe PMC REST", "OpenAlex"], perQuery: PER_QUERY, packs: [] };
  let totalRecords = 0;
  let totalErrors = 0;

  for (const pack of packs) {
    const entries = QUERIES.filter((q) => q.pack === pack);
    console.log(`\n▸ ${pack} — ${entries.length} concern(s)`);
    const concerns = [];
    for (const entry of entries) {
      const result = await harvestConcern(entry);
      const errs = result.queries.filter((q) => q.error).length;
      totalErrors += errs;
      totalRecords += result.evidenceCount;
      concerns.push(result);
      console.log(`  • ${result.concernId.padEnd(18)} ${String(result.evidenceCount).padStart(3)} studies${errs ? `  (${errs} query error[s])` : ""}`);
    }
    const file = resolve(OUT_DIR, `${pack}.json`);
    const doc = { disclaimer: DISCLAIMER, pack, generatedAt, sources: index.sources, perQuery: PER_QUERY, concerns };
    await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
    index.packs.push({ pack, file: `research/evidence/${pack}.json`, concerns: concerns.length, studies: concerns.reduce((n, c) => n + c.evidenceCount, 0) });
    console.log(`  ↳ wrote research/evidence/${pack}.json`);
  }

  await writeFile(resolve(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(`\n✓ harvested ${totalRecords} studies across ${packs.length} pack(s)${totalErrors ? ` — ${totalErrors} query error(s) (non-fatal)` : ""}`);
  console.log(`  index → research/evidence/index.json`);
}

main().catch((err) => {
  console.error("harvest failed:", err);
  process.exit(1);
});
