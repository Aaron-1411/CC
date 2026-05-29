import { NextResponse } from "next/server";
import { fetchCompanyNews, fetchMarketNews } from "@/lib/data/finnhub";
import { newsCache } from "@/lib/cache";
import { HOLDINGS_DEFINITION } from "@/lib/constants";
import { fetchYahooNews } from "@/lib/data/yahoo";
import type { NewsItem } from "@/types/market";


export async function GET() {
  const cacheKey = "all-news";
  const cached = newsCache.get(cacheKey) as NewsItem[] | undefined;
  if (cached) {
    return NextResponse.json({ news: cached });
  }

  // Finnhub path — preferred when key is set
  if (process.env.FINNHUB_API_KEY) {
    const today = new Date();
    const fromDate = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
    const toStr = today.toISOString().slice(0, 10);
    const fromStr = fromDate.toISOString().slice(0, 10);

    try {
      const allSymbols = HOLDINGS_DEFINITION.map((h) => h.yfSymbol);

      const [marketNews, ...holdingNewsResults] = await Promise.allSettled([
        fetchMarketNews("general"),
        ...allSymbols.map((sym) => fetchCompanyNews(sym, fromStr, toStr)),
      ]);

      const allNews: NewsItem[] = [];

      if (marketNews.status === "fulfilled") {
        allNews.push(...marketNews.value);
      }
      for (const result of holdingNewsResults) {
        if (result.status === "fulfilled") {
          allNews.push(...result.value);
        }
      }

      const seen = new Set<string>();
      const deduped = allNews
        .filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        })
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, 50);

      newsCache.set(cacheKey, deduped, 300_000);
      return NextResponse.json({ news: deduped });
    } catch (err) {
      console.error("Finnhub portfolio news error:", err);
      // fall through to Yahoo
    }
  }

  // Yahoo Finance fallback — no key required
  try {
    const results = await Promise.allSettled(
      HOLDINGS_DEFINITION.map((h) => fetchYahooNews(h.yfSymbol, 8))
    );

    const allNews: NewsItem[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        // Tag each item with the canonical ticker
        allNews.push(
          ...r.value.map((n) => ({
            ...n,
            ticker: HOLDINGS_DEFINITION[i].ticker,
          }))
        );
      }
    });

    // Deduplicate by headline (Yahoo sometimes returns the same story for multiple symbols)
    const seenHeadlines = new Set<string>();
    const seen = new Set<string>();
    const deduped = allNews
      .filter((n) => {
        if (seen.has(n.id) || seenHeadlines.has(n.headline)) return false;
        seen.add(n.id);
        seenHeadlines.add(n.headline);
        return true;
      })
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 50);

    newsCache.set(cacheKey, deduped, 300_000);
    return NextResponse.json({ news: deduped });
  } catch (err) {
    console.error("Yahoo portfolio news error:", err);
    return NextResponse.json({ news: [] }, { status: 500 });
  }
}
