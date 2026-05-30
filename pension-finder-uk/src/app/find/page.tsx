"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, ExternalLink, CheckCircle, Building2, PlusCircle } from "lucide-react";

type Job = { employer: string; startYear: string; endYear: string; industry: string };

const INDUSTRIES = [
  "Finance & Banking", "Healthcare & NHS", "Education", "Retail & Hospitality",
  "Construction & Trades", "Technology", "Manufacturing", "Public Sector / Civil Service",
  "Media & Creative", "Legal & Professional", "Other",
];

const STEP_TITLES = ["Your employment history", "Review & generate plan", "Your action plan"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            i < current ? "bg-indigo-700 text-white" :
            i === current ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-700" :
            "bg-gray-100 text-gray-400"
          }`}>
            {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && <div className={`h-0.5 w-8 ${i < current ? "bg-indigo-700" : "bg-gray-200"}`} />}
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-500">{STEP_TITLES[current]}</span>
    </div>
  );
}

function JobForm({ job, onChange, onRemove, index }: { job: Job; onChange: (j: Job) => void; onRemove: () => void; index: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Job {index + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 transition-colors" aria-label="Remove job">
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
            onChange={(e) => onChange({ ...job, employer: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started (year)</label>
          <input
            type="number" placeholder="e.g. 2010" min={1970} max={2026}
            value={job.startYear}
            onChange={(e) => onChange({ ...job, startYear: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Left (year or &quot;current&quot;)</label>
          <input
            type="text" placeholder="e.g. 2015 or current"
            value={job.endYear}
            onChange={(e) => onChange({ ...job, endYear: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <select
            value={job.industry}
            onChange={(e) => onChange({ ...job, industry: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select a sector…</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function getPensionLikelihood(job: Job): { label: string; color: string; notes: string[] } {
  const start = parseInt(job.startYear);
  const end = job.endYear.toLowerCase() === "current" ? 2026 : parseInt(job.endYear);
  const years = isNaN(end - start) ? 0 : end - start;
  const notes: string[] = [];
  let score = 0;
  if (years >= 2) { score += 2; notes.push("Worked there 2+ years — auto-enrolment rules likely applied."); }
  if (start <= 2012 && years >= 2) notes.push("Pre-2012 role: employer pension was optional. Chase HR to confirm.");
  if (start >= 2012) { score += 1; notes.push("Post-2012: auto-enrolment mandatory for eligible workers."); }
  if (["Finance & Banking", "Public Sector / Civil Service", "Healthcare & NHS", "Education"].includes(job.industry)) {
    score += 2; notes.push(`${job.industry} typically has generous defined-benefit or large-scheme pensions.`);
  }
  if (years < 2) notes.push("Short tenure — you may have been opted out or contributions refunded.");
  const label = score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";
  const color = score >= 4 ? "green" : score >= 2 ? "amber" : "red";
  return { label, color, notes };
}

function addToTracker(job: Job) {
  try {
    const existing = JSON.parse(localStorage.getItem("pf-pensions") || "[]");
    const newEntry = {
      id: crypto.randomUUID(),
      name: `${job.employer} pension`,
      provider: "",
      type: "workplace",
      value: "",
      annualGrowth: "5",
      notes: `Found via Pension Finder · ${job.startYear}–${job.endYear}`,
    };
    localStorage.setItem("pf-pensions", JSON.stringify([...existing, newEntry]));
  } catch {}
}

function ActionPlan({ jobs }: { jobs: Job[] }) {
  const [added, setAdded] = useState<Set<number>>(new Set());

  const handleAdd = (job: Job, i: number) => {
    addToTracker(job);
    setAdded(prev => new Set(prev).add(i));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <h3 className="font-bold text-green-800 mb-1">Step 1 — Use the Government Pension Tracing Service</h3>
        <p className="text-green-700 text-sm mb-3">This is the official, free service run by the DWP. It can trace any workplace or personal pension scheme.</p>
        <a href="https://www.gov.uk/find-pension-contact-details" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800">
          Go to Pension Tracing Service <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {jobs.filter(j => j.employer).map((job, i) => {
        const { label, color, notes } = getPensionLikelihood(job);
        const colorMap: Record<string, string> = {
          green: "bg-green-50 border-green-200",
          amber: "bg-amber-50 border-amber-200",
          red: "bg-red-50 border-red-200",
        };
        const badgeMap: Record<string, string> = {
          green: "bg-green-100 text-green-800",
          amber: "bg-amber-100 text-amber-800",
          red: "bg-red-100 text-red-800",
        };
        return (
          <div key={i} className={`border rounded-xl p-5 ${colorMap[color]}`}>
            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">{job.employer}</h3>
                  <span className="text-xs text-gray-500">{job.startYear}–{job.endYear} · {job.industry || "Unknown sector"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeMap[color]}`}>{label} likelihood</span>
                <button
                  onClick={() => handleAdd(job, i)}
                  disabled={added.has(i)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    added.has(i)
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : "bg-indigo-700 text-white hover:bg-indigo-800"
                  }`}
                >
                  {added.has(i) ? <CheckCircle className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  {added.has(i) ? "Added to tracker" : "Add to tracker"}
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-1 mb-4">
              {notes.map((n, j) => <li key={j} className="text-sm text-gray-600 flex gap-2"><span className="shrink-0">•</span>{n}</li>)}
            </ul>
            <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-700">
              <strong>What to do:</strong> Search &ldquo;{job.employer} pension scheme contact&rdquo; or call their HR/payroll. Then use the Pension Tracing Service above as a backup.
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="font-bold text-indigo-800 mb-2">Step 2 — Check your State Pension forecast</h3>
        <p className="text-sm text-gray-600 mb-3">Your National Insurance record determines how much State Pension you&apos;ll get. You need 35 qualifying years for the full amount (£221.20/week in 2026).</p>
        <a href="https://www.gov.uk/check-state-pension" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800">
          Check State Pension on Gov.uk <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <h3 className="font-bold text-purple-800 mb-2">Step 3 — Track what you find</h3>
        <p className="text-sm text-gray-600 mb-3">
          {added.size > 0
            ? `You've already added ${added.size} pension${added.size > 1 ? "s" : ""} to your tracker. Head there to enter the values and run a projection.`
            : "Once you've located your pots, add them to your tracker to see the full picture and run a projection."}
        </p>
        <a href="/track" className="inline-flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-800">
          Go to My Pensions tracker →
        </a>
      </div>
    </div>
  );
}

