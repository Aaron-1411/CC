// Returns nearby public-transport stops AND named rail/tube/tram stations
// (with operator/line tags) for a lat/lng using OpenStreetMap Overpass.
// Free, no key. Cached 30 days.
//
// v2 payload adds:
//   stations: Array<{ name, kind, distanceM, walkMin, lines: string[], operator?: string }>
//   nearestStationM: number | null
//   nearestStationWalkMin: number | null
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const TTL_MS = 1000 * 60 * 60 * 24 * 30;
const OVERPASS = "https://overpass-api.de/api/interpreter";
const CACHE_VERSION = "v3";

type StationKind = "rail" | "tube" | "tram";
interface Station {
  name: string;
  kind: StationKind;
  distanceM: number;
  walkMin: number;
  lines: string[];
  operator?: string;
  lat: number;
  lng: number;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function splitLines(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[;|,]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isFinite(lat) || !isFinite(lng)) return json({ error: "lat/lng required" }, 400);

    const key = `${CACHE_VERSION}:${lat.toFixed(3)},${lng.toFixed(3)}`;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: cached } = await supabase
      .from("transport_cache").select("data, fetched_at").eq("geo_key", key).maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ cached: true, ...(cached.data as object) });
    }

    const busR = 800;
    const stationR = 2000; // wider radius so we can list nearest stations even for non-urban areas
    const q = `[out:json][timeout:25];
(
  node(around:${busR},${lat},${lng})[highway=bus_stop];
  node(around:${stationR},${lat},${lng})[railway=station];
  node(around:${stationR},${lat},${lng})[railway=halt];
  node(around:${stationR},${lat},${lng})[railway=tram_stop];
  node(around:${stationR},${lat},${lng})[station=subway];
  node(around:${stationR},${lat},${lng})[public_transport=station];
);
out tags center;`;

    const resp = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Lovable-FTB-Toolkit/1.0" },
      body: new URLSearchParams({ data: q }).toString(),
    });
    if (!resp.ok) return json({ error: `Overpass ${resp.status}` }, 502);
    const j = await resp.json() as {
      elements: Array<{ lat?: number; lon?: number; tags?: Record<string,string> }>
    };
    const els = j.elements ?? [];

    let bus = 0;
    const stationMap = new Map<string, Station>(); // dedupe by name+kind
    for (const e of els) {
      const t = e.tags ?? {};
      if (t.highway === "bus_stop") { bus++; continue; }
      if (e.lat == null || e.lon == null) continue;
      const distanceM = Math.round(haversine(lat, lng, e.lat, e.lon));
      if (distanceM > stationR) continue;
      let kind: StationKind | null = null;
      if (t.station === "subway" || /tube|underground/i.test(t.network ?? "")) kind = "tube";
      else if (t.railway === "tram_stop") kind = "tram";
      else if (t.railway === "station" || t.railway === "halt" || t.public_transport === "station") kind = "rail";
      if (!kind) continue;
      const name = t.name ?? t["name:en"] ?? "Unnamed station";
      const lines = [
        ...splitLines(t.line),
        ...splitLines(t.route_ref),
        ...splitLines(t.network),
      ];
      const dedupedLines = Array.from(new Set(lines));
      const dedupeKey = `${name.toLowerCase()}|${kind}`;
      const existing = stationMap.get(dedupeKey);
      if (!existing || existing.distanceM > distanceM) {
        stationMap.set(dedupeKey, {
          name,
          kind,
          distanceM,
          walkMin: Math.max(1, Math.round(distanceM / 80)),
          lines: dedupedLines,
          operator: t.operator,
          lat: e.lat,
          lng: e.lon,
        });
      } else if (dedupedLines.length) {
        // merge lines from duplicate node
        existing.lines = Array.from(new Set([...existing.lines, ...dedupedLines]));
      }
    }

    const stations = Array.from(stationMap.values()).sort((a, b) => a.distanceM - b.distanceM).slice(0, 8);
    const rail = stations.filter((s) => s.kind === "rail").length;
    const tube = stations.filter((s) => s.kind === "tube").length;
    const tram = stations.filter((s) => s.kind === "tram").length;
    const total = bus + rail + tube + tram;

    // Score blends node mix AND distance to nearest heavy-rail/tube — closer = higher.
    const weighted = bus + rail * 3 + tube * 4 + tram * 2;
    const nearestRapid = stations.find((s) => s.kind === "rail" || s.kind === "tube");
    const proximityBoost = nearestRapid
      ? Math.max(0, 30 - Math.round(nearestRapid.distanceM / 60)) // <= 1.8km adds up to +30
      : 0;
    const score = Math.max(0, Math.min(100, Math.round(15 + weighted * 4 + proximityBoost)));

    const payload = {
      bus, rail, tube, tram, total, score,
      radiusM: stationR,
      stations,
      nearestStationM: stations[0]?.distanceM ?? null,
      nearestStationWalkMin: stations[0]?.walkMin ?? null,
    };
    await supabase.from("transport_cache").upsert({
      geo_key: key, data: payload, fetched_at: new Date().toISOString(),
    });
    return json({ cached: false, ...payload });
  } catch (e) {
    console.error("get-transport", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
