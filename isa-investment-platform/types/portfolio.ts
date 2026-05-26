export type HoldingType = "ETF" | "Stock";
export type TradeType = "BUY" | "SELL" | "DIVIDEND" | "SPLIT";
export type AlertType = "PRICE_ABOVE" | "PRICE_BELOW" | "CHANGE_PCT_ABOVE" | "CHANGE_PCT_BELOW" | "DRAWDOWN_BELOW";

export interface HoldingDefinition {
  ticker: string;
  yfSymbol: string;
  name: string;
  type: HoldingType;
  nativeCcy: string;
  isin: string | null;
  ter: number | null;
  exchange: string | null;
}

export interface Position {
  ticker: string;
  yfSymbol: string;
  name: string;
  type: HoldingType;
  nativeCcy: string;
  isin: string | null;
  ter: number | null;
  exchange: string | null;
  // Current values
  units: number | null;
  avgCostGBP: number | null;
  currentPriceGBP: number;
  currentPriceNative: number;
  valueGBP: number;
  weight: number; // 0–1
  // P&L
  unrealisedGBP: number | null;
  unrealisedPct: number | null;
  // Daily
  dailyChangeGBP: number;
  dailyChangePct: number;
  // Rank by value
  rank: number;
  // Chart color
  color: string;
}

export interface Trade {
  id: number;
  holdingId: number;
  ticker: string;
  type: TradeType;
  date: string; // ISO string
  units: number;
  priceGBP: number;
  totalGBP: number;
  fees: number;
  notes: string | null;
  createdAt: string;
}

export interface PositionSnapshotItem {
  ticker: string;
  valueGBP: number;
  units: number | null;
  priceGBP: number;
  dailyReturnPct: number;
  weight: number;
}

export interface Snapshot {
  date: string;
  totalValueGBP: number;
  gbpUsd: number;
  positions: PositionSnapshotItem[];
}

export interface PortfolioState {
  positions: Position[];
  totalValueGBP: number;
  gbpUsd: number;
  totalDailyChangeGBP: number;
  totalDailyChangePct: number;
  isaAllowanceUsedGBP: number;
  isaYearAllowanceGBP: number;
  lastUpdated: string;
}

export interface IsaAllowanceState {
  taxYear: string;
  allowanceGBP: number;
  usedGBP: number;
  remainingGBP: number;
  usedPct: number;
}

export interface Alert {
  id: number;
  holdingId: number;
  ticker: string;
  holdingName: string;
  type: AlertType;
  threshold: number;
  active: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export interface JournalNote {
  id: number;
  holdingId: number | null;
  ticker: string | null;
  content: string;
  date: string;
}

export interface RebalanceTarget {
  ticker: string;
  targetWeight: number;
  currentWeight: number;
  currentValueGBP: number;
  targetValueGBP: number;
  tradeAmountGBP: number; // positive = buy, negative = sell
  tradeUnits: number | null;
}
