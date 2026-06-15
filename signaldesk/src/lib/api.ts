// Typed API client. Single boundary between the React app and the Pages
// Functions backend. Every call is contract-typed.
//
// Demo fallback: under plain `vite dev` (or any deploy where the backend is
// unreachable / returns non-JSON), each method falls back to bundled demo data
// so the entire UI is explorable with zero backend. `isDemoMode` exposes which
// state we last saw so the UI can show an honest "demo data" banner.

import type {
  CandleRequest,
  CandleResponse,
  JournalStats,
  SignalWithTrades,
  SyncResult,
  UserTrade,
} from '../types/contract';
import { DEMO_ANCHORS, demoCandles, demoSignal, demoSignals } from './demo';
import { computeStats } from './stats';

const APP_KEY_STORAGE = 'signaldesk_app_key';

let lastWasDemo = false;
export function isDemoMode(): boolean {
  return lastWasDemo;
}

export function getAppKey(): string {
  try {
    return localStorage.getItem(APP_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setAppKey(key: string): void {
  try {
    if (key) localStorage.setItem(APP_KEY_STORAGE, key);
    else localStorage.removeItem(APP_KEY_STORAGE);
  } catch {
    /* ignore storage failures */
  }
}

class BackendUnavailable extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getAppKey();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (key) headers['x-app-key'] = key;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new BackendUnavailable('network');
  }

  if (res.status === 401) {
    // No app key stored → treat a closed/unconfigured gate as "backend absent"
    // so a zero-config production deploy still renders the full demo UI (with
    // the honest "demo data" badge) instead of a 401 wall. If a key IS stored,
    // surface the auth error so the access-key flow can react to a bad key.
    if (!key) throw new BackendUnavailable('gate-closed');
    throw new Error('Unauthorized — set your access key.');
  }

  // A running Vite dev server returns index.html (200, text/html) for unknown
  // routes; treat any non-JSON response as "backend not present".
  const ctype = res.headers.get('content-type') ?? '';
  if (!ctype.includes('application/json')) {
    throw new BackendUnavailable('non-json');
  }
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

// Run a backend call, falling back to a demo value when the backend is absent.
async function withDemo<T>(real: () => Promise<T>, demo: () => T): Promise<T> {
  try {
    const out = await real();
    lastWasDemo = false;
    return out;
  } catch (err) {
    if (err instanceof BackendUnavailable) {
      lastWasDemo = true;
      return demo();
    }
    throw err;
  }
}

// ---- demo-mode mutable trade store (so the journal reflects logged trades) ---
let demoStore: SignalWithTrades[] | null = null;
function demoState(): SignalWithTrades[] {
  if (!demoStore) demoStore = demoSignals();
  return demoStore;
}

// ---- public API ----

export const api = {
  listSignals(): Promise<SignalWithTrades[]> {
    return withDemo(
      () => call<SignalWithTrades[]>('/signals'),
      () => demoState(),
    );
  },

  getSignal(id: string): Promise<SignalWithTrades | null> {
    return withDemo(
      () => call<SignalWithTrades>(`/signals/${encodeURIComponent(id)}`),
      () => demoState().find((s) => s.signal.id === id) ?? demoSignal(id),
    );
  },

  sync(): Promise<SyncResult> {
    return withDemo(
      () => call<SyncResult>('/discord/sync', { method: 'POST' }),
      () => ({ fetched: 0, added: 0, skipped: 0, source: 'demo' as const }),
    );
  },

  parsePasted(content: string): Promise<SignalWithTrades> {
    return withDemo(
      () => call<SignalWithTrades>('/parse', { method: 'POST', body: JSON.stringify({ content }) }),
      () => {
        // Local demo: wrap the pasted text as a low-confidence signal.
        const id = `pasted-${Date.now()}`;
        const item: SignalWithTrades = {
          signal: {
            id,
            symbol: 'UNKNOWN',
            assetClass: 'crypto',
            direction: null,
            entry: null,
            entryRange: null,
            stopLoss: null,
            takeProfit: [],
            timeframe: null,
            signalTime: new Date().toISOString(),
            parseConfidence: 0,
            flags: ['demo mode — paste not parsed without backend'],
            notes: content.slice(0, 280),
            rawMessageId: id,
            chartImageUrl: null,
          },
          raw: {
            id,
            channelId: 'manual',
            authorId: 'manual',
            authorName: 'Manual paste',
            content,
            embeds: [],
            attachments: [],
            createdAt: new Date().toISOString(),
          },
          trades: [],
        };
        demoState().unshift(item);
        return item;
      },
    );
  },

  getCandles(req: CandleRequest): Promise<CandleResponse> {
    const params = new URLSearchParams({
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
    });
    if (req.from) params.set('from', req.from);
    if (req.to) params.set('to', req.to);
    return withDemo<CandleResponse>(
      () => call<CandleResponse>(`/candles?${params.toString()}`),
      () => ({
        candles: demoCandles(req.symbol, DEMO_ANCHORS[req.symbol] ?? 100),
        provider: 'none',
      }),
    );
  },

  saveTrade(trade: UserTrade): Promise<UserTrade> {
    return withDemo(
      () => call<UserTrade>('/trades', { method: 'POST', body: JSON.stringify(trade) }),
      () => {
        const item = demoState().find((s) => s.signal.id === trade.signalId);
        if (item) {
          const idx = item.trades.findIndex((t) => t.id === trade.id);
          if (idx >= 0) item.trades[idx] = trade;
          else item.trades.push(trade);
        }
        return trade;
      },
    );
  },

  deleteTrade(id: string, signalId: string): Promise<{ ok: true }> {
    return withDemo(
      () => call<{ ok: true }>(`/trades/${encodeURIComponent(id)}`, { method: 'DELETE' }),
      () => {
        const item = demoState().find((s) => s.signal.id === signalId);
        if (item) item.trades = item.trades.filter((t) => t.id !== id);
        return { ok: true } as const;
      },
    );
  },

  getJournal(): Promise<JournalStats> {
    return withDemo(
      () => call<JournalStats>('/journal'),
      () =>
        computeStats(
          demoState().map((s) => ({ signal: s.signal, trades: s.trades })),
        ),
    );
  },
};
