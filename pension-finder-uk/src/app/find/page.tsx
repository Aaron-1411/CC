"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, ExternalLink, CheckCircle, Building2, PlusCircle } from "lucide-react";

type Job = { employer: string; startYear: string; isCurrent: boolean; endYear: string; industry: string };

const INDUSTRIES = [
  "Finance & Banking", "Healthcare & NHS", "Education", "Retail & Hospitality",
  "Construction & Trades", "Technology", "Manufacturing", "Public Sector / Civil Service",
  "Media & Creative", "Legal & Professional", "Other",
];

const STEP_LABELS = ["Your work history", "Check & confirm", "Your action plan"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            i < current ? "bg-indigo-700 text-white" :
            i === current ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-700" :
            "bg-gray-100 text-gray-400"
          }`}>
            {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < STEP_LABELS.length - 1 && <div className={`h-0.5 w-6 sm:w-10 ${i < current ? "bg-indigo-700" : "bg-gray-200"}`} />}
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-500 hidden sm:block">{STEP_LABELS[current]}</span>
    </div>
  );
}

function JobForm({ job, onChange, onRemove, index }: {
  job: Job; onChange: (j: Job) => void; onRemove: () => void; index: number;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Job {index + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-1" aria-label="Remove job">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Employer name</label>
          <input
            type="text"
            placeholder="e.g. Lloyds Banking Group"
            value={job.employer}
            autoFocus={index === 0}
            onChange={e => onChange({ ...job, employer: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year started</label>
          <input
            type="number" placeholder="e.g. 2010" min={1960} max={2026}
            value={job.startYear}
            onChange={e => onChange({ ...job, startYear: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year left</label>
          {job.isCurrent ? (
            <div className="border border-indigo-300 bg-indigo-50 rounded-lg px-3 py-2 text-sm text-indigo-700 font-medium">Still here</div>
          ) : (
            <input
              type="number" placeholder="e.g. 2018" min={1960} max={2026}
              value={job.endYear}
              onChange={e => onChange({ ...job, endYear: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={job.isCurrent}
              onChange={e => onChange({ ...job, isCurrent: e.target.checked, endYear: "" })}
              className="accent-indigo-600 w-3.5 h-3.5"
            />
            <span className="text-xs text-gray-500">I still work here</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sector <span className="text-gray-400 font-normal">(helps us estimate pension likelihood)</span>
          </label>
          <select
            value={job.industry}
            onChange={e => onChange({ ...job, industry: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select a sector…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function getPensionLikelihood(job: Job): { label: string; color: string; notes: string[] } {
  const start = parseInt(job.startYear);
  const end = job.isCurrent ? 2026 : parseInt(job.endYear);
  const years = isNaN(end - start) ? 0 : Math.max(0, end - start);
  const notes: string[] = [];
  let score = 0;
  if (years >= 2) { score += 2; notes.push("Worked there 2+ years — auto-enrolment rules likely applied."); }
  if (start <= 2012 && years >= 2) notes.push("Pre-2012 role: employer pension was optional. Worth chasing HR to confirm.");
  if (start >= 2012) { score += 1; notes.push("Post-2012: auto-enrolment was mandatory for eligible workers."); }
  if (["Finance & Banking", "Public Sector / Civil Service", "Healthcare & NHS", "Education"].includes(job.industry)) {
    score += 2; notes.push(`${job.industry} typically has generous defined-benefit or large-scheme pensions.`);
  }
  if (years < 2) notes.push("Short tenure — you may have been opted out or had contributions refunded.");
  if (job.isCurrent) notes.push("This is your current employer — check your payslip for pension deductions.");
  const label = score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";
  const color = score >= 4 ? "green" : score >= 2 ? "amber" : "red";
  return { label, color, notes };
}

function addToTracker(job: Job) {
  try {
    const existing = JSON.parse(localStorage.getItem("pf-pensions") || "[]");
    localStorage.setItem("pf-pensions", JSON.stringify([...existing, {
      id: crypto.randomUUID(),
      name: `${job.employer} pension`,
      provider: "",
      type: "workplace",
      value: "",
      annualGrowth: "5",
      notes: `Found via Pension Finder · ${job.startYear}–${job.isCurrent ? "present" : job.endYear}`,
    }]));
  } catch {}
}

function ActionPlan({ jobs }: { jobs: Job[] }) {
  const [added, setAdded] = useState<Set<number>>(new Set());
  const handleAdd = (job: Job, i: number) => { addToTracker(job); setAdded(p => new Set(p).add(i)); };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <h3 className="font-bold text-green-800 mb-1">Step 1 — Government Pension Tracing Service</h3>
        <p className="text-green-700 text-sm mb-3">The official free DWP service. It can trace any workplace or personal pension scheme registered in the UK.</p>
        <a href="https://www.gov.uk/find-pension-contact-details" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800">
          Go to Pension Tracing Service <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {jobs.map((job, i) => {
        const { label, color, notes } = getPensionLikelihood(job);
        const bg = { green: "bg-green-50 border-green-200", amber: "bg-amber-50 border-amber-200", red: "bg-red-50 border-red-200" }[color];
        const badge = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800" }[color];
        return (
          <div key={i} className={`border rounded-xl p-5 ${bg}`}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">{job.employer}</h3>
                  <span className="text-xs text-gray-500">
                    {job.startYear}–{job.isCurrent ? "present" : (job.endYear || "?")} · {job.industry || "Unknown sector"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge}`}>{label} likelihood</span>
                <button
                  onClick={() => handleAdd(job, i)}
                  disabled={added.has(i)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    added.has(i) ? "bg-gray-100 text-gray-400 cursor-default" : "bg-indigo-700 text-white hover:bg-indigo-800"
                  }`}
                >
                  {added.has(i) ? <CheckCircle className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  {added.has(i) ? "Added" : "Add to tracker"}
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-1 mb-4">
              {notes.map((n, j) => <li key={j} className="text-sm text-gray-600 flex gap-2"><span className="shrink-0">•</span>{n}</li>)}
            </ul>
            <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-700">
              <strong>What to do:</strong> Search &ldquo;{job.employer} pension scheme contact&rdquo; or call their HR/payroll. Use the Pension Tracing Service above as a backup.
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="font-bold text-indigo-800 mb-2">Step 2 — Check your State Pension forecast</h3>
        <p className="text-sm text-gray-600 mb-3">You need 35 qualifying NI years for the full State Pension (£221.20/week in 2026). Check your record for free on Gov.uk.</p>
        <a href="https://www.gov.uk/check-state-pension" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800">
          Check on Gov.uk <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <h3 className="font-bold text-purple-800 mb-2">Step 3 — Track what you find</h3>
        <p className="text-sm text-gray-600 mb-3">
          {added.size > 0
            ? `You've added ${added.size} pension${added.size > 1 ? "s" : ""} to your tracker. Head there to enter values and run a projection.`
            : "Add your pots to the tracker to see the full picture and model your retirement income."}
        </p>
        <a href="/track" className="inline-flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-800">
          Go to My Pensions tracker →
        </a>
      </div>
    </div>
  );
}

