// Pulls Bank of England base-rate history.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BoeRatePoint { date: string; rate: number }

export function useBoeRates() {
  return useQuery({
    queryKey: ["boe-rates"],
    staleTime: 1000 * 60 * 60 * 12,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        cached: boolean; series: BoeRatePoint[];
      }>("get-boe-rates", { body: {} });
      if (error) throw error;
      if (!data) throw new Error("No BoE data");
      const latest = data.series[data.series.length - 1]?.rate ?? null;
      const min = Math.min(...data.series.map((p) => p.rate));
      const max = Math.max(...data.series.map((p) => p.rate));
      return { ...data, latest, min, max };
    },
  });
}
