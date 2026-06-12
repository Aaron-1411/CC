/**
 * Political education content — "Learn" section.
 *
 * Mirrors the MoneyMind education pattern (modules of plain-English lessons +
 * a rights quick-reference, each linking to an official source). Pure data, no
 * React. Civics content is kept conceptual and stable; anything with specific
 * numbers or ages links to the authoritative source so it stays correct.
 */

export type LessonCallout = { type: "key" | "tip" | "example"; text: string };

export type LessonSection = {
  heading: string;
  body: string;
  callout?: LessonCallout;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LearnModule = {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  /** One-paragraph "if you only read this" takeaway. */
  tldr: string;
  estMinutes: number;
  lesson: LessonSection[];
  quiz?: QuizQuestion[];
  /** Tools on transparenC that let you act on what you've learned. */
  relatedTools?: Array<{ to: string; label: string }>;
};

export const LEARN_MODULES: LearnModule[] = [
  {
    slug: "how-the-uk-is-governed",
    title: "How the UK is governed",
    icon: "🏛️",
    summary:
      "Parliament, Government, the two Houses, devolution and local councils — who actually decides what.",
    tldr: "Parliament makes the laws; the Government (drawn from the largest party) runs the country day to day. The Commons is elected; the Lords revises. Scotland, Wales and Northern Ireland have their own devolved parliaments, and local councils run many services where you live.",
    estMinutes: 8,
    lesson: [
      {
        heading: "Parliament vs Government — they're not the same thing",
        body: "Parliament is the body that makes and scrutinises law: the House of Commons (650 elected MPs) and the House of Lords (appointed and some hereditary members). The Government is the team of ministers — led by the Prime Minister — that runs the country. The Government is drawn from whichever party can command a majority in the Commons, so it is accountable to Parliament, not separate from it.",
        callout: {
          type: "key",
          text: "MPs are elected. The Government is formed from the largest party in the Commons. The Lords is not elected — it revises and checks legislation.",
        },
      },
      {
        heading: "The two Houses",
        body: "Most laws must pass both the Commons and the Lords. The Commons has the final say — under the Parliament Acts it can ultimately override the Lords — but the Lords plays a real role revising and delaying legislation and asking the Government to think again.",
        sourceLabel: "UK Parliament — how Parliament works",
        sourceUrl: "https://www.parliament.uk/about/how/",
      },
      {
        heading: "Devolution",
        body: "Scotland, Wales and Northern Ireland each have their own elected legislature with powers over areas like health, education and (in Scotland) some taxes. England has no separate parliament — English matters are decided at Westminster. This is why the rules on things like tuition fees or NHS prescriptions can differ across the UK.",
        sourceLabel: "GOV.UK — devolution settlement",
        sourceUrl: "https://www.gov.uk/guidance/devolution-settlement-scotland",
      },
      {
        heading: "Local government",
        body: "Councils — county, district, unitary, parish and town — run a huge share of everyday services: social care, schools, planning, bins, roads and housing. Councillors are elected locally, and most council meetings are open to the public. A lot of the decisions that affect your street are made here, not in Westminster.",
        sourceLabel: "GOV.UK — find your local council",
        sourceUrl: "https://www.gov.uk/find-local-council",
      },
    ],
    quiz: [
      {
        question: "Which House has the final say on legislation?",
        options: ["The House of Lords", "The House of Commons", "Both equally", "The monarch"],
        correctIndex: 1,
        explanation:
          "The elected Commons can ultimately override the Lords under the Parliament Acts. The Lords revises and delays but cannot permanently block most legislation.",
      },
      {
        question: "Who forms the Government?",
        options: [
          "The monarch appoints anyone",
          "The party (or parties) that can command a Commons majority",
          "The House of Lords",
          "The Civil Service",
        ],
        correctIndex: 1,
        explanation:
          "The Government is drawn from whichever party or coalition can command a majority of MPs in the House of Commons.",
      },
    ],
    relatedTools: [
      { to: "/parliament", label: "Bills in Parliament" },
      { to: "/my-area", label: "Find your MP" },
    ],
  },

  {
    slug: "how-a-law-is-made",
    title: "How a law is made",
    icon: "📜",
    summary:
      "From an idea to an Act of Parliament — every stage a bill passes through, and where the public can weigh in.",
    tldr: "A proposed law (a 'bill') goes through several readings and committee scrutiny in both the Commons and the Lords, then receives Royal Assent to become an Act. You can follow every stage, and feed in through consultations, your MP, select committees and petitions.",
    estMinutes: 7,
    lesson: [
      {
        heading: "What a bill is",
        body: "A bill is a proposed law. Most are introduced by the Government, but backbench MPs and peers can introduce their own ('Private Members' Bills'). To become law a bill must be agreed, in the same form, by both Houses — then formally approved by the monarch.",
      },
      {
        heading: "The stages",
        body: "A bill typically passes through: First Reading (formal introduction) → Second Reading (a debate on the principle) → Committee Stage (line-by-line examination and amendments) → Report Stage (further amendments) → Third Reading (final Commons debate). It then goes through the same stages in the other House, and any disagreements are resolved by passing it back and forth ('ping-pong').",
        callout: {
          type: "key",
          text: "First Reading → Second Reading → Committee → Report → Third Reading — then the same again in the other House.",
        },
        sourceLabel: "UK Parliament — how a bill becomes law",
        sourceUrl: "https://www.parliament.uk/about/how/laws/passage-bill/",
      },
      {
        heading: "Royal Assent",
        body: "Once both Houses agree the final text, the bill receives Royal Assent and becomes an Act of Parliament — law. In modern practice Royal Assent is a formality; the last refusal was in 1708.",
      },
      {
        heading: "Where you come in",
        body: "Before and during a bill you can respond to Government consultations, write to your MP to back or oppose specific clauses, submit written evidence to the committee scrutinising it, and sign or start petitions. The earlier you engage, the more influence you have.",
        callout: {
          type: "tip",
          text: "Committee stage is where the detail is fought over — a well-argued letter to your MP about a specific clause can matter more than a general one.",
        },
      },
    ],
    quiz: [
      {
        question: "What is the 'Committee Stage' of a bill for?",
        options: [
          "A vote on whether the bill should exist at all",
          "Line-by-line examination and amendments",
          "The monarch's approval",
          "Choosing the Prime Minister",
        ],
        correctIndex: 1,
        explanation:
          "Committee Stage is the detailed, line-by-line examination where amendments are debated — often where a bill changes most.",
      },
    ],
    relatedTools: [
      { to: "/parliament", label: "Track live bills" },
      { to: "/votes", label: "How MPs voted" },
    ],
  },

  {
    slug: "how-voting-works",
    title: "How voting works",
    icon: "🗳️",
    summary:
      "Who can vote, how to register, the voting systems used across the UK, and the different elections you can vote in.",
    tldr: "You must be registered to vote — it takes about five minutes online. UK general elections use First Past the Post; devolved and some local elections use other systems. The voting age is 18 for UK general elections and 16 for devolved and local elections in Scotland and Wales.",
    estMinutes: 8,
    lesson: [
      {
        heading: "Register first — nothing happens without it",
        body: "You cannot vote unless you are on the electoral register. Registering is free, takes about five minutes online, and you only need to do it again if your details change. There are registration deadlines before every election, so it pays to do it now rather than later.",
        sourceLabel: "GOV.UK — register to vote",
        sourceUrl: "https://www.gov.uk/register-to-vote",
      },
      {
        heading: "First Past the Post (UK general elections)",
        body: "For the UK Parliament, the country is divided into 650 constituencies. In each, the candidate with the most votes wins the seat — even without a majority. This system tends to produce clear single-party governments but means a party's share of seats can differ a lot from its share of the national vote.",
        callout: {
          type: "key",
          text: "Under First Past the Post you are electing one local MP, not directly choosing the Prime Minister.",
        },
      },
      {
        heading: "Other systems across the UK",
        body: "Devolved and many local elections use different systems — for example forms of proportional or preferential voting in the Scottish Parliament, the Senedd, and Northern Ireland. These can give smaller parties a fairer share of seats. The system in use depends on which election you are voting in.",
        sourceLabel: "Electoral Commission — voting systems",
        sourceUrl: "https://www.electoralcommission.org.uk/voting-and-elections",
      },
      {
        heading: "Who can vote, and at what age",
        body: "Broadly, British, Irish and qualifying Commonwealth citizens (and some EU citizens for certain elections) who are registered and resident can vote. The voting age is 18 for UK general elections, and 16 for Scottish Parliament, Senedd and Scottish and Welsh local elections. The rules are kept under review, so check the official source for your election.",
        callout: {
          type: "example",
          text: "A 16-year-old in Glasgow can vote in Scottish Parliament and Scottish council elections, but not yet in a UK general election.",
        },
        sourceLabel: "GOV.UK — who can vote",
        sourceUrl: "https://www.gov.uk/elections-in-the-uk/who-can-vote-in-elections",
      },
      {
        heading: "Voter ID",
        body: "At polling stations for many UK elections you now need to show an accepted form of photo ID. If you don't have one, you can apply for a free Voter Authority Certificate. Don't get turned away — check what counts before polling day.",
        sourceLabel: "Electoral Commission — voter ID",
        sourceUrl: "https://www.electoralcommission.org.uk/voting-and-elections/voter-id",
      },
    ],
    quiz: [
      {
        question: "Under First Past the Post, who are you directly electing?",
        options: [
          "The Prime Minister",
          "One MP for your local constituency",
          "The whole Cabinet",
          "The House of Lords",
        ],
        correctIndex: 1,
        explanation:
          "You elect a single MP for your constituency. The Government is then formed from whichever party wins the most seats.",
      },
      {
        question: "What's the first thing you must do before you can vote?",
        options: ["Join a party", "Register to vote", "Pay a fee", "Attend a council meeting"],
        correctIndex: 1,
        explanation:
          "You must be on the electoral register. It's free and takes about five minutes online.",
      },
    ],
    relatedTools: [
      { to: "/my-area", label: "Find your constituency" },
      { to: "/votes", label: "MP voting records" },
    ],
  },

  {
    slug: "your-voice-between-elections",
    title: "Your voice between elections",
    icon: "📣",
    summary:
      "Voting is one day every few years. Here's how to influence decisions on every other day.",
    tldr: "Between elections you can write to your MP, respond to consultations, sign or start petitions (10,000 signatures earns a government response, 100,000 means it's considered for debate), submit Freedom of Information requests, and join campaigns. Specific, evidence-backed action beats noise.",
    estMinutes: 7,
    lesson: [
      {
        heading: "Write to your MP",
        body: "Your MP represents everyone in the constituency, whether you voted for them or not. Responding to constituents is a strong convention. A short, specific, evidence-backed letter — naming the issue, the figure and the ask — carries more weight than a long general one.",
        sourceLabel: "UK Parliament — contact your MP",
        sourceUrl: "https://www.parliament.uk/get-involved/contact-an-mp-or-lord/contact-your-mp/",
      },
      {
        heading: "Petitions",
        body: "The UK Government and Parliament petitions site lets anyone start or sign a petition. At 10,000 signatures the Government must respond in writing; at 100,000 the petition is considered for debate in Parliament (debates are usual but not automatic).",
        callout: {
          type: "key",
          text: "10,000 signatures = a written government response. 100,000 = considered for a debate.",
        },
        sourceLabel: "Petitions — UK Government and Parliament",
        sourceUrl: "https://petition.parliament.uk/help",
      },
      {
        heading: "Consultations",
        body: "Before many decisions, government departments and councils run public consultations. Anyone can respond, and well-argued responses genuinely shape outcomes. They are often under-attended, so your voice can carry disproportionate weight.",
        sourceLabel: "GOV.UK — open consultations",
        sourceUrl:
          "https://www.gov.uk/search/policy-papers-and-consultations?content_store_document_type%5B%5D=open_consultations",
      },
      {
        heading: "Freedom of Information",
        body: "You have a legal right to ask most public bodies for recorded information, and they must usually respond within 20 working days. It's a powerful tool for uncovering what's really happening — how money was spent, what advice was given, what a decision was based on.",
        sourceLabel: "GOV.UK — make an FOI request",
        sourceUrl: "https://www.gov.uk/make-a-freedom-of-information-request",
      },
    ],
    quiz: [
      {
        question: "How many signatures does a petition need before the Government must respond?",
        options: ["100", "1,000", "10,000", "100,000"],
        correctIndex: 2,
        explanation:
          "At 10,000 signatures the Government must respond in writing. At 100,000 the petition is considered for debate.",
      },
    ],
    relatedTools: [
      { to: "/petitions", label: "Browse petitions" },
      { to: "/foi", label: "FOI data" },
      { to: "/take-action", label: "Take action" },
    ],
  },

  {
    slug: "getting-involved-locally",
    title: "Getting involved locally",
    icon: "🏘️",
    summary:
      "Councils make the decisions closest to your daily life — and local power is unusually accessible.",
    tldr: "Councils decide planning, housing, social care and local services. Their meetings are public, their budgets are published, and standing as a councillor needs no money or party. Many local seats go uncontested, so individuals can have real impact.",
    estMinutes: 6,
    lesson: [
      {
        heading: "What councils actually decide",
        body: "Depending on where you live, your council handles planning permission, social care, schools, housing, waste, roads and licensing. These are the decisions you feel most directly — and they are made locally, by councillors you elect.",
        sourceLabel: "GOV.UK — understand how your council works",
        sourceUrl: "https://www.gov.uk/understand-how-your-council-works",
      },
      {
        heading: "Council meetings are public",
        body: "Full council and committee meetings are generally open to the public, with agendas and minutes published in advance. You can attend, and many councils allow public questions. Planning and scrutiny committees in particular are where contested local decisions get made.",
      },
      {
        heading: "Standing for election",
        body: "You can stand as a local councillor from age 18, with no deposit and no need to belong to a party. Many seats are uncontested at each election. You don't have to win to put an issue on the agenda — standing is itself a way to be heard.",
        callout: {
          type: "tip",
          text: "Parish and town councils, school governing boards and tenants' associations are low-barrier ways to start.",
        },
        sourceLabel: "GOV.UK — become a councillor",
        sourceUrl: "https://www.gov.uk/become-councillor",
      },
    ],
    relatedTools: [
      { to: "/my-area", label: "Your area" },
      { to: "/spending", label: "Public spending" },
    ],
  },

  {
    slug: "holding-power-to-account",
    title: "Holding power to account",
    icon: "🔍",
    summary: "The checks that keep government honest — and how transparenC helps you use them.",
    tldr: "Power is checked by Parliament's select committees, a free press, Freedom of Information, independent watchdogs and the courts. transparenC pulls the public records behind these checks into one place so you can follow the money and the promises yourself.",
    estMinutes: 6,
    lesson: [
      {
        heading: "Select committees",
        body: "Cross-party committees of MPs (and Lords committees) scrutinise the work of each government department, question ministers and officials under oath-like conditions, and publish reports the Government must respond to. Their evidence sessions and reports are a goldmine of accountability.",
        sourceLabel: "UK Parliament — select committees",
        sourceUrl: "https://www.parliament.uk/about/how/committees/select/",
      },
      {
        heading: "Transparency registers",
        body: "Lots of potential conflicts of interest are recorded in public registers: ministers' meetings, MPs' financial interests and expenses, party donations, lobbying, and the 'revolving door' between government and business (ACOBA). On their own each entry is mundane; cross-referenced, patterns emerge.",
        callout: {
          type: "example",
          text: "Search a company across contracts, donations, lobbying and ACOBA at once to see whether it appears in more than one register.",
        },
      },
      {
        heading: "Independent watchdogs and the courts",
        body: "Bodies like the National Audit Office, the various ombudsman services, the Electoral Commission and the courts (through judicial review) provide checks outside Parliament. They can investigate, audit, and in some cases overturn unlawful decisions.",
      },
      {
        heading: "Where transparenC fits",
        body: "transparenC doesn't replace any of these — it makes them usable. It pulls the public data behind them into one place, links every figure to its official source, and tracks what was promised against what was delivered, so you can hold power to account with evidence.",
        sourceLabel: "transparenC — methodology",
        sourceUrl: "/methodology",
      },
    ],
    relatedTools: [
      { to: "/committees", label: "Committee reports" },
      { to: "/crossref", label: "Cross-reference" },
      { to: "/contracts", label: "Contracts" },
    ],
  },
];

export function getLearnModule(slug: string): LearnModule | undefined {
  return LEARN_MODULES.find((m) => m.slug === slug);
}

// ─── Democratic rights quick-reference ────────────────────────────────────────

export type DemocraticRight = {
  title: string;
  summary: string;
  category: "Vote" | "Be heard" | "Find out" | "Stand & act";
  sourceLabel: string;
  sourceUrl: string;
};

export const DEMOCRATIC_RIGHTS: DemocraticRight[] = [
  {
    title: "Register to vote",
    summary: "Free, about five minutes online. You must be registered before any election.",
    category: "Vote",
    sourceLabel: "GOV.UK — register to vote",
    sourceUrl: "https://www.gov.uk/register-to-vote",
  },
  {
    title: "Get free voter ID",
    summary:
      "No accepted photo ID? Apply for a free Voter Authority Certificate so you're not turned away.",
    category: "Vote",
    sourceLabel: "GOV.UK — Voter Authority Certificate",
    sourceUrl: "https://www.gov.uk/apply-for-photo-id-voter-authority-certificate",
  },
  {
    title: "Vote by post or proxy",
    summary:
      "Can't get to a polling station? You can apply to vote by post, or appoint someone to vote for you.",
    category: "Vote",
    sourceLabel: "GOV.UK — voting by post",
    sourceUrl: "https://www.gov.uk/how-to-vote/voting-by-post",
  },
  {
    title: "Contact your MP",
    summary:
      "Your MP represents you whether or not you voted for them. A specific, evidence-backed letter gets noticed.",
    category: "Be heard",
    sourceLabel: "UK Parliament — contact your MP",
    sourceUrl: "https://www.parliament.uk/get-involved/contact-an-mp-or-lord/contact-your-mp/",
  },
  {
    title: "Sign or start a petition",
    summary:
      "10,000 signatures earns a written government response; 100,000 means it's considered for debate.",
    category: "Be heard",
    sourceLabel: "Petitions — UK Government and Parliament",
    sourceUrl: "https://petition.parliament.uk/help",
  },
  {
    title: "Respond to a consultation",
    summary:
      "Before many decisions, departments and councils ask the public. Responses genuinely shape outcomes.",
    category: "Be heard",
    sourceLabel: "GOV.UK — open consultations",
    sourceUrl:
      "https://www.gov.uk/search/policy-papers-and-consultations?content_store_document_type%5B%5D=open_consultations",
  },
  {
    title: "Make an FOI request",
    summary:
      "Ask most public bodies for recorded information. They usually must respond within 20 working days.",
    category: "Find out",
    sourceLabel: "GOV.UK — make an FOI request",
    sourceUrl: "https://www.gov.uk/make-a-freedom-of-information-request",
  },
  {
    title: "Attend a council meeting",
    summary:
      "Full council and committee meetings are public, with agendas and minutes published in advance.",
    category: "Find out",
    sourceLabel: "GOV.UK — find your local council",
    sourceUrl: "https://www.gov.uk/find-local-council",
  },
  {
    title: "Stand for election",
    summary:
      "Stand as a local councillor from 18 — no deposit, no party required. Many seats are uncontested.",
    category: "Stand & act",
    sourceLabel: "GOV.UK — become a councillor",
    sourceUrl: "https://www.gov.uk/become-councillor",
  },
  {
    title: "Protest peacefully",
    summary:
      "You have the right to peaceful protest and assembly, within the law. Know the rules before you go.",
    category: "Stand & act",
    sourceLabel: "Liberty — protest rights",
    sourceUrl: "https://www.libertyhumanrights.org.uk/advice_information/protest-rights/",
  },
];
