/**
 * Finnhub client — SERVER ONLY
 */
import type { NewsItem } from "@/types/market";

const BASE = "https://finnhub.io/api/v1";

function getApiKey(): string {
  return process.env.FINNHUB_API_KEY ?? "";
}

function authUrl(path: string, params: Record<string, string> = {}): string {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({ ...params, token: apiKey });
  return `${BASE}${path}?${searchParams.toString()}`;
}

interface RawFinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface RawSentimentData {
  buzz: {
    articlesInLastWeek: number;
    buzz: number;
    weeklyAverage: number;
  };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
  symbol: string;
}

function classifySentiment(
  score: number
): "bullish" | "bearish" | "neutral" {
  if (score > 0.15) return "bullish";
  if (score < -0.15) return "bearish";
  return "neutral";
}

/**
 * Fetch company-specific news from Finnhub
 */
export async function fetchCompanyNews(
  symbol: string,
  fromDate: string,
  toDate: string
): Promise<NewsItem[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = authUrl("/company-news", {
    symbol,
    from: fromDate,
    to: toDate,
  });

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = (await res.json()) as RawFinnhubNews[];
  if (!Array.isArray(data)) return [];

  return data.slice(0, 20).map((item) => ({
    id: `finnhub-${item.id}`,
    ticker: symbol,
    headline: item.headline,
    summary: item.summary || null,
    source: item.source,
    url: item.url,
    publishedAt: item.datetime,
    sentiment: null,
    sentimentScore: null,
    category: item.category,
    image: item.image || null,
    related: item.related ? item.related.split(",").map((s) => s.trim()) : [],
  }));
}

/**
 * Fetch general market news from Finnhub
 */
export async function fetchMarketNews(
  category: string = "general"
): Promise<NewsItem[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = authUrl("/news", { category });

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = (await res.json()) as RawFinnhubNews[];
  if (!Array.isArray(data)) return [];

  return data.slice(0, 30).map((item) => ({
    id: `finnhub-${item.id}`,
    ticker: null,
    headline: item.headline,
    summary: item.summary || null,
    source: item.source,
    url: item.url,
    publishedAt: item.datetime,
    sentiment: null,
    sentimentScore: null,
    category: item.category,
    image: item.image || null,
    related: item.related ? item.related.split(",").map((s) => s.trim()) : [],
  }));
}

/**
 * Fetch news sentiment scores for a symbol
 */
export async function fetchNewsSentiment(symbol: string): Promise<{
  bullishPercent: number;
  bearishPercent: number;
  companyNewsScore: number;
  buzz: number;
} | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = authUrl("/news-sentiment", { symbol });

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as RawSentimentData;
  if (!data?.sentiment) return null;

  return {
    bullishPercent: data.sentiment.bullishPercent ?? 0,
    bearishPercent: data.sentiment.bearishPercent ?? 0,
    companyNewsScore: data.companyNewsScore ?? 0,
    buzz: data.buzz?.buzz ?? 0,
  };
}

/**
 * Fetch company news + sentiment in one call
 */
export async function fetchNewsWithSentiment(
  symbol: string,
  fromDate: string,
  toDate: string
): Promise<{
  news: NewsItem[];
  sentiment: {
    bullishPercent: number;
    bearishPercent: number;
    companyNewsScore: number;
    overallSentiment: "bullish" | "bearish" | "neutral";
  } | null;
}> {
  const [news, sentimentData] = await Promise.allSettled([
    fetchCompanyNews(symbol, fromDate, toDate),
    fetchNewsSentiment(symbol),
  ]);

  const newsItems = news.status === "fulfilled" ? news.value : [];
  const sentRaw = sentimentData.status === "fulfilled" ? sentimentData.value : null;

  // Annotate news items with sentiment if available
  const annotated = newsItems.map((item) => ({
    ...item,
    sentiment: sentRaw
      ? classifySentiment(sentRaw.companyNewsScore - 0.5)
      : null,
    sentimentScore: sentRaw
      ? sentRaw.companyNewsScore * 2 - 1 // normalize 0-1 → -1 to 1
      : null,
  }));

  const sentiment = sentRaw
    ? {
        bullishPercent: sentRaw.bullishPercent,
        bearishPercent: sentRaw.bearishPercent,
        companyNewsScore: sentRaw.companyNewsScore,
        overallSentiment: classifySentiment(sentRaw.companyNewsScore - 0.5),
      }
    : null;

  return { news: annotated, sentiment };
}
