export type Issue =
  | "NHS"
  | "Housing"
  | "Economy"
  | "Crime"
  | "Environment"
  | "Immigration"
  | "Education";

export type PromiseStatus =
  | "done"
  | "in-progress"
  | "behind-target"
  | "stalled"
  | "contested"
  | "proposed";

export type PartyPromise = {
  issue: Issue;
  promise: string;
  status: PromiseStatus;
  detail?: string;
  /** Primary source URL for the status assessment */
  sourceUrl?: string;
  /** Short label for the source (e.g. "NHS England", "OBR") */
  sourceLabel?: string;
};

export type Party = {
  id: string;
  name: string;
  leader: string;
  role: string;
  seats: number;
  polling: number; // approximate %, May 2026
  colour: string;
  ideology: string;
};

export const PARTIES: Party[] = [
  {
    id: "labour",
    name: "Labour",
    leader: "Keir Starmer",
    role: "Prime Minister",
    seats: 412,
    polling: 34,
    colour: "#E4003B",
    ideology: "Centre-left",
  },
  {
    id: "conservative",
    name: "Conservative",
    leader: "Kemi Badenoch",
    role: "Leader of the Opposition",
    seats: 121,
    polling: 21,
    colour: "#0087DC",
    ideology: "Centre-right",
  },
  {
    id: "reform",
    name: "Reform UK",
    leader: "Nigel Farage",
    role: "Opposition",
    seats: 5,
    polling: 22,
    colour: "#12B6CF",
    ideology: "Right-wing populist",
  },
  {
    id: "libdem",
    name: "Liberal Democrats",
    leader: "Ed Davey",
    role: "Opposition",
    seats: 72,
    polling: 12,
    colour: "#FAA61A",
    ideology: "Centre / Social liberal",
  },
  {
    id: "green",
    name: "Green Party",
    leader: "Carla Denyer & Adrian Ramsay",
    role: "Opposition",
    seats: 4,
    polling: 6,
    colour: "#00B140",
    ideology: "Green / Left",
  },
  {
    id: "snp",
    name: "SNP",
    leader: "Stephen Flynn",
    role: "Westminster Leader",
    seats: 9,
    polling: 3,
    colour: "#FDF38E",
    ideology: "Scottish independence / Centre-left",
  },
];

