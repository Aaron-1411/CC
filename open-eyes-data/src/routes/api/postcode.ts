import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { jsonResponse, errorResponse } from "@/lib/proxy";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MPData = {
  id: number;
  name: string;
  party: string;
  partyColour: string;
  thumbnailUrl: string;
  constituency: string;
  email: string;
  membershipFrom: string;
};

export type PostcodeResult = {
  postcode: string;
  constituency: string;
  parliamentaryConstituencyId?: number | null;
  policeForceId: string;          // matches data.police.uk force IDs
  localAuthority: string;
  region: string;
  mp: MPData | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Map ONS police force names (from postcodes.io) → data.police.uk IDs
const PFA_TO_FORCE_ID: Record<string, string> = {
  "avon and somerset constabulary": "avon-and-somerset",
  "bedfordshire police": "bedfordshire",
  "cambridgeshire constabulary": "cambridgeshire",
  "cheshire constabulary": "cheshire",
  "city of london police": "city-of-london",
  "cleveland police": "cleveland",
  "cumbria constabulary": "cumbria",
  "derbyshire constabulary": "derbyshire",
  "devon and cornwall police": "devon-and-cornwall",
  "dorset police": "dorset",
  "durham constabulary": "durham",
  "essex police": "essex",
  "gloucestershire constabulary": "gloucestershire",
  "greater manchester police": "greater-manchester",
  "hampshire and isle of wight constabulary": "hampshire",
  "hertfordshire constabulary": "hertfordshire",
  "humberside police": "humberside",
  "kent police": "kent",
  "lancashire constabulary": "lancashire",
  "leicestershire police": "leicestershire",
  "lincolnshire police": "lincolnshire",
  "merseyside police": "merseyside",
  "metropolitan police service": "metropolitan",
  "norfolk constabulary": "norfolk",
  "north yorkshire police": "north-yorkshire",
  "northamptonshire police": "northamptonshire",
  "northumbria police": "northumbria",
  "nottinghamshire police": "nottinghamshire",
  "south yorkshire police": "south-yorkshire",
  "staffordshire police": "staffordshire",
  "suffolk constabulary": "suffolk",
  "surrey police": "surrey",
  "sussex police": "sussex",
  "thames valley police": "thames-valley",
  "warwickshire police": "warwickshire",
  "west mercia police": "west-mercia",
  "west midlands police": "west-midlands",
  "west yorkshire police": "west-yorkshire",
  "wiltshire police": "wiltshire",
  // Scotland / Wales
  "police scotland": "scotland",
  "dyfed-powys police": "dyfed-powys",
  "gwent police": "gwent",
  "north wales police": "north-wales",
  "south wales police": "south-wales",
};

function pfaToForceId(pfa: string): string {
  const key = pfa.toLowerCase().trim();
  return PFA_TO_FORCE_ID[key] ?? key.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Parliament party colour map (approximate)
const PARTY_COLOURS: Record<string, string> = {
  "Labour":                  "#E4003B",
  "Conservative":            "#0087DC",
  "Liberal Democrat":        "#FAA61A",
  "Scottish National Party": "#FDF38E",
  "Green Party":             "#00B140",
  "Reform UK":               "#12B6CF",
  "Plaid Cymru":             "#005B54",
  "Democratic Unionist Party": "#D46A4C",
  "Sinn Féin":               "#326760",
  "Social Democratic & Labour Party": "#2AA82C",
  "Alliance":                "#F6CB2F",
  "Speaker":                 "#999999",
};

function partyColour(party: string): string {
  for (const [k, v] of Object.entries(PARTY_COLOURS)) {
    if (party.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "#888888";
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

type PostcodesIOResult = {
  result: {
    postcode: string;
    parliamentary_constituency_2024: string;
    pfa: string;
    admin_district: string;
    region: string;
    codes: { parliamentary_constituency_2024?: string };
  };
};

type ConstituencyMember = {
  id: number;
  nameDisplayAs: string;
  latestParty: { name: string } | null;
  latestHouseMembership: {
    membershipFrom: string;
    membershipFromId: number;
  } | null;
  thumbnailUrl: string;
};

type ConstituencyItem = {
  value: {
    name: string;
    currentRepresentation: { member: { value: ConstituencyMember } | null } | null;
  };
};

type ConstituencySearchResult = {
  items: ConstituencyItem[];
};

async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();

  // 1. postcodes.io
  const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!pcRes.ok) {
    if (pcRes.status === 404) throw new Error("Postcode not found");
    throw new Error(`postcodes.io: HTTP ${pcRes.status}`);
  }
  const pcData = (await pcRes.json()) as PostcodesIOResult;
  const r = pcData.result;

  const constituency = r.parliamentary_constituency_2024 ?? "";
  const policeForceId = pfaToForceId(r.pfa ?? "");

  // 2. Parliament Constituency API — find the sitting MP for this constituency.
  // NB: the Members `Search?constituency=` endpoint ignores that param (returns
  // all 650 members); Location/Constituency/Search matches by name.
  let mp: MPData | null = null;
  try {
    const mpRes = await fetch(
      `https://members-api.parliament.uk/api/Location/Constituency/Search?searchText=${encodeURIComponent(constituency)}&skip=0&take=10`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (mpRes.ok) {
      const mpData = (await mpRes.json()) as ConstituencySearchResult;
      const want = constituency.trim().toLowerCase();
      const chosen =
        mpData.items?.find((it) => (it.value?.name ?? "").trim().toLowerCase() === want) ??
        mpData.items?.[0];
      const member = chosen?.value?.currentRepresentation?.member?.value;
      if (member) {
        // 3. Get contact email
        let email = "";
        try {
          const contactRes = await fetch(
            `https://members-api.parliament.uk/api/Members/${member.id}/Contact`,
            { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5_000) },
          );
          if (contactRes.ok) {
            const contactData = (await contactRes.json()) as {
              value?: Array<{ type: string; email?: string }>;
            };
            const businessContact = contactData.value?.find(
              (c) => c.type === "Parliamentary" || c.type === "Constituency",
            );
            email = businessContact?.email ?? "";
          }
        } catch { /* email optional */ }

        const partyName = member.latestParty?.name ?? "";
        mp = {
          id: member.id,
          name: member.nameDisplayAs,
          party: partyName,
          partyColour: partyColour(partyName),
          thumbnailUrl: member.thumbnailUrl ?? "",
          constituency,
          email,
          membershipFrom: member.latestHouseMembership?.membershipFrom ?? "",
        };
      }
    }
  } catch (e) {
    console.warn("Parliament MP lookup failed:", e);
  }

  return {
    postcode: r.postcode,
    constituency,
    policeForceId,
    localAuthority: r.admin_district ?? "",
    region: r.region ?? "",
    mp,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/postcode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const postcode = url.searchParams.get("postcode");
        if (!postcode || postcode.trim().length < 5) {
          return errorResponse("postcode parameter required", 400);
        }
        try {
          const result = await lookupPostcode(postcode.trim());
          return jsonResponse({ data: result, meta: { fetchedAt: new Date().toISOString() } });
        } catch (e) {
          const msg = (e as Error).message;
          return errorResponse(msg, msg === "Postcode not found" ? 404 : 502);
        }
      },
    },
  },
});
