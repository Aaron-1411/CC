// ============================================================================
// MoneyMind UK — Shared Contract types (SINGLE SOURCE OF TRUTH)
// Agent A owns this file. Agents B & C import from it and must NOT change it.
// The first block is the verbatim Shared Contract. The second block holds
// lead-approved extensions (constants + rights/help shapes) that the contract
// referenced but did not type. These are documented as such.
// ============================================================================

// Module ids mirror the curriculum's M-numbers (M0 → 0 … M22 → 22). The
// canonical play order is the 4-Tier sequence, not numeric — see `modules`.
export type ModuleId = number;

// The four visible Tiers (the journey the user sees), ordered easy → hard.
export type Tier = 1 | 2 | 3 | 4;

// Persona on-ramp: a 20-second "character select" that reorders/highlights the
// most relevant modules for someone's situation.
export type Persona =
  | "student"
  | "new-earner"
  | "family"
  | "squeezed"
  | "self-employed"
  | "pre-retirement";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string; // shown after answering, right or wrong
}

export type ToolKind =
  | "payslip"
  | "benefitsChecker"
  | "holidayRedundancy"
  | "debtStrategy"
  | "isaGrowth"
  | "rentVsBuy"
  | "pensionProjector"
  | "selfAssessmentChecker";

export interface ToolSpec {
  kind: ToolKind;
  title: string;
  description: string;
}

export interface LessonSection {
  heading: string;
  body: string; // markdown allowed
  callout?: { type: "tip" | "warning" | "figure"; text: string };
  govLink?: { label: string; url: string }; // official gov.uk source
}

// The "Apply" step of the learning loop: one concrete real-world action that
// earns bonus XP and, where relevant, a ballpark "Money Found £" estimate.
export interface Quest {
  task: string; // the concrete action, plain English
  xp: number; // bonus XP for self-reporting completion
  moneyFound?: number; // ballpark annual £ this can unlock (clearly not advice)
  unlocksBadge?: string; // optional achievement badge id
}

export interface CourseModule {
  id: ModuleId;
  code: string; // curriculum code, e.g. "M1"
  tier: Tier; // visible Tier (1–4)
  level: number; // internal authoring Level (0–7)
  slug: string; // e.g. 'your-pay-explained'
  title: string;
  icon: string; // lucide-react icon name
  summary: string; // one line for the dashboard card
  tldr: string; // 30-second gist for time-poor users
  estMinutes: number;
  lesson: LessonSection[]; // ordered content blocks
  quiz: QuizQuestion[]; // 3–5 questions
  tool: ToolSpec | null; // null where the Tool step is skipped
  quest: Quest; // the real-world "Apply" action
  tutorSystemPrompt: string; // injected into the AI proxy for this module
  suggestedQuestions: string[]; // 3 starter questions for the tutor panel
  badge: { id: string; label: string; description: string };
}

export interface ProgressState {
  completedLessons: ModuleId[];
  quizScores: Record<ModuleId, number | undefined>;
  toolsUsed: ModuleId[];
  questsCompleted: ModuleId[];
  moneyFound: number; // lifetime ballpark £ unlocked through quests
  persona: Persona | null;
  onboarded: boolean; // has the user passed the persona on-ramp
  xp: number;
  badges: string[];
  streak: { count: number; lastOpenISO: string };
}

// ============================================================================
// LEAD-APPROVED CONTRACT EXTENSIONS
// The contract names rights.ts / help.ts shapes and requires the 8 tools to
// read figures from "constants Agent C verified". Those shapes were not typed
// in the core contract, so the lead defines them here. Agents B & C import
// these; they are as binding as the core types above.
// ============================================================================

// --- Quick-reference entitlements (src/content/rights.ts) ---
export interface RightItem {
  title: string;
  oneLineSummary: string;
  category: string; // e.g. 'Work', 'Benefits', 'Housing', 'Money', 'Tax'
  govLink: { label: string; url: string };
}

