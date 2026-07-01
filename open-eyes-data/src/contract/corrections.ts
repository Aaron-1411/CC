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
  {
    date: "2026-06-18",
    page: "Homepage / KPIs — NHS waiting list",
    wasWrong: "“7.58m” elective waiting list, dated “Sep 2024”.",
    nowSays: "7.2m on the elective (RTT) waiting list, dated February 2026.",
    reason:
      "The headline figure was over a year out of date. Updated to the latest NHS England Referral to Treatment (RTT) statistics.",
  },
  {
    date: "2026-06-18",
    page: "Homepage / KPIs — Asylum backlog",
    wasWrong: "“Asylum Case Backlog — 113,000”, dated “Q1 2025”.",
    nowSays: "“Asylum Cases Awaiting Initial Decision — 35,700”, dated March 2026.",
    reason:
      "The figure was stale and the label was ambiguous. The initial-decision backlog has fallen sharply from its June 2023 peak of roughly 134,000; relabelled to make clear it counts cases awaiting an initial decision, not appeals. Sourced to Home Office asylum statistics.",
  },
  {
    date: "2026-06-18",
    page: "Take Action — 18–25 turnout",
    wasWrong: "“Turnout among 18–24s was 52% at the 2024 election.”",
    nowSays:
      "Turnout among 18–24s was around 37% at the 2024 election, down from 47% in 2019 — the lowest of any age group (Ipsos).",
    reason:
      "The 52% was a misattribution: 52.8% was the overall voting-age turnout at the 2024 election, not the 18–24 figure. Corrected to the Ipsos “How Britain Voted 2024” individual-level estimate. The claim that under-25s had the lowest turnout of any age group remains correct.",
  },
  {
    date: "2026-06-18",
    page: "Sewage — dividends",
    wasWrong:
      "“In the same year [2024], water companies paid out over £1.4 billion in dividends.”",
    nowSays:
      "Since privatisation in 1989, England's water companies have paid out tens of billions of pounds in dividends to shareholders (estimates range from around £66bn to £85bn depending on methodology).",
    reason:
      "The single-year 2024 figure of £1.4bn could not be cleanly sourced. Replaced with the well-evidenced cumulative range, with the methodology dependence stated openly rather than asserting one contested total.",
  },
  {
    date: "2026-06-18",
    page: "Sewage — water bills",
    wasWrong: "“The average household water bill rose above £500/year.”",
    nowSays:
      "From April 2025 the average household water bill rose by about 26% to roughly £600 a year (Water UK).",
    reason:
      "The “above £500” figure was undated and understated the position. The 2025–26 national average is about £603, a rise of roughly £123 (~26%) on the previous year. Sourced to Water UK.",
  },
  {
    date: "2026-06-18",
    page: "Sewage — prosecutions",
    wasWrong:
      "“Only one company has faced criminal prosecution for unpermitted discharges.”",
    nowSays:
      "The Environment Agency has brought dozens of prosecutions against water companies, including a record £90 million fine for Southern Water in 2021.",
    reason:
      "The original statement was simply false. The Environment Agency has prosecuted water and sewerage companies many times; Southern Water alone was fined £90m in 2021. Corrected against Environment Agency enforcement records.",
  },
  {
    date: "2026-06-18",
    page: "Contracts — major awards database",
    wasWrong:
      "“Every government contract award over £1,000,000 from the last 10 months” — with a fixed “2,000+ scanned records” badge.",
    nowSays:
      "Government contract awards over £1,000,000 with an award date in the last 10 months, drawn from the most recently published Contracts Finder notices — labelled as the most-recent slice (not an exhaustive list), showing the real number of notices scanned and the actual award-date span covered.",
    reason:
      "The old query filtered only on publish date and kept any record carrying an awards array, so tender/opportunity notices and awards dated as far back as 2021 leaked in, and tender framework ceilings inflated headline values into the billions. Rebuilt to filter server-side to award notices (stages=award), require an active award dated inside the 10-month window, use the award value only, dedupe by OCID, and add rate-limit backoff. The unverifiable “2,000+” completeness claim was dropped in favour of the true scanned count.",
  },
  {
    date: "2026-06-18",
    page: "Contracts — major awards database (framework ceilings)",
    wasWrong:
      "Our earlier 2026-06-18 fix claimed it had stopped framework ceilings from “inflating headline values into the billions” — but the live list was still topped by a £1.42bn notice titled “Maintain Framework” covering 21 suppliers.",
    nowSays:
      "Framework and other aggregate notices — where the headline figure is a lifetime ceiling shared across many suppliers or lots rather than the price of a single contract — are now detected and set aside, and the number set aside is disclosed on the page. Genuine single-supplier call-offs from frameworks are kept, because those are real individual awards.",
    reason:
      "The earlier fix switched from the tender estimate to the award value, but for a framework agreement the award value is itself an aggregate ceiling, so billion-pound figures still leaked through as if they were single awards. A notice is now set aside when its award lists more than one supplier, or its title contains “framework” or “lots”. On a representative refresh this removed roughly 30 aggregate notices and brought the headline total down from about £5.6bn to about £3.0bn, while correctly keeping single-supplier call-offs.",
  },
  {
    date: "2026-07-02",
    page: "My area — Find your MP",
    wasWrong:
      "Every postcode resolved to the same MP (Diane Abbott, Hackney North & Stoke Newington), regardless of where the user actually lived.",
    nowSays:
      "The correct sitting MP for the user's constituency is returned — e.g. SW1A 1AA now resolves to Rachel Blake (Cities of London and Westminster), not Diane Abbott.",
    reason:
      "Wrong-endpoint bug. The Parliament Members `Search?constituency=` endpoint silently ignores its constituency filter and returns the first of all 650 members, so everyone saw the alphabetically-first MP. Rebuilt to resolve MPs via the `Location/Constituency/Search?searchText=` endpoint, which matches by constituency name and carries that constituency's current representation. Verified live against the Parliament Members API for multiple constituencies.",
  },
  {
    date: "2026-07-02",
    page: "Stop & Search — disparity ratios",
    wasWrong:
      "The stop-and-search detail page stated Black people were “7× more likely” and Asian people “3 times” more likely to be stopped and searched than White people.",
    nowSays:
      "Black people were stopped and searched at 3.8 times the rate of White people, and Asian people at around 1.4 times the rate, for the year ending March 2025 — both sourced and dated.",
    reason:
      "Both ratios were several years out of date and overstated the current disparity. Our 2026-06-12 fix corrected the 7× figure on the homepage headline; this extends the same correction to the detail page and to the Asian ratio it had left unchanged. Corrected against gov.uk Ethnicity facts & figures (stop and search).",
  },
  {
    date: "2026-07-02",
    page: "Issues — Environment (headline figure)",
    wasWrong:
      "The environment headline was “3,614,427 hours” of untreated sewage discharged through storm overflows in England in 2024.",
    nowSays:
      "291,492 storm-overflow spills of untreated sewage in England in 2025 — 35% fewer than 2024's record, with total monitored spill duration down 48%.",
    reason:
      "The Environment Agency has since published 2025 monitoring data, superseding the 2024 figure. We switched the headline to the newer published spill count rather than a computed 2025 hours figure, keeping to our rule of never presenting a derived number as if it were official. Sourced to the EA release “Fewer and shorter storm overflow spills in 2025, new monitoring data shows”.",
  },
  {
    date: "2026-07-02",
    page: "Sewage Discharges — England scope",
    wasWrong:
      "The sewage totals summed England, Wales and unlabelled sites together — about 563,730 spills and 4.55 million hours across 16,626 sites — while the page described them as England.",
    nowSays:
      "England-only totals: 450,478 spills and 3.61 million hours across 14,286 monitored overflows, matching the official Environment Agency headline for 2024.",
    reason:
      "The data query returned every country in the dataset (England, plus Welsh sites regulated by Natural Resources Wales, plus null-country rows), inflating the totals above the England figure the page claimed to show. The query now filters server-side to country = 'England'. Corrected against the Environment Agency 2024 storm-overflow EDM dataset.",
  },
  {
    date: "2026-07-02",
    page: "Sewage Discharges — spill frequency",
    wasWrong: "“Roughly one spill event every 9 minutes” across England.",
    nowSays:
      "Roughly one spill event every 70 seconds, computed live from the actual spill count for the year.",
    reason:
      "The “9 minutes” claim was wrong by roughly an order of magnitude. The cadence is now derived directly from the current spill total (seconds in a 365-day year ÷ counted spills) so it stays correct if the underlying data changes.",
  },
];
