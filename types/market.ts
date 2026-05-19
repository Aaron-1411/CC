export interface Quote {
  ticker: string;
  yfSymbol: string;
  price: number;
  priceGBP: number;
  currency: string;
  changePercent: number;
  change: number;
  changeGBP: number;
  volume: number;
  marketCap: number | null;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  previousClose: number;
  open: number;
  bid: number | null;
  ask: number | null;
  lastUpdated: string;
  marketState: "REGULAR" | "PRE" | "POST" | "CLOSED" | "PREPRE" | "POSTPOST";
  displayName: string | null;
  shortName: string | null;
}

export interface OHLCVBar {
  date: string; // ISO date string
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Adjusted close if available
  adjClose?: number;
}

export interface FundamentalData {
  ticker: string;
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  exchange: string | null;
  currency: string;
  isin: string | null;
  // Valuation
  peRatio: number | null;
  pbRatio: number | null;
  psRatio: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  // Profitability
  roe: number | null;
  roa: number | null;
  roic: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  // Growth
  revenueGrowthYoY: number | null;
  epsGrowthYoY: number | null;
  // Size
  marketCap: number | null;
  enterpriseValue: number | null;
  // Dividend
  dividendYield: number | null;
  payoutRatio: number | null;
  // Debt
  debtToEquity: number | null;
  currentRatio: number | null;
  // ETF specific
  ter: number | null;
  aum: number | null;
  inceptionDate: string | null;
  // Analyst
  analystRating: string | null;
  priceTarget: number | null;
  priceTargetHigh: number | null;
  priceTargetLow: number | null;
  numberOfAnalysts: number | null;
}

export interface ETFHolding {
  ticker: string;
  name: string;
  weight: number; // as decimal, e.g. 0.07 = 7%
  sector: string | null;
  country: string | null;
  assetClass: string | null;
  sharesHeld: number | null;
  marketValue: number | null;
}

export interface AnalystRating {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensusLabel: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  consensusScore: number; // 1-5 scale
}

export interface PriceTarget {
  analystName: string | null;
  analystCompany: string | null;
  priceTarget: number;
  adjPriceTarget: number | null;
  priceWhenPosted: number | null;
  publishedDate: string;
  newsURL: string | null;
  newsTitle: string | null;
}

export interface NewsItem {
  id: string;
  ticker: string | null;
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  publishedAt: number; // Unix timestamp
  sentiment: "bullish" | "bearish" | "neutral" | null;
  sentimentScore: number | null; // -1 to 1
  category: string | null;
  image: string | null;
  related: string[];
}

export interface MacroData {
  series: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  frequency: string;
}

export interface FXRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}
