'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchJson } from '@/lib/fetchJson';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { OHLCVBar } from '@/types/market';

interface Props { ticker: string; yfSymbol: string; }

function calcMA(bars: OHLCVBar[], w: number): (number | null)[] {
  return bars.map((_, i) => {
    if (i < w - 1) return null;
    return bars.slice(i - w + 1, i + 1).reduce((s, b) => s + b.close, 0) / w;
  });
}

function calcRSISeries(bars: OHLCVBar[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (bars.length < period + 1) return result;

  // Wilder's smoothing RSI
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff > 0) gains += diff; else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < bars.length; i++) {
    if (i === period) {
      result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      continue;
    }
    const diff = bars[i].close - bars[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function calcATR(bars: OHLCVBar[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const recent = bars.slice(-period - 1);
  const trs = recent.slice(1).map((b, i) => {
    const prev = recent[i];
    return Math.max(b.high - b.low, Math.abs(b.high - prev.close), Math.abs(b.low - prev.close));
  });
  return trs.reduce((s, v) => s + v, 0) / trs.length;
}

function calcBollinger(bars: OHLCVBar[]): { upper: number | null; mid: number | null; lower: number | null } {
  if (bars.length < 20) return { upper: null, mid: null, lower: null };
  const window = bars.slice(-20);
  const mid = window.reduce((s, b) => s + b.close, 0) / 20;
  const variance = window.reduce((s, b) => s + Math.pow(b.close - mid, 2), 0) / 20;
  const sigma = Math.sqrt(variance);
  return { upper: mid + 2 * sigma, mid, lower: mid - 2 * sigma };
}

function calcEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = values[0];
  result.push(ema);
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

interface MACDPoint { date: string; macd: number; signal: number; histogram: number }
function calcMACD(bars: OHLCVBar[]): MACDPoint[] {
  if (bars.length < 35) return [];
  const closes = bars.map(b => b.close);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.slice(25), 9);
  return bars.slice(25).map((b, i) => ({
    date: b.date,
    macd: +macdLine[25 + i].toFixed(4),
    signal: +signalLine[i].toFixed(4),
    histogram: +(macdLine[25 + i] - signalLine[i]).toFixed(4),
  }));
}

// Pivot-based support/resistance: find local highs and lows with a lookback window
function findSwingLevels(bars: OHLCVBar[], lookback = 10): { supports: number[]; resistances: number[] } {
  const supports: number[] = [];
  const resistances: number[] = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    const slice = bars.slice(i - lookback, i + lookback + 1);
    const minClose = Math.min(...slice.map(b => b.low));
    const maxClose = Math.max(...slice.map(b => b.high));
    if (bars[i].low === minClose) supports.push(bars[i].low);
    if (bars[i].high === maxClose) resistances.push(bars[i].high);
  }
  // Cluster nearby levels (within 1% of each other), keep strongest 3
  const cluster = (levels: number[]) => {
    const sorted = [...levels].sort((a, b) => a - b);
    const clustered: number[] = [];
    for (const l of sorted) {
      const existing = clustered.find(c => Math.abs(c - l) / c < 0.01);
      if (!existing) clustered.push(l);
    }
    return clustered.slice(-3);
  };
  return { supports: cluster(supports), resistances: cluster(resistances) };
}

export function TechnicalsTab({ ticker, yfSymbol }: Props) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['history', ticker, '6M'],
    queryFn: () => fetchJson(`/api/history/${encodeURIComponent(yfSymbol)}?interval=1d&range=6mo`),
    staleTime: 4 * 3_600_000,
  });

  const bars: OHLCVBar[] = useMemo(() => {
    if (!rawData) return [];
    return Array.isArray(rawData) ? rawData : (rawData?.bars ?? []);
  }, [rawData]);

  const { ma50, ma200, rsi, atr, bb, chartData, macdData, rsiData, regime, swings } = useMemo(() => {
    if (bars.length === 0) return { ma50: null, ma200: null, rsi: null, atr: null, bb: { upper: null, mid: null, lower: null }, chartData: [], macdData: [], rsiData: [], regime: null, swings: { supports: [], resistances: [] } };

    const ma50vals = calcMA(bars, 50);
    const ma200vals = calcMA(bars, 200);
    const rsiSeries = calcRSISeries(bars);
    const rsi = rsiSeries[rsiSeries.length - 1];
    const atr = calcATR(bars);
    const bb = calcBollinger(bars);
    const lastMa50 = ma50vals[ma50vals.length - 1];
    const lastMa200 = ma200vals[ma200vals.length - 1];
    const lastClose = bars[bars.length - 1]?.close;

    let regime: 'Uptrend' | 'Downtrend' | 'Consolidation' = 'Consolidation';
    if (lastMa50 && lastMa200 && lastClose) {
      if (lastClose > lastMa50 && lastMa50 > lastMa200) regime = 'Uptrend';
      else if (lastClose < lastMa50 && lastMa50 < lastMa200) regime = 'Downtrend';
    }

    const window60 = bars.slice(-60);
    const chartData = window60.map((b, i) => {
      const absI = bars.length - window60.length + i;
      return {
        date: b.date.slice(5),
        close: b.close,
        volume: b.volume,
        ma50: ma50vals[absI],
        ma200: ma200vals[absI],
        upper: i >= window60.length - 20 ? bb.upper : null,
        lower: i >= window60.length - 20 ? bb.lower : null,
      };
    });

    const rsiData = window60.map((b, i) => {
      const absI = bars.length - window60.length + i;
      return {
        date: b.date.slice(5),
        rsi: rsiSeries[absI] != null ? +rsiSeries[absI]!.toFixed(1) : null,
      };
    });

    const macdAll = calcMACD(bars);
    const macdData = macdAll.slice(-60).map(d => ({ ...d, date: d.date.slice(5) }));
    const swings = findSwingLevels(bars);

    return { ma50: lastMa50, ma200: lastMa200, rsi, atr, bb, chartData, macdData, rsiData, regime, swings };
  }, [bars]);

  if (isLoading) return <SkeletonCard className="h-48" />;
  if (bars.length === 0) return <div className="text-[var(--text-tertiary)] text-sm font-mono py-4">No price data available.</div>;

  const lastClose = bars[bars.length - 1]?.close ?? 0;
  const goldenCross = ma50 != null && ma200 != null && ma50 > ma200;
  const aboveMa50 = ma50 != null && lastClose > ma50;
  const aboveMa200 = ma200 != null && lastClose > ma200;

  const rsiColor = rsi == null ? 'text-[var(--text-tertiary)]' : rsi < 30 ? 'text-[var(--positive)]' : rsi > 70 ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]';
  const rsiLabel = rsi == null ? '' : rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral';

  const tooltipStyle = { background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10 };
  const axisProps = { tick: { fill: 'var(--text-tertiary)', fontSize: 9 }, axisLine: false, tickLine: false };

  return (
    <div className="space-y-4">
      {/* Regime + key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Regime</div>
          <div className={`text-sm font-bold font-mono ${regime === 'Uptrend' ? 'text-[var(--positive)]' : regime === 'Downtrend' ? 'text-[var(--negative)]' : 'text-[var(--neutral)]'}`}>
            {regime ?? '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
            {aboveMa50 ? '▲ above MA50' : '▼ below MA50'}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">RSI (14)</div>
          <div className={`text-sm font-bold font-mono tabular-nums ${rsiColor}`}>
            {rsi != null ? rsi.toFixed(1) : '—'}
          </div>
          {rsiLabel && <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{rsiLabel}</div>}
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">ATR (14)</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
            {atr != null ? atr.toFixed(2) : '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
            {atr != null && lastClose > 0 ? `${(atr / lastClose * 100).toFixed(1)}% of price` : 'Avg True Range'}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">MA Cross</div>
          <div className={`text-sm font-bold font-mono ${goldenCross ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {ma50 != null && ma200 != null ? (goldenCross ? '⚡ Golden' : '☠ Death') : '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
            MA50 {ma50 != null ? ma50.toFixed(2) : '—'} · MA200 {ma200 != null ? ma200.toFixed(2) : '—'}
          </div>
        </div>
      </div>

      {/* Price chart + volume */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
          Price · MA50 · MA200 · BB — 60 sessions
        </div>

        {/* Price + MAs + BB */}
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} width={56} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : '—', ''] as [string, string]}
            />
            {/* Support levels */}
            {swings.supports.map((s, i) => (
              <ReferenceLine key={`s${i}`} y={s} stroke="var(--positive)" strokeDasharray="3 3" strokeOpacity={0.5}
                label={{ value: `S ${s.toFixed(2)}`, position: 'insideTopRight', fill: 'var(--positive)', fontSize: 8 }} />
            ))}
            {/* Resistance levels */}
            {swings.resistances.map((r, i) => (
              <ReferenceLine key={`r${i}`} y={r} stroke="var(--negative)" strokeDasharray="3 3" strokeOpacity={0.5}
                label={{ value: `R ${r.toFixed(2)}`, position: 'insideBottomRight', fill: 'var(--negative)', fontSize: 8 }} />
            ))}
            <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} name="Price" />
            <Line type="monotone" dataKey="ma50" stroke="#f5a623" strokeWidth={1} dot={false} name="MA50" strokeDasharray="4 2" connectNulls />
            <Line type="monotone" dataKey="ma200" stroke="#3d7eff" strokeWidth={1} dot={false} name="MA200" strokeDasharray="4 2" connectNulls />
            <Line type="monotone" dataKey="upper" stroke="rgba(255,255,255,0.18)" strokeWidth={1} dot={false} name="BB Upper" />
            <Line type="monotone" dataKey="lower" stroke="rgba(255,255,255,0.18)" strokeWidth={1} dot={false} name="BB Lower" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume histogram */}
        <div className="mt-1 text-[9px] font-mono text-[var(--text-tertiary)] mb-1">Volume</div>
        <ResponsiveContainer width="100%" height={48}>
          <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [typeof v === 'number' ? `${(v / 1e6).toFixed(1)}M` : '—', 'Volume'] as [string, string]}
            />
            <Bar dataKey="volume" radius={1}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={i > 0 && d.close >= (chartData[i - 1]?.close ?? d.close) ? 'var(--positive)' : 'var(--negative)'} fillOpacity={0.5} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RSI time series */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            RSI (14) — 60 sessions
          </div>
          <span className={`text-[11px] font-mono font-semibold ${rsiColor}`}>
            {rsi != null ? `${rsi.toFixed(1)} · ${rsiLabel}` : '—'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={rsiData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} width={28} domain={[0, 100]} ticks={[30, 50, 70]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(1) : '—', 'RSI'] as [string, string]}
            />
            <ReferenceLine y={70} stroke="var(--negative)" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={30} stroke="var(--positive)" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={50} stroke="var(--border-normal)" strokeDasharray="2 4" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="rsi" stroke="var(--accent)" strokeWidth={1.5} dot={false} name="RSI" connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-1">
          Overbought &gt;70 (red) · Oversold &lt;30 (green) · Wilder smoothing
        </div>
      </div>

      {/* Bollinger Bands stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[11px] font-mono space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">vs Moving Averages</div>
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">50-day</span>
            <span className={aboveMa50 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
              {ma50 != null ? `${ma50.toFixed(2)} (${aboveMa50 ? '▲' : '▼'} ${Math.abs((lastClose - ma50) / ma50 * 100).toFixed(1)}%)` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">200-day</span>
            <span className={aboveMa200 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
              {ma200 != null ? `${ma200.toFixed(2)} (${aboveMa200 ? '▲' : '▼'} ${Math.abs((lastClose - ma200) / ma200 * 100).toFixed(1)}%)` : '—'}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[11px] font-mono space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Bollinger Bands (20, 2σ)</div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Upper</span><span className="tabular-nums text-[var(--negative)]">{bb.upper?.toFixed(2) ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Mid (SMA20)</span><span className="tabular-nums text-[var(--text-primary)]">{bb.mid?.toFixed(2) ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Lower</span><span className="tabular-nums text-[var(--positive)]">{bb.lower?.toFixed(2) ?? '—'}</span></div>
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">%B</span>
            <span className="tabular-nums text-[var(--text-primary)]">
              {bb.upper != null && bb.lower != null && bb.upper !== bb.lower
                ? `${((lastClose - bb.lower) / (bb.upper - bb.lower) * 100).toFixed(0)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Support / Resistance */}
      {(swings.supports.length > 0 || swings.resistances.length > 0) && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Key Levels — pivot highs &amp; lows (6-month)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-mono text-[var(--negative)] uppercase mb-1">Resistance</div>
              {swings.resistances.length > 0
                ? swings.resistances.slice().reverse().map((r, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-mono tabular-nums py-0.5">
                      <span className="text-[var(--text-tertiary)]">R{i + 1}</span>
                      <span className={r > lastClose ? 'text-[var(--negative)]' : 'text-[var(--text-secondary)] line-through'}>{r.toFixed(2)}</span>
                    </div>
                  ))
                : <div className="text-[10px] font-mono text-[var(--text-tertiary)]">None found</div>
              }
            </div>
            <div>
              <div className="text-[9px] font-mono text-[var(--positive)] uppercase mb-1">Support</div>
              {swings.supports.length > 0
                ? swings.supports.slice().reverse().map((s, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-mono tabular-nums py-0.5">
                      <span className="text-[var(--text-tertiary)]">S{i + 1}</span>
                      <span className={s < lastClose ? 'text-[var(--positive)]' : 'text-[var(--text-secondary)] line-through'}>{s.toFixed(2)}</span>
                    </div>
                  ))
                : <div className="text-[10px] font-mono text-[var(--text-tertiary)]">None found</div>
              }
            </div>
          </div>
        </div>
      )}

      {/* MACD chart */}
      {macdData.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              MACD (12, 26, 9) — last 60 bars
            </div>
            <div className="text-[10px] font-mono flex gap-3">
              <span>MACD <span className="text-[var(--accent)]">{macdData[macdData.length - 1]?.macd.toFixed(3)}</span></span>
              <span>Signal <span className="text-[#f5a623]">{macdData[macdData.length - 1]?.signal.toFixed(3)}</span></span>
              <span>Hist <span className={(macdData[macdData.length - 1]?.histogram ?? 0) >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
                {macdData[macdData.length - 1]?.histogram.toFixed(3)}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={macdData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis {...axisProps} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(4) : '—', 'Histogram'] as [string, string]} />
              <ReferenceLine y={0} stroke="var(--border-normal)" />
              <Bar dataKey="histogram" radius={1}>
                {macdData.map((d, i) => (
                  <Cell key={i} fill={d.histogram >= 0 ? 'var(--positive)' : 'var(--negative)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={macdData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? v.toFixed(4) : '—', String(name)] as [string, string]} />
              <ReferenceLine y={0} stroke="var(--border-normal)" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="macd"   stroke="var(--accent)" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f5a623"       strokeWidth={1.5} dot={false} name="Signal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
