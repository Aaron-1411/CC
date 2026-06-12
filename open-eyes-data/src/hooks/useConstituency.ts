import { useState, useEffect, useCallback } from "react";
import type { PostcodeResult, MPData } from "@/routes/api/postcode";
import { pfaToForceId } from "@/lib/uk-geo";

const STORAGE_KEY = "transparenC_constituency_v1";

/** postcodes.io response shape (subset we use). */
type PostcodesIOResult = {
  result: {
    postcode: string;
    parliamentary_constituency_2024: string;
    pfa: string;
    admin_district: string;
    region: string;
  };
};

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
    } catch {
      /* corrupted — ignore */
    }
  }, []);

  const lookup = useCallback(async (postcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const clean = postcode.replace(/\s+/g, "").toUpperCase();

      // 1. Browser → postcodes.io DIRECTLY. The postcode never touches our servers (D8).
      const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
        signal: AbortSignal.timeout(8_000),
      });
      if (!pcRes.ok) {
        if (pcRes.status === 404) throw new Error("Postcode not found");
        throw new Error(`postcodes.io: HTTP ${pcRes.status}`);
      }
      const pc = (await pcRes.json()) as PostcodesIOResult;
      const r = pc.result;
      const constituency = r.parliamentary_constituency_2024 ?? "";

      // 2. Enrich with the sitting MP by CONSTITUENCY NAME (no postcode sent).
      let mp: MPData | null = null;
      if (constituency) {
        try {
          const mpRes = await fetch(
            `/api/constituency-mp?constituency=${encodeURIComponent(constituency)}`,
          );
          if (mpRes.ok) {
            const mpJson = (await mpRes.json()) as { data: MPData | null };
            mp = mpJson.data;
          }
        } catch {
          /* MP enrichment is best-effort */
        }
      }

      const result: PostcodeResult = {
        postcode: r.postcode,
        constituency,
        policeForceId: pfaToForceId(r.pfa ?? ""),
        localAuthority: r.admin_district ?? "",
        region: r.region ?? "",
        mp,
      };
      const state: ConstituencyState = { ...result, storedAt: new Date().toISOString() };
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
