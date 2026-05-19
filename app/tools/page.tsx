'use client';
import { useState } from 'react';
import { PreTradeSimulator } from '@/components/tools/PreTradeSimulator';
import { ConcentrationMonitor } from '@/components/tools/ConcentrationMonitor';
import { TaxLotView } from '@/components/tools/TaxLotView';
import { RebalancingEngine } from '@/components/tools/RebalancingEngine';

type Tab = 'pretrade' | 'concentration' | 'taxlots' | 'rebalance';

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'pretrade',      label: 'Pre-Trade Simulator', desc: 'Impact analysis before you buy' },
  { id: 'concentration', label: 'Concentration Monitor', desc: 'HHI, position & sector limits' },
  { id: 'taxlots',       label: 'Tax Lot View', desc: 'Cost basis, G/L, ISA allowance' },
  { id: 'rebalance',     label: 'Rebalancing Engine', desc: 'Target weights & proposed trades' },
];

export default function ToolsPage() {
  const [tab, setTab] = useState<Tab>('pretrade');
  const active = TABS.find(t => t.id === tab)!;

  return (
    <div className="px-4 lg:px-6 py-5 space-y-4 max-w-[1200px]">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Position Management</h1>
        <p className="text-[12px] font-mono text-[var(--text-tertiary)] mt-0.5">{active.desc}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto scrollbar-none border-b border-[var(--border-subtle)]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-[12px] font-mono whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        {tab === 'pretrade'      && <PreTradeSimulator />}
        {tab === 'concentration' && <ConcentrationMonitor />}
        {tab === 'taxlots'       && <TaxLotView />}
        {tab === 'rebalance'     && <RebalancingEngine />}
      </div>
    </div>
  );
}
