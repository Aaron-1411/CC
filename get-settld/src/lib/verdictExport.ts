// Lightweight verdict export: copy a shareable URL (state lives in the URL
// already), and download a one-page PDF summary using jsPDF.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { copyText } from "@/lib/share";

export interface VerdictExport {
  postcode: string;
  askingPrice?: number;
  monthlyPayment?: number;
  upfrontCash?: number;
  avmP50?: number;
  overall: "green" | "amber" | "red";
  oneLiner: string;
  narrative?: string;
  factors?: { label: string; light: string; headline: string }[];
}

export async function shareVerdict(): Promise<void> {
  const url = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title: "Property verdict", url }); return; } catch { /* ignore */ }
  }
  await copyText(url, "Verdict link copied");
}

export function downloadVerdictPdf(v: VerdictExport): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Property verdict", margin, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Postcode: ${v.postcode || "—"}`, margin, 80);

  // Verdict pill
  const colour: Record<string, [number, number, number]> = {
    green: [34, 139, 79],
    amber: [217, 137, 21],
    red: [200, 40, 40],
  };
  const c = colour[v.overall] || [100, 100, 100];
  doc.setFillColor(...c);
  doc.roundedRect(margin, 100, 140, 28, 6, 6, "F");
  doc.setTextColor(255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(v.overall.toUpperCase(), margin + 12, 119);

  doc.setTextColor(20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(v.oneLiner, margin + 160, 119, { maxWidth: pageW - margin * 2 - 160 });

  if (v.narrative) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(doc.splitTextToSize(v.narrative, pageW - margin * 2), margin, 160);
  }

  const numRows: [string, string][] = [];
  if (v.askingPrice) numRows.push(["Asking price", `£${v.askingPrice.toLocaleString()}`]);
  if (v.avmP50) numRows.push(["Estimated fair value", `£${v.avmP50.toLocaleString()}`]);
  if (v.monthlyPayment) numRows.push(["Monthly mortgage", `£${v.monthlyPayment.toLocaleString()}`]);
  if (v.upfrontCash) numRows.push(["Upfront cash needed", `£${v.upfrontCash.toLocaleString()}`]);

  let y = 220;
  if (numRows.length) {
    autoTable(doc, {
      startY: y,
      head: [["Money", "Value"]],
      body: numRows,
      theme: "striped",
      headStyles: { fillColor: [40, 60, 80] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  if (v.factors?.length) {
    autoTable(doc, {
      startY: y,
      head: [["Factor", "Light", "Detail"]],
      body: v.factors.map((f) => [f.label, f.light.toUpperCase(), f.headline]),
      theme: "grid",
      headStyles: { fillColor: [40, 60, 80] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    `Homestead Ledger · Generated ${new Date().toLocaleDateString("en-GB")} · Indicative only — not financial advice.`,
    margin, pageH - 24,
  );

  doc.save(`verdict-${v.postcode || "property"}-${Date.now()}.pdf`);
}
