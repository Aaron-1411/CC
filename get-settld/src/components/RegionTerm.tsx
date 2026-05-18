// Region-aware terminology helper. Use instead of hard-coding "Stamp Duty"
// (which is wrong for Scotland → LBTT, Wales → LTT).
//   <RegionTerm term="stampDuty" /> → "Stamp Duty" / "LBTT" / "LTT"
import { useScenario } from "@/context/ScenarioContext";

type Term = "stampDuty" | "stampDutyLong" | "landRegistry" | "homeReport";

const MAP: Record<Term, Record<"england" | "scotland" | "wales" | "ni", string>> = {
  stampDuty: {
    england: "Stamp Duty", ni: "Stamp Duty",
    scotland: "LBTT", wales: "LTT",
  },
  stampDutyLong: {
    england: "Stamp Duty Land Tax",
    ni: "Stamp Duty Land Tax",
    scotland: "Land & Buildings Transaction Tax",
    wales: "Land Transaction Tax",
  },
  landRegistry: {
    england: "HM Land Registry", ni: "Land Registry of NI",
    scotland: "Registers of Scotland", wales: "HM Land Registry",
  },
  homeReport: {
    england: "Survey", ni: "Survey",
    scotland: "Home Report (seller-provided)", wales: "Survey",
  },
};

export default function RegionTerm({ term }: { term: Term }) {
  const { scenario } = useScenario();
  return <>{MAP[term][scenario.region]}</>;
}

export function useRegionTerm(term: Term) {
  const { scenario } = useScenario();
  return MAP[term][scenario.region];
}
