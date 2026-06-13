#!/usr/bin/env node
/**
 * Content compliance linter — Whole Health Compass.
 * ---------------------------------------------------------------------------
 * Enforces the non-negotiable content rules on the curated packs:
 *   #2  never name a remedy / herb / formula / supplement / dose
 *   #3  never claim an approach treats / cures / works
 *
 * HOW IT READS THE FILES
 *   The packs are TypeScript data files. Only the *string-literal contents*
 *   carry patient-facing copy — identifiers, keys and the long rule-describing
 *   comment blocks are NOT patient copy. So we tokenise each file and scan the
 *   inside of string literals only. This auto-excludes:
 *     • // line comments and /* block comments *​/  (incl. the rule docs)
 *     • object keys / type names / imports (they live outside strings)
 *   which is exactly why the packs' own "never name a herb…" rule comments do
 *   not trip the linter.
 *
 * SCOPE
 *   Defaults to <repo>/src/data/packs (recursively, .ts/.tsx). Pass explicit
 *   paths as argv to override. Safety copy (crisis.ts, redflags.ts) is NOT in
 *   scope by design: it legitimately contains words like "chest pain" that are
 *   routing signals, not remedy/efficacy claims.
 *
 * EXIT CODES
 *   0  clean   1  one or more violations   2  internal/setup error
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHC_ROOT = resolve(__dirname, "..");
const LINTER_DIR = join(WHC_ROOT, "linter");

/* ── string-literal tokeniser ──────────────────────────────────────────────
   Char-walk with explicit states. Returns [{ text, line }] for every string
   literal ('…', "…", `…`), with newlines/tabs normalised to spaces so word
   boundaries hold across wrapped copy. Comments and code are skipped. */
function extractStrings(src) {
  const out = [];
  const N = src.length;
  let i = 0;
  let line = 1;
  while (i < N) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "\n") { line++; i++; continue; }
    // line comment
    if (c === "/" && next === "/") {
      i += 2;
      while (i < N && src[i] !== "\n") i++;
      continue;
    }
    // block comment
    if (c === "/" && next === "*") {
      i += 2;
      while (i < N && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line++;
        i++;
      }
      i += 2;
      continue;
    }
    // string literal
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      const startLine = line;
      i++;
      let buf = "";
      while (i < N) {
        const ch = src[i];
        if (ch === "\\") {
          const e = src[i + 1] ?? "";
          if (e === "n" || e === "t" || e === "r") buf += " ";
          else if (e === "\n") line++; // line continuation
          else buf += e; // \" \' \\ etc → literal char
          i += 2;
          continue;
        }
        if (ch === quote) { i++; break; }
        if (ch === "\n") { line++; buf += " "; i++; continue; }
        buf += ch;
        i++;
      }
      out.push({ text: buf, line: startLine });
      continue;
    }
    i++;
  }
  return out;
}

