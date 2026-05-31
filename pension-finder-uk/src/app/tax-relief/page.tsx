"use client";
import { useState } from "react";
import { Gift, TrendingUp, Calculator } from "lucide-react";
import Link from "next/link";

type TaxBand = "basic" | "higher" | "additional";

const BANDS: { value: TaxBand; label: string; rate: number; relief: number }[] = [
  { value: "basic", label: "Basic rate (20%)", rate: 20, relief: 20 },
  { value: "higher", label: "Higher rate (40%)", rate: 40, relief: 40 },
  { value: "additional", label: "Additional rate (45%)", rate: 45, relief: 45 },
];

function fmtGBP(n: number) {
  return `£${Math.round(n).toLocaleString()}`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">{children}</span>;
}

export default function TaxReliefPage() {
  const [monthly, setMonthly] = useState(200);
  const [band, setBand] = useState<TaxBand>("basic");
  const [salarySacrifice, setSalarySacrifice] = useState(false);
  const [salary, setSalary] = useState(35000);

  const selected = BANDS.find(b => b.value === band)!;
  const reliefRate = selected.relief / 100;

  // Relief at source: you pay reduced amount, govt tops up
  // e.g. basic rate: you pay £80, govt adds £20 → £100 goes in
  const govTopUp = Math.round(monthly * (reliefRate / (1 - reliefRate)));
  const totalMonthly = monthly + govTopUp;
  const totalAnnual = totalMonthly * 12;
  const yourAnnual = monthly * 12;
  const govAnnual = govTopUp * 12;

  // Over 25 years at 5% growth
  const years = 25;
  const fv = (m: number) => m * 12 * ((Math.pow(1.05, years) - 1) / 0.05);
  const potWithRelief = Math.round(fv(totalMonthly));
  const potWithoutRelief = Math.round(fv(monthly));
  const reliefBoost = potWithRelief - potWithoutRelief;

  // Salary sacrifice extras
  const niSaving = salarySacrifice ? Math.round((monthly * 12) * 0.08) : 0; // employee NI ~8% on middle band
  const employerNiSaving = salarySacrifice ? Math.round((monthly * 12) * 0.138) : 0; // employer NI 13.8%

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
          <Gift className="w-4 h-4" /> Tax Relief Calculator
        </div>
        <h1 className="text-3xl font-bold mb-2">How much is the government adding to your pension?</h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Every pound you put into a pension gets topped up by the government through tax relief. Most people have no idea how much this is worth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:grid-flow-col">
        {/* Results — shown first on mobile via order */}
        <div className="flex flex-col gap-4 lg:order-2">
          {/* Headline */}
          <div className="bg-indigo-700 text-white rounded-2xl p-6">
            <p className="text-indigo-200 text-sm mb-1">Total going into your pension every month</p>
            <p className="text-4xl font-bold mb-1">{fmtGBP(totalMonthly)}</p>
            <p className="text-indigo-200 text-sm">
              You contribute <Pill>{fmtGBP(monthly)}</Pill> · Govt adds <Pill>{fmtGBP(govTopUp)}</Pill>
            </p>
          </div>
          {/* Annual breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="font-bold mb-4">Annual breakdown</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your contributions</span>
                <span className="font-bold text-gray-900">{fmtGBP(yourAnnual)}/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Government tax relief</span>
                <span className="font-bold text-green-700">+{fmtGBP(govAnnual)}/yr</span>
              </div>
              {salarySacrifice && <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your NI saving (est.)</span>
                  <span className="font-bold text-green-700">+{fmtGBP(niSaving)}/yr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Employer NI saving (est.)</span>
                  <span className="font-bold text-green-700">+{fmtGBP(employerNiSaving)}/yr</span>
                </div>
              </>}
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total going in per year</span>
                <span className="font-bold text-indigo-700 text-lg">{fmtGBP(totalAnnual + (salarySacrifice ? niSaving : 0))}</span>
              </div>
            </div>
          </div>
          {/* Long-term impact */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900 mb-1">Over 25 years (at 5% growth)</h3>
                <p className="text-sm text-green-800 mb-3">
                  Without tax relief your pot would reach <strong>{fmtGBP(potWithoutRelief)}</strong>.
                  With tax relief it reaches <strong>{fmtGBP(potWithRelief)}</strong> — an extra <strong>{fmtGBP(reliefBoost)}</strong> from the government top-up alone.
                </p>
                <p className="text-xs text-green-700">Illustrative only. Constant contributions, 5% compound growth.</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <Calculator className="w-5 h-5 text-indigo-400 mb-2" />
            <p className="text-sm text-gray-600 mb-3">Want to see how this pot grows over time?</p>
            <Link href="/project" className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800">
              Run a full projection →
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6 lg:order-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your monthly contribution</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
              <input
                type="number"
                min={1}
                max={20000}
                value={monthly}
                onChange={e => setMonthly(Math.max(1, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input type="range" min={50} max={3000} step={25} value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full accent-indigo-600 mt-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your income tax band</label>
            <div className="flex flex-col gap-2">
              {BANDS.map(b => (
                <label key={b.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${band === b.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}>
                  <input type="radio" name="band" value={b.value} checked={band === b.value} onChange={() => setBand(b.value)} className="accent-indigo-600" />
                  <span className="text-sm font-medium">{b.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Basic rate: income under £50,270 · Higher rate: £50,270–£125,140 · Additional: above £125,140
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
              <input type="checkbox" checked={salarySacrifice} onChange={e => setSalarySacrifice(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
              <div>
                <span className="text-sm font-medium block">I contribute via salary sacrifice</span>
                <span className="text-xs text-gray-400">Also saves National Insurance for you and your employer</span>
              </div>
            </label>
            {salarySacrifice && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                  <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Explainer */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">How does pension tax relief actually work?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Relief at source</h3>
            <p>Most workplace and personal pensions use &quot;relief at source&quot;. You pay from your take-home pay, but your provider claims basic-rate tax relief (20%) directly from HMRC and adds it to your pot. Higher-rate taxpayers claim the extra via Self Assessment.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Salary sacrifice</h3>
            <p>You give up part of your salary and it goes straight into your pension before tax and National Insurance is calculated. This means you save both income tax AND NI contributions — typically worth an extra 2–8% on top of normal relief.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Annual allowance</h3>
            <p>You can contribute up to £60,000 per year (or 100% of your earnings, whichever is lower) and still receive tax relief. Contributions above this are subject to a tax charge. The lifetime allowance was abolished in April 2024.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
