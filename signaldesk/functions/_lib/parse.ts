// Signal parsing. Two layers:
//   1. Anthropic Messages API (model claude-haiku-4-5-20251001) when
//      ANTHROPIC_API_KEY is set — best structured extraction.
//   2. A regex heuristic that always runs, used as the fallback and to fill
//      fields the model leaves null (chart image, asset-class sanity).
// Either layer alone yields a valid ParsedSignal; the heuristic guarantees the
// app parses with zero backend keys.

import type {
  AssetClass,
  Direction,
  ParsedSignal,
  ParsedSignalCore,
  RawDiscordMessage,
} from '../../src/types/contract';
import type { Env } from './http';

// Currency codes used to recognise a 6-letter forex pair like EURUSD.
const FIAT = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'CNH', 'SGD', 'HKD',
]);
// Common crypto bases — presence implies the crypto asset class.
const CRYPTO = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'BNB', 'AVAX', 'MATIC', 'LINK',
  'DOT', 'LTC', 'BCH', 'ATOM', 'ARB', 'OP', 'APT', 'SUI', 'PEPE', 'SHIB',
  'TON', 'TRX', 'NEAR', 'INJ', 'SEI', 'TIA', 'XLM', 'FIL', 'ETC', 'UNI',
]);

// Flatten a Discord message (content + embeds) into one searchable string.
export function messageText(raw: RawDiscordMessage): string {
  const parts = [raw.content];
  for (const e of raw.embeds) {
    if (e.title) parts.push(e.title);
    if (e.description) parts.push(e.description);
    for (const f of e.fields ?? []) parts.push(`${f.name}: ${f.value}`);
  }
  return parts.filter(Boolean).join('\n');
}

function firstImage(raw: RawDiscordMessage): string | null {
  const hit = raw.attachments.find(
    (a) => a.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(a.filename),
  );
  return hit?.url ?? null;
}

// "66k" -> 66000, "1.2m" -> 1200000, "64,800" -> 64800.
function toNum(s: string): number | null {
  const m = s.trim().replace(/,/g, '').match(/^(\d*\.?\d+)\s*([km])?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  if (m[2]?.toLowerCase() === 'k') n *= 1_000;
  if (m[2]?.toLowerCase() === 'm') n *= 1_000_000;
  return n;
}

function classify(symbol: string): AssetClass {
  const s = symbol.toUpperCase();
  if (CRYPTO.has(s) || s.endsWith('USDT') || /^(BTC|ETH|SOL|XRP|DOGE)/.test(s)) return 'crypto';
  if (s.length === 6 && FIAT.has(s.slice(0, 3)) && FIAT.has(s.slice(3))) return 'forex';
  // A bare crypto base + fiat quote (e.g. BTCUSD) is still crypto.
  const base3 = s.slice(0, 3);
  if (s.length >= 6 && CRYPTO.has(base3)) return 'crypto';
  return 'stock';
}

function findSymbol(text: string): string | null {
  // $TICKER (stocks) first — most explicit.
  const cash = text.match(/\$([A-Za-z]{1,6})\b/);
  if (cash) return cash[1].toUpperCase();
  // Explicit pair like BTC/USDT, EUR/USD, BTCUSDT, EURUSD.
  const pair = text.match(/\b([A-Za-z]{3,5})[\/\- ]?(USDT|USD|EUR|GBP|JPY|BTC|ETH)\b/i);
  if (pair) return (pair[1] + pair[2]).toUpperCase();
  // A known crypto base mentioned alone.
  for (const c of CRYPTO) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) return c;
  }
  // Last resort: a 6-letter forex pair.
  const fx = text.match(/\b([A-Z]{6})\b/);
  if (fx && FIAT.has(fx[1].slice(0, 3)) && FIAT.has(fx[1].slice(3))) return fx[1];
  return null;
}

function findDirection(text: string): Direction | null {
  if (/\b(long|buy|bull(?:ish)?|bought)\b/i.test(text)) return 'long';
  if (/\b(short|sell|bear(?:ish)?|sold)\b/i.test(text)) return 'short';
  return null;
}

