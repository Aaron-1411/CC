"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, PencilLine, Check, X, TrendingUp, PoundSterling, Wallet } from "lucide-react";
import Link from "next/link";

type Pension = {
  id: string;
  name: string;
  provider: string;
  type: "workplace" | "personal" | "state";
  value: string;
  annualGrowth: string;
  notes: string;
};

const TYPES: { value: Pension["type"]; label: string }[] = [
  { value: "workplace", label: "Workplace" },
  { value: "personal", label: "Personal / SIPP" },
  { value: "state", label: "State Pension" },
];

const TYPE_COLORS: Record<Pension["type"], string> = {
  workplace: "bg-indigo-100 text-indigo-700",
  personal: "bg-purple-100 text-purple-700",
  state: "bg-green-100 text-green-700",
};

function formatGBP(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toFixed(0)}`;
}

const EMPTY: Omit<Pension, "id"> = { name: "", provider: "", type: "workplace", value: "", annualGrowth: "5", notes: "" };

export default function TrackPage() {
  const [pensions, setPensions] = useState<Pension[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Pension, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pf-pensions");
      if (stored) setPensions(JSON.parse(stored));
    } catch {}
  }, []);

  function save(updated: Pension[]) {
    setPensions(updated);
    localStorage.setItem("pf-pensions", JSON.stringify(updated));
  }

  function addPension() {
    const p: Pension = { ...form, id: crypto.randomUUID() };
    save([...pensions, p]);
    setForm(EMPTY);
    setShowForm(false);
  }

  function updatePension() {
    save(pensions.map((p) => (p.id === editing ? { ...form, id: editing } : p)));
    setEditing(null);
    setForm(EMPTY);
  }

  function deletePension(id: string) {
    save(pensions.filter((p) => p.id !== id));
  }

  function startEdit(p: Pension) {
    setEditing(p.id);
    setForm({ name: p.name, provider: p.provider, type: p.type, value: p.value, annualGrowth: p.annualGrowth, notes: p.notes });
    setShowForm(false);
  }

  const totalValue = pensions.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
  const projected1yr = pensions.reduce((sum, p) => {
    const v = parseFloat(p.value) || 0;
    const g = parseFloat(p.annualGrowth) || 5;
    return sum + v * (1 + g / 100);
  }, 0);

  const PensionForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col gap-4">
      <h3 className="font-bold text-indigo-800">{editing ? "Edit pension" : "Add a pension"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pension name / reference</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lloyds Workplace Pension" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. Nest, Aviva, Legal & General" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Pension["type"] })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current value (£)</label>
          <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 15000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated annual growth (%)</label>
          <input type="number" value={form.annualGrowth} onChange={(e) => setForm({ ...form, annualGrowth: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Contact number, account ref…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Pensions</h1>
          <p className="text-gray-500">Track all your pension pots in one place. Data stays in your browser — nothing is sent to us.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }}
          className="bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add pension
        </button>
      </div>

      {/* Summary cards */}
      {pensions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
            <Wallet className="w-8 h-8 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Total value</p>
              <p className="text-2xl font-bold text-gray-900">{formatGBP(totalValue)}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Projected in 1 year</p>
              <p className="text-2xl font-bold text-gray-900">{formatGBP(projected1yr)}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
            <PoundSterling className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Number of pots</p>
              <p className="text-2xl font-bold text-gray-900">{pensions.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-6">
          <PensionForm onSave={addPension} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* List */}
      {pensions.length === 0 && !showForm ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">No pensions added yet</h2>
          <p className="text-gray-400 text-sm mb-6">Add your pots here after using the <Link href="/find" className="text-indigo-600 underline">Pension Finder</Link>.</p>
          <button onClick={() => setShowForm(true)} className="bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800">
            Add your first pension
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pensions.map((p) => (
            editing === p.id ? (
              <div key={p.id}>
                <PensionForm onSave={updatePension} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>{TYPES.find(t => t.value === p.type)?.label}</span>
                  </div>
                  {p.provider && <p className="text-sm text-gray-500 mb-1">{p.provider}</p>}
                  <div className="flex items-center gap-6 flex-wrap">
                    <span className="text-lg font-bold text-indigo-700">{p.value ? formatGBP(parseFloat(p.value)) : "Unknown"}</span>
                    {p.annualGrowth && <span className="text-sm text-gray-400">{p.annualGrowth}% est. growth/yr</span>}
                    {p.notes && <span className="text-xs text-gray-400 truncate max-w-xs">{p.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <PencilLine className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePension(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {pensions.length > 0 && (
        <div className="mt-8 flex gap-4 flex-wrap">
          <Link href="/project" className="bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-800">
            Run a projection →
          </Link>
          <Link href="/consolidate" className="border border-gray-300 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
            How to consolidate →
          </Link>
        </div>
      )}
    </div>
  );
}
