'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { HOLDINGS_DEFINITION, HOLDING_COLORS } from '@/lib/constants';
import { useLivePrices } from '@/hooks/useLivePrices';
import { LivePriceBlock } from '@/components/instrument/LivePriceBlock';
import { PriceChart } from '@/components/instrument/PriceChart';
import { MyPositionCard } from '@/components/instrument/MyPositionCard';
import { AIAnalysisPanel } from '@/components/instrument/AIAnalysisPanel';
import { ProfileStrip } from '@/components/instrument/ProfileStrip';
import { FundamentalsTab } from '@/components/instrument/FundamentalsTab';
import { TechnicalsTab } from '@/components/instrument/TechnicalsTab';
import { CatalystsTab } from '@/components/instrument/CatalystsTab';
import { RiskTab } from '@/components/instrument/RiskTab';
import { NewsTab } from '@/components/instrument/NewsTab';
import { ETFHoldingsTab } from '@/components/instrument/ETFHoldingsTab';
import { SeasonalitySection } from '@/components/instrument/SeasonalitySection';

interface Props { params: Promise<{ ticker: string }>; }

type Tab = 'chart' | 'fundamentals' | 'technicals' | 'catalysts' | 'risk' | 'news' | 'seasonality' | 'etf';

export default function InstrumentPage({ params }: Props) {
  const { ticker } = use(params);
  const [tab, setTab] = useState<Tab>('chart');
  useLivePrices();
  const h = HOLDINGS_DEFINITION.find((x) => x.ticker === decodeURIComponent(ticker));

  if (!h) {
    return (
      <div className="p-6 text-[var(--text-secondary)]">
        Holding <span className="font-mono">{ticker}</span> not found.{' '}
        <Link href="/" className="text-[var(--accent)] hover:underline">Back to overview</Link>
      </div>
    );
  }

  const color = HOLDING_COLORS[h.ticker] ?? '#8896b0';
  const isETF = h.type === 'ETF';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'chart',        label: 'Chart' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'technicals',   label: 'Technicals' },
    { id: 'catalysts',    label: 'Catalysts' },
    { id: 'risk',         label: 'Risk' },
    { id: 'news',         label: 'News' },
    { id: 'seasonality',  label: 'Seasonality' },
    ...(isETF ? [{ id: 'etf' as Tab, label: 'Holdings' }] : []),
  ];

  return (
    <div className="px-4 lg:px-6 py-5 space-y-4 max-w-[1200px]">
      {/* Back + header */}
      <div>
        <Link href="/" className="text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mb-3 inline-block">
          ← Overview
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{h.name}</h1>
          <span className="font-mono text-[11px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
            {h.ticker}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded border ${
            isETF
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-soft)]'
              : 'bg-[#1e1a2e] text-[#bc8cff] border-[#4a3d7a]'
          }`}>
            {h.type}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{h.exchange}</span>
          {h.isin && <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{h.isin}</span>}
          {h.ter !== null && (
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">TER: {(h.ter * 100).toFixed(2)}%</span>
          )}
        </div>
      </div>

      {/* Live price block */}
      <LivePriceBlock ticker={h.ticker} yfSymbol={h.yfSymbol} />

      {/* Profile strip — sector, stats, description */}
      <ProfileStrip ticker={h.ticker} yfSymbol={h.yfSymbol} type={h.type} />

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto scrollbar-none border-b border-[var(--border-subtle)]">
        {TABS.map((t) => (
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
            {t.id === 'news' && (
              <span className="ml-1 text-[9px] align-super text-[var(--accent)] opacity-70">●</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'chart' && (
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Price Chart</div>
            <PriceChart ticker={h.ticker} yfSymbol={h.yfSymbol} />
          </section>
          <MyPositionCard ticker={h.ticker} />
          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
              AI Analysis · Live web data
            </div>
            <AIAnalysisPanel ticker={h.ticker} name={h.name} type={h.type} />
          </section>
        </div>
      )}

      {tab === 'fundamentals' && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Fundamentals · Yahoo Finance
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
              Price-only (no dividends)
            </span>
          </div>
          <FundamentalsTab yfSymbol={h.yfSymbol} ticker={h.ticker} type={h.type} />
        </section>
      )}

      {tab === 'technicals' && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Technicals · 6-month price history
          </div>
          <TechnicalsTab ticker={h.ticker} yfSymbol={h.yfSymbol} />
        </section>
      )}

      {tab === 'catalysts' && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Catalysts · Yahoo Finance
          </div>
          <CatalystsTab yfSymbol={h.yfSymbol} ticker={h.ticker} />
        </section>
      )}

      {tab === 'risk' && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Risk · Position-level analytics
          </div>
          <RiskTab ticker={h.ticker} yfSymbol={h.yfSymbol} />
        </section>
      )}

      {tab === 'news' && (
        <section className="space-y-0">
          <NewsTab ticker={h.ticker} />
        </section>
      )}

      {tab === 'seasonality' && (
        <section className="space-y-0">
          <SeasonalitySection ticker={h.ticker} />
        </section>
      )}

      {tab === 'etf' && isETF && (
        <section className="space-y-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            ETF Holdings · Financial Modeling Prep
          </div>
          <ETFHoldingsTab ticker={h.ticker} />
        </section>
      )}
    </div>
  );
}
