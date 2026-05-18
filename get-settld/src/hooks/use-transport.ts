// Nearby public-transport summary for a lat/lng (OSM Overpass via edge fn).
// Returns named stations (rail/tube/tram) with distances, walk times and lines.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StationKind = "rail" | "tube" | "tram";

export interface NearbyStation {
  name: string;
  kind: StationKind;
  distanceM: number;
  walkMin: number;
  lines: string[];
  operator?: string;
  lat?: number;
  lng?: number;
}

export interface TransportData {
  bus: number;
  rail: number;
  tube: number;
  tram: number;
  total: number;
  score: number;
  radiusM: number;
  stations: NearbyStation[];
  nearestStationM: number | null;
  nearestStationWalkMin: number | null;
  cached: boolean;
}

export function useTransport(lat: number | null | undefined, lng: number | null | undefined) {
  return useQuery<TransportData>({
    queryKey: ["transport", lat, lng],
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TransportData>(
        "get-transport", { body: { lat, lng } },
      );
      if (error) throw error;
      if (!data) throw new Error("No transport data");
      return { stations: [], nearestStationM: null, nearestStationWalkMin: null, ...data };
    },
  });
}
