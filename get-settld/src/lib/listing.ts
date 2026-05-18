import { supabase } from "@/integrations/supabase/client";

export interface ParsedListing {
  address?: string;
  postcode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  imageUrl?: string;
  source?: string;
  // Rightmove-parity fields (omitted if not on the page)
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

export const SUPPORTED_LISTING_HOSTS = [
  "rightmove.co.uk",
  "zoopla.co.uk",
  "onthemarket.com",
  "primelocation.com",
  "purplebricks.co.uk",
  "boomin.com",
  "openrent.co.uk",
] as const;

export const SUPPORTED_LISTING_LABEL = "Rightmove, Zoopla, OnTheMarket, PrimeLocation, Purplebricks, Boomin or OpenRent";

export type ListingErrorKind =
  | "empty"
  | "invalid_url"
  | "unsupported_host"
  | "blocked"
  | "not_found"
  | "rate_limited"
  | "no_fields"
  | "ai_unavailable"
  | "auth_required"
  | "network"
  | "unknown";

export class ListingParseError extends Error {
  kind: ListingErrorKind;
  hint: string;
  constructor(kind: ListingErrorKind, message: string, hint: string) {
    super(message);
    this.kind = kind;
    this.hint = hint;
  }
}

const HINT_FORMATS = `Try a direct property page from ${SUPPORTED_LISTING_LABEL} - for example https://www.rightmove.co.uk/properties/123456789 or https://www.zoopla.co.uk/for-sale/details/12345678/`;

/** Quick client-side check before we hit the edge function. Returns null if OK. */
export function validateListingUrl(raw: string): ListingParseError | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return new ListingParseError("empty", "Paste a listing link first", HINT_FORMATS);
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
  } catch {
    return new ListingParseError(
      "invalid_url",
      "That doesn't look like a web address",
      HINT_FORMATS,
    );
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return new ListingParseError("invalid_url", "Only http and https links are supported", HINT_FORMATS);
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const ok = SUPPORTED_LISTING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (!ok) {
    return new ListingParseError(
      "unsupported_host",
      `We don't recognise ${host} yet`,
      `We can read listings from ${SUPPORTED_LISTING_LABEL}. For other sites, switch to Manual entry or use a screenshot.`,
    );
  }
  return null;
}

/** Calls the parse-listing edge function to extract structured fields from a portal URL. */
export async function parseListingUrl(url: string): Promise<ParsedListing> {
  const validation = validateListingUrl(url);
  if (validation) throw validation;

  let resp: { data: (ParsedListing & { error?: string }) | null; error: { message: string } | null };
  try {
    resp = await supabase.functions.invoke<ParsedListing & { error?: string }>(
      "parse-listing",
      { body: { url: url.trim() } },
    );
  } catch (e) {
    throw new ListingParseError(
      "network",
      "Couldn't reach the listing reader",
      "Check your internet connection and try again. If this keeps happening, paste the details manually.",
    );
  }

  const { data, error } = resp;
  if (error) throw mapEdgeError(error.message);
  if (!data) {
    throw new ListingParseError("unknown", "We didn't get a response", "Try again, or fall back to manual entry.");
  }
  if (data.error) throw mapEdgeError(data.error);

  // The edge function may return 200 with an empty object if the listing
  // page rendered no extractable fields (heavy JS, paywall, etc).
  const hasAnyField = Boolean(
    data.address || data.postcode || data.price || data.beds || data.sqft,
  );
  if (!hasAnyField) {
    throw new ListingParseError(
      "no_fields",
      "We couldn't read any details from that page",
      "The listing may be behind a login or use a layout we don't handle yet. Try uploading a screenshot or entering the details manually.",
    );
  }

  return data;
}

function mapEdgeError(message: string): ListingParseError {
  const m = message.toLowerCase();
  if (m.includes("sign in")) {
    return new ListingParseError("auth_required", "Sign in to use the listing reader", "Create a free account to import listings by URL.");
  }
  if (m.includes("rate limit")) {
    return new ListingParseError("rate_limited", "We're being rate-limited", "Wait a few seconds and try again.");
  }
  if (m.includes("credits")) {
    return new ListingParseError("ai_unavailable", "Listing reader is temporarily unavailable", "Please try again later, or enter the details manually.");
  }
  if (m.includes("ai not configured")) {
    return new ListingParseError("ai_unavailable", "Listing reader isn't set up", "Please enter the details manually for now.");
  }
  if (m.includes("listing fetch failed")) {
    // Heuristic on common HTTP statuses we surface from the edge function.
    if (/4\d\d/.test(m) && (m.includes("403") || m.includes("401"))) {
      return new ListingParseError(
        "blocked",
        "That listing blocked our reader",
        "Some agent sites block automated requests. Upload a screenshot or paste the details manually.",
      );
    }
    if (m.includes("404")) {
      return new ListingParseError(
        "not_found",
        "Listing page not found",
        "The link may have expired or been removed. Double-check the URL and try again.",
      );
    }
    return new ListingParseError(
      "blocked",
      "We couldn't open that listing",
      "The site may be down or blocking us. Try again or paste the details manually.",
    );
  }
  if (m.includes("valid http")) {
    return new ListingParseError("invalid_url", "That isn't a valid listing URL", HINT_FORMATS);
  }
  return new ListingParseError("unknown", message || "Something went wrong", "Try again or paste the details manually.");
}

export interface VerdictNarrativeInput {
  overall: "green" | "amber" | "red";
  oneLiner: string;
  postcode?: string;
  askingPrice?: number;
  monthlyPayment?: number;
  upfrontCash?: number;
  avmP50?: number;
  factors?: { label: string; light: string; headline: string }[];
}

export async function fetchVerdictNarrative(input: VerdictNarrativeInput): Promise<string> {
  // Narrative is a nice-to-have; only call if user is signed in (server enforces too).
  const { data: sess } = await supabase.auth.getSession();
  if (!sess?.session) return "";
  const { data, error } = await supabase.functions.invoke<{ narrative?: string; error?: string }>(
    "verdict-narrative",
    { body: input },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No response");
  if (data.error) throw new Error(data.error);
  return data.narrative ?? "";
}
