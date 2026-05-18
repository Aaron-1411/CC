import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { fmtFull, fmt } from "@/lib/format";
import { useScenario } from "@/context/ScenarioContext";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, Legend,
} from "recharts";
import Jargon from "@/components/Jargon";
import Comparator from "@/components/Comparator";

interface Saver {
  id: string;
  name: string;
  saved: number;
  monthly: number;
  useLisa: boolean;
  lisaMonthly: number;
}

const newSaver = (name: string): Saver => ({
  id: crypto.randomUUID(), name, saved: 4_000, monthly: 300, useLisa: true, lisaMonthly: 200,
});

interface ProjectionPoint {
  month: number;
  date: string;
  balance: number;
  bonus: number;
}

const projectBalance = (savers: Saver[], rate: number, target: number, inflationPct: number, capMonths = 360) => {
  const r = rate / 100 / 12;
  let bal = savers.reduce((s, x) => s + x.saved, 0);
  let cumulativeBonus = 0;
  const out: ProjectionPoint[] = [{ month: 0, date: "Now", balance: bal, bonus: 0 }];
  let m = 0, hit: number | null = null;
  const start = new Date();
  // Inflate target
  const monthlyInfl = inflationPct / 100 / 12;
  while (m < capMonths) {
    m++;
    let monthlyBonus = 0;
    for (const s of savers) {
      bal = bal * (1 + r) + s.monthly;
      if (s.useLisa) {
        const lm = Math.min(333, s.lisaMonthly);
        bal += lm;
        monthlyBonus += lm * 0.25;
      }
    }
    bal += monthlyBonus;
    cumulativeBonus += monthlyBonus;
    const inflatedTarget = target * Math.pow(1 + monthlyInfl, m);
    if (hit === null && bal >= inflatedTarget) hit = m;
    if (m % 3 === 0 || m === 1) {
      const d = new Date(start); d.setMonth(d.getMonth() + m);
      out.push({
        month: m,
        date: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        balance: Math.round(bal),
        bonus: Math.round(cumulativeBonus),
      });
    }
    if (hit !== null && m > hit + 12) break;
  }
  return { points: out, monthsToTarget: hit, totalBonus: cumulativeBonus };
};

