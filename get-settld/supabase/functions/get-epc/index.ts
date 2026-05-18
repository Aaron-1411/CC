// Fetches EPC certificates for a UK postcode from epc.opendatacommunities.org
// and caches the result for 30 days. Returns a list of certificates with
// floor area, current/potential efficiency, property type and address - the
// raw inputs we need to compute real £/sqft and energy bills.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const EPC_URL =
  "https://epc.opendatacommunities.org/api/v1/domestic/search";

interface EpcCert {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const raw = url.searchParams.get("postcode") ?? body.postcode ?? "";

    if (!raw || typeof raw !== "string") {
      return json({ error: "postcode required" }, 400);
    }

    const postcode = raw.trim().toUpperCase().replace(/\s+/g, " ");
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(postcode)) {
      return json({ error: "invalid postcode" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await supabase
      .from("epc_cache")
      .select("data, fetched_at")
      .eq("postcode", postcode)
      .maybeSingle();

    if (
      cached &&
      Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS
    ) {
      const arr = cached.data as EpcCert[];
      return json({
        postcode,
        cached: true,
        count: arr.length,
        certificates: arr,
        stats: summarise(arr),
      });
    }

    const email = Deno.env.get("EPC_API_EMAIL");
    const key = Deno.env.get("EPC_API_KEY");
    if (!email || !key) {
      return json({ error: "EPC credentials missing" }, 500);
    }
    const auth = btoa(`${email}:${key}`);

    const params = new URLSearchParams({
      postcode,
      size: "100",
    });
    const r = await fetch(`${EPC_URL}?${params}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("EPC API failed", r.status, txt.slice(0, 300));
      return json(
        { error: `EPC API ${r.status}`, detail: txt.slice(0, 200) },
        502,
      );
    }

    const j = await r.json();
    // deno-lint-ignore no-explicit-any
    const rows: EpcCert[] = (j.rows ?? []).map((b: any) => {
      const sqm = Number(b["total-floor-area"] ?? 0);
      return {
        lmkKey: String(b["lmk-key"] ?? ""),
        address: [b.address1, b.address2, b.address3]
          .filter(Boolean)
          .join(", "),
        postcode: String(b.postcode ?? ""),
        propertyType: String(b["property-type"] ?? ""),
        builtForm: String(b["built-form"] ?? ""),
        totalFloorAreaSqm: sqm,
        totalFloorAreaSqft: Math.round(sqm * 10.7639),
        currentEnergyBand: String(b["current-energy-rating"] ?? ""),
        potentialEnergyBand: String(b["potential-energy-rating"] ?? ""),
        currentEnergyEfficiency: Number(
          b["current-energy-efficiency"] ?? 0,
        ),
        potentialEnergyEfficiency: Number(
          b["potential-energy-efficiency"] ?? 0,
        ),
        co2Current: Number(b["co2-emissions-current"] ?? 0),
        inspectionDate: String(b["inspection-date"] ?? ""),
        tenure: String(b.tenure ?? ""),
      };
    });

    await supabase.from("epc_cache").upsert({
      postcode,
      data: rows,
      fetched_at: new Date().toISOString(),
    });

    return json({
      postcode,
      cached: false,
      count: rows.length,
      certificates: rows,
      stats: summarise(rows),
    });
  } catch (e) {
    console.error("get-epc error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function summarise(rows: EpcCert[]) {
  const sqfts = rows
    .map((r) => r.totalFloorAreaSqft)
    .filter((n) => n > 100 && n < 10000)
    .sort((a, b) => a - b);
  const median = sqfts.length
    ? sqfts[Math.floor(sqfts.length / 2)]
    : null;
  const bandCounts: Record<string, number> = {};
  for (const r of rows) {
    if (!r.currentEnergyBand) continue;
    bandCounts[r.currentEnergyBand] =
      (bandCounts[r.currentEnergyBand] ?? 0) + 1;
  }
  const modeBand =
    Object.entries(bandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    medianSqft: median,
    modeBand,
    sampleSize: rows.length,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
