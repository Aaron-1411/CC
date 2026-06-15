import type { JournalStats } from '../types/contract';
import { fmtDuration, fmtNum, fmtPct, fmtR } from '../lib/format';

interface Props {
  stats: JournalStats | null;
  loading?: boolean;
}

export default function JournalDashboard({ stats, loading }: Props) {
  if (loading && !stats) {
    return (
      <div className="panel p-3 text-sm text-muted">Loading journal…</div>
    );
  }
  if (!stats) return null;

  const edge = stats.myTotalR - stats.signalTotalR;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold">Journal</span>
        <span className="text-[11px] text-muted">
          {stats.tradesTaken} of {stats.totalSignals} signals taken
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <Stat label="Take rate" value={fmtPct(stats.takeRate)} />
        <Stat
          label="Win rate"
          value={fmtPct(stats.winRate)}
          sub={`${stats.wins}W / ${stats.losses}L`}
        />
        <Stat
          label="My total R"
          value={fmtR(stats.myTotalR)}
          tone={stats.myTotalR >= 0 ? 'good' : 'bad'}
        />
        <Stat
          label="Signal R (theo.)"
          value={fmtR(stats.signalTotalR)}
          tone={stats.signalTotalR >= 0 ? 'good' : 'bad'}
        />
        <Stat
          label="Execution edge"
          value={fmtR(edge)}
          sub="mine − signal"
          tone={edge >= 0 ? 'good' : 'bad'}
        />
        <Stat
          label="Avg slippage"
          value={fmtNum(stats.avgEntrySlippage, 4)}
          sub="+ = worse fill"
          tone={stats.avgEntrySlippage > 0 ? 'bad' : 'good'}
        />
        <Stat
          label="Avg delay"
          value={Number.isFinite(stats.avgTimingDelayMins) ? fmtDuration(stats.avgTimingDelayMins) : '—'}
          sub="after signal"
        />
        <Stat label="Signals" value={String(stats.totalSignals)} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  const color = tone === 'good' ? 'text-long' : tone === 'bad' ? 'text-short' : 'text-white';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-lg font-semibold leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
