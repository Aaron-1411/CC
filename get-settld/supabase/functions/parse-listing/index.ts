// Fetches a property listing URL (Rightmove, Zoopla, OnTheMarket, etc.)
// and uses Lovable AI to extract structured fields. Hardened against SSRF
// via strict host allowlist, request timeout, and body-size cap.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOSTS = [
  "rightmove.co.uk",
  "zoopla.co.uk",
  "onthemarket.com",
  "primelocation.com",
  "purplebricks.co.uk",
  "boomin.com",
  "openrent.co.uk",
];

const MAX_BYTES = 1_000_000; // 1MB cap on listing HTML
const FETCH_TIMEOUT_MS = 7_000;

interface Parsed {
  address?: string;
  postcode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  imageUrl?: string;
  source?: string;
  // Rightmove-parity fields — leave undefined if not present on the page.
  propertyType?: string;
  tenure?: string;
  leaseYearsRemaining?: number;
  groundRent?: number;
  serviceCharge?: number;
  councilTaxBand?: string;
  councilTaxAnnual?: number;
  parking?: string;
  garden?: string;
  broadbandMbps?: number;
  mobileSignal?: string;
  chainStatus?: string;
  daysOnMarket?: number;
  floodRisk?: string;
  heating?: string;
  listedBuilding?: boolean;
  conservationArea?: boolean;
  epc?: string;
  yearBuilt?: number;
  priceHistory?: { date?: string; price?: number; event?: string }[];
}

