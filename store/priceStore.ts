'use client';
import { create } from 'zustand';
import type { Quote } from '@/types/market';

interface PriceState {
  quotes: Record<string, Quote>;
  gbpUsd: number;
  lastUpdated: string | null;
  source: 'sse' | 'fetch' | null;
  connected: boolean;
  error: string | null;
  setQuotes: (quotes: Record<string, Quote>, gbpUsd: number, lastUpdated: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setSource: (source: 'sse' | 'fetch') => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  quotes: {},
  gbpUsd: 1.27,
  lastUpdated: null,
  source: null,
  connected: false,
  error: null,
  setQuotes: (quotes, gbpUsd, lastUpdated) =>
    set({ quotes, gbpUsd, lastUpdated, error: null }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  setSource: (source) => set({ source }),
}));