export default function FindPage() {
  const [step, setStep] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([{ employer: "", startYear: "", endYear: "", industry: "" }]);

  const addJob = () => setJobs([...jobs, { employer: "", startYear: "", endYear: "", industry: "" }]);
  const updateJob = (i: number, j: Job) => { const arr = [...jobs]; arr[i] = j; setJobs(arr); };
  const removeJob = (i: number) => setJobs(jobs.filter((_, idx) => idx !== i));

  const validJobs = jobs.filter(j => j.employer && j.startYear);
  const canProceed = validJobs.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <StepIndicator current={step} total={3} />

      {step === 0 && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Where have you worked?</h1>
          <p className="text-gray-500 mb-8">Add every employer you can remember. Don&apos;t worry if you can&apos;t recall every detail — even partial information helps.</p>
          <div className="flex flex-col gap-4 mb-6">
            {jobs.map((job, i) => (
              <JobForm key={i} job={job} index={i} onChange={(j) => updateJob(i, j)} onRemove={() => removeJob(i)} />
            ))}
          </div>
          <button onClick={addJob} className="flex items-center gap-2 text-indigo-700 font-semibold text-sm hover:text-indigo-900 mb-8">
            <Plus className="w-4 h-4" /> Add another employer
          </button>
          <div>
            <button
              onClick={() => setStep(1)}
              disabled={!canProceed}
              className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Review my history <ChevronRight className="w-4 h-4" />
            </button>
            {!canProceed && (
              <p className="text-xs text-gray-400 mt-2">Add at least one employer name and start year to continue.</p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Review your employment history</h1>
          <p className="text-gray-500 mb-8">Check this looks right before we generate your personalised action plan.</p>
          <div className="flex flex-col gap-3 mb-8">
            {validJobs.map((job, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
                <div>
                  <p className="font-semibold">{job.employer}</p>
                  <p className="text-sm text-gray-500">{job.startYear}–{job.endYear || "?"} · {job.industry || "Sector not specified"}</p>
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
          <p className="text-gray-500 mb-8">Here&apos;s exactly what to do next, tailored to your work history.</p>
          <ActionPlan jobs={validJobs} />
          <button onClick={() => setStep(0)} className="mt-8 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ChevronLeft className="w-4 h-4" /> Start again
          </button>
        </div>
      )}
    </div>
  );
}
