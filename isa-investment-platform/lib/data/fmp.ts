/**
 * Financial Modeling Prep client — SERVER ONLY
 */
import type { ETFHolding, FundamentalData, AnalystRating, PriceTarget } from "@/types/market";

const BASE = "https://financialmodelingprep.com/api";

function getApiKey(): string {
  return process.env.FMP_API_KEY ?? "";
}

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({ ...params, apikey: apiKey });
  return `${BASE}${path}?${searchParams.toString()}`;
}

async function fmpFetch<T>(path: string, params: Record<string, string> = {}, ttl: number = 3600): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = buildUrl(path, params);
  try {
    const res = await fetch(url, { next: { revalidate: ttl } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface RawFMPProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchangeShortName: string;
  currency: string;
  isin: string;
  mktCap: number;
  beta: number;
  lastDiv: number;
  dcfDiff: number;
  dcf: number;
}

interface RawFMPKeyMetrics {
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  roe: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe_detail: number;
  capexPerShare: number;
}

interface RawFMPIncomeStatement {
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  grossProfitRatio: number;
  operatingIncomeRatio: number;
  netIncomeRatio: number;
  ebitda: number;
  ebitdaratio: number;
  researchAndDevelopmentExpenses: number;
  date: string;
  period: string;
}

interface RawETFHolder {
  asset: string;
  name: string;
  weightPercentage: string;
  sharesNumber: number;
  marketValue: number;
}

interface RawAnalystRating {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface RawPriceTarget {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  analystName: string;
  priceTarget: number;
  adjPriceTarget: number;
  priceWhenPosted: number;
  newsPublisher: string;
  newsBaseURL: string;
  analystCompany: string;
}

export async function fetchProfile(symbol: string): Promise<Partial<FundamentalData> | null> {
  const data = await fmpFetch<RawFMPProfile[]>(`/v3/profile/${symbol}`, {}, 86400);
  if (!data || !data[0]) return null;
  const p = data[0];
  return {
    ticker: p.symbol,
    name: p.companyName,
    description: p.description || null,
    sector: p.sector || null,
    industry: p.industry || null,
    country: p.country || null,
    exchange: p.exchangeShortName || null,
    currency: p.currency,
    isin: p.isin || null,
    marketCap: p.mktCap || null,
    dividendYield: p.lastDiv || null,
  };
}

export async function fetchKeyMetrics(symbol: string): Promise<Partial<FundamentalData> | null> {
  const data = await fmpFetch<RawFMPKeyMetrics[]>(`/v3/key-metrics/${symbol}`, { limit: "1" }, 86400);
  if (!data || !data[0]) return null;
  const m = data[0];
  return {
    peRatio: m.peRatio || null,
    pbRatio: m.pbRatio || null,
    psRatio: m.priceToSalesRatio || null,
    evEbitda: m.enterpriseValueOverEBITDA || null,
    evRevenue: m.evToSales || null,
    roe: m.roe || null,
    roa: m.returnOnTangibleAssets || null,
    roic: m.roic || null,
    debtToEquity: m.debtToEquity || null,
    currentRatio: m.currentRatio || null,
    dividendYield: m.dividendYield || null,
    payoutRatio: m.payoutRatio || null,
    enterpriseValue: m.enterpriseValue || null,
    marketCap: m.marketCap || null,
  };
}

export async function fetchIncomeStatement(
  symbol: string
): Promise<RawFMPIncomeStatement[] | null> {
  return fmpFetch<RawFMPIncomeStatement[]>(
    `/v3/income-statement/${symbol}`,
    { limit: "4" },
    86400
  );
}

export async function fetchETFHolders(symbol: string): Promise<ETFHolding[]> {
  const data = await fmpFetch<RawETFHolder[]>(`/v3/etf-holder/${symbol}`, {}, 86400);
  if (!data || !Array.isArray(data)) return [];

  return data.slice(0, 20).map((h) => ({
    ticker: h.asset,
    name: h.name,
    weight: parseFloat(h.weightPercentage) / 100,
    sector: null,
    country: null,
    assetClass: null,
    sharesHeld: h.sharesNumber || null,
    marketValue: h.marketValue || null,
  }));
}

export async function fetchAnalystRatings(symbol: string): Promise<AnalystRating[]> {
  const data = await fmpFetch<RawAnalystRating[]>(
    `/v3/analyst-stock-recommendations/${symbol}`,
    { limit: "3" },
    86400
  );
  if (!data || !Array.isArray(data)) return [];

  return data.map((r) => {
    const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
    const score = total > 0
      ? (r.strongBuy * 5 + r.buy * 4 + r.hold * 3 + r.sell * 2 + r.strongSell * 1) / total
      : 3;

    let consensusLabel: AnalystRating["consensusLabel"] = "Hold";
    if (score >= 4.5) consensusLabel = "Strong Buy";
    else if (score >= 3.5) consensusLabel = "Buy";
    else if (score >= 2.5) consensusLabel = "Hold";
    else if (score >= 1.5) consensusLabel = "Sell";
    else consensusLabel = "Strong Sell";

    return {
      period: r.period,
      strongBuy: r.strongBuy,
      buy: r.buy,
      hold: r.hold,
      sell: r.sell,
      strongSell: r.strongSell,
      consensusLabel,
      consensusScore: score,
    };
  });
}

export async function fetchPriceTargets(symbol: string): Promise<PriceTarget[]> {
  const data = await fmpFetch<RawPriceTarget[]>(
    `/v4/price-target`,
    { symbol, limit: "10" },
    86400
  );
  if (!data || !Array.isArray(data)) return [];

  return data.map((pt) => ({
    analystName: pt.analystName || null,
    analystCompany: pt.analystCompany || null,
    priceTarget: pt.priceTarget,
    adjPriceTarget: pt.adjPriceTarget || null,
    priceWhenPosted: pt.priceWhenPosted || null,
    publishedDate: pt.publishedDate,
    newsURL: pt.newsURL || null,
    newsTitle: pt.newsTitle || null,
  }));
}

export async function fetchFullFundamentals(symbol: string): Promise<FundamentalData | null> {
  const [profile, metrics] = await Promise.allSettled([
    fetchProfile(symbol),
    fetchKeyMetrics(symbol),
  ]);

  const p = profile.status === "fulfilled" ? profile.value : null;
  const m = metrics.status === "fulfilled" ? metrics.value : null;

  if (!p && !m) return null;

  return {
    ticker: symbol,
    name: p?.name ?? symbol,
    description: p?.description ?? null,
    sector: p?.sector ?? null,
    industry: p?.industry ?? null,
    country: p?.country ?? null,
    exchange: p?.exchange ?? null,
    currency: p?.currency ?? "USD",
    isin: p?.isin ?? null,
    peRatio: m?.peRatio ?? null,
    pbRatio: m?.pbRatio ?? null,
    psRatio: m?.psRatio ?? null,
    evEbitda: m?.evEbitda ?? null,
    evRevenue: m?.evRevenue ?? null,
    roe: m?.roe ?? null,
    roa: m?.roa ?? null,
    roic: m?.roic ?? null,
    grossMargin: null,
    operatingMargin: null,
    netMargin: null,
    revenueGrowthYoY: null,
    epsGrowthYoY: null,
    marketCap: m?.marketCap ?? p?.marketCap ?? null,
    enterpriseValue: m?.enterpriseValue ?? null,
    dividendYield: m?.dividendYield ?? p?.dividendYield ?? null,
    payoutRatio: m?.payoutRatio ?? null,
    debtToEquity: m?.debtToEquity ?? null,
    currentRatio: m?.currentRatio ?? null,
    ter: null,
    aum: null,
    inceptionDate: null,
    analystRating: null,
    priceTarget: null,
    priceTargetHigh: null,
    priceTargetLow: null,
    numberOfAnalysts: null,
  };
}
