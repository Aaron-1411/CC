export interface Property {
  id: string;
  address: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  epc: string;
  tenure: "Freehold" | "Leasehold";
  serviceCharge: number;
  pros: string[];
  cons: string[];
  // Rightmove-parity fields (all optional — undefined = "not disclosed")
  propertyType?: "Flat" | "Terraced" | "Semi-detached" | "Detached" | "Bungalow" | "Maisonette" | "Studio";
  leaseYearsRemaining?: number;
  groundRent?: number;            // £/yr
  councilTaxBand?: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  councilTaxAnnual?: number;      // £/yr
  parking?: "None" | "On-street" | "Allocated" | "Garage" | "Driveway";
  garden?: "None" | "Patio" | "Shared" | "Private" | "Large";
  broadbandMbps?: number;         // headline download
  mobileSignal?: "Poor" | "Limited" | "Good" | "Excellent";
  chainStatus?: "No chain" | "Chain free" | "Onward chain" | "Unknown";
  daysOnMarket?: number;
  priceHistory?: { date: string; price: number; event: "Listed" | "Reduced" | "Sold" }[];
  floodRisk?: "Very low" | "Low" | "Medium" | "High";
  heating?: "Gas central" | "Electric" | "Heat pump" | "Oil" | "Other";
  listedBuilding?: boolean;
  conservationArea?: boolean;
}

export const PROPS: Property[] = [
  {
    id: "p1", address: "12 Maple Grove", area: "Wood Green N22",
    price: 465_000, beds: 2, baths: 1, sqft: 720, yearBuilt: 1932, epc: "D",
    tenure: "Freehold", serviceCharge: 0,
    pros: ["Period features", "South-facing garden", "Walk to tube"],
    cons: ["Single glazing", "Dated kitchen"],
    propertyType: "Terraced", councilTaxBand: "C", councilTaxAnnual: 1820,
    parking: "On-street", garden: "Private", broadbandMbps: 900, mobileSignal: "Good",
    chainStatus: "Onward chain", daysOnMarket: 32, floodRisk: "Very low",
    heating: "Gas central", listedBuilding: false, conservationArea: false,
    priceHistory: [
      { date: "2025-09-04", price: 475_000, event: "Listed" },
      { date: "2025-10-12", price: 465_000, event: "Reduced" },
    ],
  },
  {
    id: "p2", address: "Apt 4, The Foundry", area: "Peckham SE15",
    price: 510_000, beds: 2, baths: 2, sqft: 685, yearBuilt: 2019, epc: "B",
    tenure: "Leasehold", serviceCharge: 2400,
    pros: ["Modern build", "Concierge", "Near Rye Lane"],
    cons: ["Service charge", "84-year lease remaining"],
    propertyType: "Flat", leaseYearsRemaining: 84, groundRent: 350,
    councilTaxBand: "D", councilTaxAnnual: 1980, parking: "Allocated", garden: "Shared",
    broadbandMbps: 1000, mobileSignal: "Excellent", chainStatus: "No chain",
    daysOnMarket: 11, floodRisk: "Low", heating: "Heat pump",
    listedBuilding: false, conservationArea: false,
    priceHistory: [{ date: "2025-10-22", price: 510_000, event: "Listed" }],
  },
  {
    id: "p3", address: "8 Riverside Mews", area: "Richmond TW9",
    price: 638_000, beds: 2, baths: 1, sqft: 810, yearBuilt: 1908, epc: "E",
    tenure: "Freehold", serviceCharge: 0,
    pros: ["Premium catchment", "Quiet cul-de-sac", "Strong appreciation"],
    cons: ["Needs full refurb", "Limited parking"],
    propertyType: "Semi-detached", councilTaxBand: "F", councilTaxAnnual: 3120,
    parking: "On-street", garden: "Private", broadbandMbps: 330, mobileSignal: "Good",
    chainStatus: "Chain free", daysOnMarket: 64, floodRisk: "Medium",
    heating: "Gas central", listedBuilding: false, conservationArea: true,
    priceHistory: [
      { date: "2025-08-01", price: 660_000, event: "Listed" },
      { date: "2025-09-15", price: 638_000, event: "Reduced" },
    ],
  },
];

export const epcScore: Record<string, number> = { A: 100, B: 90, C: 75, D: 60, E: 45, F: 30, G: 15 };

export interface ScoredProperty extends Property {
  total: number;
  pricePerSqft: number;
}

export interface Weights { price: number; size: number; condition: number; tenure: number; epc: number; }
export const DEFAULT_WEIGHTS: Weights = { price: 30, size: 20, condition: 20, tenure: 15, epc: 15 };

export const scoreProperties = (props: Property[] = PROPS, w: Weights = DEFAULT_WEIGHTS): ScoredProperty[] => {
  if (props.length === 0) return [];
  const totalW = (w.price + w.size + w.condition + w.tenure + w.epc) || 1;
  const minPrice = Math.min(...props.map((p) => p.price));
  const maxSqft = Math.max(...props.map((p) => p.sqft));
  return props.map((p) => {
    const priceScore = (minPrice / p.price) * 100;
    const sizeScore = (p.sqft / maxSqft) * 100;
    const conditionScore = Math.max(0, 100 - (2025 - p.yearBuilt) * 0.7);
    const tenureScore = p.tenure === "Freehold" ? 100 : 60;
    const eScore = epcScore[p.epc] || 50;
    const total = Math.round(
      (priceScore * w.price + sizeScore * w.size + conditionScore * w.condition + tenureScore * w.tenure + eScore * w.epc) / totalW
    );
    return { ...p, total, pricePerSqft: Math.round(p.price / p.sqft) };
  }).sort((a, b) => b.total - a.total);
};
