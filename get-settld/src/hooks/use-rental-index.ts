// Pulls ONS IPHRP rental price index for a region.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeHistoricStats, type HpiPoint } from "@/lib/historicReturns";

export function useRentalIndex(region: string | null | undefined) {
  return useQuery({
    queryKey: ["rental-index", region?.toLowerCase() ?? null],
    enabled: !!region,
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        region: string; cached: boolean; series: HpiPoint[];
      }>("get-rental-index", { body: { region } });
      if (error) throw error;
      if (!data) throw new Error("No rental data");
      return { ...data, stats: computeHistoricStats(data.series) };
    },
  });
}
