export type CommuteMode = "tube" | "rail" | "cycle" | "drive";

// Universal destinations that work for any UK area:
// - cityCentre: the area's own nearest city/town centre
// - regionalHub: the dominant regional employment hub (e.g. Manchester for the NW)
// - london: central London (zone 1) by best route
// - airport: the nearest major international airport
export interface CommuteTimes {
  tube: Record<string, number | null>;
  rail: Record<string, number | null>;
  cycle: Record<string, number | null>;
  drive: Record<string, number | null>;
}

export interface InvestmentProfile {
  pricePerSqft: number;
  pricePerSqftRegion: number;
  yearlyGrowth: number[];
  rentalDemand: number;
  voidWeeks: number;
  capexPipeline: number;
  affordabilityRatio: number;
}

export interface SchoolBreakdown {
  primaryOfsted: number;
  secondaryOfsted: number;
  pctOutstanding: number;
  catchmentPremium: number;
  topSchool: string;
}

export type DataConfidence = "high" | "medium" | "low";

export interface MetricProvenance {
  label: string;
  source: string;
  sourceUrl?: string;
  lastUpdated: string; // ISO yyyy-mm or yyyy-mm-dd
  confidence: DataConfidence;
  method: string;
}

export type MetricKey =
  | "medianPrice" | "growth5y" | "yield" | "crime"
  | "schools" | "transport" | "green"
  | "commute" | "schoolBreakdown" | "investment";

export const METRIC_PROVENANCE: Record<MetricKey, MetricProvenance> = {
  medianPrice: {
    label: "Median price", source: "HM Land Registry · Price Paid Data",
    sourceUrl: "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads",
    lastUpdated: "2025-09", confidence: "high",
    method: "12-month rolling median of completed sales by postcode district.",
  },
  growth5y: {
    label: "5-year growth", source: "ONS UK House Price Index",
    sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest",
    lastUpdated: "2025-09", confidence: "high",
    method: "Local-authority HPI compounded across the latest 5 published years.",
  },
  yield: {
    label: "Gross rental yield", source: "ONS PRMS + Zoopla rental indices",
    lastUpdated: "2025-08", confidence: "medium",
    method: "Median advertised 2-bed rent ÷ median 2-bed sale price (annualised).",
  },
  crime: {
    label: "Crime per 1,000", source: "data.police.uk Street-level data",
    sourceUrl: "https://data.police.uk/",
    lastUpdated: "2025-08", confidence: "high",
    method: "12-month rolling all-crime count per 1,000 residents in the LSOA.",
  },
  schools: {
    label: "Schools score (1–10)", source: "Ofsted ratings + DfE performance tables",
    lastUpdated: "2025-07", confidence: "high",
    method: "Weighted blend of Ofsted grades and Progress 8 across the catchment.",
  },
  transport: {
    label: "Transport score (1–10)", source: "DfT PTAL + national rail timetable",
    lastUpdated: "2025-06", confidence: "medium",
    method: "Public Transport Accessibility Level normalised to 1–10.",
  },
  green: {
    label: "Green-space score (1–10)", source: "OS Open Greenspace + ONS Access to Greenspace",
    lastUpdated: "2025-04", confidence: "medium",
    method: "Park hectares within 1 km, blended with tree-canopy cover %.",
  },
  commute: {
    label: "Commute times", source: "TfL Journey Planner + National Rail",
    lastUpdated: "2025-09", confidence: "medium",
    method: "Indicative door-to-door peak averages incl. interchange/access.",
  },
  schoolBreakdown: {
    label: "School impact breakdown", source: "Ofsted + Rightmove catchment premium",
    lastUpdated: "2025-07", confidence: "medium",
    method: "Primary/secondary Ofsted, % Outstanding, observed catchment premium.",
  },
  investment: {
    label: "Investment profile", source: "ONS HPI + EGi/CoStar regen pipeline",
    lastUpdated: "2025-08", confidence: "medium",
    method: "£/sqft, demand index, voids, regen pipeline value, affordability ratio.",
  },
};

export interface Area {
  id: string;
  name: string;
  region: string;
  medianPrice: number;
  growth5y: number;
  crime: number;
  schools: number;
  transport: number;
  green: number;
  yield: number;
  vibe: string;
  pros: string[];
  cons: string[];
  commute: CommuteTimes;
  schoolBreakdown: SchoolBreakdown;
  investment: InvestmentProfile;
  /** "curated" = manually verified entry; "synthetic" = regional-benchmark estimate */
  provenance?: "curated" | "synthetic";
}

export const areaConfidence = (a: Area): DataConfidence =>
  a.provenance === "synthetic" ? "low" : "high";

export const confidenceLabel = (c: DataConfidence) =>
  c === "high" ? "High confidence" : c === "medium" ? "Medium confidence" : "Modelled estimate";

export const REGIONS = [
  "Greater London",
  "South East",
  "South West",
  "East of England",
  "East Midlands",
  "West Midlands",
  "Yorkshire & Humber",
  "North West",
  "North East",
  "Wales",
  "Scotland",
  "Northern Ireland",
] as const;

export type RegionName = typeof REGIONS[number];

export const DESTINATIONS = [
  { id: "cityCentre", label: "Local city / town centre" },
  { id: "regionalHub", label: "Nearest regional hub" },
  { id: "london", label: "Central London" },
  { id: "airport", label: "Nearest major airport" },
] as const;

export type DestinationId = typeof DESTINATIONS[number]["id"];

export const MODES: { id: CommuteMode; label: string }[] = [
  { id: "tube", label: "Tube / Metro" },
  { id: "rail", label: "National Rail" },
  { id: "cycle", label: "Cycle" },
  { id: "drive", label: "Drive (peak)" },
];

// Helper to keep area definitions terse
const C = (
  tube: [number | null, number | null, number | null, number | null],
  rail: [number | null, number | null, number | null, number | null],
  cycle: [number | null, number | null, number | null, number | null],
  drive: [number | null, number | null, number | null, number | null],
): CommuteTimes => ({
  tube:  { cityCentre: tube[0],  regionalHub: tube[1],  london: tube[2],  airport: tube[3]  },
  rail:  { cityCentre: rail[0],  regionalHub: rail[1],  london: rail[2],  airport: rail[3]  },
  cycle: { cityCentre: cycle[0], regionalHub: cycle[1], london: cycle[2], airport: cycle[3] },
  drive: { cityCentre: drive[0], regionalHub: drive[1], london: drive[2], airport: drive[3] },
});

