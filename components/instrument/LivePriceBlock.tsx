'use client';
import { usePriceStore } from '@/store/priceStore';
import { PriceFlash } from '@/components/shared/PriceFlash';

interface Props { ticker: string; yfSymbol: string; }

export function LivePriceBlock({ ticker, yfSymbol }: Props) {
  const { quotes, gbpUsd } = usePriceStore();
  const q = quotes[ticker] ?? quotes[yfSymbol];

  if (!q) {
    return (
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 text-[var(--text-tertiary)] text-sm font-mono">
        Live price loading…
      </div>
    );
  }

  const isPos = q.changePercent >= 0;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PriceFlash value={q.price}>
            <div className="text-3xl font-bold font-mono tabular-nums text-[var(--text-primary)]">
              {q.currency} {q.price.toFixed(2)}
            </div>
          </PriceFlash>
          <div className="text-sm font-mono text-[var(--text-secondary)] mt-0.5">
            £{q.priceGBP.toFixed(4)} GBP
          </div>
          <div className={`text-lg font-bold font-mono tabular-nums mt-1 ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {isPos ? '+' : ''}{q.change.toFixed(2)} ({isPos ? '+' : ''}{q.changePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono">
          <div><span className="text-[var(--text-tertiary)]">Day:</span> <span className="text-[var(--text-secondary)]">{q.dayLow.toFixed(2)} – {q.dayHigh.toFixed(2)}</span></div>
          <div><span className="text-[var(--text-tertiary)]">52W:</span> <span className="text-[var(--text-secondary)]">{q.fiftyTwoWeekLow.toFixed(2)} – {q.fiftyTwoWeekHigh.toFixed(2)}</span></div>
          {q.volume > 0 && <div><span className="text-[var(--text-tertiary)]">Vol:</span> <span className="text-[var(--text-secondary)]">{(q.volume / 1e6).toFixed(1)}M</span></div>}
          {q.marketCap && <div><span className="text-[var(--text-tertiary)]">MCap:</span> <span className="text-[var(--text-secondary)]">{q.marketCap >= 1e12 ? `$${(q.marketCap / 1e12).toFixed(2)}T` : `$${(q.marketCap / 1e9).toFixed(1)}B`}</span></div>}
          <div><span className="text-[var(--text-tertiary)]">Prev:</span> <span className="text-[var(--text-secondary)]">{q.previousClose.toFixed(2)}</span></div>
          <div><span className="text-[var(--text-tertiary)]">FX:</span> <span className="text-[var(--text-secondary)]">{gbpUsd.toFixed(4)}</span></div>
        </div>
      </div>
    </div>
  );
}