export default function Deposit() {
  const { scenario, setScenario, depositPct } = useScenario();
  const price = scenario.price;
  const setPrice = (price: number) => setScenario({ price });
  const setDepositPct = (pct: number) => setScenario({ deposit: Math.round(scenario.price * pct / 100) });

  const [savers, setSavers] = useState<Saver[]>([newSaver("You")]);
  const [interest, setInterest] = useState(4.5);
  const [inflation, setInflation] = useState(2.0);
  const [linkTrueCost, setLinkTrueCost] = useState(false);

  const target = useMemo(() => {
    if (linkTrueCost) {
      // Approximate non-deposit cash (legal £1.5k + survey £600 + searches £350 + mtg fee £999 + broker £500 + moving £800)
      return scenario.deposit + 4_749;
    }
    return scenario.deposit;
  }, [linkTrueCost, scenario.deposit]);

  const main = useMemo(
    () => projectBalance(savers, interest, target, inflation),
    [savers, interest, target, inflation]
  );

  const months = main.monthsToTarget ?? 999;
  const years = (months / 12).toFixed(1);

  // What-if matrix: ±£100/mo, ±1% rate
  const matrix = useMemo(() => {
    const grid: { row: string; cells: { label: string; months: number | null }[] }[] = [];
    for (const dRate of [-1, 0, 1]) {
      const cells = [-100, 0, 100].map((dMonthly) => {
        const variant = savers.map((s) => ({ ...s, monthly: Math.max(0, s.monthly + dMonthly) }));
        const r = projectBalance(variant, interest + dRate, target, inflation, 600);
        return { label: `${dMonthly >= 0 ? "+" : ""}£${dMonthly}/mo`, months: r.monthsToTarget };
      });
      grid.push({ row: `${dRate >= 0 ? "+" : ""}${dRate}% rate`, cells });
    }
    return grid;
  }, [savers, interest, target, inflation]);

  const updateSaver = (id: string, patch: Partial<Saver>) =>
    setSavers((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <>
      <PageHeader
        eyebrow="Saving"
        title={<>Deposit & <Jargon term="LISA" /> Planner</>}
        documentTitle="Deposit & LISA Planner"
        description="Trajectory chart with LISA bonus markers, joint savers, inflation drag, and a sensitivity matrix."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Your numbers</h2>
          <div><Label>Target property price</Label>
            <NumberInput value={price} onChange={setPrice} /></div>
          <div><Label>Deposit %</Label>
            <NumberInput value={Math.round(depositPct)} onChange={setDepositPct} /></div>
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <Label>Save for full true-cost</Label>
              <p className="text-xs text-muted-foreground">Include legal, survey, fees, moving (~£4.7k)</p>
            </div>
            <Switch checked={linkTrueCost} onCheckedChange={setLinkTrueCost} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Savings rate %</Label>
              <NumberInput step="0.1" value={interest} onChange={setInterest} /></div>
            <div><Label>CPI inflation %</Label>
              <NumberInput step="0.1" value={inflation} onChange={setInflation} /></div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-brand">Savers</h3>
              {savers.length < 2 && (
                <button
                  onClick={() => setSavers((s) => [...s, newSaver("Partner")])}
                  className="text-xs text-brand underline"
                >+ add joint saver</button>
              )}
            </div>
            {savers.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 mb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={s.name}
                    onChange={(e) => updateSaver(s.id, { name: e.target.value })}
                    className="font-semibold border-0 px-0 h-7 focus-visible:ring-0 max-w-[140px]"
                  />
                  {savers.length > 1 && (
                    <button
                      onClick={() => setSavers((arr) => arr.filter((x) => x.id !== s.id))}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Already saved</Label>
                    <NumberInput value={s.saved} onChange={(n) => updateSaver(s.id, { saved: n })} /></div>
                  <div><Label className="text-xs">Monthly £</Label>
                    <NumberInput value={s.monthly} onChange={(n) => updateSaver(s.id, { monthly: n })} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">LISA (max £333/mo each)</Label>
                  <Switch checked={s.useLisa} onCheckedChange={(v) => updateSaver(s.id, { useLisa: v })} />
                </div>
                {s.useLisa && (
                  <NumberInput
                    value={s.lisaMonthly}
                    onChange={(n) => updateSaver(s.id, { lisaMonthly: Math.min(333, n) })}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 bg-gradient-warm">
            <Badge className="bg-brand-muted text-brand border-0 mb-3">Forecast</Badge>
            <h2 className="font-serif text-3xl font-bold text-brand">
              {months >= 999 ? "Out of range" : `${years} years`}
            </h2>
            <p className="text-muted-foreground mt-1">
              to hit a {fmtFull(target)} target ({linkTrueCost ? "deposit + completion costs" : `${depositPct.toFixed(0)}% of ${fmtFull(price)}`}).
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <Stat label="Total LISA bonus" value={fmtFull(Math.round(main.totalBonus))} />
              <Stat label="Total monthly" value={fmtFull(savers.reduce((s, x) => s + x.monthly + (x.useLisa ? x.lisaMonthly : 0), 0))} />
              <Stat label="Inflated target" value={fmtFull(Math.round(target * Math.pow(1 + inflation/100, months / 12)))} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif font-bold text-brand mb-3">Trajectory</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={main.points}>
                  <defs>
                    <linearGradient id="bal" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="balance" name="Balance" stroke="hsl(var(--brand))" fill="url(#bal)" />
                  <Area type="monotone" dataKey="bonus" name="LISA bonus (cumulative)" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.15)" />
                  <ReferenceLine y={target} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Target", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif font-bold text-brand mb-3">What-if matrix · months to target</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th></th>
                    {matrix[0].cells.map((c) => <th key={c.label} className="font-mono text-xs text-muted-foreground">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.row}>
                      <td className="font-mono text-xs text-muted-foreground pr-3">{row.row}</td>
                      {row.cells.map((c, i) => {
                        const isCenter = c.label === "+£0/mo" && row.row === "+0% rate";
                        return (
                          <td key={i} className={`text-center rounded-md py-2 font-mono font-semibold ${isCenter ? "bg-brand text-brand-foreground" : "bg-muted/50"}`}>
                            {c.months === null ? "-" : `${(c.months / 12).toFixed(1)}y`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Sensitivity to ±£100/mo and ±1% rate change.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card rounded-lg p-3 border">
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-mono text-base font-bold text-brand mt-0.5">{value}</p>
  </div>
);
