import { useState } from "react";
import { ClipboardCheck, Copy, Download, FileText } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { clinicConfig } from "@/config/clinic";
import { summaryRows, buildSummaryText, hasTaking, type IntakeData } from "@/lib/summary";

export function PractitionerSummary({ data, showActions = true }: { data: IntakeData; showActions?: boolean }) {
  const [copied, setCopied] = useState(false);
  const rows = summaryRows(data);
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText(data, clinicConfig.name));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — download remains as the fallback */
    }
  };

  const download = () => {
    const blob = new Blob([buildSummaryText(data, clinicConfig.name)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pre-consultation-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-surface px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-serif text-xl leading-none">Your practitioner summary</h3>
            <p className="mt-1 text-sm text-muted-foreground">A clear summary to share with your practitioner.</p>
          </div>
        </div>
      </div>

      <dl className="divide-y divide-border px-5 sm:px-6">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 py-3.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:pt-0.5">{r.label}</dt>
            <dd className="text-[0.95rem] leading-relaxed text-foreground/90">{r.value}</dd>
          </div>
        ))}
      </dl>

      {hasTaking(data) && (
        <p className="mx-5 mb-1 rounded-lg bg-warning-soft px-3.5 py-2.5 text-xs leading-relaxed text-warning-foreground sm:mx-6">
          Bring this list to your appointment, and check with your pharmacist or doctor that everything is safe to take
          together.
        </p>
      )}

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground">
          Prepared with {clinicConfig.name} · {date} · General education, not medical advice.
        </p>
        {showActions && (
          <div className="flex gap-2">
            <Button variant="soft" size="sm" onClick={copy}>
              {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
