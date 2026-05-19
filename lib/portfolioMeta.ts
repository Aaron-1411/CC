/**
 * Static sector / geography / theme metadata for each holding.
 * ETF sector allocations are approximate (as of mid-2025 factsheets).
 * Used by the portfolio overview page — no live data needed.
 */

export type SectorName =
  | "Information Technology"
  | "Communication Services"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Financials"
  | "Healthcare"
  | "Industrials"
  | "Energy"
  | "Materials"
  | "Real Estate"
  | "Utilities"
  | "Commodities";

export type RegionName =
  | "United States"
  | "Europe ex-UK"
  | "Japan"
  | "United Kingdom"
  | "Emerging Markets"
  | "Other Developed"
  | "Global Commodity";

export interface HoldingMeta {
  ticker: string;
  /** Short thesis — what this holding actually is and why it's here */
  thesis: string;
  /** One-line category label */
  category: string;
  /** GICS sector allocations, must sum to 1 */
  sectors: Partial<Record<SectorName, number>>;
  /** Geographic exposure, must sum to 1 */
  geography: Partial<Record<RegionName, number>>;
  /** Investment themes this holding contributes to */
  themes: string[];
  /** Beta to global equities (approximate) */
  beta: number;
  /** Volatility profile */
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
}

export const PORTFOLIO_META: HoldingMeta[] = [
  {
    ticker: "EQQQ",
    thesis: "Pure-play Nasdaq-100 exposure — the world's 100 most innovative non-financial companies, market-cap weighted. Dominant AI/tech allocation with low TER.",
    category: "US Tech ETF",
    sectors: {
      "Information Technology": 0.52,
      "Communication Services": 0.16,
      "Consumer Discretionary": 0.14,
      "Healthcare": 0.06,
      "Consumer Staples": 0.04,
      "Industrials": 0.04,
    },
    geography: { "United States": 1.0 },
    themes: ["AI & Semiconductors", "US Tech Dominance", "Mega-Cap Growth"],
    beta: 1.35,
    riskLevel: "High",
  },
  {
    ticker: "VWRP",
    thesis: "The portfolio's diversification anchor — ~4,000 stocks across 50+ countries. Provides global beta, emerging market optionality, and sector breadth that individual stocks can't replicate.",
    category: "Global All-World ETF",
    sectors: {
      "Information Technology": 0.24,
      "Financials": 0.16,
      "Healthcare": 0.12,
      "Consumer Discretionary": 0.10,
      "Communication Services": 0.08,
      "Industrials": 0.08,
      "Consumer Staples": 0.06,
      "Energy": 0.05,
      "Materials": 0.04,
      "Real Estate": 0.03,
      "Utilities": 0.02,
    },
    geography: {
      "United States": 0.63,
      "Japan": 0.06,
      "United Kingdom": 0.04,
      "Europe ex-UK": 0.11,
      "Emerging Markets": 0.12,
      "Other Developed": 0.04,
    },
    themes: ["Global Diversification", "Developed Market Core", "Emerging Market Optionality"],
    beta: 1.0,
    riskLevel: "Moderate",
  },
  {
    ticker: "VUAG",
    thesis: "S&P 500 accumulating — captures US corporate earnings breadth. Complements EQQQ by adding financials, healthcare, and energy alongside tech mega-caps.",
    category: "US Large Cap ETF",
    sectors: {
      "Information Technology": 0.32,
      "Financials": 0.13,
      "Healthcare": 0.12,
      "Consumer Discretionary": 0.10,
      "Communication Services": 0.09,
      "Industrials": 0.08,
      "Consumer Staples": 0.06,
      "Energy": 0.04,
      "Materials": 0.02,
      "Real Estate": 0.02,
      "Utilities": 0.02,
    },
    geography: { "United States": 1.0 },
    themes: ["US Large Cap Core", "Mega-Cap Growth"],
    beta: 1.05,
    riskLevel: "Moderate",
  },
  {
    ticker: "BRK.A",
    thesis: "Berkshire is a capital-allocation machine — effectively a private equity firm with a perpetual insurance float. Acts as the portfolio's quality/value anchor: low beta, massive cash reserves ($340B+), and Buffett's 60-year compounding track record.",
    category: "US Value / Conglomerate",
    sectors: { "Financials": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["Value & Quality", "Capital Allocation", "Recession Resilience"],
    beta: 0.85,
    riskLevel: "Moderate",
  },
  {
    ticker: "NVDA",
    thesis: "The infrastructure layer of the AI revolution. NVDA's H100/H200/B200 GPUs are the compute substrate every hyperscaler, sovereign AI project, and frontier lab needs. Data centre revenue run-rate >$100B/year with pricing power and widening moat via CUDA ecosystem.",
    category: "AI Infrastructure / Semiconductors",
    sectors: { "Information Technology": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["AI & Semiconductors", "Data Centre Buildout", "Mega-Cap Growth"],
    beta: 1.75,
    riskLevel: "Very High",
  },
  {
    ticker: "GOOGL",
    thesis: "Search monopoly (90% share) transitioning to AI-native search, Cloud (GCP growing 30% YoY), and DeepMind as optionality. Trading at a discount to MSFT/AMZN on cloud multiples despite comparable moat quality.",
    category: "AI / Search / Cloud",
    sectors: { "Communication Services": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["AI & Semiconductors", "Digital Advertising", "Cloud Infrastructure"],
    beta: 1.15,
    riskLevel: "High",
  },
  {
    ticker: "AAPL",
    thesis: "The world's most profitable consumer ecosystem. Services (App Store, Apple Pay, iCloud, Apple TV+) are approaching 25% of revenue at ~70% gross margin. iPhone installed base of 2.2B creates unmatched switching costs. Near-term AI catalyst: Apple Intelligence drives upgrade cycle.",
    category: "Consumer Tech / Ecosystem",
    sectors: { "Information Technology": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["Consumer Tech Ecosystem", "AI Device Upgrade Cycle", "Services Revenue"],
    beta: 1.20,
    riskLevel: "Moderate",
  },
  {
    ticker: "SGLN",
    thesis: "Physical gold — the portfolio's explicit hedge against tail risk: dollar debasement, geopolitical shock, and equity correlation breakdown. Gold's 25-year CAGR of ~8% makes it more than just insurance. Allocating ~5% provides meaningful drawdown cushion without materially diluting upside.",
    category: "Hard Asset / Hedge",
    sectors: { "Commodities": 1.0 },
    geography: { "Global Commodity": 1.0 },
    themes: ["Inflation Hedge", "Tail Risk Protection", "Store of Value"],
    beta: 0.0,
    riskLevel: "Low",
  },
  {
    ticker: "ASML",
    thesis: "Absolute monopoly on EUV lithography — the single most critical tool in semiconductor manufacturing. No EUV machine = no 3nm, 2nm, or 1nm chips. Every chip manufactured at TSMC, Samsung, and Intel requires ASML equipment. The world's most defensible industrial moat.",
    category: "Semiconductor Equipment",
    sectors: { "Information Technology": 1.0 },
    geography: { "Europe ex-UK": 1.0 },
    themes: ["AI & Semiconductors", "Industrial Moat", "European Tech"],
    beta: 1.40,
    riskLevel: "High",
  },
  {
    ticker: "MSTR",
    thesis: "Leveraged Bitcoin proxy operating a software business. MicroStrategy's approach — issuing equity/debt to buy Bitcoin at scale — has delivered massive Bitcoin-per-share accretion. High conviction, high risk: this is a speculative position sized accordingly at ~2.5%.",
    category: "Digital Assets / Bitcoin Proxy",
    sectors: { "Information Technology": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["Digital Assets / Bitcoin", "Speculative Growth"],
    beta: 3.20,
    riskLevel: "Very High",
  },
  {
    ticker: "PLTR",
    thesis: "AI-powered data analytics with a US government moat. AIP (Artificial Intelligence Platform) is ramping with commercial clients; government contracts provide revenue floor. Early in an AI adoption curve where Palantir's ontology-based approach is genuinely differentiated.",
    category: "AI / Data Analytics",
    sectors: { "Information Technology": 1.0 },
    geography: { "United States": 1.0 },
    themes: ["AI & Semiconductors", "Government & Defence Tech", "Enterprise Software"],
    beta: 1.65,
    riskLevel: "Very High",
  },
];

export const THEME_DESCRIPTIONS: Record<string, string> = {
  "AI & Semiconductors": "The infrastructure layer of the next decade — chips, compute, and the software that runs on them. NVDA, ASML, PLTR, GOOGL, and the AI-heavy ETFs all contribute here.",
  "US Tech Dominance": "Concentrated exposure to the world's most profitable technology companies via EQQQ and VUAG.",
  "Mega-Cap Growth": "High-quality businesses with durable competitive moats and multi-decade growth runways.",
  "Global Diversification": "VWRP provides exposure to ~4,000 companies across 50+ countries, smoothing out single-market concentration.",
  "Value & Quality": "BRK.A anchors the portfolio with Buffett-style capital allocation — high returns on equity, low debt, disciplined buybacks.",
  "Inflation Hedge": "SGLN (physical gold) provides a structural hedge against dollar debasement and equity drawdowns.",
  "Tail Risk Protection": "Gold and Berkshire's cash reserves act as shock absorbers in severe market dislocations.",
  "Digital Assets / Bitcoin": "MSTR is the portfolio's speculative high-beta bet on Bitcoin becoming digital reserve collateral.",
  "Consumer Tech Ecosystem": "AAPL's hardware/services flywheel with 2.2B devices and 90%+ customer retention.",
  "Capital Allocation": "BRK.A's compounding machine: $340B+ cash, no dividends, perpetual buybacks below intrinsic value.",
  "Cloud Infrastructure": "GOOGL (GCP), and indirect exposure via ETFs to AWS and Azure — the backbone of the digital economy.",
  "Emerging Market Optionality": "VWRP's ~12% EM allocation provides exposure to India, China, Taiwan, Brazil, and South Korea's growth.",
  "Government & Defence Tech": "PLTR's US government contracts are sticky, high-margin, and growing with the AI defence spending wave.",
  "Industrial Moat": "ASML's EUV monopoly is the strongest industrial competitive position in any sector globally.",
  "European Tech": "ASML provides rare non-US tech exposure with genuine global pricing power.",
};
