"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, PencilLine, Check, X, Wallet, TrendingUp, PoundSterling } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type PensionType = "workplace" | "personal" | "state";
type Pension = {
  id: string; name: string; provider: string; type: PensionType;
  value: string; annualGrowth: string; notes: string;
};

const TYPES: { value: PensionType; label: string }[] = [
  { value: "workplace", label: "Workplace" },
  { value: "personal", label: "Personal / SIPP" },
  { value: "state", label: "State Pension" },
];

const TYPE_COLORS: Record<PensionType, string> = {
  workplace: "bg-indigo-100 text-indigo-700",
  personal: "bg-purple-100 text-purple-700",
  state: "bg-green-100 text-green-700",
};

const PIE_COLORS: Record<PensionType, string> = {
  workplace: "#6366f1",
  personal: "#a855f7",
  state: "#22c55e",
};

function fmtGBP(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toFixed(0)}`;
}

const EMPTY: Omit<Pension, "id"> = { name: "", provider: "", type: "workplace", value: "", annualGrowth: "5", notes: "" };

function healthScore(pensions: Pension[], totalValue: number): { score: number; label: string; colour: string; tip: string } {
  let score = 0;
  if (totalValue >= 10000) score += 20;
  if (totalValue >= 50000) score += 20;
  if (totalValue >= 100000) score += 20;
  if (pensions.length >= 1) score += 15;
  if (pensions.every(p => parseFloat(p.annualGrowth) >= 4)) score += 15;
  if (pensions.some(p => p.type === "state")) score += 10;
  score = Math.min(100, score);
  if (score >= 80) return { score, label: "Excellent", colour: "text-green-700", tip: "Your pension picture looks strong. Consider whether consolidation could save on fees." };
  if (score >= 55) return { score, label: "Good", colour: "text-indigo-700", tip: "Solid foundation. Boosting monthly contributions or adding missing pots will improve your score." };
  if (score >= 30) return { score, label: "Needs attention", colour: "text-amber-700", tip: "There may be significant gaps. Use the Pension Finder to locate any missing pots." };
  return { score, label: "Critical", colour: "text-red-700", tip: "Start now — even small contributions today compound significantly over time." };
}

export default function TrackPage() {
  const [pensions, setPensions] = useState<Pension[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Pension, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pf-pensions");
      if (stored) setPensions(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  function save(updated: Pension[]) {
    setPensions(updated);
    localStorage.setItem("pf-pensions", JSON.stringify(updated));
  }

  function addPension() {
    save([...pensions, { ...form, id: crypto.randomUUID() }]);
    setForm(EMPTY);
    setShowForm(false);
  }

  function updatePension() {
    if (!editing) return;
    save(pensions.map(p => p.id === editing ? { ...form, id: editing } : p));
    setEditing(null);
    setForm(EMPTY);
  }

  function startEdit(p: Pension) {
    setEditing(p.id);
    setForm({ name: p.name, provider: p.provider, type: p.type, value: p.value, annualGrowth: p.annualGrowth, notes: p.notes });
    setShowForm(false);
  }

  const totalValue = pensions.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
  const projected1yr = pensions.reduce((s, p) => {
    const v = parseFloat(p.value) || 0;
    const g = parseFloat(p.annualGrowth) || 5;
    return s + v * (1 + g / 100);
  }, 0);

  const pieData = TYPES
    .map(t => ({
      name: t.label,
      value: pensions.filter(p => p.type === t.value).reduce((s, p) => s + (parseFloat(p.value) || 0), 0),
      type: t.value,
    }))
    .filter(d => d.value > 0);

  const health = pensions.length > 0 ? healthScore(pensions, totalValue) : null;

  const PensionForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col gap-4 mb-4">
      <h3 className="font-bold text-indigo-800">{editing ? "Edit pension" : "Add a pension"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pension name / reference</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lloyds Workplace Pension" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="e.g. Nest, Aviva, Legal & General" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PensionType })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current value (£)</label>
          <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="e.g. 15000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Est. annual growth (%)</label>
          <input type="number" value={form.annualGrowth} onChange={e => setForm({ ...form, annualGrowth: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Contact number, account ref…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onSave} disabled={!form.name} className="bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800 disabled:opacity-40 flex items-center gap-2">
          <Check className="w-4 h-4" /> {editing ? "Save changes" : "Add pension"}
        </button>
        <button onClick={onCancel} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );

  if (!loaded) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Pensions</h1>
          <p className="text-gray-500">Track all your pension pots in one place. Stored only in your browser.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }}
          className="bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800 flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add pension
        </button>
      </div>

      {showForm && <PensionForm onSave={addPension} onCancel={() => setShowForm(false)} />}

      {pensions.length === 0 && !showForm ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">No pensions added yet</h2>
          <p className="text-gray-400 text-sm mb-6">
            Use the <Link href="/find" className="text-indigo-600 underline">Pension Finder</Link> to locate them, then add them here.
          </p>
          <button onClick={() => setShowForm(true)} className="bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800">
            Add your first pension
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {pensions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="col-span-2 bg-indigo-700 text-white rounded-2xl p-5">
                <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">Total value</p>
                <p className="text-3xl font-bold">{fmtGBP(totalValue)}</p>
                <p className="text-indigo-200 text-xs mt-1">across {pensions.length} pot{pensions.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> In 1 year</p>
                <p className="text-xl font-bold text-gray-900">{fmtGBP(projected1yr)}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><PoundSterling className="w-3.5 h-3.5" /> Pots tracked</p>
                <p className="text-xl font-bold text-gray-900">{pensions.length}</p>
              </div>
            </div>
          )}

          {/* Health score + pie */}
          {pensions.length > 0 && health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold mb-3">Pension health score</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={health.score >= 80 ? "#16a34a" : health.score >= 55 ? "#6366f1" : health.score >= 30 ? "#d97706" : "#dc2626"}
                        strokeWidth="3"
                        strokeDasharray={`${health.score} ${100 - health.score}`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">{health.score}</span>
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${health.colour}`}>{health.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{health.tip}</p>
                  </div>
                </div>
              </div>

              {pieData.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <h3 className="font-bold mb-3">Breakdown by type</h3>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={100} height={100}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={PIE_COLORS[entry.type as PensionType]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmtGBP(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[d.type as PensionType] }} />
                          <span className="text-gray-600">{d.name}</span>
                          <span className="font-semibold text-gray-900 ml-auto">{fmtGBP(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex flex-col gap-3">
            {pensions.map(p => (
              editing === p.id ? (
                <div key={p.id}>
                  <PensionForm onSave={updatePension} onCancel={() => setEditing(null)} />
                </div>
              ) : (
                <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>
                        {TYPES.find(t => t.value === p.type)?.label}
                      </span>
                    </div>
                    {p.provider && <p className="text-sm text-gray-500 mb-1">{p.provider}</p>}
                    <div className="flex items-center gap-6 flex-wrap">
                      <span className="text-lg font-bold text-indigo-700">{p.value ? fmtGBP(parseFloat(p.value)) : "Value unknown"}</span>
                      {p.annualGrowth && <span className="text-sm text-gray-400">{p.annualGrowth}% est. growth/yr</span>}
                      {p.notes && <span className="text-xs text-gray-400 truncate max-w-xs">{p.notes}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button onClick={() => save(pensions.filter(x => x.id !== p.id))} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          {pensions.length > 0 && (
            <div className="mt-8 flex gap-4 flex-wrap">
              <Link href="/project" className="bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800">Run a projection →</Link>
              <Link href="/consolidate" className="border border-gray-300 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Should I consolidate? →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
