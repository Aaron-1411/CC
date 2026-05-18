// Central registry of live-data citations used across every score trace.
// Each citation describes the dataset, the refresh cadence/last-updated date,
// and exactly which fields from the dataset feed which derived score input.
//
// The registry is keyed by short slugs that ScoreTrace.source strings reference
// via substring match (so we don't have to refactor every trace constructor).

export interface Citation {
  id: string;
  dataset: string;             // canonical dataset name
  publisher: string;           // who runs / owns the data
  url: string;
  refresh: string;             // human-readable cadence
  lastUpdated: string;         // YYYY-MM or YYYY-MM-DD
  licence: string;
  /** Field-level mapping: dataset field -> internal score input it powers */
  fieldMapping: { datasetField: string; mappedTo: string }[];
}

export const CITATIONS: Record<string, Citation> = {
  landRegistryPPD: {
    id: "landRegistryPPD",
    dataset: "HM Land Registry - Price Paid Data",
    publisher: "HM Land Registry",
    url: "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads",
    refresh: "Monthly",
    lastUpdated: "2025-09",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "price_paid", mappedTo: "AVM comparable soldPrice · area medianPrice" },
      { datasetField: "transfer_date", mappedTo: "AVM recency weighting · 12mo rolling median" },
      { datasetField: "postcode", mappedTo: "Subject ↔ comp distance pairing" },
      { datasetField: "property_type", mappedTo: "Comp eligibility filter (D/S/T/F)" },
    ],
  },
  onsHPI: {
    id: "onsHPI",
    dataset: "ONS UK House Price Index",
    publisher: "Office for National Statistics",
    url: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest",
    refresh: "Monthly",
    lastUpdated: "2025-09",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "hpi_index", mappedTo: "investment.yearlyGrowth · 5y growth composite" },
      { datasetField: "average_price", mappedTo: "Regional £/sqft anchor for AVM" },
    ],
  },
  onsPRMS: {
    id: "onsPRMS",
    dataset: "ONS Private Rental Market Statistics + Zoopla rental indices",
    publisher: "ONS / Zoopla",
    url: "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/privaterentalaffordabilityengland/latest",
    refresh: "Quarterly",
    lastUpdated: "2025-08",
    licence: "OGL v3.0 / Zoopla T&Cs",
    fieldMapping: [
      { datasetField: "median_rent_2bed", mappedTo: "Gross rental yield" },
      { datasetField: "void_weeks", mappedTo: "investment.voidWeeks · supply pressure" },
      { datasetField: "rental_demand_index", mappedTo: "Demographic momentum" },
    ],
  },
  onsEarnings: {
    id: "onsEarnings",
    dataset: "ONS Annual Survey of Hours and Earnings (ASHE)",
    publisher: "Office for National Statistics",
    url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/latest",
    refresh: "Annual",
    lastUpdated: "2025-04",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "median_gross_annual_pay", mappedTo: "Affordability ratio (price ÷ income)" },
    ],
  },
  policeUk: {
    id: "policeUk",
    dataset: "data.police.uk Street-level crime",
    publisher: "Home Office / police forces",
    url: "https://data.police.uk/",
    refresh: "Monthly",
    lastUpdated: "2025-08",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "all_crime_count", mappedTo: "Safety score · area.crime per 1,000" },
      { datasetField: "lsoa_code", mappedTo: "Geographic match to subject postcode" },
    ],
  },
  ofsted: {
    id: "ofsted",
    dataset: "Ofsted state-funded school ratings + DfE performance tables",
    publisher: "Ofsted / DfE",
    url: "https://www.gov.uk/government/organisations/ofsted",
    refresh: "Termly",
    lastUpdated: "2025-07",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "overall_effectiveness", mappedTo: "Primary/Secondary Ofsted scores" },
      { datasetField: "progress_8", mappedTo: "Catchment quality weighting" },
      { datasetField: "outstanding_pct", mappedTo: "% schools rated Outstanding" },
    ],
  },
  dftPTAL: {
    id: "dftPTAL",
    dataset: "DfT PTAL + National Rail timetable + TfL Journey Planner",
    publisher: "DfT / TfL / Network Rail",
    url: "https://tfl.gov.uk/info-for/urban-planning-and-construction/planning-with-webcat/webcat",
    refresh: "Annually (PTAL) · Live (timetables)",
    lastUpdated: "2025-06",
    licence: "OGL v3.0 / TfL Open Data",
    fieldMapping: [
      { datasetField: "ptal_band", mappedTo: "Area transport score" },
      { datasetField: "journey_minutes", mappedTo: "Commute to London / regional hub" },
    ],
  },
  epcOpen: {
    id: "epcOpen",
    dataset: "EPC Open Data (Domestic)",
    publisher: "DLUHC / Open Data Communities",
    url: "https://epc.opendatacommunities.org/",
    refresh: "Quarterly",
    lastUpdated: "2025-08",
    licence: "Open Government Licence v3.0",
    fieldMapping: [
      { datasetField: "current_energy_rating", mappedTo: "AVM EPC adjustment · Property condition" },
      { datasetField: "total_floor_area", mappedTo: "Subject sqft / comp sqft" },
      { datasetField: "construction_age_band", mappedTo: "Age penalty in AVM" },
    ],
  },
  osGreenspace: {
    id: "osGreenspace",
    dataset: "OS Open Greenspace + ONS Access to Greenspace",
    publisher: "Ordnance Survey / ONS",
    url: "https://www.ordnancesurvey.co.uk/products/os-open-greenspace",
    refresh: "Bi-annual",
    lastUpdated: "2025-04",
    licence: "OS OpenData Licence",
    fieldMapping: [
      { datasetField: "park_hectares_1km", mappedTo: "Green-space score" },
      { datasetField: "tree_canopy_pct", mappedTo: "Green-space score (blended)" },
    ],
  },
  egiCoStar: {
    id: "egiCoStar",
    dataset: "EGi / CoStar Regeneration Pipeline",
    publisher: "CoStar Group",
    url: "https://www.costar.com/",
    refresh: "Monthly",
    lastUpdated: "2025-08",
    licence: "Commercial subscription",
    fieldMapping: [
      { datasetField: "scheme_capex_gbp", mappedTo: "investment.capexPipeline" },
      { datasetField: "completion_year", mappedTo: "Regeneration time-decay weighting" },
    ],
  },
  osPOI: {
    id: "osPOI",
    dataset: "OS Points of Interest + area vibe descriptors",
    publisher: "Ordnance Survey",
    url: "https://www.ordnancesurvey.co.uk/products/points-of-interest",
    refresh: "Quarterly",
    lastUpdated: "2025-06",
    licence: "OS commercial licence",
    fieldMapping: [
      { datasetField: "poi_category (bar/restaurant/venue)", mappedTo: "Nightlife & culture score" },
    ],
  },
  rightmoveCatchment: {
    id: "rightmoveCatchment",
    dataset: "Rightmove catchment premium index",
    publisher: "Rightmove plc",
    url: "https://www.rightmove.co.uk/",
    refresh: "Monthly",
    lastUpdated: "2025-07",
    licence: "Commercial",
    fieldMapping: [
      { datasetField: "catchment_premium_pct", mappedTo: "School quality (premium component)" },
    ],
  },
};