export const PLEDGES: Record<string, PartyPromise[]> = {
  labour: [
    {
      issue: "NHS",
      promise: "2 million extra NHS appointments per week",
      status: "in-progress",
      detail: "Appointment volumes rising but full target not yet confirmed by NHS England.",
      sourceUrl: "https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/",
      sourceLabel: "NHS England",
    },
    {
      issue: "NHS",
      promise: "40 new hospitals by 2030",
      status: "stalled",
      detail: "Programme reviewed; many sites delayed or redesignated as refurbishments.",
      sourceUrl: "https://www.nao.org.uk/reports/the-new-hospital-programme/",
      sourceLabel: "NAO report",
    },
    {
      issue: "Housing",
      promise: "1.5 million new homes this parliament",
      status: "behind-target",
      detail: "Build rates below trajectory needed; planning reform passed but delivery slow.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/latest",
      sourceLabel: "ONS housing data",
    },
    {
      issue: "Housing",
      promise: "Renters Reform Act — end no-fault evictions",
      status: "done",
      detail: "Renters Rights Bill passed 2025. Section 21 no-fault evictions abolished.",
      sourceUrl: "https://www.legislation.gov.uk/ukpga/2025/15/contents",
      sourceLabel: "Renters Rights Act 2025",
    },
    {
      issue: "Economy",
      promise: "No return to austerity",
      status: "contested",
      detail: "£40bn tax rise in Oct 2024 budget; critics argue it contradicts the pledge.",
      sourceUrl: "https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/",
      sourceLabel: "OBR Oct 2024",
    },
    {
      issue: "Economy",
      promise: "Deliver the highest sustained growth in the G7",
      status: "in-progress",
      detail: "Growth mission underway; OBR forecasts revised down to ~1% for 2025.",
      sourceUrl: "https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/",
      sourceLabel: "OBR Mar 2025",
    },
    {
      issue: "Crime",
      promise: "Reduce knife crime by 50% within a decade",
      status: "in-progress",
      detail: "Knife Crime Prevention Orders expanded; early data mixed.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/bulletins/crimeinenglandandwales/latest",
      sourceLabel: "ONS Crime stats",
    },
    {
      issue: "Crime",
      promise: "13,000 more neighbourhood police officers",
      status: "in-progress",
      detail: "Recruitment underway; numbers not yet fully verified.",
      sourceUrl: "https://www.gov.uk/government/statistics/police-workforce-england-and-wales",
      sourceLabel: "Home Office workforce",
    },
    {
      issue: "Environment",
      promise: "Clean power by 2030",
      status: "in-progress",
      detail: "Great British Energy launched; renewable capacity targets set.",
      sourceUrl: "https://www.gov.uk/government/publications/clean-power-2030-action-plan",
      sourceLabel: "DESNZ action plan",
    },
    {
      issue: "Environment",
      promise: "Great British Energy — public clean energy company",
      status: "done",
      detail: "GBE established and operational as of 2025.",
      sourceUrl: "https://www.legislation.gov.uk/ukpga/2025/4/contents",
      sourceLabel: "Great British Energy Act",
    },
    {
      issue: "Immigration",
      promise: "Reduce net migration significantly",
      status: "in-progress",
      detail: "Net migration still at ~728k in latest ONS figures; further curbs announced.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/bulletins/internationalmigrationbulletin/latest",
      sourceLabel: "ONS migration stats",
    },
    {
      issue: "Education",
      promise: "Free breakfast clubs in every primary school",
      status: "done",
      detail: "Pilots launched in thousands of schools from April 2025.",
      sourceUrl: "https://www.gov.uk/government/news/thousands-of-children-to-benefit-from-free-breakfast-clubs",
      sourceLabel: "DfE announcement",
    },
    {
      issue: "Education",
      promise: "Recruit 6,500 new teachers",
      status: "in-progress",
      detail: "Teacher training bursaries increased; recruitment below target in some subjects.",
      sourceUrl: "https://www.gov.uk/government/statistics/initial-teacher-training-trainee-number-census",
      sourceLabel: "DfE ITT census",
    },
  ],
  conservative: [
    {
      issue: "Immigration",
      promise: "Cut net migration to under 100,000",
      status: "proposed",
      detail: "A pledge made in every Conservative manifesto 2010–2024. Net migration rose to a record 906,000 in the year to June 2023 while they were in government. Now an opposition policy for the next election.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/bulletins/internationalmigrationbulletin/latest",
      sourceLabel: "ONS Migration Stats",
    },
    {
      issue: "NHS",
      promise: "Reduce NHS bureaucracy and expand private delivery",
      status: "proposed",
      detail: "Kemi Badenoch has proposed more private partnerships and management cuts. NHS waiting lists grew from 4.4m to 7.8m during 14 years of Conservative government.",
      sourceUrl: "https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/",
      sourceLabel: "NHS England RTT Stats",
    },
    {
      issue: "Economy",
      promise: "Cut taxes — oppose Labour's NICs increase",
      status: "proposed",
      detail: "Voted against the April 2025 employer National Insurance increase. Propose £17.7bn of tax cuts funded by reduced public spending.",
      sourceUrl: "https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/",
      sourceLabel: "OBR EFO March 2025",
    },
    {
      issue: "Housing",
      promise: "Oppose mandatory housing targets — reform planning differently",
      status: "proposed",
      detail: "Conservatives voted against Labour's NPPF reforms which restored mandatory local housing targets. Their 2024 manifesto proposed 'street votes' and beauty-based planning.",
      sourceUrl: "https://www.conservatives.com/our-plan",
      sourceLabel: "Conservative Manifesto 2024",
    },
    {
      issue: "Environment",
      promise: "Retain net zero but extend 2050 timeline",
      status: "proposed",
      detail: "Kemi Badenoch has questioned the pace of net zero policy and cost to consumers, though the party still formally backs the 2050 target.",
      sourceUrl: "https://www.conservatives.com/our-plan",
      sourceLabel: "Conservative Manifesto 2024",
    },
    {
      issue: "Crime",
      promise: "More prison places and tougher sentencing",
      status: "proposed",
      detail: "Oppose early release scheme. Prison population grew from 85,000 to over 87,000 during the final years of Conservative government.",
      sourceUrl: "https://www.gov.uk/government/statistics/prison-population-figures-2024",
      sourceLabel: "MoJ Prison Population 2024",
    },
    {
      issue: "Education",
      promise: "Restore Ofsted single-word judgements",
      status: "proposed",
      detail: "Labour replaced 'Outstanding / Good / Requires Improvement / Inadequate' with a report card system in 2025. Conservatives would revert this.",
      sourceUrl: "https://www.gov.uk/government/consultations/improving-school-accountability",
      sourceLabel: "DfE Consultation 2025",
    },
  ],
  reform: [
    {
      issue: "Immigration",
      promise: "Stop all illegal channel crossings immediately",
      status: "proposed",
      detail: "Flagship pledge from Reform's 'Contract with the People'. Proposes Royal Navy interceptions, offshore processing and deportation flights. No legal framework currently exists for this approach.",
      sourceUrl: "https://www.reform.uk/the-contract/",
      sourceLabel: "Reform Contract 2024",
    },
    {
      issue: "Immigration",
      promise: "Freeze all non-essential immigration for 5 years",
      status: "proposed",
      detail: "Covers work visas, student visas and family reunion. IFS estimates this would cause significant labour shortages in health, social care and hospitality.",
      sourceUrl: "https://www.reform.uk/the-contract/",
      sourceLabel: "Reform Contract 2024",
    },
    {
      issue: "NHS",
      promise: "Cut 50% of NHS managers, redirect £13.7bn to frontline",
      status: "proposed",
      detail: "Reform explicitly says it would not privatise the NHS but argues management bloat diverts funds from clinical care. NHS England employs approx. 1.5m staff; managers represent under 4% of the workforce.",
      sourceUrl: "https://digital.nhs.uk/data-and-information/publications/statistical/nhs-workforce-statistics",
      sourceLabel: "NHS Workforce Statistics",
    },
    {
      issue: "Environment",
      promise: "Abolish net zero — scrap Climate Change Act targets",
      status: "proposed",
      detail: "Reform would repeal the 2008 Climate Change Act net zero commitment, end green levies on energy bills and halt offshore wind subsidies. The OBR estimates net zero policies cost households £2.5bn/year in levies.",
      sourceUrl: "https://obr.uk/docs/dlm_uploads/CBO_October-2021_web.pdf",
      sourceLabel: "OBR Climate Report",
    },
    {
      issue: "Economy",
      promise: "No income tax on earnings under £20,000",
      status: "proposed",
      detail: "Raise the personal allowance from £12,570 to £20,000. IFS estimates cost of ~£55bn/year. Reform says it would be funded by cutting foreign aid, diversity programmes and quangos.",
      sourceUrl: "https://ifs.org.uk/articles/reform-uks-fiscal-plans-general-election-2024",
      sourceLabel: "IFS Analysis 2024",
    },
    {
      issue: "Economy",
      promise: "Cut overseas aid to 0.1% of GNI",
      status: "proposed",
      detail: "Would reduce UK aid from 0.5% to 0.1% of GNI — a cut of ~£10bn/year. UK aid currently funds vaccines, emergency relief and development programmes.",
      sourceUrl: "https://www.reform.uk/the-contract/",
      sourceLabel: "Reform Contract 2024",
    },
    {
      issue: "Crime",
      promise: "Mandatory sentences for knife crime and serious repeat offenders",
      status: "proposed",
      detail: "Follows a trend in Conservative and Reform rhetoric after knife crime reached record recorded levels in 2023–24.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/bulletins/crimeinenglandandwales/latest",
      sourceLabel: "ONS Crime Stats 2024",
    },
  ],
  libdem: [
    {
      issue: "NHS",
      promise: "8,000 more GPs and right to see GP within 7 days",
      status: "proposed",
      detail: "Funded via reversing non-dom tax cuts and increased wealth taxes. There are currently about 35,000 full-time GPs in England — an 8,000 increase would be a 23% rise.",
      sourceUrl: "https://www.nhsconfed.org/publications/primary-care-staffing",
      sourceLabel: "NHS Confederation — GP Workforce",
    },
    {
      issue: "Economy",
      promise: "Rejoin the EU single market and customs union",
      status: "proposed",
      detail: "Lib Dem official policy; would require renegotiating the Trade and Cooperation Agreement. OBR estimated Brexit reduced UK trade intensity by around 15% compared to a no-Brexit counterfactual.",
      sourceUrl: "https://obr.uk/docs/dlm_uploads/Working-paper-No.7-How-has-Brexit-affected-UK-trade.pdf",
      sourceLabel: "OBR — Brexit Trade Impact",
    },
    {
      issue: "Housing",
      promise: "380,000 new homes per year — reform planning",
      status: "proposed",
      detail: "Higher than Labour's 1.5m homes / 300k/year target. Requires significant green belt release and planning reform beyond what Labour has enacted.",
      sourceUrl: "https://www.libdems.org.uk/manifesto",
      sourceLabel: "Lib Dem Manifesto 2024",
    },
    {
      issue: "Education",
      promise: "Votes at 16 for all elections",
      status: "proposed",
      detail: "Scotland already allows 16-year-olds to vote in Scottish elections. Labour has not committed to this in Westminster.",
      sourceUrl: "https://www.libdems.org.uk/manifesto",
      sourceLabel: "Lib Dem Manifesto 2024",
    },
    {
      issue: "Crime",
      promise: "Legalise and regulate recreational cannabis",
      status: "proposed",
      detail: "Would generate estimated £1bn+ in tax revenue, reduce criminal market and allow public health regulation. Similar to systems in Canada, Germany and 24 US states.",
      sourceUrl: "https://www.libdems.org.uk/manifesto",
      sourceLabel: "Lib Dem Manifesto 2024",
    },
    {
      issue: "Environment",
      promise: "Insulate 4 million homes by 2030",
      status: "proposed",
      detail: "19 million UK homes have an EPC rating of D or below. Lib Dem emergency retrofit plan would cost ~£6bn/year via a National Wealth Fund.",
      sourceUrl: "https://www.gov.uk/government/statistics/english-housing-survey-headline-report-2022-to-2023",
      sourceLabel: "DLUHC Housing Survey 2023",
    },
    {
      issue: "Immigration",
      promise: "Replace Rwanda scheme with safe legal asylum routes",
      status: "proposed",
      detail: "Rwanda scheme was scrapped by Labour in July 2024 (at a cost of £700m with zero flights). Lib Dems propose humanitarian visa pathways instead.",
      sourceUrl: "https://www.nao.org.uk/reports/the-rwanda-migration-and-economic-development-partnership/",
      sourceLabel: "NAO — Rwanda Scheme 2024",
    },
  ],
  green: [
    {
      issue: "Environment",
      promise: "Green New Deal — £100bn/year public investment in clean energy",
      status: "proposed",
      detail: "Funded via wealth tax and increased borrowing. Would accelerate offshore wind, solar and home insulation. The UK currently invests ~£15bn/year in clean energy.",
      sourceUrl: "https://www.greenparty.org.uk/green-new-deal/",
      sourceLabel: "Green Party — Green New Deal",
    },
    {
      issue: "Economy",
      promise: "2% annual wealth tax on assets over £10 million",
      status: "proposed",
      detail: "Estimated to raise £50–70bn/year. The wealthiest 1% of households hold 23% of all UK wealth (£6.8tn combined). No EU country currently levies a recurring wealth tax of this scale.",
      sourceUrl: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/bulletins/wealthingreatbritainwave7/2018to2020",
      sourceLabel: "ONS — Wealth in Great Britain",
    },
    {
      issue: "NHS",
      promise: "Free personal social care for all adults",
      status: "proposed",
      detail: "Current social care is means-tested — assets above £23,250 must be spent before state support. Up to 165,000 people a year face 'catastrophic' social care costs of over £100,000.",
      sourceUrl: "https://www.health.org.uk/publications/long-reads/what-is-happening-to-social-care-funding",
      sourceLabel: "Health Foundation — Social Care Funding",
    },
    {
      issue: "Economy",
      promise: "Public ownership of energy, water and rail",
      status: "proposed",
      detail: "Water companies have paid £72bn in dividends since privatisation in 1989 while infrastructure investment lagged. Rail nationalisation is underway under Labour via Great British Railways.",
      sourceUrl: "https://www.theguardian.com/environment/2023/mar/17/water-firms-paid-out-dividends-of-72bn-since-privatisation",
      sourceLabel: "Water dividend analysis",
    },
    {
      issue: "Economy",
      promise: "32-hour working week (4 days) with no pay cut",
      status: "proposed",
      detail: "Multiple UK trials showed 4-day week maintained productivity. 61 companies in the 2022 UK trial permanently adopted it. No national legislation proposed yet.",
      sourceUrl: "https://autonomy.work/portfolio/uk-pilot-results-and-their-implications-for-the-future-of-the-4-day-week/",
      sourceLabel: "Autonomy — 4-Day Week UK Pilot",
    },
    {
      issue: "Housing",
      promise: "End Right to Buy — halt social housing sell-off",
      status: "proposed",
      detail: "1.5 million social homes have been sold since 1980, with replacement rates under 10%. England loses ~12,000 social homes per year net. Labour has restricted but not yet abolished Right to Buy.",
      sourceUrl: "https://www.local.gov.uk/about/news/councils-call-immediate-suspension-right-buy",
      sourceLabel: "LGA — Right to Buy statistics",
    },
    {
      issue: "Education",
      promise: "Abolish university tuition fees — restore maintenance grants",
      status: "proposed",
      detail: "English students face average debt of £45,800 on graduation — highest in the OECD. Scotland maintains free tuition for Scottish students.",
      sourceUrl: "https://www.ifs.org.uk/publications/15031",
      sourceLabel: "IFS — Student Loan Debt 2023",
    },
  ],
  snp: [
    {
      issue: "Economy",
      promise: "Scottish independence — full fiscal and political autonomy",
      status: "proposed",
      detail: "Core SNP mission since 1934. The 2014 referendum returned 55% No. SNP argues independence is needed to escape Westminster economic decisions. A second referendum requires Section 30 order from Westminster.",
      sourceUrl: "https://www.snp.org/manifesto/",
      sourceLabel: "SNP Manifesto 2024",
    },
    {
      issue: "NHS",
      promise: "Protect NHS Scotland from Barnett consequentials cuts",
      status: "in-progress",
      detail: "NHS Scotland is fully devolved. SNP government has prioritised health spending, but the Scottish budget is constrained by the Barnett formula and UK spending decisions.",
      sourceUrl: "https://www.audit.scot/uploads/docs/report/2024/nr_240411_nhs_in_scotland.pdf",
      sourceLabel: "Audit Scotland — NHS Performance 2024",
    },
    {
      issue: "Environment",
      promise: "Just transition for North Sea oil and gas workers",
      status: "in-progress",
      detail: "The SNP government established a Just Transition Commission and opposed Labour's decision to halt new North Sea licences without a transition support package.",
      sourceUrl: "https://www.gov.scot/policies/energy/just-transition/",
      sourceLabel: "Scottish Government — Just Transition",
    },
    {
      issue: "Immigration",
      promise: "Separate Scottish population visa — selective immigration for growth",
      status: "proposed",
      detail: "Scotland's population growth is slower than England's; SNP argues a tailored visa system would address regional workforce needs. Immigration is currently a reserved matter.",
      sourceUrl: "https://www.snp.org/manifesto/",
      sourceLabel: "SNP Manifesto 2024",
    },
    {
      issue: "Economy",
      promise: "Oppose UK public sector pay restraint affecting Scotland",
      status: "in-progress",
      detail: "The Scottish Government has at times offered above-UK pay settlements to public sector workers but is limited by its block grant.",
      sourceUrl: "https://www.snp.org/manifesto/",
      sourceLabel: "SNP Manifesto 2024",
    },
    {
      issue: "Housing",
      promise: "Rent controls and stronger tenant protections",
      status: "done",
      detail: "The Housing (Scotland) Act 2022 introduced emergency rent cap legislation — a first in any part of the UK. Challenged by landlord groups but upheld.",
      sourceUrl: "https://www.legislation.gov.uk/asp/2022/1/contents",
      sourceLabel: "Housing (Scotland) Act 2022",
    },
    {
      issue: "Education",
      promise: "Free university tuition for Scottish-domiciled students",
      status: "done",
      detail: "Scottish students pay no tuition fees at Scottish universities — a policy in place since 2000. Average English graduate debt is £45,800; the comparable Scottish figure is near zero.",
      sourceUrl: "https://www.gov.scot/policies/higher-education/tuition-fees/",
      sourceLabel: "Scottish Government — Tuition Fees",
    },
  ],
};
