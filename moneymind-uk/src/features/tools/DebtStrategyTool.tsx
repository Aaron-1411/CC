import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { gbp, NumberField, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

interface Debt {
  id: number;
  name: string;
  balance: number;
  apr: number;
  min: number;
}

type Strategy = "avalanche" | "snowball";

interface SimResult {
  months: number;
  interest: number;
  capped: boolean;
}

const MAX_MONTHS = 600;

// Roll-over method: total monthly payment stays constant (sum of every minimum
// plus your extra). As each debt clears, its freed-up minimum is thrown at the
// next target — ordered by APR (avalanche) or balance (snowball).
function simulate(debts: Debt[], extra: number, strategy: Strategy): SimResult {
  let bal = debts.map((d) => ({ ...d })).filter((d) => d.balance > 0);
  if (bal.length === 0) return { months: 0, interest: 0, capped: false };
  const totalBudget = bal.reduce((s, d) => s + Math.max(0, d.min), 0) + Math.max(0, extra);

  let months = 0;
  let interest = 0;
  while (bal.some((d) => d.balance > 0.005) && months < MAX_MONTHS) {
    months++;
    // 1. accrue monthly interest
    for (const d of bal) {
      const i = d.balance * (d.apr / 100 / 12);
      d.balance += i;
      interest += i;
    }
    // 2. pay minimums (capped to balance), track what's left of the budget
    let leftover = totalBudget;
    for (const d of bal) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.min, d.balance, leftover);
      d.balance -= pay;
      leftover -= pay;
    }
    // 3. throw everything left at the target debt(s) in strategy order
    const order = [...bal]
      .filter((d) => d.balance > 0)
      .sort((a, z) => (strategy === "avalanche" ? z.apr - a.apr : a.balance - z.balance));
    for (const d of order) {
      if (leftover <= 0) break;
      const pay = Math.min(d.balance, leftover);
      d.balance -= pay;
      leftover -= pay;
    }
    bal = bal.filter((d) => d.balance > 0.005);
  }
  return { months, interest, capped: months >= MAX_MONTHS };
}

function fmtMonths(m: number): string {
  if (m <= 0) return "—";
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo} mo`;
  if (mo === 0) return `${y} yr`;
  return `${y} yr ${mo} mo`;
}

export function DebtStrategyTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  // Defaults chosen so the two methods genuinely diverge: the biggest balance
  // also has the highest rate (avalanche tackles it first), while the smallest
  // balance has a lower rate (snowball clears it first).
  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: "Credit card", balance: 3200, apr: 27.9, min: 80 },
    { id: 2, name: "Store card", balance: 900, apr: 22.9, min: 25 },
  ]);
  const [extra, setExtra] = useState(120);
  const nextId = useRef(3);

  const touch = () => fire();
  const update = (id: number, patch: Partial<Debt>) => {
    setDebts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    touch();
  };
  const add = () => {
    setDebts((ds) => [...ds, { id: nextId.current++, name: "New debt", balance: 1000, apr: 20, min: 30 }]);
    touch();
  };
  const remove = (id: number) => {
    setDebts((ds) => ds.filter((d) => d.id !== id));
    touch();
  };

  const avalanche = simulate(debts, extra, "avalanche");
  const snowball = simulate(debts, extra, "snowball");
  const totalBalance = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
  const cheaper = avalanche.interest <= snowball.interest ? "avalanche" : "snowball";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {debts.map((d) => (
          <div key={d.id} className="rounded-2xl border border-navy-100 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={d.name}
                onChange={(e) => update(d.id, { name: e.target.value })}
                aria-label="Debt name"
                className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-900 outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => remove(d.id)}
                aria-label={`Remove ${d.name}`}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Balance" value={d.balance} onChange={(n) => update(d.id, { balance: n })} />
              <NumberField label="APR" value={d.apr} prefix="" suffix="%" max={200} onChange={(n) => update(d.id, { apr: n })} />
              <NumberField label="Min / month" value={d.min} onChange={(n) => update(d.id, { min: n })} />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-navy-200 py-2.5 text-sm font-medium text-navy-600 hover:border-emerald-400 hover:text-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add a debt
        </button>
      </div>

      <NumberField
        label="Extra you can pay each month"
        value={extra}
        onChange={(n) => { setExtra(n); touch(); }}
        hint="On top of the minimum payments above. This is what clears debt faster."
      />

      {totalBalance > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ResultStat
              label="Avalanche (highest APR first)"
              value={avalanche.capped ? "600+ mo" : fmtMonths(avalanche.months)}
              sub={`${gbp(avalanche.interest)} interest`}
              accent={cheaper === "avalanche"}
            />
            <ResultStat
              label="Snowball (smallest first)"
              value={snowball.capped ? "600+ mo" : fmtMonths(snowball.months)}
              sub={`${gbp(snowball.interest)} interest`}
              accent={cheaper === "snowball"}
            />
          </div>

          <div className="rounded-2xl border border-navy-100 p-4">
            <ResultRow label="Total you owe" value={gbp(totalBalance)} />
            <ResultRow label="Interest saved with Avalanche" value={gbp(Math.abs(snowball.interest - avalanche.interest))} />
            <div className="my-1 border-t border-navy-100" />
            <ResultRow
              label="Lowest-cost method"
              value={cheaper === "avalanche" ? "Avalanche" : "Snowball"}
              strong
            />
          </div>

          {(avalanche.capped || snowball.capped) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              At these payments at least one debt would take 50+ years to clear — the interest is
              outrunning your payments. Free debt advice can help:{" "}
              <a href="https://www.stepchange.org/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">StepChange</a>{" "}
              or{" "}
              <a href="https://www.nationaldebtline.org/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">National Debtline</a>.
            </div>
          )}
        </>
      )}

      <Assumptions>
        Both methods assume you keep paying the same total each month and roll freed-up payments onto the
        next debt. <strong>Avalanche</strong> targets the highest interest rate first (cheapest overall);
        <strong> Snowball</strong> clears the smallest balance first (quick wins for motivation). Interest
        is charged monthly on the balance and rates are assumed fixed. If money is tight, free confidential
        help is available from StepChange and National Debtline.
      </Assumptions>
    </div>
  );
}
