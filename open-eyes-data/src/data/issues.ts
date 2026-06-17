/**
 * Issue hub definitions — each issue aggregates party pledges, live data,
 * news, related tools, and action prompts into one place.
 */

import type { SourcedStat } from "@/contract/stats";

export type IssueKey =
  | "nhs"
  | "housing"
  | "economy"
  | "crime"
  | "environment"
  | "immigration"
  | "education";

export type IssueDef = {
  key: IssueKey;
  /** Display title */
  title: string;
  /** Short plain-English framing question */
  question: string;
  /** One-paragraph plain-English description */
  description: string;
  /** Colour for accents — tailwind CSS value */
  color: string;
  /** Emoji icon */
  icon: string;
  /** Party pledge category (matches Issue type in parties.ts) */
  partyIssue: string;
  /** Topic category (matches TOPICS keys in news API) */
  newsTopic: string;
  /** Pre-filled topic for Write-to-MP link */
  mpTopic: string;
  /** Pre-filled topic for AI briefing */
  briefingTopic: string;
  /**
   * Headline figure for the issue, rendered via <SourcedStat>. This replaces the
   * old free-text `keyFact` so every number on the hub carries a source + asOf.
   * Verified against the cited source on 2026-06-15.
   */
  headlineStat: SourcedStat;
  /** Short plain-English gloss on what the headline figure means (no bare stats). */
  keyFactContext: string;
  /** Related data tools within the app */
  relatedTools: Array<{ to: string; label: string; description: string }>;
};

