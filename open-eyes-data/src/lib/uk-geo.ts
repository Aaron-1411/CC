/**
 * Shared UK geography helpers — usable from BOTH client and server.
 *
 * Extracted so the postcode lookup can run client-side (browser → postcodes.io
 * directly), keeping the user's postcode off our servers entirely (decision D8).
 */

// Map ONS police force names (from postcodes.io `pfa`) → data.police.uk force IDs
export const PFA_TO_FORCE_ID: Record<string, string> = {
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

export function pfaToForceId(pfa: string): string {
  const key = (pfa ?? "").toLowerCase().trim();
  return PFA_TO_FORCE_ID[key] ?? key.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Parliament party colour map (approximate)
export const PARTY_COLOURS: Record<string, string> = {
  Labour: "#E4003B",
  Conservative: "#0087DC",
  "Liberal Democrat": "#FAA61A",
  "Scottish National Party": "#FDF38E",
  "Green Party": "#00B140",
  "Reform UK": "#12B6CF",
  "Plaid Cymru": "#005B54",
  "Democratic Unionist Party": "#D46A4C",
  "Sinn Féin": "#326760",
  "Social Democratic & Labour Party": "#2AA82C",
  Alliance: "#F6CB2F",
  Speaker: "#999999",
};

export function partyColour(party: string): string {
  for (const [k, v] of Object.entries(PARTY_COLOURS)) {
    if ((party ?? "").toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "#888888";
}
