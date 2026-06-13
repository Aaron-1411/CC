#!/usr/bin/env node
/**
 * No-LLM guard — Whole Health Compass.
 * ---------------------------------------------------------------------------
 * Patient surfaces must be 100% static, curated copy. No model ever generates
 * text a patient reads — that is the safe-by-design guarantee (a static string
 * cannot hallucinate a medical claim). This guard fails the build if either:
 *
 *   (a) an AI/LLM SDK appears in package.json deps/devDeps, or
 *   (b) app source (src/**, functions/**) contains a tell-tale of a runtime
 *       model call (endpoint host, SDK import, completion call shape).
 *
 * scripts/ is intentionally NOT scanned: this guard necessarily *names* the
 * very patterns it bans, and must not flag itself.
 *
 * EXIT CODES  0 clean   1 violation   2 setup error
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHC_ROOT = resolve(__dirname, "..");

/* Package names that indicate an LLM/AI client dependency. Matched exactly, or
   as a scoped-package prefix (e.g. "@anthropic-ai/sdk" via "@anthropic-ai/"). */
const BANNED_EXACT = new Set([
  "openai", "openai-edge", "@anthropic-ai/sdk", "@google/generative-ai",
  "cohere-ai", "cohere", "replicate", "langchain", "ai",
  "@huggingface/inference", "groq-sdk", "together-ai",
]);
const BANNED_PREFIX = [
  "@anthropic-ai/", "@google-ai/", "@langchain/", "@mistralai/",
];

function isBannedDep(name) {
  if (BANNED_EXACT.has(name)) return true;
  return BANNED_PREFIX.some((p) => name.startsWith(p));
}

/* Runtime tell-tales in source. Kept high-signal to avoid false positives on
   ordinary words. */
const SOURCE_PATTERNS = [
  { re: /api\.openai\.com/i, why: "OpenAI API host" },
  { re: /generativelanguage\.googleapis\.com/i, why: "Google Generative Language host" },
  { re: /api\.anthropic\.com/i, why: "Anthropic API host" },
  { re: /\bchat\.completions\b/i, why: "chat.completions call" },
  { re: /\bgpt-(?:3\.5|4o?|4-)/i, why: "GPT model id" },
  { re: /\bclaude-(?:2|3|3\.5|opus|sonnet|haiku)/i, why: "Claude model id" },
  { re: /from\s+["']openai["']/i, why: "import from 'openai'" },
  { re: /require\(\s*["']openai["']\s*\)/i, why: "require('openai')" },
  { re: /new\s+OpenAI\s*\(/i, why: "new OpenAI(" },
  { re: /@anthropic-ai\/sdk/i, why: "Anthropic SDK import" },
  { re: /import\s+Anthropic\b/i, why: "import Anthropic" },
  { re: /\banthropic\.messages\b/i, why: "anthropic.messages call" },
  { re: /\breplicate\.run\b/i, why: "replicate.run call" },
  { re: /\bcohere\.generate\b/i, why: "cohere.generate call" },
  { re: /@google\/generative-ai/i, why: "Google generative-ai import" },
];

const findings = [];

/* (a) package.json */
const pkgPath = join(WHC_ROOT, "package.json");
if (!existsSync(pkgPath)) {
  console.error("guard-no-llm: package.json not found");
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  for (const name of Object.keys(pkg[field] ?? {})) {
    if (isBannedDep(name)) findings.push({ where: `package.json (${field})`, detail: name });
  }
}

/* (b) source scan */
function walk(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(full)) files.push(full);
  }
  return files;
}

const sourceFiles = [join(WHC_ROOT, "src"), join(WHC_ROOT, "functions")].flatMap(walk);
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  const rel = relative(WHC_ROOT, file);
  for (const { re, why } of SOURCE_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const line = text.slice(0, m.index).split("\n").length;
      findings.push({ where: `${rel}:${line}`, detail: `${why} ("${m[0]}")` });
    }
  }
}

if (findings.length === 0) {
  console.log(
    `✓ no-LLM guard clean — no AI SDK in package.json, no model-call tell-tale in ${sourceFiles.length} source file(s).`,
  );
  process.exit(0);
}

console.error(`✗ no-LLM guard: ${findings.length} finding(s)\n`);
for (const f of findings) console.error(`  ${f.where}  →  ${f.detail}`);
console.error(
  "\nPatient surfaces must be static, curated copy. Remove the dependency or\n" +
    "model call above — no LLM may generate text a patient reads.",
);
process.exit(1);