// Grab the first number following any of the given keywords.
function afterKeyword(text: string, keywords: string[]): number | null {
  const kw = keywords.join('|');
  const re = new RegExp(`(?:${kw})\\s*[:=@]?\\s*(\\$?\\d[\\d,]*\\.?\\d*\\s*[km]?)`, 'i');
  const m = text.match(re);
  return m ? toNum(m[1].replace(/\$/g, '')) : null;
}

function findEntry(text: string): { entry: number | null; range: [number, number] | null } {
  // Range: "entry 100-105" / "entry 100 to 105".
  const rangeRe =
    /(?:entry|enter|buy|long|short)\s*(?:zone|area)?\s*[:=@]?\s*(\$?\d[\d,]*\.?\d*\s*[km]?)\s*(?:-|–|to|\/)\s*(\$?\d[\d,]*\.?\d*\s*[km]?)/i;
  const r = text.match(rangeRe);
  if (r) {
    const a = toNum(r[1].replace(/\$/g, ''));
    const b = toNum(r[2].replace(/\$/g, ''));
    if (a != null && b != null) return { entry: null, range: [Math.min(a, b), Math.max(a, b)] };
  }
  const single = afterKeyword(text, ['entry', 'enter', 'buy', 'long', 'short', '@']);
  return { entry: single, range: null };
}

function findTargets(text: string): number[] {
  const out: number[] = [];
  // "targets 110 / 120 / 130" or "tp1 110 tp2 120".
  const block = text.match(
    /(?:tps?|targets?|take[\s-]?profits?|t\/p)\s*\d*\s*[:=]?\s*([\d,\.\skm\/\-–]+)/i,
  );
  if (block) {
    for (const piece of block[1].split(/[\/,\-–\s]+/)) {
      const n = toNum(piece);
      if (n != null) out.push(n);
    }
  }
  // Also catch repeated "tp1: x  tp2: y".
  const each = text.matchAll(/(?:tp|target|t\/p)\s*\d*\s*[:=@]?\s*(\d[\d,]*\.?\d*\s*[km]?)/gi);
  for (const m of each) {
    const n = toNum(m[1]);
    if (n != null && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 6);
}

export function heuristicParse(raw: RawDiscordMessage): ParsedSignalCore {
  const text = messageText(raw);
  const symbol = findSymbol(text);
  const direction = findDirection(text);
  const { entry, range } = findEntry(text);
  const stopLoss = afterKeyword(text, ['stop', 'sl', 'stop[\\s-]?loss', 'stoploss']);
  const takeProfit = findTargets(text);
  const tfMatch = text.match(/\b(scalp|intraday|day\s?trade|swing|position|\d+\s?(?:m|h|d|min|hour|day))\b/i);

  const flags: string[] = [];
  if (!symbol) flags.push('symbol not detected');
  if (!direction) flags.push('direction not stated');
  if (entry == null && !range) flags.push('no entry stated');
  if (range) flags.push('entry given as range');
  if (stopLoss == null) flags.push('no stop loss stated');
  if (takeProfit.length === 0) flags.push('no targets stated');

  let confidence = 0.3;
  if (symbol) confidence += 0.15;
  if (direction) confidence += 0.15;
  if (entry != null || range) confidence += 0.15;
  if (stopLoss != null) confidence += 0.1;
  if (takeProfit.length > 0) confidence += 0.1;
  confidence = Math.min(confidence, 0.9);

  return {
    symbol: symbol ?? 'UNKNOWN',
    assetClass: symbol ? classify(symbol) : 'crypto',
    direction,
    entry,
    entryRange: range,
    stopLoss,
    takeProfit,
    timeframe: tfMatch ? tfMatch[1].toLowerCase() : null,
    parseConfidence: confidence,
    flags,
    notes: text.length > 400 ? text.slice(0, 400) + '…' : text || null,
  };
}

const SYSTEM_PROMPT = `You extract structured trade signals from freeform trading-chat messages.
Return ONLY a JSON object (no prose, no code fences) with exactly these keys:
{
  "symbol": string,                 // normalized ticker, e.g. "BTCUSD", "EURUSD", "AAPL"; "UNKNOWN" if none
  "assetClass": "stock"|"forex"|"crypto",
  "direction": "long"|"short"|null,
  "entry": number|null,             // single entry price
  "entryRange": [number, number]|null,
  "stopLoss": number|null,
  "takeProfit": number[],           // ordered targets, [] if none
  "timeframe": string|null,         // only if explicitly stated (e.g. "swing", "1h")
  "parseConfidence": number,        // 0..1, your confidence
  "flags": string[],                // human notes, e.g. "no stop loss stated"
  "notes": string|null              // brief context, <= 280 chars
}
Numbers must be plain numbers (resolve "66k" -> 66000). Never invent values that are not present.`;

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}