// --- Find Help directory (src/content/help.ts) ---
export interface HelpService {
  name: string;
  description: string;
  url: string;
  category: string; // e.g. 'Debt', 'General advice', 'Housing', 'Benefits'
  phone?: string;
  freephone?: boolean;
}

// --- Verified UK figures (src/content/constants.ts) ---
// Agent C populates UK_FIGURES with values verified against gov.uk / official
// sources for the CURRENT tax year. Every tool and every lesson figure reads
// from here — no magic numbers in components. Anything Agent C cannot verify
// must be flagged in content with [VERIFY], never silently guessed.
//
// Rates are decimals (0.20 = 20%). Money values are in whole GBP per the period
// named in the key (…Annual / …Weekly / …Monthly). England & Northern Ireland
// figures are the default; Scotland/Wales divergences are explained in lessons.
export interface UKFigures {
  taxYear: string; // e.g. "2026/27"

  incomeTax: {
    personalAllowance: number; // annual, before taper
    personalAllowanceTaperThreshold: number; // income where PA starts tapering
    basicRate: number; // decimal
    higherRate: number; // decimal
    additionalRate: number; // decimal
    basicRateBandUpper: number; // taxable income ceiling for basic rate
    higherRateBandUpper: number; // taxable income ceiling for higher rate (= additional-rate start)
  };

  nationalInsurance: {
    // Employee Class 1
    primaryThresholdAnnual: number;
    upperEarningsLimitAnnual: number;
    employeeMainRate: number; // decimal, on earnings between PT and UEL
    employeeUpperRate: number; // decimal, above UEL
    // Employer (secondary) Class 1
    secondaryThresholdAnnual: number;
    employerRate: number; // decimal, above ST
  };

  savings: {
    isaAllowance: number; // total annual ISA allowance
    lisaAllowance: number; // annual LISA subscription limit
    lisaBonusRate: number; // decimal (government top-up)
    juniorIsaAllowance: number;
    helpToSaveMonthlyMax: number;
    helpToSaveBonusRate: number; // decimal on highest balance
  };

  statePension: {
    fullNewWeekly: number;
    qualifyingYearsForFull: number;
    minQualifyingYears: number;
  };

  pensions: {
    autoEnrolMinTotal: number; // decimal, total minimum contribution
    autoEnrolMinEmployer: number; // decimal, minimum employer share
    annualAllowance: number;
  };

  work: {
    // National Minimum / Living Wage hourly rates
    nlwHourly: number; // National Living Wage (21+)
    wage18to20Hourly: number;
    wageUnder18Hourly: number;
    apprenticeHourly: number;
    statutorySickPayWeekly: number;
    statutoryHolidayWeeks: number; // 5.6 for a 5-day week
    // Statutory redundancy
    redundancyWeeklyPayCap: number; // max weekly pay used in the formula
    redundancyMaxYears: number; // capped service years
  };

  benefits: {
    childBenefitFirstChildWeekly: number;
    childBenefitAdditionalChildWeekly: number;
    highIncomeChildBenefitChargeThreshold: number; // adjusted net income where HICBC starts
    highIncomeChildBenefitChargeUpper: number; // income where benefit fully clawed back
  };

  tax: {
    tradingAllowance: number;
    propertyAllowance: number;
    capitalGainsAnnualExemption: number;
    inheritanceTaxNilRateBand: number;
    residenceNilRateBand: number;
    marriageAllowanceTransferable: number;
    selfAssessmentUntaxedIncomeThreshold: number; // must-file trigger for untaxed income
  };

  property: {
    // Stamp Duty Land Tax (England & NI) — residential, main home
    sdltThreshold: number; // nil-rate ceiling for standard purchases
    sdltFirstTimeBuyerThreshold: number; // nil-rate ceiling for first-time buyers
    sdltFirstTimeBuyerMaxPrice: number; // price above which FTB relief is lost
    // Ordered bands for the standard SDLT calculation. Each band charges `rate`
    // on the slice of price between `from` (exclusive) and `upTo` (inclusive).
    sdltBands: { upTo: number | null; rate: number }[];
  };
}
