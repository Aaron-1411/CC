// Resolve a UK outcode (e.g. "TW9") to lat/lng via postcodes.io.
// No edge function needed — public endpoint, cached client-side.
import { useQuery } from "@tanstack/react-query";

export interface OutcodeInfo {
  outcode: string;
  latitude: number;
  longitude: number;
  adminDistrict: string[];
  adminWard: string[];
}

export function useOutcode(outcode: string | null | undefined) {
  const oc = outcode?.toUpperCase().trim() ?? "";
  return useQuery<OutcodeInfo>({
    queryKey: ["outcode", oc],
    enabled: !!oc && /^[A-Z]{1,2}\d[A-Z\d]?$/.test(oc),
    staleTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
    queryFn: async () => {
      const r = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(oc)}`);
      if (!r.ok) throw new Error("Outcode lookup failed");
      const j = await r.json();
      const res = j?.result;
      if (!res) throw new Error("No result");
      return {
        outcode: res.outcode,
        latitude: res.latitude,
        longitude: res.longitude,
        adminDistrict: res.admin_district ?? [],
        adminWard: res.admin_ward ?? [],
      };
    },
  });
}
