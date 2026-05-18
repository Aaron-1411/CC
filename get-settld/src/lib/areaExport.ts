import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Area, cagr, cumulativeGrowth, valueGap, investmentScore, schoolImpactScore, areaConfidence, confidenceLabel } from "@/data/areas";
import { fmt } from "@/lib/format";
import {
  METHODOLOGY_VERSION,
  METHODOLOGY_VERSION_DATE,
  METHODOLOGY_CHANGELOG,
  versionStamp,
} from "@/data/methodologyVersion";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildAreasCsv(areas: Area[]): string {
  const headers = [
    "Area", "Region", "Confidence", "Median price (£)", "5yr growth (%)",
    "5yr CAGR (%)", "Cumulative growth (%)", "Yield (%)", "Crime /1k",
    "Schools /10", "Transport /10", "Green /10",
    "School impact /100", "Investment score /100",
    "£/sqft", "Region £/sqft", "Value gap (%)",
    "Rental demand /100", "Voids (wk)", "Regen pipeline /100", "Affordability (×)",
    "Pros", "Cons",
  ];
  const rows = areas.map((a) => {
    const i = a.investment;
    return [
      a.name, a.region, confidenceLabel(areaConfidence(a)),
      a.medianPrice, a.growth5y,
      cagr(i.yearlyGrowth), cumulativeGrowth(i.yearlyGrowth), a.yield, a.crime,
      a.schools, a.transport, a.green,
      schoolImpactScore(a.schoolBreakdown), investmentScore(a),
      i.pricePerSqft, i.pricePerSqftRegion, valueGap(i),
      i.rentalDemand, i.voidWeeks, i.capexPipeline, i.affordabilityRatio,
      a.pros.join(" • "), a.cons.join(" • "),
    ].map(csvCell).join(",");
  });
  const preface: string[] = [
    `# ${versionStamp()}`,
    `# Methodology changelog (most recent first):`,
    ...METHODOLOGY_CHANGELOG.map((e) => `#   v${e.version} (${e.date}) - ${e.summary}`),
    "",
  ];
  return [...preface, headers.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function buildAreasPdf(areas: Area[], shareUrl?: string): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(20, 35, 60);
  doc.text("Area Comparison Report", 40, 48);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
  doc.text(`Homestead Ledger · Generated ${today}`, 40, 64);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(20, 35, 60);
  doc.text(`Methodology v${METHODOLOGY_VERSION} · released ${METHODOLOGY_VERSION_DATE}`, 40, 78);
  doc.setFont("helvetica", "normal"); doc.setTextColor(110);
  if (shareUrl) doc.text(shareUrl, 40, 92);

  // Summary table
  autoTable(doc, {
    startY: 108,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [20, 35, 60], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 246, 250] },
    head: [[
      "Area", "Region", "Conf.", "Median", "5y growth", "Yield",
      "Schools", "Transport", "Green", "Crime",
      "School /100", "Invest /100",
    ]],
    body: areas.map((a) => [
      a.name, a.region, confidenceLabel(areaConfidence(a)).split(" ")[0],
      fmt(a.medianPrice), `+${a.growth5y}%`, `${a.yield}%`,
      `${a.schools}/10`, `${a.transport}/10`, `${a.green}/10`, String(a.crime),
      String(schoolImpactScore(a.schoolBreakdown)), String(investmentScore(a)),
    ]),
  });

  // Per-area detail blocks
  areas.forEach((a) => {
    const i = a.investment;
    let y = (doc as any).lastAutoTable.finalY + 22;
    if (y > doc.internal.pageSize.getHeight() - 200) { doc.addPage(); y = 60; }

    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 35, 60);
    doc.text(`${a.name} - ${a.region}`, 40, y);
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(110);
    doc.text(a.vibe, 40, y + 14);

    autoTable(doc, {
      startY: y + 22,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3 },
      theme: "grid",
      head: [["Metric", "Value", "Metric", "Value"]],
      headStyles: { fillColor: [232, 236, 244], textColor: 30, fontStyle: "bold" },
      body: [
        ["Investment score", `${investmentScore(a)} / 100`, "School impact", `${schoolImpactScore(a.schoolBreakdown)} / 100`],
        ["5y CAGR", `${cagr(i.yearlyGrowth)}%`, "Cumulative growth", `${cumulativeGrowth(i.yearlyGrowth)}%`],
        ["£/sqft", `£${i.pricePerSqft} (region £${i.pricePerSqftRegion})`, "Value gap vs region", `${valueGap(i)}%`],
        ["Rental demand", `${i.rentalDemand} / 100`, "Voids", `${i.voidWeeks} weeks`],
        ["Regen pipeline", `${i.capexPipeline} / 100`, "Affordability", `${i.affordabilityRatio}× income`],
        ["Top school", a.schoolBreakdown.topSchool, "% Outstanding", `${a.schoolBreakdown.pctOutstanding}%`],
        ["Confidence", confidenceLabel(areaConfidence(a)), "Source", "ONS HPI · Land Registry · Ofsted"],
      ],
    });

    const after = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: after,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 4, valign: "top" },
      theme: "plain",
      body: [[
        { content: "PROS\n" + a.pros.map((p) => `+ ${p}`).join("\n"), styles: { textColor: [20, 110, 60] as any } },
        { content: "CONS\n" + a.cons.map((c) => `- ${c}`).join("\n"), styles: { textColor: [160, 40, 40] as any } },
      ]],
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: "auto" } },
    });
  });

  // Methodology changelog page
  doc.addPage();
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20, 35, 60);
  doc.text("Methodology version & changelog", 40, 50);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(110);
  doc.text(
    `This report was built using methodology v${METHODOLOGY_VERSION}, released ${METHODOLOGY_VERSION_DATE}. The log below tracks updates to the calculation methods, sources, and confidence model over time.`,
    40, 68, { maxWidth: doc.internal.pageSize.getWidth() - 80 },
  );
  autoTable(doc, {
    startY: 100,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [20, 35, 60], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 246, 250] },
    head: [["Version", "Date", "Summary", "Changes"]],
    body: METHODOLOGY_CHANGELOG.map((e) => [
      `v${e.version}`, e.date, e.summary, e.changes.map((c) => `• ${c}`).join("\n"),
    ]),
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 70 },
      2: { cellWidth: 180 },
      3: { cellWidth: "auto" },
    },
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(
      `Page ${p} of ${pages} · Methodology v${METHODOLOGY_VERSION} (${METHODOLOGY_VERSION_DATE}) · Sources: ONS UK HPI, HM Land Registry, Ofsted, data.police.uk, DfT PTAL`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  return doc;
}

export function downloadAreasPdf(filename: string, areas: Area[], shareUrl?: string) {
  const doc = buildAreasPdf(areas, shareUrl);
  doc.save(filename);
}
