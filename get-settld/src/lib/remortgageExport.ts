// PDF export for the Remortgage Comparator.
// Captures the on-screen chart cards via html2canvas and assembles a
// professional one-click summary PDF including:
//   • Inputs snapshot
//   • Best option reasoning
//   • Detailed cost breakdown per option (interest, ERC, legal/broker,
//     product fee, cashback, overpayments, net cost)
//   • Affordability headroom check
//   • Embedded chart images (Monthly payment + Stress test)
//   • Plain-English glossary
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { fmtFull } from "@/lib/format";

export interface RemortgageRowSnapshot {
  id: string;
  label: string;
  isStay?: boolean;
  rate: number;
  initialYears: number;
  followOnRate: number;
  monthlyInitial: number;
  monthlyDelta: number;
  interestPaid: number;
  productFee: number;
  ercCost: number;        // £ — separated from other fees
  legalAndBroker: number; // £
  cashback: number;
  overpaid: number;
  netCost: number;
  balanceEnd: number;
  breakevenMonths: number | null;
}

export interface AffordabilitySnapshot {
  monthlyIncome: number;
  monthlyExpenses: number;
  enabled: boolean;
}

export interface RemortgageExportInput {
  inputs: {
    balance: number;
    propertyValue: number;
    ltv: number;
    termRemaining: number;
    currentRate: number;
    currentSvr: number;
    monthsLeftOnDeal: number;
    ercPct: number;
    legalFees: number;
    brokerFee: number;
    monthlyOverpay: number;
    lumpSum: number;
    horizonYears: number;
    currentMonthly: number;
  };
  rows: RemortgageRowSnapshot[];
  bestId?: string;
  affordability: AffordabilitySnapshot;
  chartElementIds: string[]; // DOM ids to capture
}

const GLOSSARY: Array<[string, string]> = [
  ["LTV (Loan to Value)", "The percentage of the property's value that you owe on the mortgage. Lower LTV = better rates."],
  ["ERC (Early Repayment Charge)", "A penalty (typically 1-5% of the balance) for leaving your fixed deal early. Drops each year."],
  ["SVR (Standard Variable Rate)", "The lender's default rate you fall onto when your fix ends. Almost always more expensive than a new fix."],
  ["Net cost of borrowing", "Interest + fees − cashback over your chosen horizon. The only fair single-number score across different fix lengths because capital you repay is equity, not a cost."],
  ["Booking window", "Most lenders let you reserve a new rate up to 6 months before your current deal ends, with no ERC."],
  ["Product fee", "A one-off fee charged by the lender for the new deal. Can sometimes be added to the loan (we charge it upfront for clarity)."],
  ["Stress test", "Models what your monthly payment looks like if rates move ±% after your fix ends, on the remaining balance."],
  ["Payment headroom", "What's left of your monthly take-home after expenses and the new mortgage payment. Negative = unaffordable."],
];

async function captureElement(id: string): Promise<string | null> {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[remortgage-pdf] capture failed", id, e);
    return null;
  }
}

