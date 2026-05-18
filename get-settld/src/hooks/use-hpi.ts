// Pulls HM Land Registry HPI monthly series for a Local Authority District
// and computes historic stats.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeHistoricStats, type HpiPoint } from "@/lib/historicReturns";

export function useHpi(lad: string | null | undefined) {
  return useQuery({
    queryKey: ["hpi", lad?.toLowerCase() ?? null],
    enabled: !!lad,
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        lad: string; cached: boolean; series: HpiPoint[];
      }>("get-hpi", { body: { lad } });
      if (error) throw error;
      if (!data) throw new Error("No HPI data");
      const stats = computeHistoricStats(data.series);
      return { ...data, stats };
    },
  });
}
