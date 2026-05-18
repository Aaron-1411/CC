import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FloodWarning { severity: string; severityLevel: number; description: string }
export interface FloodRisk {
  lat: number; lng: number;
  warnings: FloodWarning[];
  light: "green" | "amber" | "red";
  headline: string;
}

export function useFloodRisk(postcode?: string) {
  return useQuery({
    queryKey: ["flood-risk", postcode],
    enabled: !!postcode && postcode.trim().length >= 2,
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<FloodRisk & { error?: string }>(
        "get-flood-risk",
        { body: { postcode } },
      );
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No flood data");
      if (data.error) throw new Error(data.error);
      return data;
    },
  });
}

export interface School {
  name: string; phase: string; ofsted: string; distanceKm: number | null; urn: number | null;
}
export interface SchoolsResult { schools: School[]; headline: string; radiusKm: number }

export function useSchools(postcode?: string, radiusKm = 2) {
  return useQuery({
    queryKey: ["schools", postcode, radiusKm],
    enabled: !!postcode && postcode.trim().length >= 2,
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SchoolsResult & { error?: string }>(
        "get-schools",
        { body: { postcode, radiusKm } },
      );
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No schools data");
      if (data.error) throw new Error(data.error);
      return data;
    },
  });
}
