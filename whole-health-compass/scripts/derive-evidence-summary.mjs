#!/usr/bin/env node
/**
 * Derive the patient-facing evidence summary — Whole Health Compass.
 * ---------------------------------------------------------------------------
 * Reads the back-office peer-reviewed corpus harvested into research/evidence/
 * (see scripts/harvest-evidence.mjs) and projects it down to a tiny, COMPLIANCE-
 * SAFE aggregate that the app is allowed to render.
 *
 * WHAT IT EMITS (src/data/evidence-summary.ts)
 *   Per concern id, ONLY:
 *     • reviewCount        — how many peer-reviewed reviews mention the concern
 *     • byType             — counts split by synthesis type (SR / MA / guideline / review)
 *     • mostRecentYear     — newest publication year seen
 *     • sources            — human-readable source databases ("Europe PMC", "OpenAlex")
 *     • searchUrl          — neutral deep link to the public Europe PMC search
 *
 * WHAT IT DELIBERATELY DROPS (so the output is patient-safe by construction)
 *   study titles, authors, venues, DOIs, the modality "angles" / matchedQueries,
 *   citation counts — i.e. every field that could (a) name a remedy/supplement,
 *   (b) imply efficacy, or (c) let one tradition be ranked above another. The
 *   raw corpus stays in research/evidence/ (outside src/, never bundled).
 *
 * The generated file is included in `npm run lint:content` scope as a guarantee
 * that no banned token can ever reach it.
 *
 * USAGE   node scripts/derive-evidence-summary.mjs
 * EXIT    0 ok · 1 no corpus / nothing derived · 2 internal error
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHC_ROOT = resolve(__dirname, "..");
const EVIDENCE_DIR = join(WHC_ROOT, "research", "evidence");
const OUT_FILE = join(WHC_ROOT, "src", "data", "evidence-summary.ts");

const SOURCE_LABELS = { europepmc: "Europe PMC", openalex: "OpenAlex" };
const REVIEW_PUBTYPES =
  '(PUB_TYPE:"systematic-review" OR PUB_TYPE:"meta-analysis" OR PUB_TYPE:"guideline")';

function fail(msg, code = 1) {
  console.error(`derive-evidence-summary: ${msg}`);
  process.exit(code);
}

/* Build a neutral, public Europe PMC search deep link that mirrors the harvest
   filter, so "browse this evidence" shows the same review-type literature we
   counted. Only the concern's *condition* term travels in the URL — never a
   remedy name or any user data. */
function buildSearchUrl(condition) {
  const q = `"${condition}" AND ${REVIEW_PUBTYPES}`;
  return `https://europepmc.org/search?query=${encodeURIComponent(q)}`;
}

function emptyByType() {
  return { systematicReview: 0, metaAnalysis: 0, guideline: 0, review: 0 };
}
function bucketOf(type) {
  switch (type) {
    case "systematic-review":
      return "systematicReview";
    case "meta-analysis":
      return "metaAnalysis";
    case "guideline":
      return "guideline";
    default:
      return "review"; // OpenAlex type:review + any unlabelled review
  }
}

/* ── load every pack file the harvester wrote ──────────────────────────────── */
if (!existsSync(EVIDENCE_DIR)) {
  fail(
    `no corpus at ${EVIDENCE_DIR}. Run \`npm run harvest:evidence\` first.`,
  );
}
const packFiles = readdirSync(EVIDENCE_DIR).filter(
  (f) => f.endsWith(".json") && f !== "index.json",
);
if (packFiles.length === 0) fail(`no pack files in ${EVIDENCE_DIR}.`);

/* ── fold into a flat, pack-agnostic map keyed by concernId ────────────────── */
const byConcern = {};
const sourcesSeen = new Set();
let newestHarvest = "";