const SYSTEM = `You extract UK property listing facts from raw HTML.
Return ONLY a JSON object. Omit any field you cannot find — never invent values.

Required core fields when present:
- address (string), postcode (UK format like SW9 8DE), price (number GBP, no symbol),
- beds (number), baths (number), sqft (number, internal floor area in square feet — convert sqm * 10.7639 if needed),
- imageUrl (string, primary listing photo URL).

Rightmove-parity fields when present (these are the boxes Rightmove shows):
- propertyType: one of "Flat","Terraced","Semi-detached","Detached","Bungalow","Maisonette","Studio"
- tenure: "Freehold" or "Leasehold"
- leaseYearsRemaining (number), groundRent (number, £/yr), serviceCharge (number, £/yr)
- councilTaxBand: one of "A".."H", councilTaxAnnual (number, £/yr if shown)
- parking: one of "None","On-street","Allocated","Garage","Driveway"
- garden: one of "None","Patio","Shared","Private","Large"
- broadbandMbps (number, headline download from the Ofcom block on the listing)
- mobileSignal: one of "Poor","Limited","Good","Excellent"
- chainStatus: one of "No chain","Chain free","Onward chain","Unknown"
- daysOnMarket (number), floodRisk: "Very low","Low","Medium","High"
- heating: one of "Gas central","Electric","Heat pump","Oil","Other"
- listedBuilding (boolean), conservationArea (boolean)
- epc: one of "A".."G"
- yearBuilt (number, 4-digit year)
- priceHistory: array of { date: "YYYY-MM-DD", price: number, event: "Listed"|"Reduced"|"Sold" } from the Rightmove "Listing history" / "Property history" block.

Return JSON only — no prose, no markdown, no code fences.`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- Auth gate (signed-in users only — prevents abuse of AI credits) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Sign in required" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) return json({ error: "Sign in required" }, 401);

    // --- Input validation ---
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const url = (body as { url?: unknown })?.url;
    if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
      return json({ error: "Provide a valid URL" }, 400);
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch {
      return json({ error: "Provide a valid URL" }, 400);
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return json({ error: "Only http(s) URLs are allowed" }, 400);
    }

    // --- SSRF guard: strict host allowlist ---
    const host = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();
    const allowed = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    if (!allowed) {
      return json({ error: `Unsupported host ${host}` }, 400);
    }

    // --- Fetch with timeout + size cap ---
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let pageRes: Response;
    try {
      pageRes = await fetch(parsedUrl.toString(), {
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
    } catch (e) {
      clearTimeout(timer);
      const aborted = (e as Error).name === "AbortError";
      return json({ error: aborted ? "Listing fetch timed out" : "Listing fetch failed" }, 504);
    }
    clearTimeout(timer);

    // After redirects, re-check the final host (defense in depth).
    const finalHost = new URL(pageRes.url).hostname.replace(/^www\./i, "").toLowerCase();
    const finalAllowed = ALLOWED_HOSTS.some((h) => finalHost === h || finalHost.endsWith(`.${h}`));
    if (!finalAllowed) return json({ error: `Redirect to disallowed host ${finalHost}` }, 400);

    if (!pageRes.ok) return json({ error: `Listing fetch failed (${pageRes.status})` }, 502);

    // Read up to MAX_BYTES then abort.
    const reader = pageRes.body?.getReader();
    if (!reader) return json({ error: "Empty listing response" }, 502);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { try { await reader.cancel(); } catch { /* noop */ } break; }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(concat(chunks));

    const head = (html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "").slice(0, 30_000);
    const bodySnippet = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/i, " ")
      .replace(/\s+/g, " ")
      .slice(0, 12_000);
    const trimmed = head + "\n\n" + bodySnippet;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `URL: ${parsedUrl.toString()}\n\nHTML:\n${trimmed}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) return json({ error: `AI error (${aiRes.status})` }, 502);

    const aiBody = await aiRes.json();
    const content: string = aiBody?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Parsed = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const strOrU = (v: unknown, max = 60) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
    const boolOrU = (v: unknown) => typeof v === "boolean" ? v : undefined;
    const historyOrU = (v: unknown) => {
      if (!Array.isArray(v)) return undefined;
      const cleaned = v.slice(0, 20)
        .map((h: { date?: unknown; price?: unknown; event?: unknown }) => ({
          date: strOrU(h?.date, 12),
          price: numOrUndef(h?.price),
          event: strOrU(h?.event, 20),
        }))
        .filter((h) => h.date && h.price);
      return cleaned.length ? cleaned : undefined;
    };

    const out: Parsed = {
      address: strOrU(parsed.address, 300),
      postcode: parsed.postcode ? String(parsed.postcode).trim().toUpperCase().slice(0, 10) : undefined,
      price: numOrUndef(parsed.price),
      beds: numOrUndef(parsed.beds),
      baths: numOrUndef(parsed.baths),
      sqft: numOrUndef(parsed.sqft),
      imageUrl: safeImageUrl(parsed.imageUrl),
      source: host,
      propertyType: strOrU(parsed.propertyType, 30),
      tenure: strOrU(parsed.tenure, 20),
      leaseYearsRemaining: numOrUndef(parsed.leaseYearsRemaining),
      groundRent: numOrUndef(parsed.groundRent),
      serviceCharge: numOrUndef(parsed.serviceCharge),
      councilTaxBand: strOrU(parsed.councilTaxBand, 2),
      councilTaxAnnual: numOrUndef(parsed.councilTaxAnnual),
      parking: strOrU(parsed.parking, 20),
      garden: strOrU(parsed.garden, 20),
      broadbandMbps: numOrUndef(parsed.broadbandMbps),
      mobileSignal: strOrU(parsed.mobileSignal, 12),
      chainStatus: strOrU(parsed.chainStatus, 20),
      daysOnMarket: numOrUndef(parsed.daysOnMarket),
      floodRisk: strOrU(parsed.floodRisk, 12),
      heating: strOrU(parsed.heating, 20),
      listedBuilding: boolOrU(parsed.listedBuilding),
      conservationArea: boolOrU(parsed.conservationArea),
      epc: strOrU(parsed.epc, 2)?.toUpperCase(),
      yearBuilt: numOrUndef(parsed.yearBuilt),
      priceHistory: historyOrU(parsed.priceHistory),
    };

    return json(out, 200);
  } catch (e) {
    console.error("parse-listing error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.byteLength; }
  return out;
}
function numOrUndef(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : Number(v);
  return Number.isFinite(n) && n > 0 && n < 1e10 ? n : undefined;
}
function safeImageUrl(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.toString().slice(0, 1000);
  } catch { return undefined; }
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
