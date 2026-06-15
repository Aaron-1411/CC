import type { SignalWithTrades } from '../types/contract';
import { fmtPrice, fmtRelative } from '../lib/format';

interface Props {
  item: SignalWithTrades;
  selected: boolean;
  onSelect: () => void;
}

export default function SignalCard({ item, selected, onSelect }: Props) {
  const { signal, trades } = item;
  const dir = signal.direction;
  const openTrades = trades.filter((t) => t.status === 'open').length;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left panel p-3 transition-colors ${
        selected ? 'border-accent' : 'hover:border-muted/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{signal.symbol}</span>
          {dir && (
            <span
              className={`pill ${dir === 'long' ? 'bg-long/15 text-long' : 'bg-short/15 text-short'}`}
            >
              {dir.toUpperCase()}
            </span>
          )}
          <span className="pill bg-panel2 text-muted">{signal.assetClass}</span>
        </div>
        <span className="text-xs text-muted whitespace-nowrap">{fmtRelative(signal.signalTime)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          Entry:{' '}
          <span className="text-white">
            {signal.entry != null
              ? fmtPrice(signal.entry, signal.assetClass)
              : signal.entryRange
                ? `${fmtPrice(signal.entryRange[0], signal.assetClass)}–${fmtPrice(signal.entryRange[1], signal.assetClass)}`
                : '—'}
          </span>
        </span>
        <span>
          Stop: <span className="text-white">{fmtPrice(signal.stopLoss, signal.assetClass)}</span>
        </span>
        <span>
          Targets:{' '}
          <span className="text-white">
            {signal.takeProfit.length ? signal.takeProfit.map((t) => fmtPrice(t, signal.assetClass)).join(' / ') : '—'}
          </span>
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <ConfidenceBar value={signal.parseConfidence} />
        <div className="flex items-center gap-1">
          {trades.length > 0 && (
            <span className="pill bg-accent/15 text-accent">
              {trades.length} trade{trades.length > 1 ? 's' : ''}
              {openTrades ? ` · ${openTrades} open` : ''}
            </span>
          )}
        </div>
      </div>

      {signal.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {signal.flags.map((f, i) => (
            <span key={i} className="pill bg-flag/15 text-flag">
              {f}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? 'bg-long' : value >= 0.45 ? 'bg-flag' : 'bg-short';
  return (
    <div className="flex items-center gap-2 flex-1 max-w-[160px]">
      <span className="text-[10px] uppercase tracking-wide text-muted">conf</span>
      <div className="h-1.5 flex-1 rounded-full bg-panel2 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted w-7 text-right">{pct}%</span>
    </div>
  );
}
