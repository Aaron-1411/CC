#!/usr/bin/env node
/**
 * Per-route prerender — Whole Health Compass.
 * ---------------------------------------------------------------------------
 * WHAT IT DOES
 *   The app is a client-rendered SPA (one Vite bundle, no SSR). Crawlers and
 *   social-share scrapers that don't run JS would otherwise see the same bare
 *   shell for every URL. This script takes the built dist/index.html and writes
 *   a per-route static shell — dist/<route>/index.html — with that route's own
 *   <title>, description, canonical, Open Graph / Twitter card and JSON-LD baked
 *   into the HTML. Real users still get the hydrating SPA; only the head differs.
 *
 *   Cloudflare Pages serves a matching static /<route>/index.html BEFORE applying
 *   the public/_redirects SPA fallback ("/* /index.html 200"), so these files are
 *   what a crawler hitting /compliance receives — correct metadata, no JS needed.
 *   It also emits dist/sitemap.xml (public routes only — /clinic is omitted) and
 *   dist/robots.txt.
 *
 * PORTABILITY (why this file is plain .mjs and reads config by regex)
 *   CI runs `bun run build`, which on a GitHub runner shells out to this script
 *   under Node ~20 — which cannot strip TypeScript types. So this file MUST NOT
 *   import any .ts module. It regex-extracts the handful of config scalars it
 *   needs (siteUrl, name, tagline, ogImagePath) from src/config/clinic.ts as
 *   text. Zero runtime dependencies by design.
 *
 * EXIT CODES
 *   0  ok      2  setup error (e.g. dist/index.html missing — run vite build first)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHC_ROOT = resolve(__dirname, "..");
const DIST = join(WHC_ROOT, "dist");
const INDEX = join(DIST, "index.html");

/* ── config (text-extracted, no .ts import) ─────────────────────────────── */
function readConfig() {
  const file = join(WHC_ROOT, "src", "config", "clinic.ts");
  const src = readFileSync(file, "utf8");
  // First quoted value for `<key>:` — the type decl (`<key>: string;`) has no
  // quote so it never matches; the config object's literal does.
  const pick = (key, fallback) => {
    const m = src.match(new RegExp(`\\b${key}\\s*:\\s*["']([^"']*)["']`));
    return m ? m[1] : fallback;
  };
  return {
    siteUrl: pick("siteUrl", "https://example.com").replace(/\/+$/, ""),
    name: pick("name", "Whole Health Compass"),
    tagline: pick("tagline", "Understand your health from every angle."),
    ogImagePath: pick("ogImagePath", "/og-image.svg"),
  };
}

const cfg = readConfig();
const SITE = cfg.name;
const t = (s) => `${s} · ${SITE}`;
const ogImageAbs = /^https?:\/\//i.test(cfg.ogImagePath)
  ? cfg.ogImagePath
  : `${cfg.siteUrl}${cfg.ogImagePath.startsWith("/") ? "" : "/"}${cfg.ogImagePath}`;
const ogImageType = /\.svg(\?|$)/i.test(cfg.ogImagePath) ? "image/svg+xml" : "image/png";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* ── public routes to prerender ─────────────────────────────────────────────
   The 7 static public pages. Excluded by design: /learn/:id (dynamic, titled
   client-side via usePageMeta), /clinic (private dashboard — kept out of the
   sitemap and robots), and the catch-all redirect. Copy is education-framed and
   pack-neutral so it stays true under white-labelling. */
