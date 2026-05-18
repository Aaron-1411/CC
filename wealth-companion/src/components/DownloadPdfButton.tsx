import { useState, type RefObject } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportElementToPDF } from "@/lib/pdf-export";

export function DownloadPdfButton({
  targetRef,
  filename = "sterling-report.pdf",
  label = "Download PDF",
}: {
  targetRef: RefObject<HTMLElement | null>;
  filename?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!targetRef.current) return;
        setBusy(true);
        try {
          await exportElementToPDF(targetRef.current, filename);
        } catch (e) {
          console.error("PDF export failed", e);
          alert("Sorry — couldn't generate the PDF. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {busy ? "Building PDF…" : label}
    </button>
  );
}
