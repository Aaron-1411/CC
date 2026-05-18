// Tiny banner that surfaces today's live BoE base rate + a representative
// 5-yr fixed mortgage rate at the user's LTV. Pure presentation — the
// underlying numbers come from the BoE cache.
//
// Renders distinct loading and error states so users always know whether
// numbers are stale, fetching, or unavailable.
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useBoeRates } from "@/hooks/use-boe-rates";
import { useLiveMortgageRates, rateForLtv } from "@/hooks/use-live-mortgage-rates";

export default function LiveRateBanner({ ltv }: { ltv?: number }) {
  const boe = useBoeRates();
  const live = useLiveMortgageRates();

  if (boe.isLoading || live.isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Skeleton className="h-5 w-28" />
        {ltv != null && <Skeleton className="h-5 w-48" />}
      </div>
    );
  }

  if (boe.error || !boe.data?.latest) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Badge variant="outline" className="gap-1 text-destructive">
          <AlertCircle className="h-3 w-3" /> Live rates unavailable
        </Badge>
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={() => { boe.refetch(); live.refetch(); }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const base = boe.data.latest;
  const indicative = ltv != null ? rateForLtv(ltv, base) : null;
  const trend = boe.data.series.length >= 2
    ? boe.data.series.at(-1)!.rate - boe.data.series.at(-2)!.rate
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
      <Badge variant="outline" className="gap-1">
        {trend < 0 ? <TrendingDown className="h-3 w-3 text-success" /> : <TrendingUp className="h-3 w-3 text-warning" />}
        BoE base {base.toFixed(2)}%
      </Badge>
      {indicative != null && (
        <Badge variant="outline" className="gap-1">
          Indicative 5-yr fix at {ltv}% LTV ≈ {indicative.toFixed(2)}%
        </Badge>
      )}
      <span className="text-[10px]">Updated daily · Bank of England + market spreads</span>
    </div>
  );
}
