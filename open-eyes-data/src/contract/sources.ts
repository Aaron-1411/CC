/**
 * Shared Contract — Data sources & licences.
 *
 * Every upstream the app reads from is registered here exactly once, with its
 * correct licence. UI footers and the /methodology page render from this registry.
 * Nobody redefines a source inline.
 */

export type LicenceId = "OGL-3.0" | "OPL" | "PUBLISHER" | "OTHER";

export interface DataSource {
  id: string; // stable key, e.g. "ons-ltim", "parliament-petitions"
  name: string; // human name, e.g. "ONS Long-Term International Migration"
  homepage: string;
  termsUrl: string; // link to the provider's licence/terms page
  licence: LicenceId; // verified per provider — Parliament APIs are OPL, not OGL
  cadence: string; // human-readable: "monthly", "quarterly", "live", "annual"
}

export const LICENCE_LABELS: Record<LicenceId, string> = {
  "OGL-3.0": "Open Government Licence v3.0",
  OPL: "Open Parliament Licence",
  PUBLISHER: "Publisher copyright (headlines/links only)",
  OTHER: "See provider terms",
};

export const LICENCE_URLS: Record<LicenceId, string> = {
  "OGL-3.0": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
  OPL: "https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/",
  PUBLISHER: "",
  OTHER: "",
};

/**
 * The source registry. `id` is the foreign key used by SourcedStat.sourceId
 * and FreshnessMeta.sourceId. Licences verified 2026-06-12.
 */
export const SOURCES = {
  "ons-ltim": {
    id: "ons-ltim",
    name: "ONS Long-Term International Migration",
    homepage:
      "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "twice yearly",
  },
  "ons-economy": {
    id: "ons-economy",
    name: "ONS Economic Indicators (GDP, CPI, labour market)",
    homepage: "https://www.ons.gov.uk/economy",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "monthly/quarterly on release calendar",
  },
  "nhs-england": {
    id: "nhs-england",
    name: "NHS England Statistics",
    homepage: "https://www.england.nhs.uk/statistics/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "monthly",
  },
  "ea-edm": {
    id: "ea-edm",
    name: "Environment Agency Storm Overflow (EDM) Annual Returns",
    homepage:
      "https://www.gov.uk/government/news/environment-agency-storm-overflow-spill-data-for-2024",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "annual",
  },
  "homeoffice-stop-search": {
    id: "homeoffice-stop-search",
    name: "Home Office / Ethnicity Facts & Figures — Stop & Search",
    homepage:
      "https://www.ethnicity-facts-figures.service.gov.uk/crime-justice-and-the-law/policing/stop-and-search/latest/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "annual",
  },
  "police-uk": {
    id: "police-uk",
    name: "data.police.uk",
    homepage: "https://data.police.uk/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "monthly",
  },
  "dfe-workforce": {
    id: "dfe-workforce",
    name: "DfE School Workforce Census",
    homepage:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "annual",
  },
  "mhclg-housing": {
    id: "mhclg-housing",
    name: "MHCLG Net Additional Dwellings / Housing Supply",
    homepage: "https://www.gov.uk/government/collections/net-supply-of-housing",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "annual",
  },
  obr: {
    id: "obr",
    name: "Office for Budget Responsibility",
    homepage: "https://obr.uk/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "per fiscal event",
  },
  "parliament-petitions": {
    id: "parliament-petitions",
    name: "UK Government & Parliament Petitions",
    homepage: "https://petition.parliament.uk/",
    termsUrl: LICENCE_URLS.OPL,
    licence: "OPL",
    cadence: "live",
  },
  "parliament-bills": {
    id: "parliament-bills",
    name: "UK Parliament Bills API",
    homepage: "https://bills-api.parliament.uk/",
    termsUrl: LICENCE_URLS.OPL,
    licence: "OPL",
    cadence: "live",
  },
  "parliament-members": {
    id: "parliament-members",
    name: "UK Parliament Members API",
    homepage: "https://members-api.parliament.uk/",
    termsUrl: LICENCE_URLS.OPL,
    licence: "OPL",
    cadence: "live",
  },
  "parliament-votes": {
    id: "parliament-votes",
    name: "Commons Votes API",
    homepage: "https://commonsvotes-api.parliament.uk/",
    termsUrl: LICENCE_URLS.OPL,
    licence: "OPL",
    cadence: "live",
  },
  "parliament-committees": {
    id: "parliament-committees",
    name: "UK Parliament Committees API",
    homepage: "https://committees-api.parliament.uk/",
    termsUrl: LICENCE_URLS.OPL,
    licence: "OPL",
    cadence: "live",
  },
  "contracts-finder": {
    id: "contracts-finder",
    name: "Contracts Finder",
    homepage: "https://www.contractsfinder.service.gov.uk/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "live",
  },
  "electoral-commission": {
    id: "electoral-commission",
    name: "Electoral Commission — Donations & Loans",
    homepage: "https://search.electoralcommission.org.uk/",
    termsUrl: "https://www.electoralcommission.org.uk/privacy-policy/terms-and-conditions",
    licence: "OTHER",
    cadence: "quarterly",
  },
  ipsa: {
    id: "ipsa",
    name: "IPSA — MP Business Costs & Expenses",
    homepage: "https://www.theipsa.org.uk/",
    termsUrl: "https://www.theipsa.org.uk/terms-and-conditions",
    licence: "OTHER",
    cadence: "bi-monthly",
  },
  "dwp-sanctions": {
    id: "dwp-sanctions",
    name: "DWP Universal Credit Sanctions (Stat-Xplore)",
    homepage: "https://www.gov.uk/government/collections/jobseekers-allowance-sanctions",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "quarterly",
  },
  "govuk-search": {
    id: "govuk-search",
    name: "GOV.UK Search API (departmental publications)",
    homepage: "https://www.gov.uk/",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "live",
  },
  acoba: {
    id: "acoba",
    name: "Advisory Committee on Business Appointments (ACOBA)",
    homepage:
      "https://www.gov.uk/government/organisations/advisory-committee-on-business-appointments",
    termsUrl: LICENCE_URLS["OGL-3.0"],
    licence: "OGL-3.0",
    cadence: "live",
  },
  "postcodes-io": {
    id: "postcodes-io",
    name: "postcodes.io (ONS open data)",
    homepage: "https://postcodes.io/",
    termsUrl: "https://postcodes.io/about",
    licence: "OGL-3.0",
    cadence: "live",
  },
} satisfies Record<string, DataSource>;

export type SourceId = keyof typeof SOURCES;

export function getSource(id: SourceId): DataSource {
  return SOURCES[id];
}
