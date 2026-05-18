import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtFull } from "@/lib/format";
import { estimateLeaseExtension, projectGroundRent, type LeaseInput } from "@/lib/lease";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Jargon from "@/components/Jargon";

const DEFAULT: LeaseInput = {
  currentLeaseYears: 85,
  propertyValueFreehold: 350_000,
  groundRentAnnual: 250,
  groundRentReviewType: "fixed",
};

export default function LeaseAnalysis() {
  const [input, setInput] = useState<LeaseInput>(DEFAULT);

  const ext = useMemo(() => estimateLeaseExtension(input), [input]);
  const proj = useMemo(() => projectGroundRent(input, 50), [input]);
  const total50y = proj.reduce((s, p) => s + p.rent, 0);

  return (
    <>
      <PageHeader
        eyebrow="Leasehold"
        title={<><Jargon term="Leasehold" /> deep-dive</>}
        documentTitle="Leasehold deep-dive"
        description="Estimate your statutory lease-extension premium and project ground-rent escalation over the next 50 years."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Lease details</h2>
          <div><Label>Years remaining on lease</Label>
            <NumberInput value={input.currentLeaseYears} onChange={(n) => setInput((p) => ({ ...p, currentLeaseYears: n }))} /></div>
          <div><Label>Estimated freehold value</Label>
            <NumberInput value={input.propertyValueFreehold} onChange={(n) => setInput((p) => ({ ...p, propertyValueFreehold: n }))} /></div>
          <div><Label>Annual ground rent (£)</Label>
            <NumberInput value={input.groundRentAnnual} onChange={(n) => setInput((p) => ({ ...p, groundRentAnnual: n }))} /></div>
          <div>
            <Label>Ground rent review</Label>
            <Select value={input.groundRentReviewType} onValueChange={(v: LeaseInput["groundRentReviewType"]) => setInput((p) => ({ ...p, groundRentReviewType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed (no review)</SelectItem>
                <SelectItem value="rpi">RPI-linked (~3%/yr)</SelectItem>
                <SelectItem value="doubling25">Doubles every 25 years</SelectItem>
                <SelectItem value="doubling10">Doubles every 10 years (toxic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Indicative only — based on Sportelli (5%) deferment + Savills relativity. A formal RICS valuation is required to serve a Section 42 notice.
          </p>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 bg-gradient-warm">
            <Badge className="bg-brand-muted text-brand border-0 mb-3">Estimated extension premium</Badge>
            <h2 className="font-serif text-4xl font-bold text-brand">{fmtFull(ext.premium)}</h2>
            <p className="text-muted-foreground mt-1">
              To extend your lease by 90 years to <span className="font-mono">{ext.newLeaseYears}</span> years
              {ext.marriageValueApplies && <span className="text-destructive"> · marriage value applies</span>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-sm">
              <div className="bg-card rounded-md p-3 border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Plus legal & valuation</p>
                <p className="font-mono font-semibold mt-1">~£3,500</p>
              </div>
              <div className="bg-card rounded-md p-3 border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total estimated cost</p>
                <p className="font-mono font-semibold mt-1">{fmtFull(ext.premium + 3500)}</p>
              </div>
              <div className="bg-card rounded-md p-3 border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">FH value uplift</p>
                <p className="font-mono font-semibold text-success mt-1">~{fmtFull(Math.round(input.propertyValueFreehold * 0.04))}</p>
              </div>
            </div>
          </Card>

          {ext.noteworthy.length > 0 && (
            <Card className="p-5">
              <h3 className="font-serif font-bold text-brand mb-3">Things to know</h3>
              <ul className="space-y-2 text-sm">
                {ext.noteworthy.map((n) => <li key={n}>⚠ {n}</li>)}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-serif font-bold text-brand mb-3">Ground rent over 50 years</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Total paid over 50 years: <span className="font-mono font-semibold text-foreground">{fmtFull(total50y)}</span>
            </p>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={proj}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Years from now", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                  <Line type="monotone" dataKey="rent" stroke="hsl(var(--brand))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
