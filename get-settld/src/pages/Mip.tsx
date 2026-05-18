import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { scoreMip, type MipInput, type MipResult } from "@/lib/mip";
import { fmtFull } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Jargon from "@/components/Jargon";
import Comparator from "@/components/Comparator";
import { useRegionTerm } from "@/components/RegionTerm";

const DEFAULT: MipInput = {
  grossAnnualIncome: 55000,
  monthlyDebtPayments: 150,
  dependants: 0,
  employment: "employed",
  monthsInRole: 36,
  depositAmount: 30000,
  propertyPrice: 320000,
  depositSource: "savings",
  creditBand: "good",
  missedPaymentsLast12m: 0,
  bankruptOrIVA: false,
  ukResidentYears: 10,
};

export default function Mip() {
  const { user } = useAuth();
  const [input, setInput] = useState<MipInput>(DEFAULT);
  const [result, setResult] = useState<MipResult | null>(null);
  const [explanation, setExplanation] = useState<string>("");

  const upd = <K extends keyof MipInput>(k: K, v: MipInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const explain = useMutation({
    mutationFn: async (r: MipResult) => {
      const { data, error } = await supabase.functions.invoke<{ explanation?: string; error?: string }>(
        "mip-explainer",
        { body: { result: r, inputs: input } },
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.explanation ?? "";
    },
    onSuccess: (text) => setExplanation(text),
    onError: (e) => toast.error((e as Error).message),
  });

  const run = () => {
    const r = scoreMip(input);
    setResult(r);
    setExplanation("");
    if (user) {
      supabase.from("mip_assessments").insert({
        user_id: user.id, inputs: input as never, result: r as never,
      }).then(({ error }) => { if (error) console.warn(error); });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mortgage"
        title={<><Jargon term="MIP" /> readiness</>}
        documentTitle="Mortgage in Principle readiness"
        description="A 6-question pre-flight that tells you which lenders will likely say yes — without a hard credit search."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Your situation</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Gross annual income</Label>
              <NumberInput value={input.grossAnnualIncome} onChange={(n) => upd("grossAnnualIncome", n)} /></div>
            <div><Label>Monthly debt payments</Label>
              <NumberInput value={input.monthlyDebtPayments} onChange={(n) => upd("monthlyDebtPayments", n)} /></div>
            <div><Label>Dependants</Label>
              <NumberInput value={input.dependants} onChange={(n) => upd("dependants", n)} /></div>
            <div><Label>UK residency (years)</Label>
              <NumberInput value={input.ukResidentYears} onChange={(n) => upd("ukResidentYears", n)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employment</Label>
              <Select value={input.employment} onValueChange={(v: MipInput["employment"]) => upd("employment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="selfEmployed">Self-employed</SelectItem>
                  <SelectItem value="contract">Contractor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Months in role</Label>
              <NumberInput value={input.monthsInRole} onChange={(n) => upd("monthsInRole", n)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div><Label>Property price</Label>
              <NumberInput value={input.propertyPrice} onChange={(n) => upd("propertyPrice", n)} /></div>
            <div><Label>Deposit</Label>
              <NumberInput value={input.depositAmount} onChange={(n) => upd("depositAmount", n)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deposit source</Label>
              <Select value={input.depositSource} onValueChange={(v: MipInput["depositSource"]) => upd("depositSource", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="lisa">LISA</SelectItem>
                  <SelectItem value="gift">Gifted</SelectItem>
                  <SelectItem value="equity">Property equity</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Credit band</Label>
              <Select value={input.creditBand} onValueChange={(v: MipInput["creditBand"]) => upd("creditBand", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="unknown">Don't know</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div><Label>Missed payments (12m)</Label>
              <NumberInput value={input.missedPaymentsLast12m} onChange={(n) => upd("missedPaymentsLast12m", n)} /></div>
            <div className="flex items-center justify-between">
              <Label>Bankruptcy / IVA history</Label>
              <Switch checked={input.bankruptOrIVA} onCheckedChange={(v) => upd("bankruptOrIVA", v)} />
            </div>
          </div>
          <Button className="w-full" onClick={run}>Check my readiness</Button>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {!result && (
            <Card className="p-10 text-center text-muted-foreground">
              Fill in your details on the left, then run the check. We'll tell you how many high-street lenders
              are likely to approve, your estimated max borrowing, and what to fix first.
            </Card>
          )}
          {result && (
            <>
              <Card className="p-6 bg-gradient-warm">
                <Badge className="bg-brand-muted text-brand border-0 mb-3">Estimated max borrowing</Badge>
                <Comparator
                  value={fmtFull(result.estimatedMaxBorrow)}
                  context={`${result.borrowingMultiple.toFixed(1)}× your income · typical lender cap is 4.5×`}
                  tone={result.borrowingMultiple <= 4.5 ? "good" : result.borrowingMultiple <= 5 ? "warn" : "bad"}
                  className="!flex-row !items-baseline !gap-3"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  <Jargon term="LTV" /> {(result.ltv * 100).toFixed(0)}%
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-sm">
                  <div className="bg-success/10 rounded-md p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Likely</p>
                    <p className="font-mono text-2xl font-bold text-success mt-1">{result.lendersLikely}</p>
                  </div>
                  <div className="bg-warning/10 rounded-md p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Borderline</p>
                    <p className="font-mono text-2xl font-bold text-warning mt-1">{result.lendersBorderline}</p>
                  </div>
                  <div className="bg-destructive/10 rounded-md p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Unlikely</p>
                    <p className="font-mono text-2xl font-bold text-destructive mt-1">{result.lendersUnlikely}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif font-bold text-brand">Personalised guidance</h3>
                  <Button variant="outline" size="sm" onClick={() => explain.mutate(result)} disabled={explain.isPending || !user}>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    {explain.isPending ? "Thinking..." : "Get AI guidance"}
                  </Button>
                </div>
                {!user && <p className="text-xs text-muted-foreground">Sign in to get tailored next steps.</p>}
                {explain.isPending && <Skeleton className="h-24 w-full" />}
                {explanation && (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{explanation}</div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="font-serif font-bold text-brand mb-3">Lender panel</h3>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {result.lenders.map((l) => (
                    <li key={l.name} className="flex items-center gap-2 border rounded-md px-3 py-2">
                      {l.status === "likely" && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {l.status === "borderline" && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {l.status === "unlikely" && <XCircle className="h-4 w-4 text-destructive" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{l.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.reason}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              {(result.flags.length > 0 || result.strengths.length > 0) && (
                <Card className="p-5">
                  <h3 className="font-serif font-bold text-brand mb-3">What's helping & hurting</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-success mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {result.strengths.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
                        {result.strengths.map((s) => <li key={s}>✓ {s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-destructive mb-2">Flags</p>
                      <ul className="space-y-1">
                        {result.flags.length === 0 && <li className="text-muted-foreground text-xs">No major flags</li>}
                        {result.flags.map((s) => <li key={s}>⚠ {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              <p className="text-xs text-muted-foreground">
                Indicative only. Lender criteria change frequently — confirm with a broker before committing.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
