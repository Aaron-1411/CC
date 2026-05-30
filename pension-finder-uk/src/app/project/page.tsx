"use client";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Info } from "lucide-react";

const STATE_PENSION_WEEKLY = 221.20;
const STATE_PENSION_AGE = 67;

function formatGBP(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toFixed(0)}`;
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-indigo-700">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function Tooltip2({ children }: { children: React.ReactNode }) {
  return (
    <span className="group relative cursor-help">
      <Info className="w-3.5 h-3.5 text-gray-400 inline ml-1" />
      <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 text-center">
        {children}
      </span>
    </span>
  );
}

export default function ProjectPage() {
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(67);
  const [currentPot, setCurrentPot] = useState(25000);
  const [monthlyContrib, setMonthlyContrib] = useState(300);
  const [growthRate, setGrowthRate] = useState(5);
  const [includeStatePension, setIncludeStatePension] = useState(true);
  const [niYears, setNiYears] = useState(20);
  const [drawdownMonthly, setDrawdownMonthly] = useState(2000);

  const years = retirementAge - currentAge;

  const chartData = useMemo(() => {
    const data = [];
    let pot = currentPot;
    const monthlyRate = growthRate / 100 / 12;
    for (let y = 0; y <= years; y++) {
      data.push({
        age: currentAge + y,
        pessimistic: Math.round(currentPot * Math.pow(1 + (growthRate - 2) / 100, y) + monthlyContrib * 12 * ((Math.pow(1 + (growthRate - 2) / 100, y) - 1) / ((growthRate - 2) / 100 || 0.001))),
        central: Math.round(currentPot * Math.pow(1 + growthRate / 100, y) + monthlyContrib * 12 * ((Math.pow(1 + growthRate / 100, y) - 1) / (growthRate / 100 || 0.001))),
        optimistic: Math.round(currentPot * Math.pow(1 + (growthRate + 2) / 100, y) + monthlyContrib * 12 * ((Math.pow(1 + (growthRate + 2) / 100, y) - 1) / ((growthRate + 2) / 100 || 0.001))),
      });
      // update pot for final value (unused, but keep for clarity)
      for (let m = 0; m < 12; m++) {
        pot = pot * (1 + monthlyRate) + monthlyContrib;
      }
    }
    return data;
  }, [currentAge, years, currentPot, monthlyContrib, growthRate]);

  const finalPot = chartData[chartData.length - 1]?.central ?? 0;
  const statePensionAnnual = includeStatePension ? Math.round((niYears / 35) * STATE_PENSION_WEEKLY * 52) : 0;
  const statePensionMonthly = Math.round(statePensionAnnual / 12);

  // Sustainable drawdown at 3.5% safe withdrawal rate
  const safeMonthly = Math.round((finalPot * 0.035) / 12);

  // How long pot lasts at chosen drawdown (simple)
  const monthlyPotGrowth = (growthRate / 2 / 100) / 12; // assume half growth in retirement
  let potLeft = finalPot;
  let yearsLast = 0;
  while (potLeft > 0 && yearsLast < 50) {
    potLeft = potLeft * (1 + monthlyPotGrowth) - drawdownMonthly;
    yearsLast += 1 / 12;
  }
  const potLastsYears = Math.min(50, Math.round(yearsLast));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Pension Projection Calculator</h1>
      <p className="text-gray-500 mb-10">See what your pension could be worth at retirement — in plain English.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-lg">Your details</h2>
          <Slider label="Current age" value={currentAge} min={18} max={65} step={1} onChange={setCurrentAge} format={(v) => `${v} yrs`} />
          <Slider label="Target retirement age" value={retirementAge} min={currentAge + 1} max={75} step={1} onChange={setRetirementAge} format={(v) => `${v} yrs`} />
          <Slider label="Current pension pot" value={currentPot} min={0} max={500000} step={1000} onChange={setCurrentPot} format={formatGBP} />
          <Slider label="Monthly contributions" value={monthlyContrib} min={0} max={3000} step={25} onChange={setMonthlyContrib} format={(v) => `£${v}/mo`} />
          <Slider label="Expected annual growth" value={growthRate} min={1} max={12} step={0.5} onChange={setGrowthRate} format={(v) => `${v}%`} />

          <hr />
          <h2 className="font-bold text-lg">State Pension</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={includeStatePension} onChange={(e) => setIncludeStatePension(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
            <span className="text-sm font-medium">Include State Pension</span>
          </label>
          {includeStatePension && (
            <Slider label="NI qualifying years" value={niYears} min={1} max={35} step={1} onChange={setNiYears} format={(v) => `${v} yrs`} />
          )}
        </div>

        {/* Chart + Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-1">Projected pot growth</h2>
            <p className="text-xs text-gray-400 mb-4">Pessimistic ({growthRate - 2}%) · Central ({growthRate}%) · Optimistic ({growthRate + 2}%) annual growth</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatGBP(v)} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => formatGBP(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#d1d5db" fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="central" name="Central" stroke="#6366f1" fill="url(#cGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#22c55e" fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Projected pot at {retirementAge}</p>
              <p className="text-2xl font-bold text-indigo-800">{formatGBP(finalPot)}</p>
              <p className="text-xs text-indigo-600 mt-1">at {growthRate}% annual growth</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">State Pension (monthly)
                <Tooltip2>Based on {niYears} NI qualifying years out of 35 needed for full pension of £{STATE_PENSION_WEEKLY}/wk</Tooltip2>
              </p>
              <p className="text-2xl font-bold text-green-800">£{statePensionMonthly}/mo</p>
              <p className="text-xs text-green-600 mt-1">{includeStatePension ? `${niYears} NI years` : "Not included"}</p>
            </div>
          </div>

          {/* Drawdown section */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4">Retirement income</h2>
            <Slider label="Monthly drawdown from private pensions" value={drawdownMonthly} min={100} max={10000} step={50} onChange={setDrawdownMonthly} format={(v) => `£${v}/mo`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Total monthly income</p>
                <p className="text-xl font-bold text-gray-900">£{(drawdownMonthly + statePensionMonthly).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Safe withdrawal rate
                  <Tooltip2>The "4% rule" suggests withdrawing ~3.5–4% of your pot annually is sustainable for a 30-year retirement.</Tooltip2>
                </p>
                <p className="text-xl font-bold text-gray-900">{formatGBP(safeMonthly)}/mo</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${potLastsYears >= 30 ? "bg-green-50" : potLastsYears >= 20 ? "bg-amber-50" : "bg-red-50"}`}>
                <p className="text-xs text-gray-500 mb-1">Pot lasts approx.</p>
                <p className={`text-xl font-bold ${potLastsYears >= 30 ? "text-green-800" : potLastsYears >= 20 ? "text-amber-800" : "text-red-800"}`}>
                  {potLastsYears >= 50 ? "50+ years" : `${potLastsYears} years`}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Projections are illustrative only. They assume contributions stay constant, growth is compound, and inflation is not modelled. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