const EMPTY_JOB: Job = { employer: "", startYear: "", isCurrent: false, endYear: "", industry: "" };

export default function FindPage() {
  const [step, setStep] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([{ ...EMPTY_JOB }]);

  const updateJob = (i: number, j: Job) => { const arr = [...jobs]; arr[i] = j; setJobs(arr); };
  const removeJob = (i: number) => setJobs(jobs.filter((_, idx) => idx !== i));
  const validJobs = jobs.filter(j => j.employer && j.startYear);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <StepIndicator current={step} />

      {step === 0 && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Where have you worked?</h1>
          <p className="text-gray-500 mb-8">Add every employer you remember. Partial information is fine — even a name and rough year helps.</p>
          <div className="flex flex-col gap-4 mb-6">
            {jobs.map((job, i) => (
              <JobForm key={i} job={job} index={i} onChange={j => updateJob(i, j)} onRemove={() => removeJob(i)} />
            ))}
          </div>
          <button
            onClick={() => setJobs([...jobs, { ...EMPTY_JOB }])}
            className="flex items-center gap-2 text-indigo-700 font-semibold text-sm hover:text-indigo-900 mb-8"
          >
            <Plus className="w-4 h-4" /> Add another employer
          </button>
          <div>
            <button
              onClick={() => setStep(1)}
              disabled={validJobs.length === 0}
              className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Review my history <ChevronRight className="w-4 h-4" />
            </button>
            {validJobs.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">Add at least one employer name and start year to continue.</p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Does this look right?</h1>
          <p className="text-gray-500 mb-8">Check your history before we generate your action plan.</p>
          <div className="flex flex-col gap-3 mb-8">
            {validJobs.map((job, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
                <div>
                  <p className="font-semibold">{job.employer}</p>
                  <p className="text-sm text-gray-500">
                    {job.startYear}–{job.isCurrent ? "present" : (job.endYear || "?")} · {job.industry || "Sector not specified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setStep(2)} className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-800 flex items-center gap-2">
              Generate my plan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Your pension action plan</h1>
          <p className="text-gray-500 mb-8">Here&apos;s exactly what to do, tailored to your work history.</p>
          <ActionPlan jobs={validJobs} />
          <button onClick={() => setStep(0)} className="mt-8 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ChevronLeft className="w-4 h-4" /> Start again
          </button>
        </div>
      )}
    </div>
  );
}
