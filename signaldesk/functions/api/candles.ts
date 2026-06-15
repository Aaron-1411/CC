// GET /api/candles?symbol&assetClass&interval[&from&to] -> CandleResponse.
//
// Provider routing (NEVER Finnhub for candles — it 403s on the free tier):
//   crypto        -> Binance keyless /api/v3/klines
//   stock | forex -> Twelve Data /time_series (needs TWELVEDATA_API_KEY)
// Results are cached in D1 (candle_cache) for 60s to stay well under rate
// limits. When a provider is unavailable we return provider:'none' with
// fallbackToImage:true so the client shows the signal's chart screenshot.
import { type Env, error, json } from '../_lib/http';
import { getCachedCandles, putCachedCandles } from '../_lib/db';
import type { AssetClass, Candle, CandleResponse } from '../../src/types/contract';

const CACHE_TTL_SEC = 60;
const OUTPUT_SIZE = 300;

type Interval = '1min' | '5min' | '15min' | '1h' | '4h' | '1day';
const INTERVALS = new Set<Interval>(['1min', '5min', '15min', '1h', '4h', '1day']);

// contract interval -> Binance kline interval.
const BINANCE_INTERVAL: Record<Interval, string> = {
  '1min': '1m',
  '5min': '5m',
  '15min': '15m',
  '1h': '1h',
  '4h': '4h',
  '1day': '1d',
};

// Normalise a crypto symbol to a Binance spot pair (quote in USDT).
function binanceSymbol(symbol: string): string {
  let s = symbol.toUpperCase().replace(/[\/\-\s]/g, '');
  if (s.endsWith('USDT')) return s;
  if (s.endsWith('USD')) return s.slice(0, -3) + 'USDT';
  if (/(BTC|ETH|EUR|GBP)$/.test(s)) return s; // already quoted in a Binance base
  return s + 'USDT';
}

// Twelve Data wants forex as BASE/QUOTE; stocks pass through unchanged.
function twelveDataSymbol(symbol: string, assetClass: AssetClass): string {
  const s = symbol.toUpperCase().replace(/[\/\-\s]/g, '');
  if (assetClass === 'forex' && s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`;
  return s;
}

async function fetchBinance(symbol: string, interval: Interval): Promise<Candle[]> {
  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.set('symbol', binanceSymbol(symbol));
  url.searchParams.set('interval', BINANCE_INTERVAL[interval]);
  url.searchParams.set('limit', String(OUTPUT_SIZE));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`binance ${res.status}`);
  const rows = (await res.json()) as unknown[][];
  return rows.map((r) => ({
    time: Math.floor(Number(r[0]) / 1000),
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
  }));
}

interface TwelveDataResponse {
  status?: string;
  message?: string;
  values?: { datetime: string; open: string; high: string; low: string; close: string }[];
}

async function fetchTwelveData(
  symbol: string,
  assetClass: AssetClass,
  interval: Interval,
  apiKey: string,
): Promise<Candle[]> {
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', twelveDataSymbol(symbol, assetClass));
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', String(OUTPUT_SIZE));
  url.searchParams.set('timezone', 'UTC');
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`twelvedata ${res.status}`);
  const data = (await res.json()) as TwelveDataResponse;
  if (data.status === 'error' || !data.values) {
    throw new Error(data.message || 'twelvedata error');
  }
  // Twelve Data returns newest-first; charts want oldest-first.
  return data.values
    .map((v) => ({
      time: Math.floor(Date.parse(v.datetime.replace(' ', 'T') + 'Z') / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }))
    .filter((c) => Number.isFinite(c.time))
    .sort((a, b) => a.time - b.time);
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') ?? '').trim();
  const assetClass = url.searchParams.get('assetClass') as AssetClass | null;
  const interval = (url.searchParams.get('interval') ?? '1h') as Interval;

  if (!symbol) return error('symbol is required.');
  if (assetClass !== 'stock' && assetClass !== 'forex' && assetClass !== 'crypto') {
    return error('assetClass must be stock, forex, or crypto.');
  }
  if (!INTERVALS.has(interval)) return error('Unsupported interval.');

  const cacheKey = `${assetClass}:${symbol.toUpperCase()}:${interval}`;

  // Cache lookups need D1; when DB is unbound we simply skip the cache.
  if (env.DB) {
    const cached = await getCachedCandles(env.DB, cacheKey, CACHE_TTL_SEC);
    if (cached) return new Response(cached, {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  let body: CandleResponse;
  try {
    if (assetClass === 'crypto') {
      body = { candles: await fetchBinance(symbol, interval), provider: 'binance' };
    } else {
      if (!env.TWELVEDATA_API_KEY) {
        const noKey: CandleResponse = {
          candles: [],
          provider: 'none',
          error: 'Charting not configured (set TWELVEDATA_API_KEY for stocks/forex).',
          fallbackToImage: true,
        };
        return json(noKey);
      }
      body = {
        candles: await fetchTwelveData(symbol, assetClass, interval, env.TWELVEDATA_API_KEY),
        provider: 'twelvedata',
      };
    }
  } catch (e) {
    const failed: CandleResponse = {
      candles: [],
      provider: 'none',
      error: e instanceof Error ? e.message : 'Candle fetch failed.',
      fallbackToImage: true,
    };
    return json(failed);
  }

  if (env.DB && body.candles.length > 0) {
    await putCachedCandles(env.DB, cacheKey, JSON.stringify(body));
  }
  return json(body);
};
