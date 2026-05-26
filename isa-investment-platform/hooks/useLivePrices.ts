'use client';
import { useEffect, useRef, useCallback } from 'react';
import { usePriceStore } from '@/store/priceStore';
import { usePortfolioStore } from '@/store/portfolioStore';

const MAX_BACKOFF = 30_000;

export function useLivePrices() {
  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(1_000);
  const mountedRef = useRef(true);

  const setQuotes = usePriceStore((s) => s.setQuotes);
  const setConnected = usePriceStore((s) => s.setConnected);
  const setError = usePriceStore((s) => s.setError);
  const setSource = usePriceStore((s) => s.setSource);
  const applyQuotes = usePortfolioStore((s) => s.applyQuotes);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const es = new EventSource('/api/stream/prices');
    esRef.current = es;

    es.onopen = () => {
      backoffRef.current = 1_000;
      setConnected(true);
      setSource('sse');
      setError(null);
    };

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as {
          quotes?: Record<string, unknown>;
          gbpUsd?: number;
          lastUpdated?: string;
          error?: boolean;
        };
        if (data.error) {
          setError('Price stream error');
          return;
        }
        if (data.quotes && data.lastUpdated) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const quotes = data.quotes as any;
          const gbpUsd = data.gbpUsd ?? 1.27;
          setQuotes(quotes, gbpUsd, data.lastUpdated);
          applyQuotes(quotes, gbpUsd);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);
      if (!mountedRef.current) return;
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF);
      setTimeout(connect, delay);
    };
  }, [setQuotes, setConnected, setError, setSource, applyQuotes]);

  useEffect(() => {
    mountedRef.current = true;

    const handleVisibility = () => {
      if (document.hidden) {
        esRef.current?.close();
        esRef.current = null;
        setConnected(false);
      } else {
        // Tab became visible — reconnect if not already connected
        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    connect();

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      esRef.current?.close();
      setConnected(false);
    };
  }, [connect, setConnected]);
}