export async function exportRemortgagePdf(data: RemortgageExportInput): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // ----- Header
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Remortgage comparison report", M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated ${today}  ·  Indicative only — not financial advice.`, M, 58);

  let y = 100;
  doc.setTextColor(0, 0, 0);

  // ----- Your situation
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Your situation", M, y);
  y += 6;
  const i = data.inputs;
  autoTable(doc, {
    startY: y + 4,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    body: [
      ["Mortgage balance", fmtFull(i.balance), "Property value", fmtFull(i.propertyValue)],
      ["LTV", `${i.ltv}%`, "Term remaining", `${i.termRemaining} years`],
      ["Current rate", `${i.currentRate}%`, "Lender SVR", `${i.currentSvr}%`],
      ["Months left on deal", String(i.monthsLeftOnDeal), "ERC %", `${i.ercPct}%`],
      ["Legal/valuation", fmtFull(i.legalFees), "Broker fee", fmtFull(i.brokerFee)],
      ["Monthly overpayment", fmtFull(i.monthlyOverpay), "Lump sum", fmtFull(i.lumpSum)],
      ["Comparison horizon", `${i.horizonYears} years`, "Current monthly payment", fmtFull(i.currentMonthly)],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 110 },
      1: { cellWidth: 130 },
      2: { fontStyle: "bold", cellWidth: 110 },
      3: { cellWidth: 130 },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 18;

  // ----- Recommendation
  const best = data.rows.find((r) => r.id === data.bestId);
  const stay = data.rows.find((r) => r.isStay);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Recommendation", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (best) {
    const savings = stay ? Math.max(0, stay.netCost - best.netCost) : 0;
    const lines = [
      `Best option over ${i.horizonYears} years: ${best.label}.`,
      `Net cost of borrowing: ${fmtFull(best.netCost)} (interest + fees − cashback).`,
      stay && best.id !== stay.id
        ? `That saves about ${fmtFull(savings)} versus doing nothing.`
        : `Doing nothing is currently cheapest — usually because the ERC outweighs the switching benefit.`,
      `Monthly payment ${best.monthlyDelta < 0 ? "drops by" : "rises by"} ${fmtFull(Math.abs(best.monthlyDelta))} vs. today.`,
      best.breakevenMonths != null && best.breakevenMonths <= i.horizonYears * 12
        ? `Switching fees pay back in about ${best.breakevenMonths} months.`
        : best.isStay ? "" : "Switching fees do not fully pay back inside the horizon — the long-term rate is still the deciding factor.",
    ].filter(Boolean) as string[];
    lines.forEach((l) => {
      const wrapped = doc.splitTextToSize(`• ${l}`, W - 2 * M);
      doc.text(wrapped, M, y);
      y += wrapped.length * 12;
    });
  }
  y += 8;

  // ----- Detailed cost breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Detailed cost breakdown", M, y);
  y += 4;
  autoTable(doc, {
    startY: y + 6,
    head: [["Option", "Interest", "ERC", "Legal/Broker", "Product fee", "Cashback", "Overpayments", `Net cost / ${i.horizonYears}y`]],
    body: data.rows.map((r) => [
      r.label + (r.id === data.bestId ? "  ★" : ""),
      fmtFull(r.interestPaid),
      r.ercCost > 0 ? `−${fmtFull(r.ercCost)}` : "—",
      r.legalAndBroker > 0 ? `−${fmtFull(r.legalAndBroker)}` : "—",
      r.productFee > 0 ? `−${fmtFull(r.productFee)}` : "—",
      r.cashback > 0 ? `+${fmtFull(r.cashback)}` : "—",
      r.overpaid > 0 ? fmtFull(r.overpaid) : "—",
      fmtFull(r.netCost),
    ]),
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [15, 27, 61], textColor: 255, fontSize: 8.5 },
    bodyStyles: { textColor: [30, 30, 30] },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 7) {
        hook.cell.styles.fontStyle = "bold";
      }
      const r = data.rows[hook.row.index];
      if (hook.section === "body" && r && r.id === data.bestId) {
        hook.cell.styles.fillColor = [232, 245, 240];
      }
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "Costs (−) reduce your wealth, credits (+) add to it. Capital repayment and overpayments are equity built, not a cost — they don't appear in net cost.",
    M, y, { maxWidth: W - 2 * M },
  );
  doc.setTextColor(0, 0, 0);
  y += 18;

  // ----- Affordability
  if (data.affordability.enabled) {
    if (y > 680) { doc.addPage(); y = 60; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Affordability — payment stress headroom", M, y);
    y += 4;
    const a = data.affordability;
    const baseDisposable = a.monthlyIncome - a.monthlyExpenses;
    autoTable(doc, {
      startY: y + 6,
      head: [["Option", "New monthly", "Headroom today", "Headroom @ +3%"]],
      body: data.rows.map((r) => {
        const headroom = baseDisposable - r.monthlyInitial;
        const balanceForStress = r.balanceEnd > 0 ? r.balanceEnd : data.inputs.balance;
        const stressedRate = (r.isStay ? data.inputs.currentSvr : r.followOnRate) + 3;
        const yearsLeft = Math.max(1, data.inputs.termRemaining - data.inputs.horizonYears);
        const r12 = stressedRate / 100 / 12;
        const n = yearsLeft * 12;
        const stressedMp = r12 === 0 ? balanceForStress / n
          : (balanceForStress * (r12 * Math.pow(1 + r12, n))) / (Math.pow(1 + r12, n) - 1);
        const stressedHeadroom = baseDisposable - stressedMp;
        return [
          r.label + (r.id === data.bestId ? "  ★" : ""),
          fmtFull(r.monthlyInitial),
          (headroom >= 0 ? "+" : "−") + fmtFull(Math.abs(headroom)),
          (stressedHeadroom >= 0 ? "+" : "−") + fmtFull(Math.abs(stressedHeadroom)),
        ];
      }),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 27, 61], textColor: 255 },
      didParseCell: (hook) => {
        if (hook.section === "body" && (hook.column.index === 2 || hook.column.index === 3)) {
          const v = String(hook.cell.raw ?? "");
          if (v.startsWith("−")) hook.cell.styles.textColor = [180, 30, 30];
          else if (v.startsWith("+")) hook.cell.styles.textColor = [30, 120, 60];
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Based on monthly take-home ${fmtFull(a.monthlyIncome)} and expenses ${fmtFull(a.monthlyExpenses)}. Stress assumes a +3% rise in your revert rate after the fix ends.`,
      M, y, { maxWidth: W - 2 * M },
    );
    doc.setTextColor(0, 0, 0);
    y += 22;
  }

  // ----- Charts (capture from DOM)
  for (const id of data.chartElementIds) {
    const img = await captureElement(id);
    if (!img) continue;
    if (y > 480) { doc.addPage(); y = 60; }
    // Compute display size while preserving aspect.
    const props = doc.getImageProperties(img);
    const maxW = W - 2 * M;
    const maxH = 280;
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const w = props.width * ratio;
    const h = props.height * ratio;
    doc.addImage(img, "PNG", M, y, w, h);
    y += h + 16;
  }

  // ----- Glossary
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Plain-English glossary", M, 60);
  let gy = 84;
  doc.setFontSize(10);
  GLOSSARY.forEach(([term, def]) => {
    doc.setFont("helvetica", "bold");
    doc.text(term, M, gy);
    gy += 13;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(def, W - 2 * M);
    doc.text(wrapped, M, gy);
    gy += wrapped.length * 12 + 6;
    if (gy > 760) { doc.addPage(); gy = 60; }
  });

  // ----- Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Page ${p} of ${pageCount}  ·  Indicative only — not financial advice.`, M, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`remortgage-comparison-${new Date().toISOString().slice(0, 10)}.pdf`);
}
