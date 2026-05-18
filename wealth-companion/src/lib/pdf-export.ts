import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export async function exportElementToPDF(el: HTMLElement, filename = "report.pdf") {
  // html-to-image handles modern CSS (oklch, css vars) far better than html2canvas
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: { transform: "none" },
  });

  // Get image dimensions
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res) => (img.onload = res));

  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (img.height * imgW) / img.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}
