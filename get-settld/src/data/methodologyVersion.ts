// Methodology version + changelog. Bump VERSION on every change and prepend a CHANGELOG entry.
// This metadata is embedded into every exported PDF, CSV, and Markdown so users can track updates over time.

export interface ChangelogEntry {
  version: string;       // semver
  date: string;          // ISO date (YYYY-MM-DD)
  summary: string;       // one-line headline
  changes: string[];     // bullet points of what changed
}

export const METHODOLOGY_CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2026-05-03",
    summary: "Added methodology versioning and changelog to all exports",
    changes: [
      "Every PDF/CSV/Markdown export now includes the active methodology version and a dated changelog",
      "Exports stamped with generation timestamp alongside the version for auditability",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-20",
    summary: "Exportable methodology section",
    changes: [
      "Added downloadable Data Methodology in PDF, CSV and Markdown formats",
      "Introduced #methodology deep link for sharing",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-10",
    summary: "Area report PDF + CSV exports",
    changes: [
      "Added shareable PDF and CSV reports for selected areas",
      "Per-area pros/cons and investment score blocks in PDF",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-28",
    summary: "Initial UK-wide area dataset with provenance",
    changes: [
      "Launched ~1,800 UK area benchmarks with curated + synthetic tiers",
      "Added per-metric source, last-updated date, and confidence indicators",
    ],
  },
];

export const METHODOLOGY_VERSION = METHODOLOGY_CHANGELOG[0].version;
export const METHODOLOGY_VERSION_DATE = METHODOLOGY_CHANGELOG[0].date;

export const versionStamp = () => {
  const now = new Date();
  const ts = now.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  return `Methodology v${METHODOLOGY_VERSION} (${METHODOLOGY_VERSION_DATE}) · Exported ${ts}`;
};

export const changelogMarkdown = (): string => {
  const lines: string[] = ["## Methodology changelog", ""];
  METHODOLOGY_CHANGELOG.forEach((e) => {
    lines.push(`### v${e.version} - ${e.date}`);
    lines.push(`_${e.summary}_`);
    lines.push("");
    e.changes.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  });
  return lines.join("\n");
};

export const changelogCsvRows = (): string[][] => {
  const rows: string[][] = [["Version", "Date", "Summary", "Change"]];
  METHODOLOGY_CHANGELOG.forEach((e) => {
    e.changes.forEach((c) => rows.push([e.version, e.date, e.summary, c]));
  });
  return rows;
};

export const changelogPlainLines = (): string[] => {
  const out: string[] = [];
  METHODOLOGY_CHANGELOG.forEach((e) => {
    out.push(`v${e.version} - ${e.date} - ${e.summary}`);
    e.changes.forEach((c) => out.push(`   • ${c}`));
  });
  return out;
};
