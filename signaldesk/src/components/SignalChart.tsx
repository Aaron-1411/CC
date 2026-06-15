import { useEffect, useRef, useState } from 'react';
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import type { CandleResponse, ParsedSignal } from '../types/contract';
import { api } from '../lib/api';
import { fmtPrice } from '../lib/format';

const INTERVALS = ['5min', '15min', '1h', '4h', '1day'] as const;
type Interval = (typeof INTERVALS)[number];

interface Props {
  signal: ParsedSignal;
}

export default function SignalChart({ signal }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [interval, setInterval] = useState<Interval>('1h');
  const [resp, setResp] = useState<CandleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Build the chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#11161f' },
        textColor: '#8a97ab',
        fontFamily: 'ui-monospace, monospace',
      },
      grid: {
        vertLines: { color: '#1b2433' },
        horzLines: { color: '#1b2433' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#222b3a' },
      timeScale: { borderColor: '#222b3a', timeVisible: true, secondsVisible: false },
      height: 360,
      autoSize: false,
      width: el.clientWidth,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#16c784',
      downColor: '#ea3943',
      borderUpColor: '#16c784',
      borderDownColor: '#ea3943',
      wickUpColor: '#16c784',
      wickDownColor: '#ea3943',
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) chart.applyOptions({ width: Math.floor(w) });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Fetch candles whenever symbol/interval changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCandles({ symbol: signal.symbol, assetClass: signal.assetClass, interval })
      .then((r) => {
        if (cancelled) return;
        setResp(r);
        if (r.fallbackToImage && signal.chartImageUrl) setShowImage(true);
      })
      .catch(() => {
        if (!cancelled) setResp({ candles: [], provider: 'none', error: 'Failed to load candles' });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [signal.symbol, signal.assetClass, interval]);

  // Push candle data + level overlays to the series.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || !resp) return;

    const data: CandlestickData[] = resp.candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);

    // Clear then re-add price lines for the signal levels.
    // (lightweight-charts has no "clear all"; track and remove individually.)
    const lines: ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>[] = [];
    const addLine = (price: number, color: string, title: string, dashed = false) => {
      lines.push(
        series.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title,
        }),
      );
    };

    if (signal.entry != null) addLine(signal.entry, '#4c8dff', 'Entry');
    if (signal.entryRange) {
      addLine(signal.entryRange[0], '#4c8dff', 'Entry lo', true);
      addLine(signal.entryRange[1], '#4c8dff', 'Entry hi', true);
    }
    if (signal.stopLoss != null) addLine(signal.stopLoss, '#ea3943', 'Stop');
    signal.takeProfit.forEach((tp, i) => addLine(tp, '#16c784', `T${i + 1}`));

    chart.timeScale().fitContent();

    return () => {
      for (const l of lines) series.removePriceLine(l);
    };
  }, [resp, signal]);

  const hasImage = !!signal.chartImageUrl;
  const noCandles = resp != null && resp.candles.length === 0;

  return (
    <div className="panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{signal.symbol}</span>
          {resp && (
            <span className="pill bg-panel2 text-muted">
              {resp.provider === 'none' ? 'demo/none' : resp.provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`px-2 py-1 rounded text-xs border ${
                interval === iv ? 'border-accent text-white' : 'border-edge text-muted'
              }`}
            >
              {iv}
            </button>
          ))}
          {hasImage && (
            <button
              onClick={() => setShowImage((v) => !v)}
              className={`px-2 py-1 rounded text-xs border ${
                showImage ? 'border-accent text-white' : 'border-edge text-muted'
              }`}
            >
              image
            </button>
          )}
        </div>
      </div>

      {showImage && hasImage ? (
        <img
          src={signal.chartImageUrl!}
          alt={`Chart for ${signal.symbol}`}
          className="w-full rounded-md border border-edge"
        />
      ) : (
        <div className="relative">
          <div ref={containerRef} className="w-full" style={{ height: 360 }} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
              loading candles…
            </div>
          )}
          {noCandles && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted text-sm gap-2 px-4">
              <p>{resp?.error || 'No candle data available for this symbol.'}</p>
              {hasImage && (
                <button className="btn btn-accent" onClick={() => setShowImage(true)}>
                  Show signal chart image
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Level legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
        {signal.entry != null && (
          <Legend color="#4c8dff" label={`Entry ${fmtPrice(signal.entry, signal.assetClass)}`} />
        )}
        {signal.entryRange && (
          <Legend
            color="#4c8dff"
            label={`Entry ${fmtPrice(signal.entryRange[0], signal.assetClass)}–${fmtPrice(
              signal.entryRange[1],
              signal.assetClass,
            )}`}
          />
        )}
        {signal.stopLoss != null && (
          <Legend color="#ea3943" label={`Stop ${fmtPrice(signal.stopLoss, signal.assetClass)}`} />
        )}
        {signal.takeProfit.map((tp, i) => (
          <Legend key={i} color="#16c784" label={`T${i + 1} ${fmtPrice(tp, signal.assetClass)}`} />
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted">
      <span className="inline-block w-3 h-0.5" style={{ background: color }} />
      {label}
    </span>
  );
}
