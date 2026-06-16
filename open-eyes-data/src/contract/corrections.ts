/**
 * Shared Contract — Public corrections log.
 *
 * Append-only. Rendered on /about. Publishing our own corrections is the
 * cheapest trust signal available — and a requirement of the mission.
 */

export interface CorrectionEntry {
  date: string; // ISO date the correction was made
  page: string; // human label, e.g. "Take Action — petitions"
  wasWrong: string; // what the site previously stated
  nowSays: string; // what it says now
  reason: string; // why it was wrong / what source corrected it
}

/**
 * Seeded honestly with the launch-remediation corrections (2026-06-12).
 * New entries are appended, never edited or removed.
 */
export const CORRECTIONS: CorrectionEntry[] = [
  {
    date: "2026-06-12",
    page: "Take Action — petitions",
    wasWrong: "“100 signatures gets a response. 100,000 triggers a Parliamentary debate.”",
    nowSays:
      "10,000 signatures gets a UK Government response; 100,000 means the petition is considered for debate (debates are usual but not automatic).",
    reason:
      "The original figures were simply incorrect. Corrected against petition.parliament.uk/help.",
  },
  {
    date: "2026-06-12",
    page: "Homepage — Immigration",
    wasWrong: "“728,000 net migration (latest ONS figures)”.",
    nowSays:
      "Net migration of 171,000 for the year ending December 2025 (the figure is now bound to the live ONS series with its release date).",
    reason:
      "The 728,000 figure was badly out of date; ONS estimates have since fallen sharply. Now sourced and dated via ONS LTIM.",
  },
  {
    date: "2026-06-12",
    page: "Homepage — Crime & Policing",
    wasWrong: "“Black people are 7× more likely to be stopped and searched.”",
    nowSays:
      "Black people were stopped and searched at 3.8 times the rate of White people (year ending March 2025), sourced and dated.",
    reason:
      "The 7× figure was several years out of date; the disparity has fallen. Corrected against gov.uk Ethnicity facts & figures.",
  },
  {
    date: "2026-06-12",
    page: "Take Action — write to your MP",
    wasWrong: "“A specific, data-backed letter always gets a reply.”",
    nowSays:
      "Responding to constituents is a strong convention, not a legal duty — so a reply is very likely but not guaranteed.",
    reason: "Overstated a convention as a certainty.",
  },
  {
    date: "2026-06-12",
    page: "Parties — Labour NHS pledge",
    wasWrong: "“2 million extra NHS appointments per week”.",
    nowSays:
      "40,000 more appointments every week — two million more a year — matching the verbatim manifesto pledge.",
    reason:
      "Our summary overstated the pledge by roughly fifty times (it conflated the weekly and annual figures). Corrected against the Labour 2024 manifesto wording.",
  },
  {
    date: "2026-06-12",
    page: "Take Action — contracts",
    wasWrong: "“Every government contract over £10k is public.”",
    nowSays:
      "Central government must publish contract details above £12,000 inc VAT (£30,000 for most other public bodies).",
    reason:
      "Incorrect threshold. Corrected against GOV.UK Procurement Act 2023 below-threshold guidance.",
  },
  {
    date: "2026-06-15",
    page: "Issues — Economy",
    wasWrong: "“Up from 1.1% in 2024” (the comparison year for UK GDP growth).",
    nowSays: "Up from 1.0% in 2024, matching the latest ONS revision of 2024 GDP growth.",
    reason:
      "The 2024 comparator was slightly out of date after ONS revised annual GDP growth down to 1.0%. Corrected against ONS Quarterly National Accounts.",
  },
  {
    date: "2026-06-15",
    page: "Issues — Environment",
    wasWrong: "“Each overflow operated on average around 32 times” in 2024.",
    nowSays: "Each overflow operated on average 31.8 times in 2024 (the exact published figure).",
    reason:
      "Rounded “around 32” to the precise figure for accuracy. Derived from the Environment Agency 2024 storm-overflow EDM dataset (450,398 spills across 14,162 monitored overflows).",
  },
];
