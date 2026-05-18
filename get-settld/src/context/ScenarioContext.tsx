import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";

export type Region = "england" | "scotland" | "wales" | "ni";
export type Tenure = "buy_to_live" | "buy_to_let";

export interface Scenario {
  /** Headline target purchase price (£) */
  price: number;
  /** Cash deposit (£) - derived deposit % computed on read */
  deposit: number;
  /** Annual gross household income (£) */
  income: number;
  /** Mortgage term (years) */
  term: number;
  /** Indicative product rate (%) */
  rate: number;
  /** Region for SDLT/Land Tax + scheme eligibility */
  region: Region;
  /** First-time buyer flag */
  isFTB: boolean;
  /** Buy to live vs buy to let */
  tenure: Tenure;
  /** Planned hold period (years) - drives appreciation, IRR, exit calcs */
  holdYears: number;
}

export const DEFAULT_SCENARIO: Scenario = {
  price: 350_000,
  deposit: 35_000,
  income: 65_000,
  term: 30,
  rate: 4.49,
  region: "england",
  isFTB: true,
  tenure: "buy_to_live",
  holdYears: 7,
};

const KEY = "homestead.scenario.v1";

interface Ctx {
  scenario: Scenario;
  setScenario: (patch: Partial<Scenario>) => void;
  resetScenario: () => void;
  /** Computed deposit percentage for convenience */
  depositPct: number;
  /** Computed loan-to-value */
  ltv: number;
  /** Computed loan amount */
  loan: number;
  /** Stable share URL with scenario encoded in hash */
  shareUrl: string;
}

const ScenarioContext = createContext<Ctx | null>(null);

const decodeFromHash = (): Partial<Scenario> | null => {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/scenario=([^&]+)/);
  if (!m) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(atob(m[1])));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
};

const encodeToHash = (s: Scenario) => btoa(encodeURIComponent(JSON.stringify(s)));

const readInitial = (): Scenario => {
  if (typeof window === "undefined") return DEFAULT_SCENARIO;
  const fromHash = decodeFromHash();
  if (fromHash) return { ...DEFAULT_SCENARIO, ...fromHash };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SCENARIO, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SCENARIO;
};

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setState] = useState<Scenario>(readInitial);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(scenario)); } catch { /* ignore */ }
  }, [scenario]);

  const setScenario = useCallback((patch: Partial<Scenario>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetScenario = useCallback(() => setState(DEFAULT_SCENARIO), []);

  const value = useMemo<Ctx>(() => {
    const depositPct = scenario.price > 0 ? (scenario.deposit / scenario.price) * 100 : 0;
    const loan = Math.max(0, scenario.price - scenario.deposit);
    const ltv = scenario.price > 0 ? (loan / scenario.price) * 100 : 0;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}#scenario=${encodeToHash(scenario)}`
        : "";
    return { scenario, setScenario, resetScenario, depositPct, ltv, loan, shareUrl };
  }, [scenario, setScenario, resetScenario]);

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): Ctx {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be used inside <ScenarioProvider>");
  return ctx;
}

/** Read-once initial value from scenario for tools that own local state. */
export function useScenarioInitial<K extends keyof Scenario>(key: K, fallback: Scenario[K]): Scenario[K] {
  const ctx = useContext(ScenarioContext);
  return (ctx?.scenario?.[key] ?? fallback) as Scenario[K];
}
