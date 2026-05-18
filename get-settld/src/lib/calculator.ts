// Pure cost-engine for the standalone /calculator. Kept separate from
// the full TrueCost page so the public/embed surface stays small and
// link-shareable via querystring.
import { computePurchaseTax, type Region } from "@/lib/taxes";

export interface CalcInputs {
  price: number;
  region: Region;
  isFTB: boolean;
  deposit: number;
  surveyType: "condition" | "homebuyer" | "structural";
  solicitor: number;
  mortgageFee: number;
  moving: number;
  insurance: number;
}

export const SURVEY_PRICES: Record<CalcInputs["surveyType"], { label: string; price: number }> = {
  condition: { label: "Condition Report (RICS L1)", price: 400 },
  homebuyer: { label: "HomeBuyer Report (RICS L2)", price: 600 },
  structural: { label: "Full Structural Survey (RICS L3)", price: 1200 },
};

export const DEFAULTS: CalcInputs = {
  price: 300_000,
  region: "england",
  isFTB: true,
  deposit: 30_000,
  surveyType: "homebuyer",
  solicitor: 1500,
  mortgageFee: 999,
  moving: 800,
  insurance: 250,
};

export interface CalcLine {
  key: string;
  label: string;
  amount: number;
  hint?: string;
}

export interface CalcResult {
  lines: CalcLine[];
  tax: ReturnType<typeof computePurchaseTax>;
  totalUpfront: number;
}

export const compute = (i: CalcInputs): CalcResult => {
  const tax = computePurchaseTax({
    price: i.price,
    region: i.region,
    isFTB: i.isFTB,
    isAdditional: false,
    isNonResident: false,
  });
  const survey = SURVEY_PRICES[i.surveyType];
  const lines: CalcLine[] = [
    { key: "deposit", label: "Deposit", amount: i.deposit, hint: "Paid at exchange / completion." },
    { key: "tax", label: tax.label, amount: tax.total, hint: `Banded ${tax.label} for ${i.region}.${i.isFTB ? " First-time buyer relief applied." : ""}` },
    { key: "solicitor", label: "Solicitor / Conveyancing", amount: i.solicitor, hint: "Typical UK range £1,200–£2,500 inc. VAT." },
    { key: "survey", label: survey.label, amount: survey.price, hint: "RICS-registered surveyor." },
    { key: "mortgageFee", label: "Mortgage arrangement fee", amount: i.mortgageFee, hint: "Lender product fee. Often £0–£1,999." },
    { key: "moving", label: "Removals & moving", amount: i.moving, hint: "2–3 bed local move estimate." },
    { key: "insurance", label: "Buildings insurance (year 1)", amount: i.insurance, hint: "ABI typical premium for an average rebuild cost." },
  ];
  const totalUpfront = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, tax, totalUpfront };
};

// Bidirectional URL <-> inputs serialisation. Short keys keep links readable.
const KEY_MAP: Record<string, keyof CalcInputs> = {
  p: "price", r: "region", f: "isFTB", d: "deposit",
  sv: "surveyType", so: "solicitor", mf: "mortgageFee", mv: "moving", in: "insurance",
};
const REV: Record<keyof CalcInputs, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
) as Record<keyof CalcInputs, string>;

export const inputsToSearch = (i: CalcInputs): string => {
  const params = new URLSearchParams();
  (Object.keys(REV) as (keyof CalcInputs)[]).forEach((k) => {
    const v = i[k];
    if (typeof v === "boolean") params.set(REV[k], v ? "1" : "0");
    else params.set(REV[k], String(v));
  });
  return params.toString();
};

export const inputsFromSearch = (search: string): CalcInputs => {
  const params = new URLSearchParams(search);
  const out: CalcInputs = { ...DEFAULTS };
  Object.entries(KEY_MAP).forEach(([short, long]) => {
    const raw = params.get(short);
    if (raw == null) return;
    if (long === "isFTB") (out as any)[long] = raw === "1";
    else if (long === "region" || long === "surveyType") (out as any)[long] = raw;
    else {
      const n = Number(raw);
      if (Number.isFinite(n)) (out as any)[long] = n;
    }
  });
  return out;
};
