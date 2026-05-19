import { NextResponse } from "next/server";
import { fetchNewsWithSentiment } from "@/lib/data/finnhub";
import { newsCache } from "@/lib/cache";
import { TICKER_TO_YF, fetchYahooNews } from "@/lib/data/yahoo";
import { HOLDINGS_DEFINITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const h = HOLDINGS_DEFINITION.find(x => x.ticker === ticker);
  const yfSymbol = h?.yfSymbol ?? TICKER_TO_YF[ticker] ?? ticker;
  const cacheKey = `news-${yfSymbol}`;

  const cached = newsCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Use Finnhub if key is present, otherwise fall back to Yahoo Finance (no key needed)
  if (process.env.FINNHUB_API_KEY) {
    const today = new Date();
    const fromDate = new Date(today.getTime() - 30 * 24 * 3600 * 1000);
    const toStr = today.toISOString().slice(0, 10);
    const fromStr = fromDate.toISOString().slice(0, 10);

    try {
      const result = await fetchNewsWithSentiment(yfSymbol, fromStr, toStr);
      newsCache.set(cacheKey, result, 300_000);
      return NextResponse.json(result);
    } catch (err) {
      console.error(`Finnhub news fetch error for ${ticker}:`, err);
      // fall through to Yahoo fallback
    }
  }

  // Yahoo Finance fallback — free, no key required
  try {
    const news = await fetchYahooNews(yfSymbol, 25);

    // Classify sentiment with Anthropic if key is available
    let sentiment = null;
    if (process.env.ANTHROPIC_API_KEY && news.length > 0) {
      try {
        sentiment = await classifyNewsWithAnthropic(ticker, news.slice(0, 10).map(n => n.headline));
      } catch (e) {
        console.warn("Anthropic sentiment classification failed:", e);
      }
    }

    const result = { news, sentiment };
    newsCache.set(cacheKey, result, 300_000);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`Yahoo news fetch error for ${ticker}:`, err);
    return NextResponse.json({ news: [], sentiment: null }, { status: 500 });
  }
}

async function classifyNewsWithAnthropic(
  ticker: string,
  headlines: string[]
): Promise<{ overallSentiment: "bullish" | "bearish" | "neutral"; bullishPercent: number; bearishPercent: number; neutralPercent: number; articlesAnalyzed: number } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const prompt = `You are a financial news sentiment classifier. Classify each headline as bullish, bearish, or neutral for ${ticker} stock specifically.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Respond with a JSON object only, no explanation:
{"classifications": ["bullish"|"bearish"|"neutral", ...], "overallSentiment": "bullish"|"bearish"|"neutral"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json() as { content?: { type: string; text: string }[] };
  const text = data.content?.find(b => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as { classifications?: string[]; overallSentiment?: string };
  const classifications = parsed.classifications ?? [];
  const bullish = classifications.filter(c => c === "bullish").length;
  const bearish = classifications.filter(c => c === "bearish").length;
  const neutral = classifications.filter(c => c === "neutral").length;
  const total = classifications.length || 1;

  return {
    overallSentiment: (parsed.overallSentiment ?? "neutral") as "bullish" | "bearish" | "neutral",
    bullishPercent: bullish / total,
    bearishPercent: bearish / total,
    neutralPercent: neutral / total,
    articlesAnalyzed: classifications.length,
  };
}
