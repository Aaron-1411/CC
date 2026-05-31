"use client";
import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChevronDown, ChevronUp, Info, TrendingDown, TrendingUp, AlertCircle, Share2, Check } from "lucide-react";

const STATE_PENSION_WEEKLY = 221.20;

function fmtGBP(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${Math.round(n).toLocaleString()}`;
}

function Slider({ label, value, min, max, step, onChange, format, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; hint?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-indigo-700">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600 h-2" />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{format(min)}</span>
        {hint && <span className="text-indigo-400 italic">{hint}</span>}
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <span className="group relative cursor-help inline-flex items-center">
      <Info className="w-3.5 h-3.5 text-gray-400 ml-1" />
      <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-900 text-white text-xs rounded-lg p-2 z-20 text-center leading-relaxed">
        {children}
      </span>
    </span>
  );
}

function buildChartData(currentAge: number, years: number, currentPot: number, monthlyContrib: number, growthRate: number) {
  return Array.from({ length: years + 1 }, (_, y) => {
    const g = (r: number) => r / 100;
    const fv = (r: number) => currentPot * Math.pow(1 + g(r), y) +
      (r > 0 ? monthlyContrib * 12 * ((Math.pow(1 + g(r), y) - 1) / g(r)) : monthlyContrib * 12 * y);
    return {
      age: currentAge + y,
      pessimistic: Math.round(fv(Math.max(0.1, growthRate - 2))),
      central: Math.round(fv(growthRate)),
      optimistic: Math.round(fv(growthRate + 2)),
    };
  });
}

function getInitial<T>(params: URLSearchParams, key: string, fallback: T): T {
  const v = params.get(key);
  if (v === null) return fallback;
  if (typeof fallback === "boolean") return (v === "true") as unknown as T;
  return Number(v) as unknown as T;
}

export default function ProjectPage() {
  // Seed state from share URL if present
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Quick mode inputs
  const [currentAge, setCurrentAge] = useState(() => getInitial(params, "currentAge", 35));
  const [retirementAge, setRetirementAge] = useState(() => getInitial(params, "retirementAge", 67));
  const [currentPot, setCurrentPot] = useState(() => getInitial(params, "currentPot", 25000));

  // Advanced inputs
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [monthlyContrib, setMonthlyContrib] = useState(() => getInitial(params, "monthlyContrib", 300));
  const [growthRate, setGrowthRate] = useState(() => getInitial(params, "growthRate", 5));
  const [includeState, setIncludeState] = useState(() => getInitial(params, "includeState", true));
  const [niYears, setNiYears] = useState(() => getInitial(params, "niYears", 20));
  const [inflationAdjust, setInflationAdjust] = useState(false);
  const [targetMonthly, setTargetMonthly] = useState(2000);
  const [drawdownMonthly, setDrawdownMonthly] = useState(2000);

  const years = Math.max(1, retirementAge - currentAge);
  const INFLATION = 2.5;

  const chartData = useMemo(
    () => buildChartData(currentAge, years, currentPot, monthlyContrib, growthRate),
    [currentAge, years, currentPot, monthlyContrib, growthRate]
  );

  const nominalPot = chartData[chartData.length - 1]?.central ?? 0;
  const realPot = inflationAdjust
    ? Math.round(nominalPot / Math.pow(1 + INFLATION / 100, years))
    : nominalPot;

  const statePensionAnnual = includeState ? Math.round((niYears / 35) * STATE_PENSION_WEEKLY * 52) : 0;
  const statePensionMonthly = Math.round(statePensionAnnual / 12);
  const safeMonthly = Math.round(((inflationAdjust ? realPot : nominalPot) * 0.035) / 12);
  const totalMonthly = safeMonthly + statePensionMonthly;
  const gap = targetMonthly - totalMonthly;

  // How long pot lasts at chosen drawdown
  const potLastsYears = useMemo(() => {
    const monthlyRate = (growthRate / 2 / 100) / 12;
    let pot = nominalPot;
    let months = 0;
    while (pot > 0 && months < 600) {
      pot = pot * (1 + monthlyRate) - drawdownMonthly;
      months++;
    }
    return months >= 600 ? 50 : Math.round(months / 12);
  }, [nominalPot, drawdownMonthly, growthRate]);

  const displayData = inflationAdjust
    ? chartData.map(d => ({
        ...d,
        pessimistic: Math.round(d.pessimistic / Math.pow(1 + INFLATION / 100, d.age - currentAge)),
        central: Math.round(d.central / Math.pow(1 + INFLATION / 100, d.age - currentAge)),
        optimistic: Math.round(d.optimistic / Math.pow(1 + INFLATION / 100, d.age - currentAge)),
      }))
    : chartData;

  const gapColor = gap <= 0 ? "green" : gap < 500 ? "amber" : "red";
  const gapBg: Record<string, string> = {
    green: "bg-green-50 border-green-200",
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
  };
  const gapText: Record<string, string> = {
    green: "text-green-800",
    amber: "text-amber-800",
    red: "text-red-800",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-1">Pension Projection Calculator</h1>
      <p className="text-gray-500 mb-8">See what your pension could be worth at retirement — in plain English.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Controls ── */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">

          {/* Quick inputs */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">The essentials</p>
            <div className="flex flex-col gap-5">
              <Slider label="Your age" value={currentAge} min={18} max={65} step={1} onChange={setCurrentAge} format={v => `${v}`} />
              <Slider label="Retirement age" value={retirementAge} min={currentAge + 1} max={75} step={1} onChange={setRetirementAge} format={v => `${v}`} hint="State pension age is 67" />
              <Slider label="Current pot total" value={currentPot} min={0} max={500000} step={1000} onChange={setCurrentPot} format={fmtGBP} hint="Not sure? Enter 0" />
            </div>
          </div>

          <hr />

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            <span>Fine-tune the numbers</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-5">
              <Slider label="Monthly contributions" value={monthlyContrib} min={0} max={3000} step={25} onChange={setMonthlyContrib} format={v => `£${v}/mo`} hint="Incl. employer match" />
              <Slider label="Expected annual growth" value={growthRate} min={1} max={12} step={0.5} onChange={setGrowthRate} format={v => `${v}%`} hint="Balanced fund ≈ 5–6%" />
              <Slider label="Target monthly income" value={targetMonthly} min={500} max={8000} step={100} onChange={setTargetMonthly} format={v => `£${v}/mo`} />
              <Slider label="Monthly drawdown from pot" value={drawdownMonthly} min={100} max={8000} step={50} onChange={setDrawdownMonthly} format={v => `£${v}/mo`} />

              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includeState} onChange={e => setIncludeState(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Include State Pension</span>
                </label>
                {includeState && (
                  <Slider label="NI qualifying years" value={niYears} min={1} max={35} step={1} onChange={setNiYears} format={v => `${v} yrs`} hint="Need 35 for full pension" />
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={inflationAdjust} onChange={e => setInflationAdjust(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">
                    Show in today&apos;s money
                    <InfoTip>Adjusts all figures for 2.5% annual inflation so you can compare with your current salary.</InfoTip>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Top-line summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 bg-indigo-700 text-white rounded-2xl p-5">
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">
                Projected pot at {retirementAge}
                {inflationAdjust && <span className="ml-1 opacity-75">(today&apos;s £)</span>}
              </p>
              <p className="text-3xl font-bold">{fmtGBP(realPot)}</p>
              <p className="text-indigo-200 text-xs mt-1">at {growthRate}% growth · {years} years to go</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Safe monthly income
                <InfoTip>3.5% annual withdrawal — a conservative rule of thumb for a 30+ year retirement.</InfoTip>
              </p>
              <p className="text-xl font-bold text-gray-900">{fmtGBP(safeMonthly)}/mo</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">State Pension</p>
              <p className="text-xl font-bold text-gray-900">
                {includeState ? `£${statePensionMonthly}/mo` : "Not included"}
              </p>
            </div>
          </div>

          {/* Retirement income gap */}
          {showAdvanced && (
            <div className={`border rounded-2xl p-5 ${gapBg[gapColor]}`}>
              <div className="flex items-start gap-3">
                {gap <= 0
                  ? <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  : <TrendingDown className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <h3 className={`font-bold mb-1 ${gapText[gapColor]}`}>
                    {gap <= 0
                      ? `You're on track — projected surplus of ${fmtGBP(Math.abs(gap))}/mo`
                      : `Monthly shortfall: ${fmtGBP(gap)}`}
                  </h3>
                  <p className={`text-sm ${gapText[gapColor]}`}>
                    {gap <= 0
                      ? `Your combined income (£${totalMonthly.toLocaleString()}/mo) exceeds your £${targetMonthly.toLocaleString()}/mo target.`
                      : `To close the gap, you'd need to contribute an extra £${Math.round(gap * 0.8).toLocaleString()}/mo now (or retire ${Math.ceil(gap / 150)} years later).`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold">Pot growth over time</h2>
              {inflationAdjust && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">In today&apos;s money</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Pessimistic ({Math.max(0.1, growthRate - 2).toFixed(1)}%) · Central ({growthRate}%) · Optimistic ({growthRate + 2}%) annual growth
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => fmtGBP(Number(v))} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => fmtGBP(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#d1d5db" fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="central" name="Central" stroke="#6366f1" fill="url(#cGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#22c55e" fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Drawdown durability */}
          {showAdvanced && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="font-bold mb-3">How long will your pot last?</h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`rounded-xl px-5 py-3 text-center ${
                  potLastsYears >= 30 ? "bg-green-50 border border-green-200" :
                  potLastsYears >= 20 ? "bg-amber-50 border border-amber-200" :
                  "bg-red-50 border border-red-200"
                }`}>
                  <p className="text-xs text-gray-500 mb-1">At £{drawdownMonthly.toLocaleString()}/mo drawdown</p>
                  <p className={`text-2xl font-bold ${
                    potLastsYears >= 30 ? "text-green-800" :
                    potLastsYears >= 20 ? "text-amber-800" : "text-red-800"
                  }`}>
                    {potLastsYears >= 50 ? "50+ years" : `~${potLastsYears} years`}
                  </p>
                </div>
                {potLastsYears < 25 && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 flex-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your pot may run out before age {retirementAge + potLastsYears}. Consider reducing drawdown or increasing contributions.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Annuity estimate */}
          {showAdvanced && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="font-bold mb-1">Annuity alternative</h2>
              <p className="text-xs text-gray-400 mb-4">Instead of drawdown, you could use your pot to buy a guaranteed income for life (an annuity). Rates vary — this uses a typical 2026 rate for a 67-year-old.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Level annuity", rate: 0.072, desc: "Fixed income, no inflation protection" },
                  { label: "Inflation-linked", rate: 0.052, desc: "Rises with RPI each year" },
                ].map(a => (
                  <div key={a.label} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">{a.label}</p>
                    <p className="text-xl font-bold text-indigo-800">{fmtGBP((nominalPot * a.rate) / 12)}/mo</p>
                    <p className="text-xs text-gray-500 mt-1">{fmtGBP(nominalPot * a.rate)}/yr · {a.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">Annuity rates are illustrative. Get quotes from multiple providers before deciding.</p>
            </div>
          )}

          {/* Share */}
          <ShareButton state={{ currentAge, retirementAge, currentPot, monthlyContrib, growthRate, niYears, includeState }} />

          <p className="text-xs text-gray-400 leading-relaxed">
            Projections are illustrative only. They assume constant contributions and compound growth. Inflation adjustment uses 2.5% p.a.
            Past returns are not a guide to the future. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function ShareButton({ state }: { state: Record<string, number | boolean> }) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(() => {
    const params = new URLSearchParams(
      Object.entries(state).map(([k, v]) => [k, String(v)])
    );
    const url = `${window.location.origin}/project?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [state]);

  return (
    <button
      onClick={share}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-2.5 transition-colors self-start"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Link copied!" : "Share this projection"}
    </button>
  );
}
