import type { ParsedSignal, UserTrade } from '../types/contract';
import { fmtDuration, fmtPrice, fmtR, fmtTime } from '../lib/format';

interface Props {
  signal: ParsedSignal;
  trade: UserTrade;
  onEdit: () => void;
  onDelete: () => void;
}

function signalEntry(s: ParsedSignal): number | null {
  if (s.entry != null) return s.entry;
  if (s.entryRange) return (s.entryRange[0] + s.entryRange[1]) / 2;
  return null;
}

function rMultiple(trade: UserTrade, entry: number, stop: number): number | null {
  if (trade.exitPrice == null) return null;
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const move = trade.direction === 'long' ? trade.exitPrice - entry : entry - trade.exitPrice;
  return move / risk;
}

export default function TradeResult({ signal, trade, onEdit, onDelete }: Props) {
  const sigEntry = signalEntry(signal);
  const stop = signal.stopLoss;

  const myR = stop != null ? rMultiple(trade, trade.entryPrice, stop) : null;
  const sigR = stop != null && sigEntry != null ? rMultiple(trade, sigEntry, stop) : null;

  const slippage =
    sigEntry != null
      ? trade.direction === 'long'
        ? trade.entryPrice - sigEntry
        : sigEntry - trade.entryPrice
      : null;

  const delayMins = (Date.parse(trade.entryTime) - Date.parse(signal.signalTime)) / 60000;

  const won = myR != null ? myR > 0 : null;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`pill ${trade.direction === 'long' ? 'bg-long/15 text-long' : 'bg-short/15 text-short'}`}
          >
            {trade.direction.toUpperCase()}
          </span>
          <span
            className={`pill ${
              trade.status === 'open'
                ? 'bg-accent/15 text-accent'
                : won
                  ? 'bg-long/15 text-long'
                  : 'bg-short/15 text-short'
            }`}
          >
            {trade.status === 'open' ? 'OPEN' : won ? 'WIN' : 'LOSS'}
          </span>
          {myR != null && <span className={`text-sm font-semibold ${myR >= 0 ? 'text-long' : 'text-short'}`}>{fmtR(myR)}</span>}
        </div>
        <div className="flex gap-1">
          <button className="btn px-2 py-1 min-h-0 text-xs" onClick={onEdit}>
            edit
          </button>
          <button className="btn px-2 py-1 min-h-0 text-xs text-short" onClick={onDelete}>
            delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-xs">
        <Metric label="My entry" value={fmtPrice(trade.entryPrice, signal.assetClass)} />
        <Metric label="My exit" value={trade.exitPrice != null ? fmtPrice(trade.exitPrice, signal.assetClass) : '—'} />
        <Metric label="Size" value={trade.size != null ? String(trade.size) : '—'} />
        <Metric
          label="Slippage vs signal"
          value={slippage != null ? `${slippage >= 0 ? '+' : ''}${fmtPrice(Math.abs(slippage), signal.assetClass)}` : '—'}
          tone={slippage == null ? 'muted' : slippage > 0 ? 'bad' : 'good'}
        />
        <Metric
          label="Timing delay"
          value={Number.isFinite(delayMins) ? fmtDuration(delayMins) : '—'}
          tone={delayMins > 0 ? 'bad' : 'good'}
        />
        <Metric label="Signal R (theoretical)" value={fmtR(sigR)} />
      </div>

      <div className="mt-2 text-[11px] text-muted">
        Entered {fmtTime(trade.entryTime)}
        {trade.exitTime ? ` · exited ${fmtTime(trade.exitTime)}` : ''}
      </div>

      {trade.notes && <p className="mt-2 text-sm text-white/80">{trade.notes}</p>}
    </div>
  );
}

function Metric({ label, value, tone = 'muted' }: { label: string; value: string; tone?: 'muted' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-long' : tone === 'bad' ? 'text-short' : 'text-white';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`font-medium ${color}`}>{value}</div>
    </div>
  );
}