const ROUTES = [
  {
    path: "/",
    title: `${SITE} — Understand your health from every angle`,
    description:
      "A calm, plain-English guide that helps you describe what's going on, prepares a summary for your practitioner, and explains how different traditions each understand it. Educational only — always routes you to a qualified, registered practitioner.",
  },
  {
    path: "/compass",
    title: t("The Compass"),
    description:
      "A gentle, step-by-step tool that helps you put what you're feeling into words and prepare a clear summary to share with a practitioner. It never diagnoses and never recommends a remedy.",
  },
  {
    path: "/learn",
    title: t("Learn — how traditions understand common concerns"),
    description:
      "Browse plain-English explanations of how different medical traditions each make sense of everyday health concerns. Education only — no diagnosis, no remedies, no rankings.",
  },
  {
    path: "/for-clinics",
    title: t("For clinics"),
    description:
      "A safe, white-label patient-education tool that helps people arrive understood and prepared, and routes every enquiry to your practitioners. Designed to sit outside medical-device regulation.",
  },
  {
    path: "/compliance",
    title: t("Compliance & safety"),
    description:
      "How this tool stays outside medical-device regulation, handles special-category health data under UK GDPR, and routes every path to a qualified, registered practitioner.",
  },
  {
    path: "/about",
    title: t("About"),
    description:
      "Why we built a calm, education-first tool that brings different health traditions together around one person — and always hands the care itself back to a qualified human.",
  },
  {
    path: "/privacy",
    title: t("Privacy & data protection"),
    description:
      "How we handle your information: the clinic is the data controller and we act as its processor, with explicit versioned consent, data minimisation and an append-only audit trail.",
  },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canonicalFor(p) {
  return p === "/" ? `${cfg.siteUrl}/` : `${cfg.siteUrl}${p}`;
}

/* Remove the head tags this script owns, so re-running is idempotent and the
   per-route values never stack. Leaves <title> and the description meta in place
   (those are edited, not stripped). [^>]* spans newlines in JS, so multi-line
   source tags are handled; we only drop HTML comments that mention this script. */
function stripManaged(html) {
  return html
    .replace(/[ \t]*<!--[\s\S]*?-->\n?/g, (m) => (/prerender/i.test(m) ? "" : m))
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\n?/gi, "")
    .replace(/[ \t]*<meta\s+property="og:[^"]*"[^>]*>\n?/gi, "")
    .replace(/[ \t]*<meta\s+name="twitter:[^"]*"[^>]*>\n?/gi, "")
    .replace(/[ \t]*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\n?/gi, "");
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
}

function setDescription(html, desc) {
  return html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${esc(desc)}" />`,
  );
}

function socialBlock(route) {
  const url = esc(canonicalFor(route.path));
  const title = esc(route.title);
  const desc = esc(route.description);
  const img = esc(ogImageAbs);
  const lines = [
    `<link rel="canonical" href="${url}" />`,
    ``,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta property="og:site_name" content="${esc(SITE)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:type" content="${ogImageType}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(SITE)} — general education, not a medical device" />`,
    ``,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
  ];
  return lines.map((l) => (l ? `    ${l}` : "")).join("\n") + "\n";
}

/* WebSite + Organization + WebPage. Deliberately NOT MedicalWebPage /
   MedicalOrganization — this is general education, not a medical entity. */
function jsonLd(route) {
  const url = canonicalFor(route.path);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${cfg.siteUrl}/#website`,
        url: `${cfg.siteUrl}/`,
        name: SITE,
        description: cfg.tagline,
        publisher: { "@id": `${cfg.siteUrl}/#org` },
        inLanguage: "en-GB",
      },
      {
        "@type": "Organization",
        "@id": `${cfg.siteUrl}/#org`,
        name: SITE,
        url: `${cfg.siteUrl}/`,
        logo: `${cfg.siteUrl}/favicon.svg`,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: route.title,
        isPartOf: { "@id": `${cfg.siteUrl}/#website` },
        about: { "@id": `${cfg.siteUrl}/#org` },
        description: route.description,
        inLanguage: "en-GB",
      },
    ],
  };
  const body = JSON.stringify(graph, null, 2)
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n");
  return `    <script type="application/ld+json">\n${body}\n    </script>\n`;
}

function renderRoute(shell, route) {
  let html = stripManaged(shell);
  html = setTitle(html, route.title);
  html = setDescription(html, route.description);
  const inject = `${socialBlock(route)}\n${jsonLd(route)}`;
  return html.replace("  </head>", `${inject}  </head>`);
}

/* ── run ───────────────────────────────────────────────────────────────── */
if (!existsSync(INDEX)) {
  console.error(`prerender: ${INDEX} not found — run \`vite build\` first.`);
  process.exit(2);
}
const shell = readFileSync(INDEX, "utf8");

let written = 0;
for (const route of ROUTES) {
  const outDir = route.path === "/" ? DIST : join(DIST, route.path.replace(/^\//, ""));
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), renderRoute(shell, route), "utf8");
  written++;
}

const urls = ROUTES.map(
  (r) =>
    `  <url>\n    <loc>${esc(canonicalFor(r.path))}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n  </url>`,
).join("\n");
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  "utf8",
);

writeFileSync(
  join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /clinic\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`,
  "utf8",
);

console.log(
  `✓ prerender: ${written} route shell(s) + sitemap.xml + robots.txt → dist/  (site ${cfg.siteUrl})`,
);
