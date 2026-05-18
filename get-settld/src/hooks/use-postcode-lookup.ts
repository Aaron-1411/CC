// Resolves a UK postcode to its admin area (LAD), region, and coordinates
// via the lookup-postcode Edge Function (Postcodes.io + 30-day Postgres cache).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PostcodeInfo {
  postcode: string;
  outcode: string;
  area: string;
  lad: string;          // Local Authority District, e.g. "Westminster"
  region: string;       // e.g. "London", "South East"
  country: string;      // "England" | "Scotland" | "Wales" | "Northern Ireland"
  latitude: number;
  longitude: number;
  cached: boolean;
}

export function usePostcodeLookup(postcode: string | null) {
  return useQuery<PostcodeInfo>({
    queryKey: ["postcode-lookup", postcode?.toUpperCase().trim()],
    enabled: !!postcode && /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode ?? ""),
    staleTime: 1000 * 60 * 60 * 24, // 1 day client cache
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<PostcodeInfo>(
        "lookup-postcode",
        { body: { postcode } },
      );
      if (error) throw error;
      if (!data || (data as { error?: string }).error) {
        throw new Error((data as { error?: string })?.error ?? "Lookup failed");
      }
      return data;
    },
  });
}
