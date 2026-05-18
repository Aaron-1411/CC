export interface JourneyStep {
  id: string;
  label: string;
  detail: string;
  /** Optional in-app deep-link to the relevant tool */
  toolHref?: string;
  /** Optional list of documents this step needs */
  docs?: string[];
}
export interface JourneyPhase { name: string; weeks: string; icon: string; steps: JourneyStep[] }

export const JOURNEY_PHASES: JourneyPhase[] = [
  {
    name: "Prepare", weeks: "Weeks 1–8", icon: "①",
    steps: [
      { id: "p1", label: "Build a 5–20% deposit", detail: "Plus ~3% for fees, surveys, SDLT and moving costs.", toolHref: "/deposit", docs: ["Savings statements", "LISA opening confirmation"] },
      { id: "p2", label: "Check your credit file", detail: "Use Experian, Equifax and TransUnion. Fix errors early.", docs: ["Credit report PDF"] },
      { id: "p3", label: "Get a Mortgage in Principle", detail: "Use a whole-of-market broker. Valid for 60–90 days.", toolHref: "/mortgage", docs: ["3 months payslips", "3 months bank statements", "Photo ID", "Proof of address"] },
      { id: "p4", label: "Shortlist 2–3 areas", detail: "Use Area Compare for schools, transport and growth data.", toolHref: "/areas" },
      { id: "p5", label: "Check government schemes", detail: "LISA, First Homes, Shared Ownership, devolved equivalents.", toolHref: "/schemes" },
    ],
  },
  {
    name: "Search", weeks: "Weeks 4–12", icon: "②",
    steps: [
      { id: "s1", label: "View 8–12 properties", detail: "Visit at different times of day. Note natural light, noise, neighbours.", toolHref: "/viewings" },
      { id: "s2", label: "Score your shortlist", detail: "Use Property Compare to weigh up the final 2–3.", toolHref: "/properties" },
      { id: "s3", label: "Check right-fit & risk", detail: "Score lifestyle fit and surface lease/EPC/flood risks before offering.", toolHref: "/right-fit" },
      { id: "s4", label: "Run the Appreciation Score", detail: "Test long-term value before you commit emotionally.", toolHref: "/appreciation" },
      { id: "s5", label: "Get a property AVM", detail: "Triangulate fair value before bidding.", toolHref: "/avm" },
    ],
  },
  {
    name: "Offer", weeks: "Week 12+", icon: "③",
    steps: [
      { id: "o1", label: "Plan the offer ladder", detail: "Use offer-strategy to set opening bid and walk-away point.", toolHref: "/offer" },
      { id: "o2", label: "Make your offer", detail: "Lead with your MIP and chain status." },
      { id: "o3", label: "Instruct a solicitor", detail: "£1,200–£2,000. Get fixed-fee quotes from 3 conveyancers.", docs: ["Solicitor engagement letter", "Source-of-funds evidence"] },
      { id: "o4", label: "Book a survey", detail: "Level 2 (£400) for modern; Level 3 (£600+) for older or unusual.", docs: ["Survey report"] },
    ],
  },
  {
    name: "Exchange & complete", weeks: "Weeks 14–22", icon: "④",
    steps: [
      { id: "c1", label: "Submit full mortgage application", detail: "Provide payslips, IDs, deposit source. Lender values the property.", toolHref: "/mortgage", docs: ["Mortgage offer letter"] },
      { id: "c2", label: "Review searches & enquiries", detail: "Local authority, environmental, water and drainage searches.", toolHref: "/risk" },
      { id: "c3", label: "Confirm true cost & cash", detail: "Lock down day-of-completion cash including SDLT and contingency.", toolHref: "/true-cost" },
      { id: "c4", label: "Exchange contracts", detail: "10% deposit transferred. The purchase becomes legally binding." },
      { id: "c5", label: "Completion day", detail: "Funds transfer, keys collected, you're a homeowner." },
    ],
  },
];

export const JOURNEY_STORAGE_KEY = "homestead-journey-v1";
export const JOURNEY_DOCS_KEY = "homestead-journey-docs-v1";
export const JOURNEY_DATES_KEY = "homestead-journey-dates-v1";
export const MORTGAGE_STORAGE_KEY = "homestead-mortgage-v1";

export const loadJourneyDone = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(JOURNEY_STORAGE_KEY) || "[]")); } catch { return new Set(); }
};

export const loadJourneyDocs = (): Record<string, boolean> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(JOURNEY_DOCS_KEY) || "{}"); } catch { return {}; }
};

export const loadJourneyDates = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(JOURNEY_DATES_KEY) || "{}"); } catch { return {}; }
};
