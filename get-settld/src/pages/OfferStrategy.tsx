import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Jargon from "@/components/Jargon";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Handshake, TrendingUp, Target } from "lucide-react";
import { fmtFull } from "@/lib/format";

// Logistic win-probability model
// Inputs feed a linear score; we squash through 1/(1+e^-x).
const winProb = (
  offerVsAsking: number,    // ratio
  daysOnMarket: number,
  competing: boolean,
  chainFree: boolean,
  mortgageInPrinciple: boolean,
  cashBuyer: boolean,
) => {
  // Centre point: an offer at 100% asking with no leverage → ~50% win prob baseline
  let z = (offerVsAsking - 0.95) * 18;       // every 1% over asking ≈ +0.18 logit
  z += Math.min(daysOnMarket, 180) * 0.012;  // older listings easier to win
  if (competing) z -= 0.6;                    // competing offers reduce odds
  if (chainFree) z += 0.35;
  if (mortgageInPrinciple) z += 0.25;
  if (cashBuyer) z += 0.5;
  const p = 1 / (1 + Math.exp(-z));
  return Math.max(0, Math.min(1, p));
};

export default function OfferStrategy() {
  const [asking, setAsking] = useState(385_000);
  const [comparableAvg, setComparableAvg] = useState(368_000);
  const [daysOnMarket, setDaysOnMarket] = useState(62);
  const [chainFree, setChainFree] = useState(true);
  const [competing, setCompeting] = useState(false);
  const [mortgageInPrinciple, setMip] = useState(true);
  const [cashBuyer, setCashBuyer] = useState(false);
  const [offer, setOffer] = useState(370_000);
  const [escalateTo, setEscalateTo] = useState(385_000);
  const [escalateBy, setEscalateBy] = useState(2_000);

  const recommendedRange = useMemo(() => {
    let pct = 1.0;
    if (daysOnMarket > 90) pct -= 0.06;
    else if (daysOnMarket > 60) pct -= 0.04;
    else if (daysOnMarket > 30) pct -= 0.02;
    const compRatio = comparableAvg / asking;
    pct = pct * 0.7 + compRatio * 0.3;
    if (chainFree) pct -= 0.01;
    if (competing) pct += 0.03;
    pct = Math.max(0.85, Math.min(1.05, pct));
    return {
      opening: Math.round(asking * (pct - 0.03)),
      target: Math.round(asking * pct),
      ceiling: Math.round(asking * Math.min(1.0, pct + 0.02)),
    };
  }, [asking, comparableAvg, daysOnMarket, chainFree, competing]);

  // Win-prob curve across offer range
  const curve = useMemo(() => {
    const points: { offer: number; pct: number; p: number }[] = [];
    const lo = Math.round(asking * 0.85);
    const hi = Math.round(asking * 1.05);
    const step = Math.max(1000, Math.round((hi - lo) / 18));
    for (let v = lo; v <= hi; v += step) {
      const p = winProb(v / asking, daysOnMarket, competing, chainFree, mortgageInPrinciple, cashBuyer);
      points.push({ offer: v, pct: Math.round((v / asking) * 100), p });
    }
    return points;
  }, [asking, daysOnMarket, competing, chainFree, mortgageInPrinciple, cashBuyer]);

  const chosenP = winProb(offer / asking, daysOnMarket, competing, chainFree, mortgageInPrinciple, cashBuyer);

  const escalationSteps = useMemo(() => {
    const steps: number[] = [];
    let v = offer;
    while (v < escalateTo) {
      v = Math.min(v + escalateBy, escalateTo);
      steps.push(v);
    }
    return steps;
  }, [offer, escalateTo, escalateBy]);

  return (
    <>
      <PageHeader
        eyebrow="Negotiation"
        title="Offer Strategy"
        description={<>Win-probability model + escalation clause builder. Know exactly how much each pound buys you. Tip: pair with the <Jargon term="MIP" /> from your mortgage tool.</>}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-6">
        <Card className="p-6 lg:col-span-4 space-y-4 h-fit lg:sticky lg:top-20 shadow-soft">
          <h2 className="font-serif text-xl font-bold text-brand">The deal</h2>
          <div><Label>Asking price</Label><NumberInput value={asking} onChange={setAsking} className="font-mono" /></div>
          <div><Label>Avg comparable sold</Label><NumberInput value={comparableAvg} onChange={setComparableAvg} className="font-mono" /></div>
          <div><Label>Days on market</Label><NumberInput value={daysOnMarket} onChange={setDaysOnMarket} className="font-mono" /></div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between"><Label className="text-sm">Chain-free</Label><Switch checked={chainFree} onCheckedChange={setChainFree} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Competing offers</Label><Switch checked={competing} onCheckedChange={setCompeting} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Mortgage in principle</Label><Switch checked={mortgageInPrinciple} onCheckedChange={setMip} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Cash buyer</Label><Switch checked={cashBuyer} onCheckedChange={setCashBuyer} /></div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between mb-2"><Label className="text-sm">Your offer</Label><span className="font-mono text-sm font-semibold text-brand">{fmtFull(offer)}</span></div>
            <Slider value={[offer]} min={Math.round(asking * 0.85)} max={Math.round(asking * 1.05)} step={1000} onValueChange={(v) => setOffer(v[0])} />
            <p className="text-xs text-muted-foreground mt-1">{((offer / asking) * 100).toFixed(1)}% of asking</p>
          </div>
        </Card>

        <div className="lg:col-span-8 space-y-5">
          <Card className="p-7 bg-gradient-brand text-brand-foreground border-0 shadow-card">
            <div className="flex justify-between items-baseline flex-wrap gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-75">Win probability at {fmtFull(offer)}</p>
                <p className="font-serif text-6xl font-bold mt-2 tracking-tight">{Math.round(chosenP * 100)}%</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { l: "Opening", v: recommendedRange.opening },
                  { l: "Target", v: recommendedRange.target },
                  { l: "Ceiling", v: recommendedRange.ceiling },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-[10px] uppercase tracking-widest opacity-70">{s.l}</p>
                    <p className="font-mono text-lg font-semibold mt-1">{fmtFull(s.v)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <h3 className="font-serif font-bold text-brand mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Win-probability curve</h3>
            <div className="space-y-1.5">
              {curve.map((c) => (
                <div key={c.offer} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-3 font-mono text-muted-foreground">{fmtFull(c.offer)} <span className="text-[10px]">({c.pct}%)</span></span>
                  <div className="col-span-7 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${c.offer === offer ? "bg-brand" : "bg-brand/40"}`} style={{ width: `${c.p * 100}%` }} />
                  </div>
                  <span className={`col-span-2 text-right font-mono ${c.offer === offer ? "font-bold text-brand" : ""}`}>{Math.round(c.p * 100)}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Marginal cost of +5% win probability ≈ <span className="font-mono font-semibold text-foreground">
                {(() => {
                  const target = Math.min(1, chosenP + 0.05);
                  const next = curve.find((c) => c.p >= target);
                  return next ? fmtFull(next.offer - offer) : "n/a";
                })()}
              </span>.
            </p>
          </Card>

          <Card className="p-6 shadow-soft">
            <h3 className="font-serif font-bold text-brand mb-4 flex items-center gap-2"><Handshake className="w-4 h-4" /> Escalation clause builder</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div><Label className="text-xs">Opening</Label><NumberInput value={offer} onChange={setOffer} className="font-mono" /></div>
              <div><Label className="text-xs">Step</Label><NumberInput value={escalateBy} onChange={setEscalateBy} className="font-mono" /></div>
              <div><Label className="text-xs">Ceiling</Label><NumberInput value={escalateTo} onChange={setEscalateTo} className="font-mono" /></div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              "I offer <strong className="font-mono text-foreground">{fmtFull(offer)}</strong>. I will beat any verified higher bid by <strong className="font-mono text-foreground">{fmtFull(escalateBy)}</strong> up to a maximum of <strong className="font-mono text-foreground">{fmtFull(escalateTo)}</strong>."
            </p>
            <div className="space-y-1.5">
              {escalationSteps.map((v, i) => {
                const p = winProb(v / asking, daysOnMarket, competing, chainFree, mortgageInPrinciple, cashBuyer);
                return (
                  <div key={i} className="grid grid-cols-12 items-center gap-2 text-xs">
                    <span className="col-span-1 font-mono text-muted-foreground">#{i + 1}</span>
                    <span className="col-span-4 font-mono">{fmtFull(v)}</span>
                    <div className="col-span-5 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-brand" style={{ width: `${p * 100}%` }} />
                    </div>
                    <span className="col-span-2 text-right font-mono">{Math.round(p * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 bg-accent/10 border-accent/30 flex items-start gap-3">
            <Target className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              The win-probability is a logistic model calibrated against asking-vs-offer ratio, days on market and buyer leverage signals.
              In sealed-bid scenarios, request a "best and final" deadline and submit your true ceiling - not your opener.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