/** Match a ScoreTrace.source string to one or more citation entries. */
export const citationsForSource = (source: string): Citation[] => {
  const s = source.toLowerCase();
  const hits: Citation[] = [];
  const test = (id: keyof typeof CITATIONS, patterns: string[]) => {
    if (patterns.some((p) => s.includes(p))) hits.push(CITATIONS[id]);
  };
  test("landRegistryPPD", ["land registry", "price paid", "£psqft", "£/sqft"]);
  test("onsHPI", ["ons hpi", "house price index", "ons "]);
  test("onsPRMS", ["prms", "zoopla", "rental"]);
  test("onsEarnings", ["earnings", "income"]);
  test("policeUk", ["police.uk", "police", "crime"]);
  test("ofsted", ["ofsted", "dfe"]);
  test("dftPTAL", ["ptal", "dft", "tfl", "national rail", "journey planner"]);
  test("epcOpen", ["epc"]);
  test("osGreenspace", ["greenspace", "green-space", "tree canopy"]);
  test("egiCoStar", ["regen", "costar", "egi", "capex"]);
  test("osPOI", ["poi", "vibe"]);
  test("rightmoveCatchment", ["rightmove", "catchment"]);
  // de-duplicate
  return Array.from(new Map(hits.map((c) => [c.id, c])).values());
};

/** Resolve unique citations across many sources (e.g. all factor traces). */
export const resolveCitations = (sources: string[]): Citation[] => {
  const map = new Map<string, Citation>();
  for (const src of sources) for (const c of citationsForSource(src)) map.set(c.id, c);
  return Array.from(map.values());
};
