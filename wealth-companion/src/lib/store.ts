// Local-first state store backed by localStorage. SSR-safe.
import { useEffect, useState, useCallback } from "react";
import type { StudentLoanPlan } from "./uk-tax";

const KEY = "wealth-tracker:v1";

export interface Profile {
  name: string;
  age: number;
  grossSalary: number;
  studentLoanPlan: StudentLoanPlan;
  studentLoanBalance: number;
  marriedOrCivilPartner: boolean;
  partnerLowerEarner: boolean;
  hasChildren: boolean;
  isFirstTimeBuyer: boolean;
}

export interface PensionAccount {
  id: string;
  name: string;
  provider: string;
  type: "workplace" | "sipp" | "personal";
  currentValue: number;
  monthlyOwn: number;        // £ from gross via salary sacrifice
  monthlyEmployer: number;   // £
  expectedReturn: number;    // 0.05 = 5%
}

export interface ISAAccount {
  id: string;
  name: string;
  type: "stocks" | "cash" | "lisa" | "h2b";
  currentValue: number;
  monthlyContribution: number;
  thisYearContribution: number;
  expectedReturn: number;
}

export interface Mortgage {
  enabled: boolean;
  propertyValue: number;
  outstandingBalance: number;
  rate: number;
  termYearsRemaining: number;
  monthlyOverpayment: number;
}

export interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  rate: number;
}

export interface CustomAsset {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  acquiredValue: number;
  monthlyContribution: number;
  expectedReturn: number;
  notes: string;
}

export interface SAEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  description: string;
  amount: number;        // £
  notes?: string;
}

export interface SACapitalGain {
  id: string;
  asset: string;
  acquired: string;      // YYYY-MM-DD
  disposed: string;      // YYYY-MM-DD
  proceeds: number;
  cost: number;
  withinISA: boolean;
}

export interface Goals {
  retirementAge: number;
  retirementIncome: number;        // £/yr desired in today's money
  emergencyFundMonths: number;     // target months of essentials in cash
  housePurchase: {
    enabled: boolean;
    targetPrice: number;
    targetDeposit: number;         // £
    targetYear: number;            // YYYY
  };
  payOffMortgageBy: number | null; // age, null = no goal
  payOffStudentLoanBy: number | null;
  riskAppetite: "cautious" | "balanced" | "growth";
  customGoals: { id: string; name: string; targetAmount: number; targetYear: number; currentAmount: number }[];
}

export interface SelfAssessment {
  utr: string;                       // Unique Taxpayer Reference (10 digits)
  taxYear: string;                   // e.g. "2025/26"
  employmentIncome: SAEntry[];       // PAYE jobs (separate from profile.grossSalary if needed)
  selfEmployment: SAEntry[];         // freelance / sole trader income
  selfEmploymentExpenses: SAEntry[]; // allowable expenses
  dividends: SAEntry[];              // outside ISA
  savingsInterest: SAEntry[];        // outside ISA
  rentalIncome: SAEntry[];
  rentalExpenses: SAEntry[];
  otherIncome: SAEntry[];
  pensionContribsRAS: SAEntry[];     // relief-at-source contributions (for higher-rate claim)
  giftAid: SAEntry[];                // Gift Aid donations
  capitalGains: SACapitalGain[];
}

export interface AppState {
  onboarded: boolean;
  profile: Profile;
  pensions: PensionAccount[];
  isas: ISAAccount[];
  mortgage: Mortgage;
  savings: SavingsAccount[];
  customAssets: CustomAsset[];
  selfAssessment: SelfAssessment;
  goals: Goals;
}

const DEFAULT: AppState = {
  onboarded: false,
  profile: {
    name: "",
    age: 30,
    grossSalary: 0,
    studentLoanPlan: "none",
    studentLoanBalance: 0,
    marriedOrCivilPartner: false,
    partnerLowerEarner: false,
    hasChildren: false,
    isFirstTimeBuyer: false,
  },
  pensions: [],
  isas: [],
  mortgage: {
    enabled: false,
    propertyValue: 0,
    outstandingBalance: 0,
    rate: 0.045,
    termYearsRemaining: 25,
    monthlyOverpayment: 0,
  },
  savings: [],
  customAssets: [],
  selfAssessment: {
    utr: "",
    taxYear: "2025/26",
    employmentIncome: [],
    selfEmployment: [],
    selfEmploymentExpenses: [],
    dividends: [],
    savingsInterest: [],
    rentalIncome: [],
    rentalExpenses: [],
    otherIncome: [],
    pensionContribsRAS: [],
    giftAid: [],
    capitalGains: [],
  },
  goals: {
    retirementAge: 67,
    retirementIncome: 30000,
    emergencyFundMonths: 4,
    housePurchase: { enabled: false, targetPrice: 0, targetDeposit: 0, targetYear: new Date().getFullYear() + 5 },
    payOffMortgageBy: null,
    payOffStudentLoanBy: null,
    riskAppetite: "balanced",
    customGoals: [],
  },
};

function load(): AppState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      profile: { ...DEFAULT.profile, ...parsed.profile },
      selfAssessment: { ...DEFAULT.selfAssessment, ...(parsed.selfAssessment ?? {}) },
      goals: { ...DEFAULT.goals, ...(parsed.goals ?? {}), housePurchase: { ...DEFAULT.goals.housePurchase, ...(parsed.goals?.housePurchase ?? {}) } },
    };
  } catch {
    return DEFAULT;
  }
}

type Listener = (s: AppState) => void;
const listeners = new Set<Listener>();
let current: AppState = DEFAULT;
let hydrated = false;

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    current = load();
    hydrated = true;
  }
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(current));
  }
}

export function useStore(): [AppState, (updater: (s: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(DEFAULT);

  useEffect(() => {
    ensureHydrated();
    setState(current);
    const listener: Listener = (s) => setState(s);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    current = updater(current);
    persist();
    listeners.forEach((l) => l(current));
  }, []);

  return [state, update];
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
