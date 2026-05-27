/**
 * Issue hub definitions — each issue aggregates party pledges, live data,
 * news, related tools, and action prompts into one place.
 */

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
  /** Key hardcoded context fact shown on the hub */
  keyFact: string;
  /** "What does this mean?" one-liner for the key fact */
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
      "The NHS is the UK's most valued institution — but it has missed its core A&E target every single month since July 2015. Waiting lists peaked at 7.8 million. Labour promised 2 million extra appointments per week. This is where you can see whether they're delivering.",
    color: "#3b82f6",
    icon: "🏥",
    partyIssue: "NHS",
    newsTopic: "NHS",
    mpTopic: "NHS waiting times and A&E performance",
    briefingTopic: "NHS England waiting list and A&E performance 2025",
    keyFact: "~76% of A&E patients seen within 4 hours",
    keyFactContext:
      "The target is 95%. The NHS hasn't hit it since July 2015 — a decade of consecutive misses. In that time, it has been managed by nine different Health Secretaries.",
    relatedTools: [
      { to: "/nhs", label: "A&E performance data", description: "Latest published NHS England statistics" },
      { to: "/parties", label: "Party pledges on NHS", description: "What every party promised and delivered" },
      { to: "/briefing", label: "AI briefing", description: "Generate a non-partisan NHS briefing" },
    ],
  },

  housing: {
    key: "housing",
    title: "Housing",
    question: "Will there be enough homes — and can people afford them?",
    description:
      "The UK has underbuilt homes for decades. Labour's 2024 manifesto committed to 1.5 million new homes this parliament. Renters have won the abolition of no-fault evictions. But build rates remain below target and house prices are still unaffordable for most first-time buyers.",
    color: "#f59e0b",
    icon: "🏠",
    partyIssue: "Housing",
    newsTopic: "Housing",
    mpTopic: "housing targets, planning reform and renters rights",
    briefingTopic: "UK housing crisis, building targets and renters reform 2025",
    keyFact: "Labour target: 1.5 million homes this parliament",
    keyFactContext:
      "England needs roughly 300,000 new homes per year to meet the target. Build rates in 2024-25 came in at around 200,000 — a shortfall of 100,000 per year. At this rate the target will be missed by around 400,000 homes.",
    relatedTools: [
      { to: "/parties", label: "Party pledges on housing", description: "Targets, renters reform, planning changes" },
      { to: "/petitions", label: "Housing petitions", description: "What the public is demanding on housing" },
      { to: "/briefing", label: "AI briefing", description: "Ask about planning reform, house prices, renters" },
    ],
  },

  economy: {
    key: "economy",
    title: "Economy",
    question: "Is the economy working for ordinary people?",
    description:
      "The UK economy grew by around 1% in 2025 — below the G7 average. Inflation has fallen from its 2022 peak but cost-of-living pressures persist. Government contracts, party donations, and lobbying all shape economic policy — follow the money to understand who benefits.",
    color: "#10b981",
    icon: "📈",
    partyIssue: "Economy",
    newsTopic: "Economy",
    mpTopic: "cost of living, economic growth and government spending",
    briefingTopic: "UK economic growth, inflation and cost of living 2025",
    keyFact: "~1% GDP growth forecast for 2025",
    keyFactContext:
      "Labour promised the highest sustained growth in the G7. The OBR revised its forecast down to around 1% for 2025, placing the UK towards the bottom of G7 economies. The £40bn tax rise in the October 2024 Budget was intended to stabilise public finances.",
    relatedTools: [
      { to: "/contracts", label: "Government contracts", description: "Where public money is being spent" },
      { to: "/donations", label: "Party donations", description: "Who funds the parties making economic policy" },
      { to: "/projects", label: "Major projects", description: "HS2, Hinkley and other big-ticket spending" },
      { to: "/parties", label: "Economic pledges", description: "What parties promised on the economy" },
    ],
  },

  crime: {
    key: "crime",
    title: "Crime & Policing",
    question: "Is the criminal justice system fair and effective?",
    description:
      "Knife crime, stop and search, sentencing reform and police numbers are all live debates. Labour promised to cut knife crime by 50% in a decade and recruit 13,000 neighbourhood officers. Meanwhile, stop-and-search data shows Black people are searched at 7× the rate of white people.",
    color: "#8b5cf6",
    icon: "⚖️",
    partyIssue: "Crime",
    newsTopic: "Crime",
    mpTopic: "knife crime, stop and search, policing and criminal justice",
    briefingTopic: "UK knife crime, stop and search racial disparity, policing 2025",
    keyFact: "Black people are 7× more likely to be stopped and searched",
    keyFactContext:
      "Home Office statistics consistently show Black people are stopped at roughly 7 times the rate of white people in England and Wales. Only 17% of stop-and-searches result in any action being taken — raising questions about whether the power is being used proportionately.",
    relatedTools: [
      { to: "/stop-search", label: "Stop & search data", description: "Ethnic breakdown by force, outcome and reason" },
      { to: "/parties", label: "Crime & policing pledges", description: "Knife crime, sentencing and police numbers" },
      { to: "/briefing", label: "AI briefing", description: "Ask about policing, knife crime or sentencing" },
    ],
  },

  environment: {
    key: "environment",
    title: "Environment",
    question: "Are water companies and government meeting their environmental obligations?",
    description:
      "In 2024, water companies discharged raw or partly-treated sewage into rivers and seas for over 3.6 million hours — a new record. Labour promised clean power by 2030 via Great British Energy. The Conservatives and Reform have opposing positions on net zero.",
    color: "#22c55e",
    icon: "🌊",
    partyIssue: "Environment",
    newsTopic: "Environment",
    mpTopic: "sewage discharges, water companies and net zero",
    briefingTopic: "UK sewage pollution, water company accountability and net zero policy 2025",
    keyFact: "3.6 million hours of sewage discharged in 2024",
    keyFactContext:
      "That is equivalent to every water company in England spilling sewage continuously for over 400 years, combined. Water companies paid out £1.4bn in dividends the same year while repeatedly missing their own improvement targets.",
    relatedTools: [
      { to: "/sewage", label: "Sewage discharge data", description: "Per-company, per-site storm overflow hours" },
      { to: "/parties", label: "Environment pledges", description: "Net zero, clean power and water policy" },
      { to: "/briefing", label: "AI briefing", description: "Ask about water companies, sewage or net zero" },
    ],
  },

  immigration: {
    key: "immigration",
    title: "Immigration",
    question: "How is the UK managing migration and the asylum system?",
    description:
      "Net migration reached 728,000 in the latest ONS figures. The asylum backlog stood at over 100,000 cases. Labour pledged to reduce net migration significantly while restoring safe legal routes. Reform UK wants near-zero migration. The debate affects housing, public services, and labour markets simultaneously.",
    color: "#f97316",
    icon: "✈️",
    partyIssue: "Immigration",
    newsTopic: "Immigration",
    mpTopic: "net migration, asylum backlog and immigration policy",
    briefingTopic: "UK net migration figures, asylum system and immigration policy 2025",
    keyFact: "728,000 net migration (latest ONS figures)",
    keyFactContext:
      "This is the second highest figure on record. Labour inherited a pledge to reduce it 'significantly' but has not set a numerical target. Reform UK wants net migration below zero. The Conservatives previously promised under 100,000 — a target never achieved during their 14 years in government.",
    relatedTools: [
      { to: "/parties", label: "Party positions on immigration", description: "Every party's pledges and delivery status" },
      { to: "/petitions", label: "Immigration petitions", description: "Current public demands on immigration policy" },
      { to: "/briefing", label: "AI briefing", description: "Ask about net migration, asylum or borders policy" },
    ],
  },

  education: {
    key: "education",
    title: "Education",
    question: "Are children and young people getting the education they deserve?",
    description:
      "Teacher shortages, university tuition fees, school funding and Ofsted reform are all in flux. Labour abolished single-word Ofsted ratings, launched free breakfast clubs in primary schools, and pledged to recruit 6,500 new teachers. University tuition remains a live debate for all parties.",
    color: "#ec4899",
    icon: "📚",
    partyIssue: "Education",
    newsTopic: "Education",
    mpTopic: "school funding, teacher recruitment and university tuition fees",
    briefingTopic: "UK education: school funding, teacher shortages, Ofsted and tuition fees 2025",
    keyFact: "Labour target: recruit 6,500 new teachers",
    keyFactContext:
      "Teacher training bursaries were increased but recruitment in secondary subjects like maths, physics and languages remains below target. Meanwhile, teacher retention is falling — around 40% of newly-qualified teachers leave within five years, undermining recruitment gains.",
    relatedTools: [
      { to: "/parties", label: "Education pledges", description: "Teacher recruitment, tuition fees, breakfast clubs" },
      { to: "/petitions", label: "Education petitions", description: "What the public is demanding on schools and universities" },
      { to: "/briefing", label: "AI briefing", description: "Ask about school funding, Ofsted or tuition fees" },
    ],
  },
};

export const ISSUE_KEYS = Object.keys(ISSUES) as IssueKey[];
