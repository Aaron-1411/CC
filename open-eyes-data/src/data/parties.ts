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
      issue: "NHS",
      promise: "Reform NHS through private delivery partnerships",
      status: "proposed",
      detail: "Opposition policy; not in government.",
    },
    {
      issue: "Housing",
      promise: "Reverse Labour planning reforms",
      status: "proposed",
      detail: "Conservatives oppose mandatory housing targets and NPPF changes.",
    },
    {
      issue: "Economy",
      promise: "Cut regulation to unlock private investment",
      status: "proposed",
      detail: "Deregulation agenda; no current power to implement.",
    },
    {
      issue: "Economy",
      promise: "Oppose inheritance tax threshold reduction",
      status: "proposed",
      detail: "Pledging to reverse Oct 2024 Budget IHT changes if elected.",
    },
    {
      issue: "Immigration",
      promise: "Cut net migration to under 100,000",
      status: "proposed",
      detail: "Core policy platform for next election.",
    },
    {
      issue: "Crime",
      promise: "Tougher sentencing and more prison places",
      status: "proposed",
    },
    {
      issue: "Education",
      promise: "Restore Ofsted single-word judgements",
      status: "proposed",
      detail: "Labour scrapped single-word Ofsted ratings in 2025.",
    },
  ],
  reform: [
    {
      issue: "Immigration",
      promise: "Stop the boats — zero illegal channel crossings",
      status: "proposed",
      detail: "Flagship pledge; advocates deportation flights and offshore processing.",
    },
    {
      issue: "Immigration",
      promise: "Freeze all non-essential immigration",
      status: "proposed",
    },
    {
      issue: "NHS",
      promise: "Reform NHS — not privatise — cut management waste",
      status: "proposed",
      detail: "Pledge to cut NHS managers by 50% and redirect funding to frontline.",
    },
    {
      issue: "Environment",
      promise: "Abolish net zero targets",
      status: "proposed",
      detail: "Reform would scrap the Climate Change Act net zero commitment.",
    },
    {
      issue: "Economy",
      promise: "Cut foreign aid budget to near zero",
      status: "proposed",
    },
    {
      issue: "Economy",
      promise: "Flat income tax of 20% for most earners",
      status: "proposed",
      detail: "Raise income tax threshold to £20k; simplify tax system.",
    },
    {
      issue: "Crime",
      promise: "Mandatory sentences for serious repeat offenders",
      status: "proposed",
    },
  ],
  libdem: [
    {
      issue: "NHS",
      promise: "8,000 more GPs — cut waiting times",
      status: "proposed",
      detail: "Fund via reversal of non-dom tax cuts and wealth taxes.",
    },
    {
      issue: "Economy",
      promise: "Rejoin the EU single market",
      status: "proposed",
      detail: "Lib Dem policy; would require negotiation and political consensus.",
    },
    {
      issue: "Housing",
      promise: "Build 380,000 homes per year with green belt reform",
      status: "proposed",
    },
    {
      issue: "Education",
      promise: "Votes at 16 — extend franchise to younger citizens",
      status: "proposed",
    },
    {
      issue: "Crime",
      promise: "Legalise and regulate cannabis",
      status: "proposed",
      detail: "For adult recreational use; generate tax revenue and cut criminal market.",
    },
    {
      issue: "Environment",
      promise: "Emergency retrofit programme for all homes by 2035",
      status: "proposed",
    },
    {
      issue: "Immigration",
      promise: "Restore safe and legal asylum routes",
      status: "proposed",
      detail: "Scrap Rwanda scheme (already done); create humanitarian visas.",
    },
  ],
  green: [
    {
      issue: "Environment",
      promise: "Green New Deal — £100bn public investment in clean energy",
      status: "proposed",
    },
    {
      issue: "Economy",
      promise: "2% wealth tax on assets over £10 million",
      status: "proposed",
      detail: "To fund public services and green transition.",
    },
    {
      issue: "NHS",
      promise: "Free personal social care for all adults",
      status: "proposed",
    },
    {
      issue: "Economy",
      promise: "Public ownership of energy, water, and rail",
      status: "proposed",
    },
    {
      issue: "Economy",
      promise: "4-day working week with no loss of pay",
      status: "proposed",
    },
    {
      issue: "Housing",
      promise: "End right to buy — redirect to social housing",
      status: "proposed",
    },
    {
      issue: "Education",
      promise: "Abolish university tuition fees",
      status: "proposed",
    },
  ],
  snp: [
    {
      issue: "Economy",
      promise: "Scottish independence and full fiscal autonomy",
      status: "proposed",
      detail: "Core SNP mission; requires second independence referendum.",
    },
    {
      issue: "NHS",
      promise: "Protect NHS Scotland from Westminster cuts",
      status: "in-progress",
      detail: "NHS Scotland devolved; SNP opposes block grant reductions.",
    },
    {
      issue: "Environment",
      promise: "North Sea oil transition — just transition for workers",
      status: "in-progress",
      detail: "SNP supports phased transition protecting energy jobs.",
    },
    {
      issue: "Immigration",
      promise: "Separate Scottish immigration policy for growth",
      status: "proposed",
      detail: "Population visa for Scotland; immigration devolved not yet secured.",
    },
    {
      issue: "Economy",
      promise: "Oppose UK austerity measures affecting Scotland",
      status: "in-progress",
    },
    {
      issue: "Housing",
      promise: "Rent controls and tenant protections in Scotland",
      status: "done",
      detail: "Emergency rent cap legislation passed in Holyrood.",
    },
    {
      issue: "Education",
      promise: "Free university tuition in Scotland",
      status: "done",
      detail: "Scottish university tuition remains free for Scottish-domiciled students.",
    },
  ],
};
