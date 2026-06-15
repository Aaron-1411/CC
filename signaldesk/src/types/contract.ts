// SHARED CONTRACT — single source of truth.
// Every Pages Function and every React component imports from this file.
// Do not redefine these shapes anywhere else.

export type AssetClass = 'stock' | 'forex' | 'crypto';
export type Direction = 'long' | 'short';

export interface RawDiscordMessage {
  id: string; // Discord message id — primary key throughout
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  embeds: {
    title?: string;
    description?: string;
    fields?: { name: string; value: string }[];
  }[];
  attachments: { url: string; contentType?: string; filename: string }[];
  createdAt: string; // ISO 8601
}

export interface ParsedSignal {
  id: string; // = RawDiscordMessage.id
  symbol: string; // normalized, e.g. "BTCUSD", "EURUSD", "AAPL"
  assetClass: AssetClass;
  direction: Direction | null;
  entry: number | null;
  entryRange: [number, number] | null;
  stopLoss: number | null;
  takeProfit: number[]; // ordered targets, may be empty
  timeframe: string | null; // e.g. "intraday", "swing", "1h" — only if stated
  signalTime: string; // ISO, from message createdAt
  parseConfidence: number; // 0..1
  flags: string[]; // e.g. ["entry given as range", "no stop loss stated"]
  notes: string | null;
  rawMessageId: string;
  chartImageUrl: string | null; // first image attachment, if any
}

export interface UserTrade {
  id: string; // uuid
  signalId: string; // -> ParsedSignal.id
  direction: Direction;
  entryPrice: number;
  entryTime: string; // ISO
  exitPrice: number | null;
  exitTime: string | null;
  size: number | null;
  status: 'open' | 'closed';
  notes: string | null;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandleRequest {
  symbol: string;
  assetClass: AssetClass;
  interval: '1min' | '5min' | '15min' | '1h' | '4h' | '1day';
  from?: string; // ISO
  to?: string; // ISO
}

export interface JournalStats {
  totalSignals: number;
  tradesTaken: number;
  takeRate: number; // tradesTaken / totalSignals
  wins: number;
  losses: number;
  winRate: number;
  avgEntrySlippage: number; // my entry vs signal entry, signed
  avgTimingDelayMins: number; // my entryTime - signalTime
  myTotalR: number; // realized R using my entries/exits vs signal stop
  signalTotalR: number; // theoretical R if executed exactly at signal levels
}

// ---- API envelope types (server <-> client), still contract-governed ----

export interface SignalWithTrades {
  signal: ParsedSignal;
  raw: RawDiscordMessage;
  trades: UserTrade[];
}

export interface CandleResponse {
  candles: Candle[];
  provider: 'twelvedata' | 'binance' | 'none';
  error?: string;
  fallbackToImage?: boolean;
}

export interface SyncResult {
  fetched: number;
  added: number;
  skipped: number;
  source: 'discord' | 'demo' | 'disabled';
  error?: string;
}

// The raw JSON the model/heuristic returns before the server stamps
// id / signalTime / rawMessageId / chartImageUrl onto it.
export type ParsedSignalCore = Omit<
  ParsedSignal,
  'id' | 'signalTime' | 'rawMessageId' | 'chartImageUrl'
>;
