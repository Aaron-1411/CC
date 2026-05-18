import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { METRIC_PROVENANCE, MetricKey, confidenceLabel } from "@/data/areas";
import {
  METHODOLOGY_VERSION,
  METHODOLOGY_VERSION_DATE,
  METHODOLOGY_CHANGELOG,
  changelogMarkdown,
  changelogCsvRows,
} from "@/data/methodologyVersion";

const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 7 ? iso + "-01" : iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const ORDER: MetricKey[] = [
  "medianPrice", "growth5y", "yield", "crime",
  "schools", "transport", "green",
  "commute", "schoolBreakdown", "investment",
];

export const METHODOLOGY_INTRO =
  "How we score UK areas. Every metric below lists its source, the last refresh date, and the calculation method used. Areas labelled 'Modelled estimate' are regional benchmarks (directional only) - verified entries draw from the named source directly.";

export function buildMethodologyMarkdown(): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lines: string[] = [
    "# Homestead Ledger - Data Methodology",
    `**Methodology version:** v${METHODOLOGY_VERSION} _(released ${METHODOLOGY_VERSION_DATE})_`,
    `_Generated ${today}_`,
    "",
    METHODOLOGY_INTRO,
    "",
    "| Metric | Source | Last updated | Confidence | Method |",
    "| --- | --- | --- | --- | --- |",
  ];
  ORDER.forEach((k) => {
    const p = METRIC_PROVENANCE[k];
    const src = p.sourceUrl ? `[${p.source}](${p.sourceUrl})` : p.source;
    lines.push(`| ${p.label} | ${src} | ${fmtDate(p.lastUpdated)} | ${confidenceLabel(p.confidence)} | ${p.method} |`);
  });
  lines.push("", "## Confidence ratings", "");
  lines.push("- **High confidence** - Drawn directly from a named primary source (ONS, HM Land Registry, Ofsted, data.police.uk).");
  lines.push("- **Medium confidence** - Modelled from official inputs with documented assumptions (e.g. yield blends, PTAL normalisation).");
  lines.push("- **Modelled estimate** - Regional benchmark applied where direct measurement is unavailable. Use as directional only.");
  lines.push("", changelogMarkdown());
  return lines.join("\n");
}

export function buildMethodologyCsv(): string {
  const csvCell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toRow = (cells: unknown[]) => cells.map(csvCell).join(",");
  const out: string[] = [];
  out.push(toRow(["# Methodology version", METHODOLOGY_VERSION, "Released", METHODOLOGY_VERSION_DATE, "Generated", new Date().toISOString()]));
  out.push("");
  out.push(toRow(["Metric", "Source", "Source URL", "Last updated", "Confidence", "Method"]));
  ORDER.forEach((k) => {
    const p = METRIC_PROVENANCE[k];
    out.push(toRow([p.label, p.source, p.sourceUrl ?? "", fmtDate(p.lastUpdated), confidenceLabel(p.confidence), p.method]));
  });
  out.push("");
  out.push(toRow(["# Changelog"]));
  changelogCsvRows().forEach((r) => out.push(toRow(r)));
  return out.join("\n");
}

export function buildMethodologyPdf(): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(20, 35, 60);
  doc.text("Data Methodology", 40, 52);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
  doc.text(`Homestead Ledger · Generated ${today}`, 40, 68);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(20, 35, 60);
  doc.text(`Methodology v${METHODOLOGY_VERSION}  ·  released ${METHODOLOGY_VERSION_DATE}`, 40, 82);

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  const intro = doc.splitTextToSize(METHODOLOGY_INTRO, doc.internal.pageSize.getWidth() - 80);
  doc.text(intro, 40, 100);

  autoTable(doc, {
    startY: 100 + intro.length * 12 + 10,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [20, 35, 60], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 246, 250] },
    head: [["Metric", "Source", "Updated", "Confidence", "Method"]],
    body: ORDER.map((k) => {
      const p = METRIC_PROVENANCE[k];
      return [p.label, p.source, fmtDate(p.lastUpdated), confidenceLabel(p.confidence), p.method];
    }),
    columnStyles: {
      0: { cellWidth: 90, fontStyle: "bold" },
      1: { cellWidth: 120 },
      2: { cellWidth: 55 },
      3: { cellWidth: 75 },
      4: { cellWidth: "auto" },
    },
  });

  let y = (doc as any).lastAutoTable.finalY + 24;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 35, 60);
  doc.text("Confidence ratings", 40, y);
  y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  const notes = [
    "High confidence - drawn directly from a named primary source (ONS, HM Land Registry, Ofsted, data.police.uk).",
    "Medium confidence - modelled from official inputs with documented assumptions (yield blends, PTAL normalisation).",
    "Modelled estimate - regional benchmark applied where direct measurement is unavailable. Directional only.",
  ];
  notes.forEach((n) => {
    const wrapped = doc.splitTextToSize("• " + n, doc.internal.pageSize.getWidth() - 80);
    doc.text(wrapped, 40, y);
    y += wrapped.length * 12 + 4;
  });

  // Changelog
  y += 10;
  if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 35, 60);
  doc.text("Methodology changelog", 40, y);
  autoTable(doc, {
    startY: y + 8,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [20, 35, 60], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 246, 250] },
    head: [["Version", "Date", "Summary", "Changes"]],
    body: METHODOLOGY_CHANGELOG.map((e) => [
      `v${e.version}`, e.date, e.summary, e.changes.map((c) => `• ${c}`).join("\n"),
    ]),
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 60 },
      2: { cellWidth: 140 },
      3: { cellWidth: "auto" },
    },
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(
      `Page ${p} of ${pages} · Methodology v${METHODOLOGY_VERSION} (${METHODOLOGY_VERSION_DATE}) · Homestead Ledger`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }
  return doc;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

export const downloadMethodologyPdf = (filename = "data-methodology.pdf") => buildMethodologyPdf().save(filename);
export const downloadMethodologyCsv = (filename = "data-methodology.csv") =>
  triggerDownload(new Blob([buildMethodologyCsv()], { type: "text/csv;charset=utf-8" }), filename);
export const downloadMethodologyMarkdown = (filename = "data-methodology.md") =>
  triggerDownload(new Blob([buildMethodologyMarkdown()], { type: "text/markdown;charset=utf-8" }), filename);