async function parseWithModel(text: string, env: Env): Promise<ParsedSignalCore | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.slice(0, 4000) }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AnthropicResponse;
    const raw = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const jsonText = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start < 0 || end < 0) return null;
    const obj = JSON.parse(jsonText.slice(start, end + 1)) as Partial<ParsedSignalCore>;
    return sanitize(obj);
  } catch {
    return null;
  }
}

// Coerce a model object into a valid ParsedSignalCore. Anything missing or the
// wrong type is dropped rather than trusted.
function sanitize(o: Partial<ParsedSignalCore>): ParsedSignalCore {
  const numOrNull = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const assetClass: AssetClass =
    o.assetClass === 'stock' || o.assetClass === 'forex' || o.assetClass === 'crypto'
      ? o.assetClass
      : 'crypto';
  const direction: Direction | null =
    o.direction === 'long' || o.direction === 'short' ? o.direction : null;
  const range = Array.isArray(o.entryRange) && o.entryRange.length === 2
    ? ([numOrNull(o.entryRange[0]), numOrNull(o.entryRange[1])] as [number | null, number | null])
    : null;
  const entryRange =
    range && range[0] != null && range[1] != null ? ([range[0], range[1]] as [number, number]) : null;
  return {
    symbol: typeof o.symbol === 'string' && o.symbol.trim() ? o.symbol.trim().toUpperCase() : 'UNKNOWN',
    assetClass,
    direction,
    entry: numOrNull(o.entry),
    entryRange,
    stopLoss: numOrNull(o.stopLoss),
    takeProfit: Array.isArray(o.takeProfit)
      ? o.takeProfit.map(numOrNull).filter((n): n is number => n != null)
      : [],
    timeframe: typeof o.timeframe === 'string' && o.timeframe.trim() ? o.timeframe.trim() : null,
    parseConfidence:
      typeof o.parseConfidence === 'number' && Number.isFinite(o.parseConfidence)
        ? Math.max(0, Math.min(1, o.parseConfidence))
        : 0.5,
    flags: Array.isArray(o.flags) ? o.flags.filter((f): f is string => typeof f === 'string') : [],
    notes: typeof o.notes === 'string' ? o.notes.slice(0, 400) : null,
  };
}

function stamp(core: ParsedSignalCore, raw: RawDiscordMessage): ParsedSignal {
  return {
    ...core,
    id: raw.id,
    signalTime: raw.createdAt,
    rawMessageId: raw.id,
    chartImageUrl: firstImage(raw),
  };
}

// Parse a raw message into a stamped ParsedSignal. Tries the model, falls back
// to the heuristic, and back-fills the model's nulls from the heuristic so we
// keep as much signal as possible.
export async function parseSignal(raw: RawDiscordMessage, env: Env): Promise<ParsedSignal> {
  const text = messageText(raw);
  const heuristic = heuristicParse(raw);
  const model = await parseWithModel(text, env);
  if (!model) return stamp(heuristic, raw);

  const merged: ParsedSignalCore = {
    ...model,
    symbol: model.symbol !== 'UNKNOWN' ? model.symbol : heuristic.symbol,
    direction: model.direction ?? heuristic.direction,
    entry: model.entry ?? heuristic.entry,
    entryRange: model.entryRange ?? heuristic.entryRange,
    stopLoss: model.stopLoss ?? heuristic.stopLoss,
    takeProfit: model.takeProfit.length ? model.takeProfit : heuristic.takeProfit,
    timeframe: model.timeframe ?? heuristic.timeframe,
  };
  return stamp(merged, raw);
}

// Build a RawDiscordMessage for a manual paste (no Discord round-trip).
export function pastedRaw(content: string): RawDiscordMessage {
  const id = `pasted-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    channelId: 'manual',
    authorId: 'manual',
    authorName: 'Manual paste',
    content,
    embeds: [],
    attachments: [],
    createdAt: new Date().toISOString(),
  };
}
