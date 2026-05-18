// Real door-to-door times via TfL Unified Journey Planner.
// Public, keyless at low volume. Returns minutes per available mode
// (transit/cycle/walk). Drive remains client-side heuristic.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TFL_BASE = "https://api.tfl.gov.uk/Journey/JourneyResults";
const TIMEOUT_MS = 6_000;

type Mode = "transit" | "cycle" | "walk";
const TFL_MODE: Record<Mode, string | undefined> = {
  transit: undefined, // default = all transit
  cycle: "cycle",
  walk: "walking",
};

function isLatLng(s: string) {
  return /^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(s);
}

async function callTfl(from: string, to: string, mode: Mode): Promise<number | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams();
    const m = TFL_MODE[mode];
    if (m) params.set("mode", m);
    params.set("alternativeWalking", "false");
    const url = `${TFL_BASE}/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}?${params}`;
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const journeys = Array.isArray(data?.journeys) ? data.journeys : [];
    const minutes: number[] = journeys
      .map((j: { duration?: unknown }) => Number(j?.duration))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    if (!minutes.length) return null;
    return Math.min(...minutes);
  } catch {
    clearTimeout(t);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const from = String(body?.from ?? "");
    const to = String(body?.to ?? "");
    if (!isLatLng(from) || !isLatLng(to)) {
      return json({ error: "from/to must be 'lat,lng'" }, 400);
    }
    const [transit, cycle, walk] = await Promise.all([
      callTfl(from, to, "transit"),
      callTfl(from, to, "cycle"),
      callTfl(from, to, "walk"),
    ]);
    return json({ transit, cycle, walk, source: "tfl" });
  } catch (e) {
    console.error("tfl-journey error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
