import { useState, useEffect, useCallback } from "react";
import type { PostcodeResult } from "@/routes/api/postcode";

const STORAGE_KEY = "transparenC_constituency_v1";

export type ConstituencyState = PostcodeResult & {
  storedAt: string;
};

export function useConstituency() {
  const [data, setData] = useState<ConstituencyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConstituencyState;
        setData(parsed);
      }
    } catch { /* corrupted — ignore */ }
  }, []);

  const lookup = useCallback(async (postcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/postcode?postcode=${encodeURIComponent(postcode.trim())}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { data: PostcodeResult };
      const state: ConstituencyState = { ...j.data, storedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setData(state);
      return state;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, lookup, clear };
}