for (const file of packFiles) {
  let pack;
  try {
    pack = JSON.parse(readFileSync(join(EVIDENCE_DIR, file), "utf8"));
  } catch (e) {
    fail(`could not parse ${file}: ${e.message}`, 2);
  }
  if (pack.generatedAt && pack.generatedAt > newestHarvest)
    newestHarvest = pack.generatedAt;

  for (const concern of pack.concerns ?? []) {
    const id = concern.concernId;
    if (!id) continue;
    const agg =
      byConcern[id] ??
      (byConcern[id] = {
        reviewCount: 0,
        byType: emptyByType(),
        mostRecentYear: 0,
        _sources: new Set(),
        searchUrl: concern.condition ? buildSearchUrl(concern.condition) : "",
      });

    for (const e of concern.evidence ?? []) {
      agg.reviewCount++;
      agg.byType[bucketOf(e.type)]++;
      if (typeof e.year === "number" && e.year > agg.mostRecentYear)
        agg.mostRecentYear = e.year;
      for (const s of e.sources ?? []) {
        agg._sources.add(s);
        sourcesSeen.add(s);
      }
    }
  }
}

const concernIds = Object.keys(byConcern).sort();
if (concernIds.length === 0) fail("no concerns found in corpus.");

/* finalise: turn the source Sets into stable human-readable label arrays */
const labelOf = (s) => SOURCE_LABELS[s] ?? s;
const finalByConcern = {};
for (const id of concernIds) {
  const a = byConcern[id];
  finalByConcern[id] = {
    reviewCount: a.reviewCount,
    byType: a.byType,
    mostRecentYear: a.mostRecentYear,
    sources: [...a._sources].map(labelOf).sort(),
    searchUrl: a.searchUrl,
  };
}
const topSources = [...sourcesSeen].map(labelOf).sort();
const harvestedAt = newestHarvest || new Date().toISOString();

/* ── emit the TypeScript module ────────────────────────────────────────────── */
const banner = `// AUTO-GENERATED — do not edit by hand.
// Run \`npm run derive:evidence\` to regenerate from research/evidence/.
//
// Compliance: this is a back-office AGGREGATE projection of the peer-reviewed
// corpus. It intentionally contains NO study titles, authors, venues, DOIs,
// remedy/supplement names, doses, modality breakdowns, or efficacy claims —
// only concern-level counts, the newest publication year, source names, and a
// neutral deep link to the public Europe PMC search. Concern-level (never
// per-tradition) so no approach is ranked above another. Kept in the content
// linter scope (npm run lint:content) as a standing guarantee.`;

const types = `export interface ConcernEvidenceByType {
  systematicReview: number;
  metaAnalysis: number;
  guideline: number;
  review: number;
}

export interface ConcernEvidence {
  /** peer-reviewed reviews/syntheses that mention this concern */
  reviewCount: number;
  byType: ConcernEvidenceByType;
  /** newest publication year seen across those reviews */
  mostRecentYear: number;
  /** source databases, human-readable */
  sources: string[];
  /** neutral deep link to the public Europe PMC search for this concern */
  searchUrl: string;
}

export interface EvidenceSummary {
  /** ISO timestamp of the underlying harvest */
  harvestedAt: string;
  sources: string[];
  byConcern: Record<string, ConcernEvidence>;
}`;

const literal = JSON.stringify(
  { harvestedAt, sources: topSources, byConcern: finalByConcern },
  null,
  2,
);

const accessor = `/** Aggregate evidence for a concern id, or undefined if none was harvested. */
export function getConcernEvidence(concernId: string): ConcernEvidence | undefined {
  return evidenceSummary.byConcern[concernId];
}`;

const out = `${banner}\n\n${types}\n\nexport const evidenceSummary: EvidenceSummary = ${literal};\n\n${accessor}\n`;

writeFileSync(OUT_FILE, out, "utf8");

const totalReviews = concernIds.reduce(
  (n, id) => n + finalByConcern[id].reviewCount,
  0,
);
console.log(
  `✓ derived ${concernIds.length} concern(s), ${totalReviews} review(s) → src/data/evidence-summary.ts`,
);
console.log(`  sources: ${topSources.join(", ")} · harvested ${harvestedAt}`);
