'use client';
import { useState } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { HOLDINGS_DEFINITION } from '@/lib/constants';

interface ApiKeyField { key: string; label: string; placeholder: string; envVar: string; }

const API_KEYS: ApiKeyField[] = [
  { key: 'anthropic', label: 'Anthropic API Key (AI Overview, Chat & News Sentiment)', placeholder: 'sk-ant-…', envVar: 'ANTHROPIC_API_KEY' },
  { key: 'xai',       label: 'xAI Grok API Key (AI Overview & Chat — preferred)',      placeholder: 'xai-…',    envVar: 'XAI_API_KEY' },
  { key: 'finnhub',   label: 'Finnhub API Key (News with sentiment)',                  placeholder: 'c…',       envVar: 'FINNHUB_API_KEY' },
  { key: 'fmp',       label: 'FMP API Key (Extended Fundamentals)',                    placeholder: 'your_key', envVar: 'FMP_API_KEY' },
  { key: 'fred',      label: 'FRED API Key (Macro data)',                              placeholder: 'optional', envVar: 'FRED_API_KEY' },
];

export default function SettingsPage() {
  const { positions, setUnits } = usePortfolioStore();
  const [unitsEdits, setUnitsEdits] = useState<Record<string, { units: string; avgCost: string }>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const handleUnitsSave = (ticker: string) => {
    const edit = unitsEdits[ticker];
    if (!edit) return;
    const units = parseFloat(edit.units);
    const avgCost = parseFloat(edit.avgCost);
    if (!isNaN(units)) {
      setUnits(ticker, units, !isNaN(avgCost) ? avgCost : undefined);
      setSaved(ticker);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-6 max-w-[800px]">
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Holdings manager */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Holdings — Units &amp; Cost Basis</div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">Enter your actual units and average cost per unit to unlock exact P&amp;L calculations. These are stored in your browser session.</p>
        <div className="space-y-3">
          {HOLDINGS_DEFINITION.map((h) => {
            const pos = positions.find((p) => p.ticker === h.ticker);
            const edit = unitsEdits[h.ticker] ?? { units: pos?.units?.toString() ?? '', avgCost: pos?.avgCostGBP?.toString() ?? '' };
            return (
              <div key={h.ticker} className="flex items-center gap-3 flex-wrap">
                <div className="w-20 font-mono text-xs text-[var(--text-secondary)]">{h.ticker}</div>
                <div className="flex-1 text-xs text-[var(--text-tertiary)] min-w-[100px]">{h.name.slice(0, 28)}…</div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Units"
                  value={edit.units}
                  onChange={(e) => setUnitsEdits((prev) => ({ ...prev, [h.ticker]: { ...edit, units: e.target.value } }))}
                  className="w-28 bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded px-2 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Avg cost (£)"
                  value={edit.avgCost}
                  onChange={(e) => setUnitsEdits((prev) => ({ ...prev, [h.ticker]: { ...edit, avgCost: e.target.value } }))}
                  className="w-32 bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded px-2 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => handleUnitsSave(h.ticker)}
                  className="px-3 py-1.5 text-xs font-mono rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  {saved === h.ticker ? '✓ Saved' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* API key info */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">API Keys</div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          API keys are configured via environment variables in <code className="font-mono bg-[var(--bg-raised)] px-1 rounded">.env.local</code>. They are never exposed to the browser.
        </p>
        <div className="space-y-3">
          {API_KEYS.map((k) => (
            <div key={k.key} className="flex items-center gap-3 flex-wrap">
              <div className="flex-1">
                <div className="text-xs font-medium text-[var(--text-primary)]">{k.label}</div>
                <div className="text-[10px] font-mono text-[var(--text-tertiary)]">env: {k.envVar}</div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
                k.key === 'anthropic' ? 'border-[var(--accent)]/40 text-[var(--accent)]' :
                k.key === 'xai' ? 'border-[var(--accent)]/40 text-[var(--accent)]' :
                k.key === 'fred' ? 'border-[var(--border-subtle)] text-[var(--text-tertiary)]' :
                'border-[var(--neutral-bg)] text-[var(--neutral)]'
              }`}>
                {k.key === 'anthropic' ? 'Recommended — enables AI' :
                 k.key === 'xai' ? 'Optional — Grok preferred' :
                 k.key === 'fred' ? 'Optional' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mb-2">Quick setup (.env.local)</div>
          <pre className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap">{`ANTHROPIC_API_KEY=sk-ant-... # AI overview, chat & news sentiment
XAI_API_KEY=xai-...          # Grok (preferred for AI — falls back to Anthropic)
FINNHUB_API_KEY=your_key     # optional (news with full sentiment)
FMP_API_KEY=your_key         # optional (extended fundamentals)
FRED_API_KEY=your_key        # optional (macro data)
DATABASE_URL=file:./dev.db`}</pre>
        </div>
      </section>

      {/* Data export */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Data Export</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Portfolio snapshot CSV', description: 'Current positions and values' },
            { label: 'Holdings list CSV', description: 'All holding definitions' },
          ].map((e) => (
            <button
              key={e.label}
              onClick={() => {
                const csv = positions.map((p) => `${p.ticker},${p.name},${p.currentValueGBP.toFixed(2)},${(p.weight * 100).toFixed(2)},${p.dailyPct.toFixed(2)}`).join('\n');
                const blob = new Blob([`Ticker,Name,Value GBP,Weight %,Day %\n${csv}`], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `isa-portfolio-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              className="px-4 py-2 text-xs font-mono rounded-lg border border-[var(--border-normal)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {e.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
