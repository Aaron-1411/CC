// Live mortgage rate estimator: takes the latest BoE base rate and applies
// industry-typical spreads per LTV band to produce a representative 5-year
// fixed APR. This is a transparent proxy — not a regulated quote.
//
// Spreads sourced from MoneyFacts Average 2-yr / 5-yr fixed snapshot,
// reviewed when the BoE rate moves materially.
import { useQuery } from "@tanstack/react-query";
import { useBoeRates } from "./use-boe-rates";

// Approximate spread over base rate (percentage points) for 5-year fixes.
const SPREADS: { ltv: number; spread: number }[] = [
  { ltv: 60, spread: 0.5 },
  { ltv: 75, spread: 0.7 },
  { ltv: 80, spread: 0.9 },
  { ltv: 85, spread: 1.1 },
  { ltv: 90, spread: 1.4 },
  { ltv: 95, spread: 1.9 },
];

export interface LiveRate {
  ltv: number;
  rate: number; // percentage e.g. 5.25
  spread: number;
}

export function useLiveMortgageRates() {
  const boe = useBoeRates();
  return useQuery({
    queryKey: ["live-mortgage-rates", boe.data?.latest],
    enabled: boe.isSuccess && boe.data?.latest != null,
    staleTime: 1000 * 60 * 60 * 12,
    queryFn: () => {
      const base = boe.data!.latest!;
      const rates: LiveRate[] = SPREADS.map((s) => ({
        ltv: s.ltv,
        spread: s.spread,
        rate: Number((base + s.spread).toFixed(2)),
      }));
      return { base, rates, asOf: new Date().toISOString() };
    },
  });
}

/** Quick lookup helper for any LTV %, interpolating between bands. */
export function rateForLtv(ltv: number, base: number): number {
  if (ltv <= SPREADS[0].ltv) return Number((base + SPREADS[0].spread).toFixed(2));
  if (ltv >= SPREADS[SPREADS.length - 1].ltv) {
    return Number((base + SPREADS[SPREADS.length - 1].spread).toFixed(2));
  }
  for (let i = 0; i < SPREADS.length - 1; i++) {
    const a = SPREADS[i]; const b = SPREADS[i + 1];
    if (ltv >= a.ltv && ltv <= b.ltv) {
      const t = (ltv - a.ltv) / (b.ltv - a.ltv);
      const spread = a.spread + (b.spread - a.spread) * t;
      return Number((base + spread).toFixed(2));
    }
  }
  return Number((base + 1).toFixed(2));
}
