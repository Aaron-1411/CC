// Fetches EPC certificates for a postcode via the get-epc edge function.
// Provides median floor area and the modal energy band so the verdict can
// (a) replace the user's sqft estimate with a real comp-derived figure and
// (b) flag energy efficiency in the lifestyle panel.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EpcCertificate {
  lmkKey: string;
  address: string;
  postcode: string;
  propertyType: string;
  builtForm: string;
  totalFloorAreaSqm: number;
  totalFloorAreaSqft: number;
  currentEnergyBand: string;
  potentialEnergyBand: string;
  currentEnergyEfficiency: number;
  potentialEnergyEfficiency: number;
  co2Current: number;
  inspectionDate: string;
  tenure: string;
}

export interface EpcResult {
  postcode: string;
  cached: boolean;
  count: number;
  certificates: EpcCertificate[];
  stats: {
    medianSqft: number | null;
    modeBand: string | null;
    sampleSize: number;
  };
}

export function useEpc(postcode: string | null) {
  return useQuery<EpcResult>({
    queryKey: ["epc", postcode?.toUpperCase()],
    enabled:
      !!postcode &&
      /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode ?? ""),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<EpcResult>(
        "get-epc",
        { body: { postcode } },
      );
      if (error) throw error;
      if (!data) throw new Error("No data from get-epc");
      return data;
    },
  });
}
