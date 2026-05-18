import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Copy, Check } from "lucide-react";
import { getReceiptBySlug } from "@/lib/receipts";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useTrackTool } from "@/hooks/use-track-tool";

export default function Receipt() {
  const { slug = "" } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useTrackTool("receipt.view", { slug });

  useEffect(() => {
    getReceiptBySlug(slug).then(r => { setReceipt(r); setLoading(false); }).catch(e => { setErr(String(e)); setLoading(false); });
  }, [slug]);

  if (loading) return <LoadingState label="Loading verdict receipt…" />;
  if (err) return <ErrorState title="Couldn't load receipt" description={err} />;
  if (!receipt) return <EmptyState title="Receipt not found" description="This link may have expired or been deleted." />;

  const bandColor = receipt.band === "green" ? "bg-success text-success-foreground"
    : receipt.band === "amber" ? "bg-accent text-accent-foreground"
    : "bg-destructive text-destructive-foreground";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-brand">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>
      <Card className="p-8 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Verdict Receipt</span>
          </div>
          {receipt.band && <Badge className={bandColor}>{String(receipt.band).toUpperCase()}</Badge>}
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand mb-2">
          {receipt.property_ref || "Untitled property"}
        </h1>
        {typeof receipt.score === "number" && (
          <p className="text-lg text-foreground mb-4">Score: <strong>{receipt.score}/100</strong></p>
        )}
        <ReceiptVerdict verdict={receipt.verdict} />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Issued</p>
            <p className="font-mono">{new Date(receipt.created_at).toLocaleString("en-GB")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Signature</p>
            <p className="font-mono break-all">{receipt.signature}</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t flex flex-wrap gap-2">
          <Button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? "Copied" : "Copy share link"}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>Print / Save as PDF</Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Tamper-evident: any change to the data above will invalidate the signature. Issued by Homestead Ledger — paid by buyers, never by estate agents.
        </p>
      </Card>
    </div>
  );
}

interface VerdictPayload {
  oneLiner?: string;
  monthlyPayment?: number;
  upfrontCash?: number;
  avmP50?: number;
  factors?: { label: string; light: "green" | "amber" | "red"; headline: string }[];
}

function ReceiptVerdict({ verdict }: { verdict: unknown }) {
  const v = (verdict ?? {}) as VerdictPayload;
  const fmt = (n?: number) => n == null ? "—" : `£${n.toLocaleString("en-GB")}`;
  const dot = (l: "green" | "amber" | "red") =>
    l === "green" ? "bg-success" : l === "amber" ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-4">
      {v.oneLiner && (
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Verdict</p>
          <p className="font-serif text-lg text-foreground">{v.oneLiner}</p>
        </div>
      )}
      {(v.monthlyPayment != null || v.upfrontCash != null || v.avmP50 != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mid value</p><p className="font-mono font-semibold mt-0.5">{fmt(v.avmP50)}</p></div>
          <div className="rounded-md border p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</p><p className="font-mono font-semibold mt-0.5">{fmt(v.monthlyPayment)}</p></div>
          <div className="rounded-md border p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Upfront</p><p className="font-mono font-semibold mt-0.5">{fmt(v.upfrontCash)}</p></div>
        </div>
      )}
      {Array.isArray(v.factors) && v.factors.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Factor breakdown</p>
          <ul className="space-y-2">
            {v.factors.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${dot(f.light)}`} aria-label={f.light} />
                <div className="flex-1 min-w-0"><span className="font-medium">{f.label}:</span>{" "}<span className="text-muted-foreground">{f.headline}</span></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

