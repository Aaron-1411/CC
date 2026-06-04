// Tier metadata, the rank ladder, persona on-ramp definitions, and the daily
// "Money Minute" card deck. Pure data — safe to bundle into the Worker.
import type { Persona, Tier } from "../lib/types";

// ---------------------------------------------------------------------------
// The four visible Tiers (the journey the user sees), easy → hard.
// ---------------------------------------------------------------------------
export interface TierInfo {
  tier: Tier;
  name: string; // e.g. "Survive"
  tagline: string; // one line shown under the tier heading
  rank: string; // rank earned for clearing this tier
  optional?: boolean;
  // Tailwind utility fragments so components stay token-driven, no magic hex.
  accent: string; // text/border accent class
  badgeBg: string; // soft background for the tier chip
}

export const TIERS: TierInfo[] = [
  {
    tier: 1,
    name: "Survive",
    tagline: "The money survival kit — fast, easy, big wins.",
    rank: "Survivor",
    accent: "text-emerald-700",
    badgeBg: "bg-emerald-50",
  },
  {
    tier: 2,
    name: "Stabilise",
    tagline: "Understand your income, your rights and your debts.",
    rank: "Stabiliser",
    accent: "text-sky-700",
    badgeBg: "bg-sky-50",
  },
  {
    tier: 3,
    name: "Grow",
    tagline: "Make your money work — wrappers, investing, big decisions.",
    rank: "Grower",
    accent: "text-indigo-700",
    badgeBg: "bg-indigo-50",
  },
  {
    tier: 4,
    name: "Optimise & Specialise",
    tagline: "Advanced, expert, optional — keep more of what you earn.",
    rank: "Strategist",
    optional: true,
    accent: "text-violet-700",
    badgeBg: "bg-violet-50",
  },
];

export const GRADUATE_RANK = "Graduate";

export function tierInfo(tier: Tier): TierInfo {
  return TIERS.find((t) => t.tier === tier) ?? TIERS[0];
}

// The rank ladder in order, used for the HUD progression label.
export const RANK_LADDER: string[] = [
  "Newcomer",
  ...TIERS.map((t) => t.rank),
  GRADUATE_RANK,
];

// ---------------------------------------------------------------------------
// Persona on-ramp: a 20-second "character select" that floats the most
// relevant module ids to the top of the journey. The recommended tier order is
// the default; personas only *highlight* + reorder within that frame.
// `floatIds` are surfaced first (in this order) and visually highlighted.
// ---------------------------------------------------------------------------
export interface PersonaInfo {
  id: Persona;
  label: string;
  blurb: string;
  icon: string; // lucide name
  floatIds: number[]; // module ids to surface first / highlight
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: "student",
    label: "Student",
    blurb: "Loans, first accounts and making a small budget stretch.",
    icon: "GraduationCap",
    floatIds: [21, 18, 2, 6],
  },
  {
    id: "new-earner",
    label: "New earner",
    blurb: "First proper payslip — understand pay, tax and saving.",
    icon: "Briefcase",
    floatIds: [1, 2, 18, 8],
  },
  {
    id: "family",
    label: "Family",
    blurb: "Benefits, protecting your income and budgeting for a household.",
    icon: "Users",
    floatIds: [4, 2, 5, 19],
  },
  {
    id: "squeezed",
    label: "Money is tight",
    blurb: "Practical help right now — bills, benefits and breathing space.",
    icon: "LifeBuoy",
    floatIds: [22, 4, 19, 7],
  },
  {
    id: "self-employed",
    label: "Self-employed",
    blurb: "Tax returns, allowances and building your own safety net.",
    icon: "HandCoins",
    floatIds: [13, 8, 3, 12],
  },
  {
    id: "pre-retirement",
    label: "Pre-retirement",
    blurb: "Pensions, the State Pension and getting your affairs in order.",
    icon: "Umbrella",
    floatIds: [12, 15, 14, 9],
  },
];

export function personaInfo(persona: Persona): PersonaInfo | undefined {
  return PERSONAS.find((p) => p.id === persona);
}

// ---------------------------------------------------------------------------
// The daily "Money Minute": a small deck of under-a-minute nudges. The
// dashboard picks one per day (deterministically by date) to feed the streak.
// `moduleSlug` deep-links to the relevant module where helpful.
// ---------------------------------------------------------------------------
export interface MoneyMinuteCard {
  id: string;
  prompt: string;
  detail: string;
  moduleSlug?: string;
}

export const MONEY_MINUTE_CARDS: MoneyMinuteCard[] = [
  {
    id: "mm-isa",
    prompt: "Have you used any of your £20,000 ISA allowance this year?",
    detail: "It resets every 6 April and can't be carried forward — even £25 keeps the habit alive.",
    moduleSlug: "isas-explained",
  },
  {
    id: "mm-taxcode",
    prompt: "Does your tax code say 1257L?",
    detail: "A wrong code is common and can quietly cost you hundreds. Check your latest payslip.",
    moduleSlug: "your-pay-explained",
  },
  {
    id: "mm-scam",
    prompt: "Quick scam-spot: a text says your parcel needs a 50p fee. Real or fake?",
    detail: "Fake. Genuine couriers don't ask for money by text link. When in doubt, go to the official site directly.",
    moduleSlug: "scams-fraud",
  },
  {
    id: "mm-subscription",
    prompt: "Name one subscription you haven't used in the last month.",
    detail: "Zombie subscriptions are the easiest win in budgeting — cancel one and redirect it to savings.",
    moduleSlug: "budgeting",
  },
  {
    id: "mm-pension-match",
    prompt: "Is your employer matching every pound they'd match into your pension?",
    detail: "If they match more when you pay more, not doing so is turning down a guaranteed pay rise.",
    moduleSlug: "state-pension-retirement",
  },
  {
    id: "mm-marriage-allowance",
    prompt: "Is one of you a non-taxpayer and the other basic-rate?",
    detail: "Marriage Allowance is worth £252 a year and can be backdated four years — a classic unclaimed win.",
    moduleSlug: "hidden-tax",
  },
  {
    id: "mm-buffer",
    prompt: "If your boiler died tomorrow, could you cover it without borrowing?",
    detail: "A small emergency fund (£1,000 to start) stops a surprise bill becoming expensive debt.",
    moduleSlug: "savings-emergency-fund",
  },
  {
    id: "mm-statepension",
    prompt: "Have you ever checked your State Pension forecast?",
    detail: "gov.uk/check-state-pension reads your real NI record — the most useful 5 minutes in the course.",
    moduleSlug: "state-pension-retirement",
  },
  {
    id: "mm-switch",
    prompt: "When did you last switch your energy or bank account?",
    detail: "Loyalty rarely pays. A switch can bag a bonus or a cheaper tariff in minutes.",
    moduleSlug: "banking-and-switching",
  },
  {
    id: "mm-benefits",
    prompt: "Billions in benefits go unclaimed each year — have you checked yours?",
    detail: "A free, anonymous calculator (Turn2Us or entitledto) takes minutes.",
    moduleSlug: "benefits",
  },
];

// Deterministic pick so the same day always shows the same card.
export function moneyMinuteForDate(date = new Date()): MoneyMinuteCard {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return MONEY_MINUTE_CARDS[dayIndex % MONEY_MINUTE_CARDS.length];
}