const CURATED_AREAS: Area[] = [
  // ===================== GREATER LONDON =====================
  {
    id: "tw9", name: "Richmond (TW9)", region: "Greater London",
    medianPrice: 638_000, growth5y: 21, crime: 38, schools: 9, transport: 8, green: 10, yield: 3.4,
    vibe: "Leafy, family-focused, riverside",
    pros: ["Outstanding schools catchment", "Royal park & riverside", "Strong long-term growth"],
    cons: ["Premium pricing per sqft", "Limited new-build supply"],
    commute: C([35, 35, 30, 25],[30, 30, 25, 20],[null, null, 60, 35],[55, 55, 50, 25]),
    schoolBreakdown: { primaryOfsted: 9.2, secondaryOfsted: 8.8, pctOutstanding: 42, catchmentPremium: 18, topSchool: "The Tiffin Schools (selective)" },
    investment: { pricePerSqft: 920, pricePerSqftRegion: 780, yearlyGrowth: [2.1, 3.4, 5.8, 4.2, 5.5], rentalDemand: 88, voidWeeks: 2.1, capexPipeline: 55, affordabilityRatio: 12.4 },
  },
  {
    id: "se15", name: "Peckham (SE15)", region: "Greater London",
    medianPrice: 510_000, growth5y: 28, crime: 92, schools: 7, transport: 8, green: 6, yield: 4.2,
    vibe: "Creative, food scene, gentrifying",
    pros: ["Strong rental yield", "Bakerloo extension talks", "Vibrant high street"],
    cons: ["Higher crime than borough avg", "Pace of change still uneven"],
    commute: C([28, 28, 22, 50],[18, 18, 15, 45],[null, null, 35, 60],[35, 35, 30, 55]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 9, topSchool: "Harris Academy Peckham" },
    investment: { pricePerSqft: 715, pricePerSqftRegion: 760, yearlyGrowth: [4.2, 6.1, 7.5, 5.8, 4.6], rentalDemand: 94, voidWeeks: 1.4, capexPipeline: 82, affordabilityRatio: 9.8 },
  },
  {
    id: "n22", name: "Wood Green (N22)", region: "Greater London",
    medianPrice: 465_000, growth5y: 17, crime: 78, schools: 7, transport: 9, green: 7, yield: 4.5,
    vibe: "Diverse, well-connected, value-friendly",
    pros: ["Piccadilly + Crossrail 2 plans", "Lower entry price", "Alexandra Palace nearby"],
    cons: ["Patchy regeneration", "Older housing stock"],
    commute: C([22, 22, 18, 45],[20, 20, 15, 40],[null, null, 30, 55],[40, 40, 35, 50]),
    schoolBreakdown: { primaryOfsted: 7.6, secondaryOfsted: 7.2, pctOutstanding: 28, catchmentPremium: 11, topSchool: "Alexandra Park School" },
    investment: { pricePerSqft: 595, pricePerSqftRegion: 640, yearlyGrowth: [3.1, 3.8, 4.2, 3.6, 3.4], rentalDemand: 86, voidWeeks: 1.8, capexPipeline: 74, affordabilityRatio: 10.6 },
  },
  {
    id: "e17", name: "Walthamstow (E17)", region: "Greater London",
    medianPrice: 525_000, growth5y: 24, crime: 74, schools: 8, transport: 9, green: 7, yield: 4.4,
    vibe: "Young, indie, family-friendly",
    pros: ["Victoria line terminus", "Strong young professional demand", "Wetlands & marshes"],
    cons: ["Premium creeping in", "School places competitive"],
    commute: C([20, 20, 15, 50],[null, null, 12, 45],[null, null, 35, 65],[35, 35, 30, 45]),
    schoolBreakdown: { primaryOfsted: 8.1, secondaryOfsted: 7.5, pctOutstanding: 32, catchmentPremium: 13, topSchool: "Walthamstow School for Girls" },
    investment: { pricePerSqft: 680, pricePerSqftRegion: 760, yearlyGrowth: [3.8, 5.2, 6.1, 4.8, 4.4], rentalDemand: 92, voidWeeks: 1.5, capexPipeline: 68, affordabilityRatio: 10.2 },
  },
  {
    id: "se10", name: "Greenwich (SE10)", region: "Greater London",
    medianPrice: 575_000, growth5y: 19, crime: 65, schools: 8, transport: 8, green: 9, yield: 4.0,
    vibe: "Maritime, parkside, tourist-adjacent",
    pros: ["DLR + Jubilee + clipper", "World heritage skyline", "Big regen at Greenwich Peninsula"],
    cons: ["Tourist crowds", "New-build oversupply pockets"],
    commute: C([28, 28, 22, 60],[20, 20, 15, 55],[null, null, 40, 65],[40, 40, 35, 55]),
    schoolBreakdown: { primaryOfsted: 8.0, secondaryOfsted: 7.4, pctOutstanding: 30, catchmentPremium: 12, topSchool: "John Roan School" },
    investment: { pricePerSqft: 740, pricePerSqftRegion: 760, yearlyGrowth: [2.8, 3.4, 4.6, 3.8, 3.5], rentalDemand: 84, voidWeeks: 2.2, capexPipeline: 78, affordabilityRatio: 11.1 },
  },
  {
    id: "nw5", name: "Kentish Town (NW5)", region: "Greater London",
    medianPrice: 720_000, growth5y: 16, crime: 70, schools: 8, transport: 9, green: 7, yield: 3.6,
    vibe: "Bohemian, foodie, family-Hampstead-adjacent",
    pros: ["Northern line + Overground", "Gospel Oak schools", "Hampstead Heath on doorstep"],
    cons: ["Premium pricing", "Limited new stock"],
    commute: C([18, 18, 12, 50],[null, null, 10, 45],[null, null, 25, 60],[35, 35, 25, 50]),
    schoolBreakdown: { primaryOfsted: 8.4, secondaryOfsted: 7.8, pctOutstanding: 36, catchmentPremium: 15, topSchool: "Acland Burghley" },
    investment: { pricePerSqft: 920, pricePerSqftRegion: 880, yearlyGrowth: [2.2, 3.0, 4.1, 3.4, 3.2], rentalDemand: 90, voidWeeks: 1.6, capexPipeline: 50, affordabilityRatio: 13.6 },
  },
  {
    id: "ub1", name: "Southall (UB1)", region: "Greater London",
    medianPrice: 425_000, growth5y: 22, crime: 68, schools: 7, transport: 9, green: 6, yield: 4.7,
    vibe: "South Asian heritage, Elizabeth-line transformed",
    pros: ["Elizabeth line into central in 18 min", "Strong yield", "Affordable entry"],
    cons: ["Air quality near A roads", "Mixed school provision"],
    commute: C([null, null, null, null],[18, 18, 18, 8],[null, null, 75, 25],[40, 40, 45, 15]),
    schoolBreakdown: { primaryOfsted: 7.5, secondaryOfsted: 7.0, pctOutstanding: 24, catchmentPremium: 8, topSchool: "Villiers High School" },
    investment: { pricePerSqft: 510, pricePerSqftRegion: 640, yearlyGrowth: [3.4, 4.6, 6.2, 4.8, 3.6], rentalDemand: 89, voidWeeks: 1.7, capexPipeline: 88, affordabilityRatio: 9.4 },
  },

  // ===================== SOUTH EAST =====================
  {
    id: "rg1", name: "Reading (RG1)", region: "South East",
    medianPrice: 320_000, growth5y: 18, crime: 72, schools: 7, transport: 9, green: 6, yield: 5.0,
    vibe: "Tech corridor, commuter, Thames-side",
    pros: ["Elizabeth line to London", "Big tech employer base", "Strong rental yield"],
    cons: ["Town centre tired in parts", "Traffic pinch points"],
    commute: C([null, null, null, null],[10, 25, 28, 20],[20, 35, null, 40],[15, 30, 70, 35]),
    schoolBreakdown: { primaryOfsted: 7.8, secondaryOfsted: 7.4, pctOutstanding: 26, catchmentPremium: 10, topSchool: "Kendrick School (selective)" },
    investment: { pricePerSqft: 450, pricePerSqftRegion: 470, yearlyGrowth: [3.1, 4.2, 5.4, 3.8, 3.2], rentalDemand: 88, voidWeeks: 1.8, capexPipeline: 72, affordabilityRatio: 8.1 },
  },
  {
    id: "bn1", name: "Brighton (BN1)", region: "South East",
    medianPrice: 450_000, growth5y: 22, crime: 88, schools: 8, transport: 8, green: 8, yield: 4.6,
    vibe: "Coastal, creative, LGBTQ+ hub",
    pros: ["Sea + South Downs", "Strong tourism + student demand", "Direct trains to London"],
    cons: ["Parking nightmare", "Higher crime than national avg"],
    commute: C([null, null, null, null],[12, 30, 60, 25],[15, 40, null, 45],[20, 45, 90, 40]),
    schoolBreakdown: { primaryOfsted: 8.0, secondaryOfsted: 7.6, pctOutstanding: 30, catchmentPremium: 12, topSchool: "Varndean School" },
    investment: { pricePerSqft: 560, pricePerSqftRegion: 480, yearlyGrowth: [3.6, 4.8, 5.6, 4.2, 3.8], rentalDemand: 92, voidWeeks: 1.5, capexPipeline: 60, affordabilityRatio: 10.4 },
  },
  {
    id: "ox1", name: "Oxford (OX1)", region: "South East",
    medianPrice: 545_000, growth5y: 20, crime: 60, schools: 9, transport: 7, green: 8, yield: 4.0,
    vibe: "Historic, academic, biotech-rich",
    pros: ["World-class universities & jobs", "Stable demand from students/staff", "Beautiful built environment"],
    cons: ["Very tight supply", "Affordability stretched"],
    commute: C([null, null, null, null],[8, 65, 55, 60],[10, null, null, 75],[15, 90, 90, 75]),
    schoolBreakdown: { primaryOfsted: 8.6, secondaryOfsted: 8.2, pctOutstanding: 38, catchmentPremium: 16, topSchool: "Cherwell School" },
    investment: { pricePerSqft: 620, pricePerSqftRegion: 470, yearlyGrowth: [3.0, 4.0, 5.2, 4.0, 3.4], rentalDemand: 95, voidWeeks: 1.2, capexPipeline: 65, affordabilityRatio: 12.8 },
  },
  {
    id: "gu1", name: "Guildford (GU1)", region: "South East",
    medianPrice: 510_000, growth5y: 14, crime: 45, schools: 9, transport: 8, green: 9, yield: 4.0,
    vibe: "Affluent commuter, cathedral town",
    pros: ["Top-rated schools", "Surrey Hills AONB", "Direct Waterloo trains"],
    cons: ["Very high entry price", "Chain-store-y centre"],
    commute: C([null, null, null, null],[8, 35, 36, 25],[12, 50, null, 45],[18, 55, 75, 35]),
    schoolBreakdown: { primaryOfsted: 8.8, secondaryOfsted: 8.5, pctOutstanding: 40, catchmentPremium: 17, topSchool: "Guildford County School" },
    investment: { pricePerSqft: 580, pricePerSqftRegion: 470, yearlyGrowth: [2.0, 2.8, 3.8, 3.0, 2.6], rentalDemand: 84, voidWeeks: 2.0, capexPipeline: 45, affordabilityRatio: 11.8 },
  },
  {
    id: "ct1", name: "Canterbury (CT1)", region: "South East",
    medianPrice: 320_000, growth5y: 16, crime: 58, schools: 8, transport: 7, green: 8, yield: 4.4,
    vibe: "Historic cathedral city, two universities",
    pros: ["High-speed to St Pancras 56 min", "Strong student rental market", "Heritage charm"],
    cons: ["Tourist seasonality", "Limited large-employer base"],
    commute: C([null, null, null, null],[8, 25, 56, 40],[12, 35, null, 60],[15, 35, 90, 50]),
    schoolBreakdown: { primaryOfsted: 8.0, secondaryOfsted: 7.8, pctOutstanding: 32, catchmentPremium: 11, topSchool: "Simon Langton Grammar" },
    investment: { pricePerSqft: 380, pricePerSqftRegion: 470, yearlyGrowth: [3.0, 3.8, 4.6, 3.4, 2.8], rentalDemand: 86, voidWeeks: 1.8, capexPipeline: 50, affordabilityRatio: 8.6 },
  },

  // ===================== SOUTH WEST =====================
  {
    id: "bs8", name: "Clifton, Bristol (BS8)", region: "South West",
    medianPrice: 525_000, growth5y: 26, crime: 55, schools: 9, transport: 7, green: 9, yield: 4.0,
    vibe: "Georgian elegance, professional, university-led",
    pros: ["Top schools & university", "Suspension Bridge & Downs", "Strong professional jobs base"],
    cons: ["Steep streets, tight parking", "Premium prices"],
    commute: C([null, null, null, null],[10, 10, 95, 35],[15, 15, null, 45],[15, 15, 130, 25]),
    schoolBreakdown: { primaryOfsted: 8.8, secondaryOfsted: 8.4, pctOutstanding: 38, catchmentPremium: 16, topSchool: "Clifton College" },
    investment: { pricePerSqft: 540, pricePerSqftRegion: 420, yearlyGrowth: [3.8, 5.4, 6.6, 4.8, 3.8], rentalDemand: 92, voidWeeks: 1.4, capexPipeline: 60, affordabilityRatio: 11.4 },
  },
  {
    id: "ba1", name: "Bath (BA1)", region: "South West",
    medianPrice: 485_000, growth5y: 18, crime: 42, schools: 9, transport: 7, green: 9, yield: 3.8,
    vibe: "UNESCO heritage, spa town, premium",
    pros: ["World heritage status", "Outstanding schools", "Strong tourism + commuter mix"],
    cons: ["Strict planning constraints", "Tourist congestion"],
    commute: C([null, null, null, null],[8, 15, 85, 40],[12, 25, null, 60],[15, 30, 130, 35]),
    schoolBreakdown: { primaryOfsted: 8.6, secondaryOfsted: 8.2, pctOutstanding: 36, catchmentPremium: 14, topSchool: "Beechen Cliff School" },
    investment: { pricePerSqft: 520, pricePerSqftRegion: 420, yearlyGrowth: [2.6, 3.4, 4.6, 3.6, 3.0], rentalDemand: 88, voidWeeks: 1.6, capexPipeline: 40, affordabilityRatio: 11.0 },
  },
  {
    id: "ex4", name: "Exeter (EX4)", region: "South West",
    medianPrice: 295_000, growth5y: 20, crime: 50, schools: 8, transport: 7, green: 8, yield: 4.5,
    vibe: "University city, gateway to Devon",
    pros: ["Russell Group university", "Strong rental from students", "Affordable vs Bristol"],
    cons: ["Slower London links (2h+)", "Smaller graduate job market"],
    commute: C([null, null, null, null],[8, 25, 130, 35],[12, 35, null, 50],[15, 35, 200, 25]),
    schoolBreakdown: { primaryOfsted: 8.0, secondaryOfsted: 7.6, pctOutstanding: 28, catchmentPremium: 10, topSchool: "Exeter School" },
    investment: { pricePerSqft: 360, pricePerSqftRegion: 380, yearlyGrowth: [3.4, 4.4, 5.6, 4.0, 3.2], rentalDemand: 88, voidWeeks: 1.6, capexPipeline: 58, affordabilityRatio: 8.4 },
  },
  {
    id: "pl4", name: "Plymouth (PL4)", region: "South West",
    medianPrice: 195_000, growth5y: 14, crime: 78, schools: 7, transport: 6, green: 7, yield: 5.6,
    vibe: "Naval, coastal, value entry-point",
    pros: ["Very strong yield", "Cheap entry to coastal living", "Naval / defence employers"],
    cons: ["Slower capital growth", "Patchy regeneration"],
    commute: C([null, null, null, null],[8, 65, 200, 60],[15, 75, null, 70],[15, 90, 270, 50]),
    schoolBreakdown: { primaryOfsted: 7.0, secondaryOfsted: 6.6, pctOutstanding: 18, catchmentPremium: 6, topSchool: "Devonport High" },
    investment: { pricePerSqft: 245, pricePerSqftRegion: 380, yearlyGrowth: [2.4, 3.0, 4.0, 2.6, 2.0], rentalDemand: 80, voidWeeks: 2.4, capexPipeline: 55, affordabilityRatio: 6.4 },
  },

  // ===================== EAST OF ENGLAND =====================
  {
    id: "cb1", name: "Cambridge (CB1)", region: "East of England",
    medianPrice: 540_000, growth5y: 22, crime: 52, schools: 9, transport: 8, green: 8, yield: 4.2,
    vibe: "Science city, cycling capital, global talent",
    pros: ["World-leading biotech & AI cluster", "Premium schools", "Strong rental + capital growth"],
    cons: ["Severe supply constraint", "Stretched affordability"],
    commute: C([null, null, null, null],[8, 8, 50, 30],[10, 10, null, 50],[15, 15, 90, 35]),
    schoolBreakdown: { primaryOfsted: 8.8, secondaryOfsted: 8.6, pctOutstanding: 40, catchmentPremium: 18, topSchool: "Hills Road Sixth Form" },
    investment: { pricePerSqft: 620, pricePerSqftRegion: 450, yearlyGrowth: [3.4, 4.8, 6.0, 4.6, 3.6], rentalDemand: 96, voidWeeks: 1.1, capexPipeline: 78, affordabilityRatio: 13.0 },
  },
  {
    id: "mk9", name: "Milton Keynes (MK9)", region: "East of England",
    medianPrice: 320_000, growth5y: 18, crime: 70, schools: 7, transport: 9, green: 8, yield: 4.8,
    vibe: "Planned new city, grids + redways",
    pros: ["Direct trains to Euston in 35 min", "Big employer base", "Strong yield + value"],
    cons: ["Urban form not for everyone", "Some areas anti-social behaviour"],
    commute: C([null, null, null, null],[5, 25, 35, 50],[10, 35, null, 60],[10, 40, 75, 50]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Denbigh School" },
    investment: { pricePerSqft: 360, pricePerSqftRegion: 450, yearlyGrowth: [3.2, 4.4, 5.2, 3.8, 3.0], rentalDemand: 88, voidWeeks: 1.6, capexPipeline: 78, affordabilityRatio: 7.8 },
  },
  {
    id: "al1", name: "St Albans (AL1)", region: "East of England",
    medianPrice: 615_000, growth5y: 16, crime: 38, schools: 9, transport: 9, green: 9, yield: 3.4,
    vibe: "Premium commuter, Roman heritage, family",
    pros: ["20 min Thameslink to St Pancras", "Top-rated state schools", "Beautiful market town"],
    cons: ["Among UK's most expensive commuter towns", "Limited new supply"],
    commute: C([null, null, null, null],[6, 6, 20, 30],[null, null, null, 40],[10, 10, 45, 25]),
    schoolBreakdown: { primaryOfsted: 9.0, secondaryOfsted: 8.8, pctOutstanding: 44, catchmentPremium: 20, topSchool: "St Albans High School for Girls" },
    investment: { pricePerSqft: 620, pricePerSqftRegion: 450, yearlyGrowth: [2.4, 3.0, 4.0, 3.2, 2.6], rentalDemand: 86, voidWeeks: 1.8, capexPipeline: 35, affordabilityRatio: 13.8 },
  },
  {
    id: "nr2", name: "Norwich (NR2)", region: "East of England",
    medianPrice: 245_000, growth5y: 17, crime: 65, schools: 8, transport: 6, green: 8, yield: 5.0,
    vibe: "Medieval city, indie shops, university",
    pros: ["High yield", "Affordable entry", "Strong cultural scene"],
    cons: ["Slower London links (2h)", "Limited motorway access"],
    commute: C([null, null, null, null],[8, 8, 110, 70],[12, 12, null, 90],[15, 15, 160, 80]),
    schoolBreakdown: { primaryOfsted: 7.8, secondaryOfsted: 7.4, pctOutstanding: 26, catchmentPremium: 9, topSchool: "Notre Dame High" },
    investment: { pricePerSqft: 285, pricePerSqftRegion: 380, yearlyGrowth: [2.8, 3.6, 4.6, 3.4, 2.6], rentalDemand: 84, voidWeeks: 1.8, capexPipeline: 45, affordabilityRatio: 7.2 },
  },

  // ===================== WEST MIDLANDS =====================
  {
    id: "b1", name: "Birmingham City Centre (B1)", region: "West Midlands",
    medianPrice: 230_000, growth5y: 24, crime: 95, schools: 6, transport: 9, green: 5, yield: 5.8,
    vibe: "UK's second city, regen-driven, young",
    pros: ["HS2 catalysts", "Big employer base", "Strong yield"],
    cons: ["Higher crime in centre", "School ratings mixed"],
    commute: C([null, null, null, null],[5, 5, 80, 15],[15, 15, null, 25],[15, 15, 130, 20]),
    schoolBreakdown: { primaryOfsted: 7.0, secondaryOfsted: 6.6, pctOutstanding: 20, catchmentPremium: 7, topSchool: "King Edward VI Aston" },
    investment: { pricePerSqft: 320, pricePerSqftRegion: 280, yearlyGrowth: [4.0, 5.4, 6.6, 4.8, 3.6], rentalDemand: 94, voidWeeks: 1.4, capexPipeline: 92, affordabilityRatio: 6.8 },
  },
  {
    id: "cv1", name: "Coventry (CV1)", region: "West Midlands",
    medianPrice: 195_000, growth5y: 21, crime: 80, schools: 7, transport: 8, green: 6, yield: 5.6,
    vibe: "Two universities, automotive heritage",
    pros: ["Strong student rental", "20 min to Birmingham", "Affordable entry"],
    cons: ["Older housing stock", "City centre rejuvenating slowly"],
    commute: C([null, null, null, null],[5, 20, 60, 20],[12, 30, null, 35],[15, 25, 110, 25]),
    schoolBreakdown: { primaryOfsted: 7.2, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Finham Park" },
    investment: { pricePerSqft: 245, pricePerSqftRegion: 280, yearlyGrowth: [3.4, 4.6, 5.4, 4.0, 3.0], rentalDemand: 90, voidWeeks: 1.6, capexPipeline: 72, affordabilityRatio: 6.2 },
  },
  {
    id: "wv1", name: "Wolverhampton (WV1)", region: "West Midlands",
    medianPrice: 165_000, growth5y: 16, crime: 82, schools: 6, transport: 7, green: 6, yield: 6.0,
    vibe: "Value market, manufacturing heritage",
    pros: ["Highest yields in region", "Tram + rail to Birmingham", "Cheap entry"],
    cons: ["Slower capital growth", "Mixed school provision"],
    commute: C([null, null, null, null],[5, 20, 110, 30],[15, 35, null, 45],[15, 30, 140, 30]),
    schoolBreakdown: { primaryOfsted: 6.8, secondaryOfsted: 6.4, pctOutstanding: 16, catchmentPremium: 5, topSchool: "Wolverhampton Girls' High" },
    investment: { pricePerSqft: 215, pricePerSqftRegion: 280, yearlyGrowth: [2.4, 3.0, 4.2, 3.0, 2.4], rentalDemand: 84, voidWeeks: 2.0, capexPipeline: 55, affordabilityRatio: 5.6 },
  },

  // ===================== EAST MIDLANDS =====================
  {
    id: "ng1", name: "Nottingham (NG1)", region: "East Midlands",
    medianPrice: 220_000, growth5y: 22, crime: 90, schools: 7, transport: 8, green: 7, yield: 5.8,
    vibe: "Two universities, tram network, creative",
    pros: ["Strong student & professional rental", "Tram-led centre", "Big regen at Broadmarsh"],
    cons: ["Crime above national avg", "Council finances strained"],
    commute: C([null, null, null, null],[5, 30, 110, 40],[12, 45, null, 55],[15, 40, 150, 35]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 22, catchmentPremium: 9, topSchool: "Nottingham High" },
    investment: { pricePerSqft: 285, pricePerSqftRegion: 280, yearlyGrowth: [3.6, 4.8, 5.6, 4.0, 3.2], rentalDemand: 92, voidWeeks: 1.4, capexPipeline: 80, affordabilityRatio: 6.8 },
  },
  {
    id: "le1", name: "Leicester (LE1)", region: "East Midlands",
    medianPrice: 215_000, growth5y: 19, crime: 78, schools: 7, transport: 7, green: 7, yield: 5.6,
    vibe: "Diverse, food capital, manufacturing",
    pros: ["Affordable entry", "Strong rental demand", "Improving city centre"],
    cons: ["Council financial pressure", "Some pollution hotspots"],
    commute: C([null, null, null, null],[5, 25, 70, 30],[12, 35, null, 45],[15, 35, 110, 25]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Beauchamp College" },
    investment: { pricePerSqft: 270, pricePerSqftRegion: 280, yearlyGrowth: [3.2, 4.0, 5.0, 3.6, 2.8], rentalDemand: 88, voidWeeks: 1.7, capexPipeline: 60, affordabilityRatio: 6.6 },
  },

  // ===================== YORKSHIRE & HUMBER =====================
  {
    id: "ls1", name: "Leeds City Centre (LS1)", region: "Yorkshire & Humber",
    medianPrice: 245_000, growth5y: 26, crime: 88, schools: 7, transport: 8, green: 6, yield: 5.6,
    vibe: "Northern Powerhouse, finance + media",
    pros: ["Channel 4 + finance HQs", "Strong young professional rental", "HS2 phase 2 prospects"],
    cons: ["High new-build supply pipeline", "Some areas crime hotspots"],
    commute: C([null, null, null, null],[5, 5, 130, 40],[12, 12, null, 55],[15, 15, 200, 35]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 24, catchmentPremium: 9, topSchool: "Leeds Grammar" },
    investment: { pricePerSqft: 320, pricePerSqftRegion: 270, yearlyGrowth: [4.2, 5.6, 6.4, 4.6, 3.4], rentalDemand: 94, voidWeeks: 1.3, capexPipeline: 85, affordabilityRatio: 7.4 },
  },
  {
    id: "s1", name: "Sheffield City Centre (S1)", region: "Yorkshire & Humber",
    medianPrice: 195_000, growth5y: 24, crime: 76, schools: 7, transport: 7, green: 9, yield: 5.8,
    vibe: "Steel-city reborn, Peak District-adjacent, students",
    pros: ["Two universities → strong rental", "Outdoor lifestyle", "Affordable entry"],
    cons: ["Hilly terrain", "Some tired commercial stock"],
    commute: C([null, null, null, null],[5, 40, 130, 60],[15, 50, null, 75],[15, 50, 200, 50]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Silverdale School" },
    investment: { pricePerSqft: 240, pricePerSqftRegion: 270, yearlyGrowth: [3.6, 5.0, 5.8, 4.2, 3.2], rentalDemand: 90, voidWeeks: 1.5, capexPipeline: 70, affordabilityRatio: 6.6 },
  },
  {
    id: "yo1", name: "York (YO1)", region: "Yorkshire & Humber",
    medianPrice: 320_000, growth5y: 18, crime: 50, schools: 8, transport: 7, green: 8, yield: 4.4,
    vibe: "Historic walled city, tourism + university",
    pros: ["High-speed to London 1h 50m", "Strong tourism demand", "Beautiful environment"],
    cons: ["Tourist congestion", "Tight planning constraints"],
    commute: C([null, null, null, null],[5, 30, 110, 50],[10, 40, null, 65],[15, 40, 200, 50]),
    schoolBreakdown: { primaryOfsted: 8.2, secondaryOfsted: 7.8, pctOutstanding: 30, catchmentPremium: 12, topSchool: "Fulford School" },
    investment: { pricePerSqft: 360, pricePerSqftRegion: 270, yearlyGrowth: [2.8, 3.6, 4.8, 3.6, 3.0], rentalDemand: 88, voidWeeks: 1.6, capexPipeline: 50, affordabilityRatio: 8.6 },
  },
  {
    id: "hu1", name: "Hull (HU1)", region: "Yorkshire & Humber",
    medianPrice: 130_000, growth5y: 14, crime: 92, schools: 6, transport: 6, green: 6, yield: 6.8,
    vibe: "Maritime, regeneration, freeport",
    pros: ["Highest yields in England", "Freeport investment", "Cheap entry"],
    cons: ["Slow capital growth", "Crime above avg"],
    commute: C([null, null, null, null],[5, 60, 160, 75],[12, 75, null, 90],[15, 75, 230, 60]),
    schoolBreakdown: { primaryOfsted: 6.6, secondaryOfsted: 6.2, pctOutstanding: 14, catchmentPremium: 4, topSchool: "Wolfreton School" },
    investment: { pricePerSqft: 165, pricePerSqftRegion: 270, yearlyGrowth: [2.0, 2.6, 3.6, 2.8, 2.4], rentalDemand: 80, voidWeeks: 2.4, capexPipeline: 65, affordabilityRatio: 4.4 },
  },

  // ===================== NORTH WEST =====================
  {
    id: "m1", name: "Manchester City Centre (M1)", region: "North West",
    medianPrice: 265_000, growth5y: 30, crime: 95, schools: 7, transport: 9, green: 5, yield: 6.0,
    vibe: "Northern Powerhouse, young, tech + media",
    pros: ["Highest growth of UK regional cities", "BBC + tech employer base", "Strong rental"],
    cons: ["High new-build pipeline", "Crime above avg"],
    commute: C([null, null, null, null],[5, 5, 125, 25],[12, 12, null, 35],[15, 15, 200, 25]),
    schoolBreakdown: { primaryOfsted: 7.2, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 9, topSchool: "Manchester Grammar" },
    investment: { pricePerSqft: 360, pricePerSqftRegion: 290, yearlyGrowth: [5.0, 6.4, 7.2, 5.4, 4.2], rentalDemand: 96, voidWeeks: 1.1, capexPipeline: 92, affordabilityRatio: 7.2 },
  },
  {
    id: "m20", name: "Didsbury, Manchester (M20)", region: "North West",
    medianPrice: 410_000, growth5y: 24, crime: 65, schools: 8, transport: 8, green: 8, yield: 4.8,
    vibe: "Leafy, professional, family + young pro mix",
    pros: ["Top schools for the city", "Strong tram links", "Affluent village feel"],
    cons: ["Premium for the region", "Parking pressure on village strips"],
    commute: C([null, null, null, null],[15, 15, 140, 20],[20, 20, null, 35],[20, 20, 220, 20]),
    schoolBreakdown: { primaryOfsted: 8.4, secondaryOfsted: 8.0, pctOutstanding: 32, catchmentPremium: 14, topSchool: "Parrs Wood High" },
    investment: { pricePerSqft: 420, pricePerSqftRegion: 290, yearlyGrowth: [3.8, 5.0, 6.0, 4.6, 3.6], rentalDemand: 92, voidWeeks: 1.3, capexPipeline: 60, affordabilityRatio: 9.2 },
  },
  {
    id: "l1", name: "Liverpool City Centre (L1)", region: "North West",
    medianPrice: 180_000, growth5y: 22, crime: 88, schools: 6, transport: 8, green: 6, yield: 6.4,
    vibe: "Music + maritime heritage, regen-driven",
    pros: ["Very strong yields", "Big regen pipeline (Liverpool Waters)", "Cultural depth"],
    cons: ["Some scheme oversupply risk", "School ratings mixed"],
    commute: C([null, null, null, null],[5, 35, 130, 30],[12, 45, null, 45],[15, 45, 200, 25]),
    schoolBreakdown: { primaryOfsted: 6.8, secondaryOfsted: 6.4, pctOutstanding: 18, catchmentPremium: 6, topSchool: "Liverpool Blue Coat" },
    investment: { pricePerSqft: 240, pricePerSqftRegion: 290, yearlyGrowth: [3.6, 5.0, 6.0, 4.4, 3.0], rentalDemand: 90, voidWeeks: 1.6, capexPipeline: 88, affordabilityRatio: 5.8 },
  },
  {
    id: "ch1", name: "Chester (CH1)", region: "North West",
    medianPrice: 285_000, growth5y: 16, crime: 55, schools: 8, transport: 7, green: 8, yield: 4.6,
    vibe: "Roman walled city, affluent commuter to Manchester/Liverpool",
    pros: ["Beautiful heritage", "Top regional schools", "Strong professional base"],
    cons: ["Tourist congestion", "Slower London connectivity"],
    commute: C([null, null, null, null],[5, 50, 130, 20],[10, 60, null, 35],[15, 60, 220, 25]),
    schoolBreakdown: { primaryOfsted: 8.2, secondaryOfsted: 7.8, pctOutstanding: 30, catchmentPremium: 12, topSchool: "Queen's Park High" },
    investment: { pricePerSqft: 320, pricePerSqftRegion: 290, yearlyGrowth: [2.6, 3.4, 4.4, 3.2, 2.6], rentalDemand: 86, voidWeeks: 1.8, capexPipeline: 50, affordabilityRatio: 7.8 },
  },

  // ===================== NORTH EAST =====================
  {
    id: "ne1", name: "Newcastle City Centre (NE1)", region: "North East",
    medianPrice: 195_000, growth5y: 18, crime: 88, schools: 7, transport: 8, green: 6, yield: 6.2,
    vibe: "Tyneside vibrancy, two universities",
    pros: ["High yield + affordable entry", "Strong student rental", "Quayside regen"],
    cons: ["Slow capital growth", "Long London journey"],
    commute: C([null, null, null, null],[5, 5, 170, 25],[12, 12, null, 40],[15, 15, 280, 25]),
    schoolBreakdown: { primaryOfsted: 7.2, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Royal Grammar Newcastle" },
    investment: { pricePerSqft: 235, pricePerSqftRegion: 220, yearlyGrowth: [2.6, 3.4, 4.6, 3.4, 2.8], rentalDemand: 90, voidWeeks: 1.5, capexPipeline: 75, affordabilityRatio: 6.0 },
  },
  {
    id: "dh1", name: "Durham (DH1)", region: "North East",
    medianPrice: 215_000, growth5y: 16, crime: 50, schools: 8, transport: 7, green: 8, yield: 5.4,
    vibe: "Historic university city",
    pros: ["Russell Group university → solid rental", "Heritage charm", "Affordable"],
    cons: ["Small employer base outside uni", "Tight student-let regulation"],
    commute: C([null, null, null, null],[5, 15, 175, 30],[10, 20, null, 45],[15, 20, 280, 30]),
    schoolBreakdown: { primaryOfsted: 8.0, secondaryOfsted: 7.6, pctOutstanding: 28, catchmentPremium: 11, topSchool: "Durham Johnston" },
    investment: { pricePerSqft: 260, pricePerSqftRegion: 220, yearlyGrowth: [2.4, 3.0, 4.0, 3.0, 2.6], rentalDemand: 88, voidWeeks: 1.6, capexPipeline: 50, affordabilityRatio: 6.6 },
  },

  // ===================== WALES =====================
  {
    id: "cf10", name: "Cardiff City Centre (CF10)", region: "Wales",
    medianPrice: 235_000, growth5y: 22, crime: 80, schools: 7, transport: 8, green: 7, yield: 5.4,
    vibe: "Welsh capital, sport + media + young pro",
    pros: ["BBC Wales + creative cluster", "Strong regen at Bay", "Affordable capital city"],
    cons: ["Match-day congestion", "Older housing stock in pockets"],
    commute: C([null, null, null, null],[5, 5, 110, 25],[12, 12, null, 40],[15, 15, 180, 25]),
    schoolBreakdown: { primaryOfsted: 7.6, secondaryOfsted: 7.2, pctOutstanding: 24, catchmentPremium: 10, topSchool: "Cardiff High" },
    investment: { pricePerSqft: 285, pricePerSqftRegion: 230, yearlyGrowth: [3.4, 4.4, 5.4, 4.0, 3.0], rentalDemand: 90, voidWeeks: 1.5, capexPipeline: 75, affordabilityRatio: 7.2 },
  },
  {
    id: "sa1", name: "Swansea (SA1)", region: "Wales",
    medianPrice: 175_000, growth5y: 18, crime: 78, schools: 7, transport: 6, green: 8, yield: 5.6,
    vibe: "Coastal university city, Gower-adjacent",
    pros: ["Beach & AONB on doorstep", "Affordable entry", "Strong student demand"],
    cons: ["Slower London links", "Limited large employers"],
    commute: C([null, null, null, null],[5, 50, 180, 65],[12, 60, null, 80],[15, 60, 260, 60]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Bishop Gore" },
    investment: { pricePerSqft: 225, pricePerSqftRegion: 230, yearlyGrowth: [2.8, 3.6, 4.6, 3.4, 2.6], rentalDemand: 84, voidWeeks: 1.8, capexPipeline: 55, affordabilityRatio: 6.4 },
  },

  // ===================== SCOTLAND =====================
  {
    id: "eh1", name: "Edinburgh New Town (EH1)", region: "Scotland",
    medianPrice: 425_000, growth5y: 20, crime: 60, schools: 8, transport: 8, green: 8, yield: 4.6,
    vibe: "Georgian capital, finance + festival city",
    pros: ["UNESCO heritage", "Strong finance + tech employer base", "Tourist + festival demand"],
    cons: ["Short-let regulation tightening", "Premium to rest of Scotland"],
    commute: C([null, null, null, null],[5, 5, 270, 25],[12, 12, null, 35],[15, 15, 410, 30]),
    schoolBreakdown: { primaryOfsted: 8.2, secondaryOfsted: 7.8, pctOutstanding: 30, catchmentPremium: 13, topSchool: "James Gillespie's High" },
    investment: { pricePerSqft: 460, pricePerSqftRegion: 280, yearlyGrowth: [3.2, 4.2, 5.2, 4.0, 3.4], rentalDemand: 92, voidWeeks: 1.4, capexPipeline: 60, affordabilityRatio: 9.4 },
  },
  {
    id: "g1", name: "Glasgow City Centre (G1)", region: "Scotland",
    medianPrice: 195_000, growth5y: 22, crime: 90, schools: 7, transport: 8, green: 7, yield: 6.0,
    vibe: "Largest Scottish city, music + design",
    pros: ["High yield", "Affordable entry", "Strong cultural scene"],
    cons: ["Crime above avg in pockets", "Tenement maintenance burden"],
    commute: C([null, null, null, null],[5, 5, 270, 20],[12, 12, null, 30],[15, 15, 410, 20]),
    schoolBreakdown: { primaryOfsted: 7.2, secondaryOfsted: 6.8, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Hutchesons' Grammar" },
    investment: { pricePerSqft: 240, pricePerSqftRegion: 280, yearlyGrowth: [3.6, 4.8, 5.6, 4.2, 3.2], rentalDemand: 92, voidWeeks: 1.4, capexPipeline: 75, affordabilityRatio: 5.8 },
  },
  {
    id: "ab10", name: "Aberdeen (AB10)", region: "Scotland",
    medianPrice: 165_000, growth5y: -4, crime: 65, schools: 7, transport: 6, green: 7, yield: 6.4,
    vibe: "Granite city, energy capital in transition",
    pros: ["Highest yields in Scotland", "Energy transition jobs", "Cheap entry"],
    cons: ["Negative recent growth", "Oil-price exposed economy"],
    commute: C([null, null, null, null],[5, 100, 420, 20],[12, 110, null, 30],[15, 100, 540, 25]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.0, pctOutstanding: 22, catchmentPremium: 8, topSchool: "Aberdeen Grammar" },
    investment: { pricePerSqft: 195, pricePerSqftRegion: 280, yearlyGrowth: [-3.0, -1.5, 0.5, 1.0, -1.0], rentalDemand: 78, voidWeeks: 2.6, capexPipeline: 55, affordabilityRatio: 4.8 },
  },

  // ===================== NORTHERN IRELAND =====================
  {
    id: "bt1", name: "Belfast City Centre (BT1)", region: "Northern Ireland",
    medianPrice: 175_000, growth5y: 28, crime: 70, schools: 7, transport: 7, green: 7, yield: 6.0,
    vibe: "Post-conflict regen, tech + film",
    pros: ["Highest UK regional growth recently", "Tech & film cluster", "Affordable entry"],
    cons: ["Political volatility risk", "Smaller liquidity"],
    commute: C([null, null, null, null],[5, 5, null, 25],[12, 12, null, 35],[15, 15, null, 25]),
    schoolBreakdown: { primaryOfsted: 7.4, secondaryOfsted: 7.2, pctOutstanding: 26, catchmentPremium: 10, topSchool: "Methodist College" },
    investment: { pricePerSqft: 220, pricePerSqftRegion: 200, yearlyGrowth: [4.4, 6.0, 7.0, 5.4, 3.8], rentalDemand: 90, voidWeeks: 1.6, capexPipeline: 80, affordabilityRatio: 5.6 },
  },
];

// ============ Scoring helpers ============

export const commuteScore = (mins: number | null): number => {
  if (mins == null) return 0;
  if (mins <= 25) return 100;
  if (mins >= 75) return 10;
  return Math.round(100 - ((mins - 25) / 50) * 90);
};

export const schoolImpactScore = (s: SchoolBreakdown): number => {
  const ofstedAvg = (s.primaryOfsted + s.secondaryOfsted) / 2;
  const ofstedPts = (ofstedAvg / 10) * 50;
  const outstandingPts = (s.pctOutstanding / 100) * 30;
  const catchmentPts = Math.min(s.catchmentPremium / 20, 1) * 20;
  return Math.round(ofstedPts + outstandingPts + catchmentPts);
};

export const cagr = (yearly: number[]): number => {
  if (!yearly.length) return 0;
  const factor = yearly.reduce((a, y) => a * (1 + y / 100), 1);
  const sign = factor < 0 ? -1 : 1;
  return +((sign * (Math.pow(Math.abs(factor), 1 / yearly.length) - 1)) * 100).toFixed(2);
};

export const cumulativeGrowth = (yearly: number[]): number => {
  const factor = yearly.reduce((a, y) => a * (1 + y / 100), 1);
  return +(((factor - 1) * 100).toFixed(1));
};

export const valueGap = (i: InvestmentProfile): number =>
  +(((i.pricePerSqftRegion - i.pricePerSqft) / i.pricePerSqftRegion) * 100).toFixed(1);

export const investmentScore = (a: Area): number => {
  const i = a.investment;
  const growthPts = Math.max(0, Math.min(cagr(i.yearlyGrowth) / 8, 1)) * 25;
  const yieldPts = Math.min(a.yield / 6, 1) * 20;
  const demandPts = (i.rentalDemand / 100) * 15;
  const voidPts = Math.max(0, 1 - i.voidWeeks / 6) * 10;
  const capexPts = (i.capexPipeline / 100) * 15;
  const valuePts = Math.max(0, Math.min(valueGap(i) / 15 + 0.5, 1)) * 15;
  return Math.round(growthPts + yieldPts + demandPts + voidPts + capexPts + valuePts);
};

// ============ Synthetic UK-wide dataset ============
// Deterministic generator so search/filter stays fast and stable across renders.

interface RegionBenchmark {
  region: RegionName;
  pricePerSqft: number;     // regional median £/sqft
  medianPrice: number;       // typical 2-bed-ish median
  yield: number;             // typical gross yield %
  growth5y: number;          // typical 5y headline growth %
  cityCentreCommute: number; // mins to local city/town centre by rail
  regionalHubCommute: number;// mins to nearest regional hub
  londonCommute: number | null;
  airportCommute: number;
  hub: string;
}

const REGION_BENCH: RegionBenchmark[] = [
  { region: "Greater London",     pricePerSqft: 760, medianPrice: 535_000, yield: 4.0, growth5y: 18, cityCentreCommute: 25, regionalHubCommute: 25, londonCommute: 30, airportCommute: 50, hub: "Central London" },
  { region: "South East",         pricePerSqft: 470, medianPrice: 395_000, yield: 4.2, growth5y: 17, cityCentreCommute: 12, regionalHubCommute: 35, londonCommute: 55, airportCommute: 40, hub: "London / Brighton" },
  { region: "South West",         pricePerSqft: 400, medianPrice: 320_000, yield: 4.6, growth5y: 19, cityCentreCommute: 12, regionalHubCommute: 30, londonCommute: 130, airportCommute: 45, hub: "Bristol" },
  { region: "East of England",    pricePerSqft: 440, medianPrice: 360_000, yield: 4.4, growth5y: 17, cityCentreCommute: 10, regionalHubCommute: 25, londonCommute: 50, airportCommute: 40, hub: "Cambridge / London" },
  { region: "East Midlands",      pricePerSqft: 280, medianPrice: 235_000, yield: 5.2, growth5y: 18, cityCentreCommute: 12, regionalHubCommute: 30, londonCommute: 90, airportCommute: 35, hub: "Nottingham" },
  { region: "West Midlands",      pricePerSqft: 290, medianPrice: 245_000, yield: 5.4, growth5y: 19, cityCentreCommute: 12, regionalHubCommute: 25, londonCommute: 85, airportCommute: 30, hub: "Birmingham" },
  { region: "Yorkshire & Humber", pricePerSqft: 250, medianPrice: 210_000, yield: 5.6, growth5y: 17, cityCentreCommute: 12, regionalHubCommute: 30, londonCommute: 130, airportCommute: 35, hub: "Leeds" },
  { region: "North West",         pricePerSqft: 285, medianPrice: 235_000, yield: 5.8, growth5y: 22, cityCentreCommute: 12, regionalHubCommute: 25, londonCommute: 130, airportCommute: 30, hub: "Manchester" },
  { region: "North East",         pricePerSqft: 220, medianPrice: 175_000, yield: 6.0, growth5y: 14, cityCentreCommute: 12, regionalHubCommute: 30, londonCommute: 180, airportCommute: 35, hub: "Newcastle" },
  { region: "Wales",              pricePerSqft: 240, medianPrice: 205_000, yield: 5.4, growth5y: 18, cityCentreCommute: 12, regionalHubCommute: 35, londonCommute: 140, airportCommute: 40, hub: "Cardiff" },
  { region: "Scotland",           pricePerSqft: 280, medianPrice: 210_000, yield: 5.6, growth5y: 16, cityCentreCommute: 12, regionalHubCommute: 40, londonCommute: 270, airportCommute: 30, hub: "Edinburgh / Glasgow" },
  { region: "Northern Ireland",   pricePerSqft: 200, medianPrice: 175_000, yield: 5.8, growth5y: 24, cityCentreCommute: 12, regionalHubCommute: 25, londonCommute: null, airportCommute: 30, hub: "Belfast" },
];

// Real UK postcode districts → one Area per real district. No suffix duplication.
import { UK_DISTRICTS } from "./ukPostcodeDistricts";

// Cheap deterministic hash → 0..1
function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function jitter(seed: string, salt: string, spread: number, centre = 0): number {
  return centre + (hash01(seed + salt) - 0.5) * 2 * spread;
}

// District-level price bias: central districts (lower numeric/letter suffix) cost more.
function districtBias(code: string): number {
  // Pull the trailing numeric portion; small numbers ≈ central, large ≈ outer.
  const m = code.match(/^[A-Z]+(\d+)/);
  const n = m ? parseInt(m[1], 10) : 5;
  if (n <= 2) return 0.18;
  if (n <= 5) return 0.08;
  if (n <= 10) return 0.0;
  if (n <= 20) return -0.04;
  if (n <= 40) return -0.08;
  return -0.12;
}

function buildSyntheticArea(region: RegionName, code: string, place: string): Area {
  const bench = REGION_BENCH.find((b) => b.region === region)!;
  const seed = `${region}|${code}`;
  const bias = districtBias(code);
  const localK = 1 + bias + jitter(seed, "k", 0.14);

  const pricePerSqft = Math.round(bench.pricePerSqft * localK);
  const medianPrice = Math.round(bench.medianPrice * localK / 1000) * 1000;
  const yieldPct = +Math.max(2.5, Math.min(7.5, bench.yield + jitter(seed, "y", 1.0) - bias * 4)).toFixed(1);
  const growth5y = Math.round(bench.growth5y + jitter(seed, "g", 6) + bias * 18);

  const yearlyGrowth = Array.from({ length: 5 }, (_, k) =>
    +(growth5y / 5 + jitter(seed, "yr" + k, 1.4)).toFixed(1),
  );

  const crime = Math.round(40 + jitter(seed, "c", 35) - bias * 25);
  const schools = Math.max(4, Math.min(10, Math.round(7 + jitter(seed, "s", 2) + bias * 6)));
  const transport = Math.max(4, Math.min(10, Math.round(7 + jitter(seed, "t", 2) + bias * 4)));
  const green = Math.max(4, Math.min(10, Math.round(7 + jitter(seed, "gr", 2))));

  const cmt = (base: number | null, salt: string, spread = 8) =>
    base == null ? null : Math.max(5, Math.round(base + jitter(seed, salt, spread)));

  const commute: CommuteTimes = C(
    [null, null, null, null],
    [cmt(bench.cityCentreCommute, "rc"), cmt(bench.regionalHubCommute, "rh", 12), cmt(bench.londonCommute, "rl", 20), cmt(bench.airportCommute, "ra", 12)],
    [cmt(bench.cityCentreCommute, "cc"), cmt(bench.regionalHubCommute, "ch", 15), null, cmt(bench.airportCommute, "ca", 15)],
    [cmt(bench.cityCentreCommute, "dc", 5), cmt(bench.regionalHubCommute, "dh", 15), cmt(bench.londonCommute, "dl", 25), cmt(bench.airportCommute, "da", 12)],
  );

  const primaryOfsted = +Math.max(5, Math.min(10, 7.5 + jitter(seed, "po", 1.2) + bias * 4)).toFixed(1);
  const secondaryOfsted = +Math.max(5, Math.min(10, primaryOfsted - 0.3 + jitter(seed, "so", 0.6))).toFixed(1);
  const pctOutstanding = Math.max(8, Math.min(60, Math.round(25 + jitter(seed, "out", 16) + bias * 45)));
  const catchmentPremium = Math.max(2, Math.min(25, Math.round(10 + jitter(seed, "cp", 8) + bias * 28)));

  const investment: InvestmentProfile = {
    pricePerSqft,
    pricePerSqftRegion: bench.pricePerSqft,
    yearlyGrowth,
    rentalDemand: Math.max(55, Math.min(98, Math.round(82 + jitter(seed, "rd", 14)))),
    voidWeeks: +Math.max(0.8, Math.min(4.5, 1.8 + jitter(seed, "vw", 1.4))).toFixed(1),
    capexPipeline: Math.max(20, Math.min(95, Math.round(60 + jitter(seed, "cx", 30)))),
    affordabilityRatio: +Math.max(4, Math.min(15, medianPrice / Math.max(28000, 36000 - bias * 10000))).toFixed(1),
  };

  return {
    id: code.toLowerCase(),
    name: `${place} (${code})`,
    region,
    medianPrice,
    growth5y,
    crime: Math.max(20, Math.min(100, crime)),
    schools,
    transport,
    green,
    yield: yieldPct,
    vibe: `${region} · ${code} postcode district`,
    pros: [
      `Covers ${place}`,
      `${bench.hub} hub access`,
      growth5y > 18 ? "Above-region growth" : "Stable demand",
    ],
    cons: [
      pricePerSqft > bench.pricePerSqft ? "Above-region pricing" : "Mixed regeneration pace",
      crime > 70 ? "Crime above national avg" : "Limited new-build supply",
    ],
    commute,
    schoolBreakdown: {
      primaryOfsted,
      secondaryOfsted,
      pctOutstanding,
      catchmentPremium,
      topSchool: `${place} community school`,
    },
    investment,
    provenance: "synthetic",
  };
}

function buildSyntheticDataset(): Area[] {
  const out: Area[] = [];
  const seen = new Set<string>(CURATED_AREAS.map((a) => a.id.toLowerCase()));
  (Object.keys(UK_DISTRICTS) as RegionName[]).forEach((region) => {
    UK_DISTRICTS[region].forEach(([code, place]) => {
      const id = code.toLowerCase();
      if (seen.has(id)) return;
      seen.add(id);
      out.push(buildSyntheticArea(region, code, place));
    });
  });
  return out;
}

const SYNTHETIC_AREAS: Area[] = buildSyntheticDataset();

export const AREAS: Area[] = [
  ...CURATED_AREAS.map((a) => ({ ...a, provenance: "curated" as const })),
  ...SYNTHETIC_AREAS,
];


