'use client';
import { usePriceStore } from '@/store/priceStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { NumberTicker } from '@/components/shared/NumberTicker';
import { LiveDot } from '@/components/shared/LiveDot';
import { MarketStatus } from '@/components/shared/MarketStatus';

export function PortfolioHeader() {
  const { connected, lastUpdated, source } = usePriceStore();
  const { totalValueGBP, totalDailyChangeGBP, totalDailyPct, isaUsedGBP, isaAllowanceGBP } = usePortfolioStore();

  const isPos = totalDailyChangeGBP >= 0;
  const dot = connected ? 'live' : lastUpdated ? 'stale' : 'off';
  const time = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
  const usedPct = (isaUsedGBP / isaAllowanceGBP) * 100;

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 lg:px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Total value */}
        <div>
          <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
            UK Stocks ISA · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-3xl lg:text-4xl font-bold font-mono tabular-nums text-[var(--text-primary)] leading-none">
            <NumberTicker value={totalValueGBP} prefix="£" decimals={2} />
          </div>
          <div className={`mt-1 text-sm font-mono tabular-nums ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {isPos ? '+' : ''}£{Math.abs(totalDailyChangeGBP).toFixed(2)}&nbsp;
            ({isPos ? '+' : ''}{totalDailyPct.toFixed(2)}%) today
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2">
          {/* Live status */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <LiveDot state={dot} />
            {connected ? (
              <span><span className="text-[var(--text-primary)]">{source ?? 'Live'}</span> · {time}</span>
            ) : (
              <span>Snapshot data</span>
            )}
          </div>

          <MarketStatus />

          {/* ISA allowance bar */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
            <span>ISA</span>
            <div className="w-24 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <span className="text-[var(--text-tertiary)]">£{isaUsedGBP.toLocaleString('en-GB', { maximumFractionDigits: 0 })} / £{isaAllowanceGBP.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
