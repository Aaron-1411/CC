// Bundled demo data. Used by the API client (src/lib/api.ts) whenever the
// Pages Functions backend is unreachable — e.g. plain `vite dev`, or a deploy
// where D1/secrets are not yet configured. Lets the whole UI be explored with
// zero backend. Everything here is shaped by the contract, never ad-hoc.

import type {
  Candle,
  ParsedSignal,
  RawDiscordMessage,
  SignalWithTrades,
  UserTrade,
} from '../types/contract';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

function raw(
  id: string,
  authorName: string,
  content: string,
  createdAt: string,
  image?: string,
): RawDiscordMessage {
  return {
    id,
    channelId: 'demo-channel',
    authorId: 'demo-author',
    authorName,
    content,
    embeds: [],
    attachments: image
      ? [{ url: image, contentType: 'image/png', filename: 'chart.png' }]
      : [],
    createdAt,
  };
}

const signals: ParsedSignal[] = [
  {
    id: 'demo-1',
    symbol: 'BTCUSD',
    assetClass: 'crypto',
    direction: 'long',
    entry: 64200,
    entryRange: null,
    stopLoss: 62800,
    takeProfit: [65800, 67500, 70000],
    timeframe: 'swing',
    signalTime: hoursAgo(30),
    parseConfidence: 0.93,
    flags: [],
    notes: 'Reclaim of range high, looking for continuation.',
    rawMessageId: 'demo-1',
    chartImageUrl: null,
  },
  {
    id: 'demo-2',
    symbol: 'EURUSD',
    assetClass: 'forex',
    direction: 'short',
    entry: null,
    entryRange: [1.0875, 1.089],
    stopLoss: 1.0925,
    takeProfit: [1.082, 1.0775],
    timeframe: 'intraday',
    signalTime: hoursAgo(20),
    parseConfidence: 0.81,
    flags: ['entry given as range'],
    notes: null,
    rawMessageId: 'demo-2',
    chartImageUrl: null,
  },
  {
    id: 'demo-3',
    symbol: 'AAPL',
    assetClass: 'stock',
    direction: 'long',
    entry: 212.5,
    entryRange: null,
    stopLoss: null,
    takeProfit: [218],
    timeframe: null,
    signalTime: hoursAgo(8),
    parseConfidence: 0.6,
    flags: ['no stop loss stated'],
    notes: 'Breakout watch above 212.',
    rawMessageId: 'demo-3',
    chartImageUrl: null,
  },
  {
    id: 'demo-4',
    symbol: 'ETHUSD',
    assetClass: 'crypto',
    direction: null,
    entry: null,
    entryRange: null,
    stopLoss: null,
    takeProfit: [],
    timeframe: null,
    signalTime: hoursAgo(2),
    parseConfidence: 0.25,
    flags: ['direction unclear', 'no levels stated'],
    notes: 'Keeping an eye on ETH here, will update.',
    rawMessageId: 'demo-4',
    chartImageUrl: null,
  },
];

const rawById: Record<string, RawDiscordMessage> = {
  'demo-1': raw('demo-1', 'AlphaCaller', 'BTC long 64.2k, SL 62.8k, targets 65.8 / 67.5 / 70k. Swing.', hoursAgo(30)),
  'demo-2': raw('demo-2', 'AlphaCaller', 'EURUSD short 1.0875-1.0890, stop 1.0925, tp 1.0820 then 1.0775. Intraday.', hoursAgo(20)),
  'demo-3': raw('demo-3', 'AlphaCaller', 'Watching AAPL breakout above 212.50, target 218.', hoursAgo(8)),
  'demo-4': raw('demo-4', 'AlphaCaller', 'Keeping an eye on ETH here, will update.', hoursAgo(2)),
};

const trades: UserTrade[] = [
  {
    id: 'demo-trade-1',
    signalId: 'demo-1',
    direction: 'long',
    entryPrice: 64350,
    entryTime: hoursAgo(29.5),
    exitPrice: 67500,
    exitTime: hoursAgo(4),
    size: 0.25,
    status: 'closed',
    notes: 'Took target 2, trailed the rest.',
  },
  {
    id: 'demo-trade-2',
    signalId: 'demo-2',
    direction: 'short',
    entryPrice: 1.0882,
    entryTime: hoursAgo(19),
    exitPrice: null,
    exitTime: null,
    size: 10000,
    status: 'open',
    notes: null,
  },
];

export function demoSignals(): SignalWithTrades[] {
  return signals.map((signal) => ({
    signal,
    raw: rawById[signal.id],
    trades: trades.filter((t) => t.signalId === signal.id),
  }));
}

export function demoSignal(id: string): SignalWithTrades | null {
  const signal = signals.find((s) => s.id === id);
  if (!signal) return null;
  return {
    signal,
    raw: rawById[signal.id],
    trades: trades.filter((t) => t.signalId === signal.id),
  };
}

// Deterministic pseudo-random candle series around an anchor price so the
// chart renders something plausible without a live data provider.
export function demoCandles(symbol: string, anchor: number, count = 120): Candle[] {
  let seed = 0;
  for (const ch of symbol) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const step = 3600; // 1h candles
  const startTime = Math.floor(now / 1000) - count * step;
  const out: Candle[] = [];
  let price = anchor * 0.97;
  const vol = anchor * 0.004;

  for (let i = 0; i < count; i++) {
    const drift = (anchor - price) * 0.02;
    const open = price;
    const change = drift + (rand() - 0.5) * vol * 2;
    const close = Math.max(open + change, anchor * 0.5);
    const high = Math.max(open, close) + rand() * vol;
    const low = Math.min(open, close) - rand() * vol;
    out.push({
      time: startTime + i * step,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
    });
    price = close;
  }
  return out;
}

function round(n: number): number {
  if (n >= 1000) return Math.round(n * 100) / 100;
  if (n >= 1) return Math.round(n * 100) / 100;
  return Math.round(n * 100000) / 100000;
}

// Anchor prices for the demo symbols (used when the real provider is absent).
export const DEMO_ANCHORS: Record<string, number> = {
  BTCUSD: 65000,
  ETHUSD: 3200,
  EURUSD: 1.086,
  AAPL: 213,
};