export const ISSUES: Record<IssueKey, IssueDef> = {
  nhs: {
    key: "nhs",
    title: "NHS & Health",
    question: "Is the NHS keeping up with demand?",
    description:
      "The NHS is the UK's most valued institution — but its core A&E four-hour standard has gone unmet for years, and waiting lists rose into the millions. This is where you can see how it is performing, and what each party promised.",
    color: "#3b82f6",
    icon: "🏥",
    partyIssue: "NHS",
    newsTopic: "NHS",
    mpTopic: "NHS waiting times and A&E performance",
    briefingTopic: "NHS England waiting list and A&E performance 2025",
    headlineStat: {
      value: "75.7%",
      label: "of A&E patients admitted, transferred or discharged within 4 hours",
      sourceId: "nhs-england",
      sourceUrl:
        "https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/",
      asOf: "2026-05-31",
      methodologyNote:
        "All A&E types in May 2026, down from 76.9% in April. Against a 95% legal standard; NHS England works to an interim 78% goal. Major (Type 1) units perform lower (63.8% in April). Live monthly figures on the NHS page.",
    },
    keyFactContext:
      "The 95% four-hour standard was last met in July 2015. Current monthly performance is published by NHS England and shown live on the NHS data page.",
    relatedTools: [
      {
        to: "/nhs",
        label: "A&E performance data",
        description: "Latest published NHS England statistics",
      },
      {
        to: "/parties",
        label: "Party pledges on NHS",
        description: "What every party promised and delivered",
      },
    ],
  },

  housing: {
    key: "housing",
    title: "Housing",
    question: "Will there be enough homes — and can people afford them?",
    description:
      "The UK has underbuilt homes for decades. The Government has committed to 1.5 million new homes in England this Parliament, and is reforming renters' rights and planning. Whether build rates can reach the target is the open question.",
    color: "#f59e0b",
    icon: "🏠",
    partyIssue: "Housing",
    newsTopic: "Housing",
    mpTopic: "housing targets, planning reform and renters rights",
    briefingTopic: "UK housing crisis, building targets and renters reform 2025",
    headlineStat: {
      value: 1_500_000,
      unit: "homes",
      label: "Government target for new homes in England this Parliament",
      sourceId: "mhclg-housing",
      sourceUrl: "https://www.gov.uk/government/collections/net-supply-of-housing",
      asOf: "2024-07-04",
      methodologyNote:
        "A pledge target. Delivery against it is tracked on the Parties pledge page.",
    },
    keyFactContext:
      "Meeting 1.5 million homes over a Parliament implies roughly 300,000 a year in England — well above recent build rates. Official net additional dwellings data is published annually by MHCLG.",
    relatedTools: [
      {
        to: "/parties",
        label: "Party pledges on housing",
        description: "Targets, renters reform, planning changes",
      },
      {
        to: "/petitions",
        label: "Housing petitions",
        description: "What the public is demanding on housing",
      },
    ],
  },

  economy: {
    key: "economy",
    title: "Economy",
    question: "Is the economy working for ordinary people?",
    description:
      "Growth, inflation and the cost of living shape every household budget. Government contracts, party donations and lobbying all shape economic policy too — follow the money to understand who benefits.",
    color: "#10b981",
    icon: "📈",
    partyIssue: "Economy",
    newsTopic: "Economy",
    mpTopic: "cost of living, economic growth and government spending",
    briefingTopic: "UK economic growth, inflation and cost of living 2025",
    headlineStat: {
      value: "1.4%",
      label: "UK GDP growth in 2025 (annual, ONS)",
      sourceId: "ons-economy",
      sourceUrl:
        "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/quarterlynationalaccounts/octobertodecember2025",
      asOf: "2025-12-31",
      methodologyNote:
        "Up from 1.0% in 2024. Live indicators (GDP, CPI, wages, debt) on the Economy page.",
    },
    keyFactContext:
      "Growth of 1.4% in 2025 was an improvement on 2024 but remains modest by historical standards. Inflation, wages and public debt are tracked live on the Economy page.",
    relatedTools: [
      {
        to: "/contracts",
        label: "Government contracts",
        description: "Where public money is being spent",
      },
      {
        to: "/donations",
        label: "Party donations",
        description: "Who funds the parties making economic policy",
      },
      {
        to: "/projects",
        label: "Major projects",
        description: "HS2, Hinkley and other big-ticket spending",
      },
      {
        to: "/parties",
        label: "Economic pledges",
        description: "What parties promised on the economy",
      },
    ],
  },

  crime: {
    key: "crime",
    title: "Crime & Policing",
    question: "Is the criminal justice system fair and effective?",
    description:
      "Knife crime, stop and search, sentencing reform and police numbers are all live debates. Stop-and-search data also shows a persistent ethnic disparity in who is searched — one of the clearest, most-scrutinised figures in policing.",
    color: "#8b5cf6",
    icon: "⚖️",
    partyIssue: "Crime",
    newsTopic: "Crime",
    mpTopic: "knife crime, stop and search, policing and criminal justice",
    briefingTopic: "UK knife crime, stop and search racial disparity, policing 2025",
    headlineStat: {
      value: "3.8×",
      label: "the rate at which Black people are stopped and searched vs White people",
      sourceId: "homeoffice-stop-search",
      sourceUrl:
        "https://www.gov.uk/government/statistics/stop-and-search-arrests-and-mental-health-detentions-march-2025/police-powers-and-procedures-stop-and-search-arrests-and-mental-health-detentions-england-and-wales-year-ending-31-march-2025",
      asOf: "2025-03-31",
      methodologyNote:
        "Year ending March 2025, by self-defined ethnicity. The disparity has fallen from 5.5× in the year ending March 2021. Force-level data on the Policing page.",
    },
    keyFactContext:
      "In the year ending March 2025, Black people were searched at 3.8 times the rate of White people in England and Wales — down from 5.5× four years earlier, but still a wide gap. Per-force breakdowns are on the Policing page.",
    relatedTools: [
      {
        to: "/stop-search",
        label: "Stop & search data",
        description: "Ethnic breakdown by force, outcome and reason",
      },
      {
        to: "/parties",
        label: "Crime & policing pledges",
        description: "Knife crime, sentencing and police numbers",
      },
    ],
  },

  environment: {
    key: "environment",
    title: "Environment",
    question: "Are water companies and government meeting their environmental obligations?",
    description:
      "Water companies discharge sewage into rivers and seas through storm overflows, and the Environment Agency publishes exactly how long each one spilled. Net zero and clean power are also live dividing lines between the parties.",
    color: "#22c55e",
    icon: "🌊",
    partyIssue: "Environment",
    newsTopic: "Environment",
    mpTopic: "sewage discharges, water companies and net zero",
    briefingTopic: "UK sewage pollution, water company accountability and net zero policy 2025",
    headlineStat: {
      value: 3_614_427,
      unit: "hours",
      label: "untreated sewage discharged through storm overflows in England in 2024",
      sourceId: "ea-edm",
      sourceUrl:
        "https://www.gov.uk/government/news/environment-agency-storm-overflow-spill-data-for-2024",
      asOf: "2024-12-31",
      methodologyNote:
        "A record total, 0.2% above 2023. Per-company, per-site hours on the Sewage page.",
    },
    keyFactContext:
      "The Environment Agency's Event Duration Monitoring shows 2024 was a record for spill duration. Each overflow operated on average 31.8 times; the Government's target is fewer than 10. Site-level data is on the Sewage page.",
    relatedTools: [
      {
        to: "/sewage",
        label: "Sewage discharge data",
        description: "Per-company, per-site storm overflow hours",
      },
      {
        to: "/parties",
        label: "Environment pledges",
        description: "Net zero, clean power and water policy",
      },
    ],
  },

  immigration: {
    key: "immigration",
    title: "Immigration",
    question: "How is the UK managing migration and the asylum system?",
    description:
      "Net migration has fallen sharply from its mid-2020s peak as work and study visa routes tightened. The asylum system, safe legal routes and the parties' competing targets remain central to the debate, touching housing, public services and the labour market.",
    color: "#f97316",
    icon: "✈️",
    partyIssue: "Immigration",
    newsTopic: "Immigration",
    mpTopic: "net migration, asylum backlog and immigration policy",
    briefingTopic: "UK net migration figures, asylum system and immigration policy 2025",
    headlineStat: {
      value: 171_000,
      label: "net migration to the UK, year ending December 2025 (provisional)",
      sourceId: "ons-ltim",
      sourceUrl:
        "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/bulletins/longterminternationalmigrationprovisional/yearendingdecember2025",
      asOf: "2025-12-31",
      methodologyNote:
        "Provisional; 813,000 arrived and 642,000 left. Down from a revised 331,000 a year earlier and a peak above 900,000.",
    },
    keyFactContext:
      "ONS estimates net migration at 171,000 for the year to December 2025 — roughly half the previous year — driven mainly by a fall in work-related arrivals. Figures are provisional and revised at each release.",
    relatedTools: [
      {
        to: "/parties",
        label: "Party positions on immigration",
        description: "Every party's pledges and delivery status",
      },
      {
        to: "/petitions",
        label: "Immigration petitions",
        description: "Current public demands on immigration policy",
      },
    ],
  },

  education: {
    key: "education",
    title: "Education",
    question: "Are children and young people getting the education they deserve?",
    description:
      "Teacher recruitment, university tuition fees, school funding and Ofsted reform are all in flux. The Government pledged thousands of new expert teachers and has changed how schools are inspected. Whether recruitment keeps pace with need is the test.",
    color: "#ec4899",
    icon: "📚",
    partyIssue: "Education",
    newsTopic: "Education",
    mpTopic: "school funding, teacher recruitment and university tuition fees",
    briefingTopic: "UK education: school funding, teacher shortages, Ofsted and tuition fees 2025",
    headlineStat: {
      value: 6_500,
      unit: "teachers",
      label: "Government pledge for additional expert teachers in England",
      sourceId: "dfe-workforce",
      sourceUrl:
        "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england",
      asOf: "2024-07-04",
      methodologyNote:
        "A pledge target. Recruitment is measured against the DfE School Workforce Census; delivery is tracked on the Parties pledge page.",
    },
    keyFactContext:
      "Recruitment in shortage subjects such as maths, physics and languages has historically run below target, and retention of early-career teachers is a persistent challenge. Official workforce figures are published annually by the DfE.",
    relatedTools: [
      {
        to: "/parties",
        label: "Education pledges",
        description: "Teacher recruitment, tuition fees, breakfast clubs",
      },
      {
        to: "/petitions",
        label: "Education petitions",
        description: "What the public is demanding on schools and universities",
      },
    ],
  },
};

export const ISSUE_KEYS = Object.keys(ISSUES) as IssueKey[];