/* ── list loading ──────────────────────────────────────────────────────── */
function loadList(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Banned named remedies → one boundary-aware, whitespace-tolerant regex.
   Boundary = "not flanked by an ASCII letter", so "omega-3" and "CBD-rich"
   match but no term matches inside a longer word. Apostrophes match straight
   or curly; internal spaces match any whitespace run. */
function buildRemedyRegex(terms) {
  if (terms.length === 0) return null;
  const parts = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((t) =>
      escapeRe(t)
        .replace(/ +/g, "\\s+")
        .replace(/['’]/g, "['’]"),
    );
  return new RegExp(`(?<![a-z])(?:${parts.join("|")})(?![a-z])`, "gi");
}

const allowlist = loadList(join(LINTER_DIR, "allowlist.txt"));
const remedyRe = buildRemedyRegex(loadList(join(LINTER_DIR, "banned-remedies.txt")));

/* ── rules ─────────────────────────────────────────────────────────────── */
const RULES = [
  { id: "dose-unit", label: "Named dose / unit",
    re: /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ml|iu|grams?|gram|tablets?|capsules?|drops?|sachets?)\b/gi },
  { id: "dose-frequency", label: "Dose frequency",
    re: /\b(?:once|twice|three times|four times|\d+\s*times)\s+(?:a\s+day|daily|per\s+day|a\s+week|weekly)\b/gi },
  { id: "dose-frequency", label: "Dose frequency",
    re: /\b(?:once|twice)\s+(?:daily|weekly|nightly)\b/gi },
  { id: "efficacy-cure", label: "Cure claim",
    re: /\b(?:cures?|cured|curing)\b/gi },
  { id: "efficacy-proven", label: "Proven claim",
    re: /\b(?:clinically|scientifically|medically)\s+proven\b|\bproven\s+to\b/gi },
  { id: "efficacy-guarantee", label: "Guarantee claim",
    re: /\bguarantees?\b|\bguaranteed\b/gi },
  { id: "efficacy-miracle", label: "Miracle claim",
    re: /\bmiracle\b|\bmiraculous\b/gi },
  { id: "efficacy-works", label: "Efficacy 'works' claim",
    re: /\bworks\s+wonders?\b|\bworks\s+(?:fast|quickly|instantly)\b|\b(?:really|actually|truly)\s+works\b|\bproven\s+to\s+work\b/gi },
];
if (remedyRe) RULES.push({ id: "named-remedy", label: "Named remedy / supplement", re: remedyRe });

/* "treats" needs an as-guard: the benign construction is "treats X as <a
   signal/strain/etc>" (worldview framing), which we allow; a bare "treats X"
   efficacy claim is flagged. We look from the match to the end of its sentence
   for a standalone "as". */
function findTreats(text) {
  const out = [];
  const re = /\btreats\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const rest = text.slice(m.index);
    const term = rest.search(/[.?!]/);
    const span = term === -1 ? rest : rest.slice(0, term);
    if (/\bas\b/i.test(span)) continue; // "treats … as …" → benign framing
    out.push(m[0]);
  }
  return out;
}

function applyAllowlist(text) {
  let t = text;
  for (const phrase of allowlist) {
    t = t.replace(new RegExp(escapeRe(phrase), "gi"), " ");
  }
  return t;
}

/* ── file walk ─────────────────────────────────────────────────────────── */
function walk(target) {
  const st = statSync(target);
  if (st.isFile()) return /\.(ts|tsx)$/.test(target) ? [target] : [];
  const files = [];
  for (const name of readdirSync(target)) {
    const full = join(target, name);
    const s = statSync(full);
    if (s.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(full)) files.push(full);
  }
  return files;
}

/* ── run ───────────────────────────────────────────────────────────────── */
const argTargets = process.argv.slice(2);
const targets = (argTargets.length ? argTargets : ["src/data/packs"]).map((t) =>
  resolve(WHC_ROOT, t),
);

for (const t of targets) {
  if (!existsSync(t)) {
    console.error(`lint-content: target not found: ${t}`);
    process.exit(2);
  }
}

const files = targets.flatMap(walk);
const violations = [];
const seen = new Set();
let stringCount = 0;
const record = (v) => {
  const key = `${v.rel}:${v.line}:${v.label}:${v.match.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  violations.push(v);
};

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(WHC_ROOT, file);
  for (const { text, line } of extractStrings(src)) {
    stringCount++;
    const scan = applyAllowlist(text);
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(scan)) !== null) {
        record({ rel, line, label: rule.label, match: m[0].trim() });
        if (m.index === rule.re.lastIndex) rule.re.lastIndex++;
      }
    }
    for (const hit of findTreats(scan)) {
      record({ rel, line, label: "Treats claim", match: hit });
    }
  }
}

if (violations.length === 0) {
  console.log(
    `✓ content compliance clean — ${files.length} file(s), ${stringCount} string(s) scanned, 0 violations.`,
  );
  process.exit(0);
}

console.error(`✗ content compliance: ${violations.length} violation(s)\n`);
const byFile = new Map();
for (const v of violations) {
  if (!byFile.has(v.rel)) byFile.set(v.rel, []);
  byFile.get(v.rel).push(v);
}
for (const [rel, vs] of byFile) {
  console.error(`  ${rel}`);
  for (const v of vs) {
    console.error(`    line ${v.line}  [${v.label}]  "${v.match}"`);
  }
  console.error("");
}
console.error(
  "Content packs are worldview/education only — fix the copy above, or (if a\n" +
    "false positive) add a justified phrase to linter/allowlist.txt.",
);
process.exit(1);
