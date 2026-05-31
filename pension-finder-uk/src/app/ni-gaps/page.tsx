"use client";
import { useState } from "react";
import { ExternalLink, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

const FULL_STATE_PENSION_WEEKLY = 221.20;
const FULL_STATE_PENSION_ANNUAL = FULL_STATE_PENSION_WEEKLY * 52;
const YEARS_NEEDED = 35;
const MIN_YEARS = 10;
const COST_PER_YEAR = 824; // Class 3 NI voluntary contribution 2025/26
const PENSION_AGE = 67;

function fmtGBP(n: number) {
  return `£${Math.round(n).toLocaleString()}`;
}

export default function NiGapsPage() {
  const [currentAge, setCurrentAge] = useState(45);
  const [niYears, setNiYears] = useState(18);
  const [gapYears, setGapYears] = useState(3);

  const projectedYearsWorking = Math.max(0, PENSION_AGE - currentAge);
  const totalYearsWithoutBuying = Math.min(YEARS_NEEDED, niYears + projectedYearsWorking);
  const totalYearsWithBuying = Math.min(YEARS_NEEDED, niYears + gapYears + projectedYearsWorking);

  const weeklyWithout = niYears >= MIN_YEARS ? (totalYearsWithoutBuying / YEARS_NEEDED) * FULL_STATE_PENSION_WEEKLY : 0;
  const weeklyWith = (niYears + gapYears) >= MIN_YEARS ? (totalYearsWithBuying / YEARS_NEEDED) * FULL_STATE_PENSION_WEEKLY : 0;
  const annualGain = (weeklyWith - weeklyWithout) * 52;
  const cost = gapYears * COST_PER_YEAR;
  const paybackYears = annualGain > 0 ? cost / annualGain : Infinity;
  const lifeTimeGain = annualGain * 20; // assume 20yr retirement

  const shortfall = YEARS_NEEDED - niYears;
  const canBuyGapYears = gapYears <= shortfall && gapYears >= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
          NI Gaps Calculator
        </div>
        <h1 className="text-3xl font-bold mb-2">Is it worth buying missing NI years?</h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Gaps in your National Insurance record reduce your State Pension. Buying missing years costs £824 each — but can pay back within just 2–3 years of retirement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Inputs */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          <h2 className="font-bold text-lg">Your NI record</h2>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Your current age</label>
              <span className="text-sm font-bold text-indigo-700">{currentAge}</span>
            </div>
            <input type="range" min={25} max={66} value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>25</span><span>66</span></div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Qualifying NI years so far</label>
              <span className="text-sm font-bold text-indigo-700">{niYears} / 35</span>
            </div>
            <input type="range" min={0} max={35} value={niYears} onChange={e => setNiYears(Number(e.target.value))} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0</span>
              <span className="text-indigo-400 italic">Check on Gov.uk</span>
              <span>35</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Gap years you&apos;re considering buying</label>
              <span className="text-sm font-bold text-indigo-700">{gapYears} yr{gapYears !== 1 ? "s" : ""}</span>
            </div>
            <input
              type="range" min={0} max={Math.min(20, shortfall)}
              value={gapYears}
              onChange={e => setGapYears(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0</span>
              <span>{Math.min(20, shortfall)} (max useful)</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Check your NI record first</p>
            <p className="mb-2">Your exact qualifying years and any gaps are shown free on your Gov.uk account. Not all gaps can be filled — HMRC will tell you which years are available.</p>
            <a href="https://www.gov.uk/check-national-insurance-record" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
              Check NI record on Gov.uk <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {/* Cost vs gain */}
          <div className="bg-indigo-700 text-white rounded-2xl p-6">
            <p className="text-indigo-200 text-sm mb-1">Cost to buy {gapYears} gap year{gapYears !== 1 ? "s" : ""}</p>
            <p className="text-4xl font-bold mb-1">{fmtGBP(cost)}</p>
            <p className="text-indigo-200 text-sm">{fmtGBP(COST_PER_YEAR)} per year (Class 3 NI, 2025/26)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">State Pension without buying</p>
              <p className="text-xl font-bold text-gray-900">{fmtGBP(weeklyWithout * 52)}/yr</p>
              <p className="text-xs text-gray-400">{fmtGBP(weeklyWithout)}/wk · {totalYearsWithoutBuying} NI yrs</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">State Pension after buying</p>
              <p className="text-xl font-bold text-green-800">{fmtGBP(weeklyWith * 52)}/yr</p>
              <p className="text-xs text-gray-500">{fmtGBP(weeklyWith)}/wk · {totalYearsWithBuying} NI yrs</p>
            </div>
          </div>

          {gapYears > 0 && annualGain > 0 && (
            <div className={`border rounded-2xl p-5 ${paybackYears <= 3 ? "bg-green-50 border-green-200" : paybackYears <= 7 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-start gap-3">
                {paybackYears <= 3
                  ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  : paybackYears <= 7
                  ? <TrendingUp className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-6 h-6 text-gray-500 shrink-0 mt-0.5" />}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {paybackYears <= 3 ? "Excellent — pays back very quickly" :
                     paybackYears <= 7 ? "Good return on investment" : "Worth checking carefully"}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-700">
                    <p>Extra annual income: <strong className="text-green-700">+{fmtGBP(annualGain)}/yr</strong></p>
                    <p>Breaks even after: <strong>{paybackYears < 50 ? `${paybackYears.toFixed(1)} years` : "Never (already at max)"}</strong></p>
                    <p>Lifetime gain (20yr retirement): <strong className="text-indigo-700">{fmtGBP(lifeTimeGain)}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {niYears >= YEARS_NEEDED && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">You already have {niYears} qualifying years — you&apos;re entitled to the full State Pension of {fmtGBP(FULL_STATE_PENSION_ANNUAL)}/yr. No gap years needed.</p>
            </div>
          )}

          {niYears < MIN_YEARS && niYears + gapYears < MIN_YEARS && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">You need at least 10 qualifying NI years to receive any State Pension. You currently have {niYears + gapYears} — you&apos;d receive nothing until you reach 10.</p>
            </div>
          )}
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">How NI gaps work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Who has gaps?</h3>
            <p>Gaps arise from years of self-employment, career breaks, caring responsibilities, low earnings (below the Lower Earnings Limit), or time abroad. They show as incomplete years on your NI record.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Deadline to fill gaps</h3>
            <p>You can normally fill gaps going back 6 years. An extended window to fill gaps back to 2006 was available until April 2025 — check with HMRC if you think you may have missed it.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Other ways to build NI years</h3>
            <p>Caring for a child under 12 earns NI credits automatically. Carer&apos;s Allowance also qualifies. Some benefits count too — check <a href="https://www.gov.uk/national-insurance-credits" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600">NI credits on Gov.uk</a>.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link href="/project" className="bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-800">
          Run a full pension projection →
        </Link>
        <a href="https://www.gov.uk/voluntary-national-insurance-contributions" target="_blank" rel="noopener noreferrer"
          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
          Pay voluntary NI on Gov.uk <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
