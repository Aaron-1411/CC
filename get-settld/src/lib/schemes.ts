// Quantified scheme savings + best-combo recommender + UK-wide coverage.
import { computePurchaseTax, Region } from "@/lib/taxes";

export interface SchemeInputs {
  age: number;
  income: number;
  price: number;
  deposit: number;
  ftb: boolean;
  region: Region;
  monthsToBuy: number; // savings horizon
  lisaMonthly: number; // monthly LISA contribution (capped at £333)
}

export interface SchemeEligibility {
  id: string;
  name: string;
  desc: string;
  eligible: boolean;
  reason: string;
  /** Estimated £ benefit for the active scenario (over horizon / completion) */
  benefit: number;
  /** Plain-English explanation of how the benefit is computed */
  benefitNote: string;
  /** When to apply / typical lead-time */
  timeline: string;
  /** Documents you'll need */
  docs: string[];
  /** Mutual exclusion / disqualification with another scheme */
  conflictsWith?: string[];
  /** Region restriction */
  regions: Region[];
}

const HORIZON_MONTHS = (i: SchemeInputs) => Math.max(1, i.monthsToBuy);

export const evaluateSchemes = (i: SchemeInputs): SchemeEligibility[] => {
  const monthlyLisa = Math.min(333, Math.max(0, i.lisaMonthly));
  const lisaMonthlyBonus = monthlyLisa * 0.25;
  const lisaTotalBonus = Math.round(lisaMonthlyBonus * HORIZON_MONTHS(i));

  // Standard SDLT vs FTB SDLT delta (England/NI)
  const standard = computePurchaseTax({ price: i.price, region: i.region, isFTB: false, isAdditional: false, isNonResident: false });
  const ftbTax  = computePurchaseTax({ price: i.price, region: i.region, isFTB: true,  isAdditional: false, isNonResident: false });
  const ftbSaving = Math.max(0, standard.total - ftbTax.total);

  const out: SchemeEligibility[] = [];

  // ----- LISA -----
  out.push({
    id: "lisa",
    name: "Lifetime ISA (LISA)",
    desc: "25% government bonus on up to £4,000/yr - for first homes up to £450k.",
    eligible: i.age < 40 && i.price <= 450_000 && i.ftb,
    reason: i.age >= 40 ? "Must open before age 40."
      : i.price > 450_000 ? "Property exceeds £450k LISA cap."
      : !i.ftb ? "Must be a first-time buyer."
      : "Eligible - open before 40, property under £450k.",
    benefit: lisaTotalBonus,
    benefitNote: `£${monthlyLisa}/mo × 25% × ${HORIZON_MONTHS(i)} months = £${lisaTotalBonus.toLocaleString()} of free government bonus paid into your LISA.`,
    timeline: "Open ASAP - bonus accrues monthly. Must be held 12 months before withdrawal for first-home purchase.",
    docs: ["LISA account statement", "Purchase price under £450k confirmation", "Solicitor LISA withdrawal form"],
    regions: ["england", "scotland", "wales", "ni"],
  });

  // ----- FTB SDLT relief (E&NI only) -----
  out.push({
    id: "ftb_sdlt",
    name: "First-Time Buyer SDLT Relief",
    desc: "0% SDLT up to £300k, 5% on £300k–£500k for first-time buyers (England & NI).",
    eligible: i.ftb && i.price <= 500_000 && (i.region === "england" || i.region === "ni"),
    reason: !i.ftb ? "First-time buyers only."
      : i.price > 500_000 ? "Property exceeds £500k FTB cap."
      : (i.region !== "england" && i.region !== "ni") ? "Scotland uses LBTT FTB relief; Wales has no LTT FTB relief."
      : "Eligible - England/NI, FTB, under £500k.",
    benefit: i.region === "england" || i.region === "ni" ? ftbSaving : 0,
    benefitNote: `Standard SDLT £${standard.total.toLocaleString()} − FTB SDLT £${ftbTax.total.toLocaleString()} = £${ftbSaving.toLocaleString()} saved at completion.`,
    timeline: "Applied automatically by your solicitor on the SDLT return after completion.",
    docs: ["Solicitor SDLT1 form", "Confirmation you've never owned property worldwide"],
    regions: ["england", "ni"],
  });

  // ----- Scotland LBTT FTB relief -----
  out.push({
    id: "lbtt_ftb",
    name: "LBTT First-Time Buyer Relief (Scotland)",
    desc: "Nil-rate threshold raised from £145k to £175k for FTBs.",
    eligible: i.ftb && i.region === "scotland",
    reason: !i.ftb ? "First-time buyers only." : i.region !== "scotland" ? "Scotland only." : "Eligible - Scotland FTB.",
    benefit: i.region === "scotland" && i.ftb ? Math.min(600, Math.max(0, (Math.min(i.price, 175_000) - 145_000) * 0.02)) : 0,
    benefitNote: "Up to £600 saved by raising the LBTT 0% band to £175,000 for FTBs.",
    timeline: "Applied automatically by your solicitor on the LBTT return.",
    docs: ["Solicitor LBTT return", "FTB declaration"],
    regions: ["scotland"],
  });

  // ----- First Homes (England) -----
  const firstHomesDiscount = Math.round(i.price * 0.30);
  out.push({
    id: "first_homes",
    name: "First Homes Scheme (England)",
    desc: "30–50% discount on selected new-builds for local first-time buyers.",
    eligible: i.ftb && i.income <= 80_000 && i.region === "england",
    reason: !i.ftb ? "First-time buyers only."
      : i.income > 80_000 ? "Income above £80k cap (£90k London)."
      : i.region !== "england" ? "England-only scheme."
      : "Eligible - income under £80k (£90k London), England.",
    benefit: firstHomesDiscount,
    benefitNote: `30% discount on a £${i.price.toLocaleString()} new-build = £${firstHomesDiscount.toLocaleString()} off the asking price (resale stays discounted to next buyer).`,
    timeline: "Apply when you find a participating development; typical 8–12 week lead-time.",
    docs: ["Local-connection proof", "Income evidence", "FTB declaration"],
    regions: ["england"],
    conflictsWith: ["mgs"],
  });

  // ----- Shared Ownership (England + similar regional schemes covered separately) -----
  const sharePct = 0.40;
  const cashSaved = Math.round(i.price * (1 - sharePct) - 0); // capital you don't need to fund
  out.push({
    id: "shared",
    name: "Shared Ownership",
    desc: "Buy 25–75% of a home and pay rent on the rest.",
    eligible: i.income <= 80_000,
    reason: i.income > 80_000 ? "Household income above £80k cap (£90k London)." : "Eligible - household income under £80k (£90k London).",
    benefit: cashSaved,
    benefitNote: `Buying ${Math.round(sharePct*100)}% means you only mortgage £${Math.round(i.price*sharePct).toLocaleString()} - ${Math.round((1-sharePct)*100)}% (£${cashSaved.toLocaleString()}) stays with the housing association as rent base.`,
    timeline: "Apply via Help to Buy/Share to Buy regional agent. 6–10 week assessment.",
    docs: ["3 months payslips", "Bank statements", "Affordability assessment"],
    regions: ["england", "wales", "ni"],
  });

  // ----- Mortgage Guarantee Scheme (UK-wide) -----
  const mgsDeposit = Math.round(i.price * 0.05);
  out.push({
    id: "mgs",
    name: "Mortgage Guarantee Scheme",
    desc: "Government backs 95% LTV mortgages from major lenders (price ≤ £600k).",
    eligible: i.price <= 600_000 && i.deposit / i.price >= 0.05 && i.deposit / i.price < 0.10,
    reason: i.price > 600_000 ? "Property exceeds £600k cap."
      : i.deposit / i.price < 0.05 ? "Need at least 5% deposit."
      : i.deposit / i.price >= 0.10 ? "You qualify for mainstream 90% LTV - better rates outside MGS."
      : "Eligible - 5–9.99% deposit, price under £600k.",
    benefit: Math.max(0, i.deposit - mgsDeposit),
    benefitNote: `Lets you buy with just £${mgsDeposit.toLocaleString()} (5%) instead of a 10% deposit - frees £${Math.max(0, i.deposit - mgsDeposit).toLocaleString()} for fees, works or contingency.`,
    timeline: "Applied at mortgage application via participating lenders (Halifax, NatWest, HSBC, etc.).",
    docs: ["Mortgage application", "Standard FTB documentation"],
    regions: ["england", "scotland", "wales", "ni"],
    conflictsWith: ["first_homes", "shared"],
  });

  // ----- Open Market Shared Equity (Scotland) -----
  out.push({
    id: "omse",
    name: "Open Market Shared Equity (Scotland)",
    desc: "Government takes 10–40% equity stake - you fund the rest with deposit + mortgage.",
    eligible: i.region === "scotland" && i.income <= 60_000,
    reason: i.region !== "scotland" ? "Scotland only."
      : i.income > 60_000 ? "Income guidance threshold (~£60k for priority groups)."
      : "Eligible - Scotland, priority access for FTBs and key workers.",
    benefit: Math.round(i.price * 0.25),
    benefitNote: `Government covers ~25% of price (£${Math.round(i.price*0.25).toLocaleString()}) - repayable on sale at then-current market value.`,
    timeline: "Apply via your local council's housing team; allow 8–16 weeks.",
    docs: ["Income evidence", "Affordability assessment", "Property valuation"],
    regions: ["scotland"],
  });

  // ----- Help to Buy Wales - Shared Equity -----
  out.push({
    id: "htb_wales",
    name: "Help to Buy - Wales (Shared Equity)",
    desc: "Government 20% equity loan on new-build homes up to £300k. Interest-free for 5 years.",
    eligible: i.region === "wales" && i.price <= 300_000,
    reason: i.region !== "wales" ? "Wales only."
      : i.price > 300_000 ? "Property exceeds £300k cap."
      : "Eligible - Wales new-build under £300k.",
    benefit: Math.round(i.price * 0.20),
    benefitNote: `20% equity loan = £${Math.round(i.price*0.20).toLocaleString()} of price covered. Interest-free for 5 years, then 1.75% rising with RPI.`,
    timeline: "Apply via Help to Buy Wales when you reserve a participating new-build (4–8 weeks).",
    docs: ["Reservation agreement", "Mortgage offer", "Affordability assessment"],
    regions: ["wales"],
  });

  // ----- Co-Ownership NI -----
  out.push({
    id: "co_own_ni",
    name: "Co-Ownership (Northern Ireland)",
    desc: "Buy 50–90% of a home in NI; rent the rest from Co-Ownership.",
    eligible: i.region === "ni" && i.price <= 195_000,
    reason: i.region !== "ni" ? "Northern Ireland only."
      : i.price > 195_000 ? "Property exceeds £195k cap." : "Eligible - NI under £195k.",
    benefit: Math.round(i.price * 0.50),
    benefitNote: `Buy 50% (£${Math.round(i.price*0.50).toLocaleString()}) and rent the rest at sub-market rate. Staircase up later.`,
    timeline: "Co-Ownership NI assessment ~6 weeks; viewings via partner agents.",
    docs: ["Income evidence", "Bank statements", "Co-Own application"],
    regions: ["ni"],
  });

  return out;
};

/** Best legal combination of schemes maximising £ benefit, respecting conflicts. */
export const bestCombination = (schemes: SchemeEligibility[]): { picked: SchemeEligibility[]; totalBenefit: number } => {
  const eligible = schemes.filter((s) => s.eligible);
  // Greedy by benefit, skipping conflicts
  const sorted = [...eligible].sort((a, b) => b.benefit - a.benefit);
  const picked: SchemeEligibility[] = [];
  const blocked = new Set<string>();
  for (const s of sorted) {
    if (blocked.has(s.id)) continue;
    picked.push(s);
    s.conflictsWith?.forEach((id) => blocked.add(id));
  }
  return { picked, totalBenefit: picked.reduce((sum, s) => sum + s.benefit, 0) };
};
