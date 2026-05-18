// Live crime stats for a lat/lng (data.police.uk via edge function).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CrimeData {
  perYear: number;
  byCategory: Record<string, number>;
  score: number;
  cached: boolean;
}

export function useCrime(lat: number | null | undefined, lng: number | null | undefined) {
  return useQuery<CrimeData>({
    queryKey: ["crime", lat, lng],
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 60 * 12,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<CrimeData>(
        "get-crime", { body: { lat, lng } },
      );
      if (error) throw error;
      if (!data) throw new Error("No crime data");
      return data;
    },
  });
}
