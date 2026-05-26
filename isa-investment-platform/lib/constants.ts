export const HOLDINGS_DEFINITION = [
  { ticker: "EQQQ",  yfSymbol: "EQQQ.L", name: "Invesco EQQQ Nasdaq 100 UCITS ETF",  type: "ETF"   as const, nativeCcy: "GBP", isin: "IE00B53SZB19", ter: 0.0030, exchange: "LSE"    },
  { ticker: "VWRP",  yfSymbol: "VWRP.L", name: "Vanguard FTSE All-World UCITS ETF",   type: "ETF"   as const, nativeCcy: "GBP", isin: "IE00B3RBWM25", ter: 0.0022, exchange: "LSE"    },
  { ticker: "VUAG",  yfSymbol: "VUAG.L", name: "Vanguard S&P 500 UCITS ETF",          type: "ETF"   as const, nativeCcy: "GBP", isin: "IE00B3XXRP09", ter: 0.0007, exchange: "LSE"    },
  { ticker: "BRK.A", yfSymbol: "BRK-A",  name: "Berkshire Hathaway Inc. Class A",     type: "Stock" as const, nativeCcy: "USD", isin: "US0846707026", ter: null,   exchange: "NYSE"   },
  { ticker: "NVDA",  yfSymbol: "NVDA",   name: "NVIDIA Corporation",                  type: "Stock" as const, nativeCcy: "USD", isin: "US67066G1040", ter: null,   exchange: "NASDAQ" },
  { ticker: "GOOGL", yfSymbol: "GOOGL",  name: "Alphabet Inc. Class A",               type: "Stock" as const, nativeCcy: "USD", isin: "US02079K3059", ter: null,   exchange: "NASDAQ" },
  { ticker: "AAPL",  yfSymbol: "AAPL",   name: "Apple Inc.",                          type: "Stock" as const, nativeCcy: "USD", isin: "US0378331005", ter: null,   exchange: "NASDAQ" },
  { ticker: "SGLN",  yfSymbol: "SGLN.L", name: "iShares Physical Gold ETC",           type: "ETF"   as const, nativeCcy: "USD", isin: "IE00B4ND3602", ter: 0.0012, exchange: "LSE"    },
  { ticker: "ASML",  yfSymbol: "ASML",   name: "ASML Holding NV",                     type: "Stock" as const, nativeCcy: "USD", isin: "US0441861046", ter: null,   exchange: "NASDAQ" },
  { ticker: "MSTR",  yfSymbol: "MSTR",   name: "Strategy Inc. (MicroStrategy)",       type: "Stock" as const, nativeCcy: "USD", isin: "US5949724083", ter: null,   exchange: "NASDAQ" },
  { ticker: "PLTR",  yfSymbol: "PLTR",   name: "Palantir Technologies Inc.",          type: "Stock" as const, nativeCcy: "USD", isin: "US69608A1088", ter: null,   exchange: "NYSE"   },
] as const;

export const HOLDING_COLORS: Record<string, string> = {
  EQQQ:  "#3d7eff",
  VWRP:  "#23d18b",
  VUAG:  "#7b61ff",
  "BRK.A": "#f5a623",
  NVDA:  "#f05252",
  GOOGL: "#38bdf8",
  AAPL:  "#a78bfa",
  SGLN:  "#fbbf24",
  ASML:  "#34d399",
  MSTR:  "#fb923c",
  PLTR:  "#e879f9",
};

export const BASELINE_SNAPSHOT = {
  date: new Date("2026-05-15"),
  gbpUsd: 1.2750,
  positions: [
    // valueGBP = current market value from T212 (snapshot: 2026-05-15)
    // unrealisedGBP = total unrealised P&L since purchase
    // unrealisedPct = total unrealised % return since purchase
    // costGBP = valueGBP - unrealisedGBP (actual money invested per position)
    // dailyChangeGBP / dailyPct = actual May 14→15 move from price history
    { ticker: "EQQQ",  valueGBP: 1418.66, unrealisedGBP:  230.35, unrealisedPct:  19.38, costGBP: 1188.31, dailyChangeGBP:   -1.48, dailyPct:  -0.10 },
    { ticker: "VWRP",  valueGBP: 1387.16, unrealisedGBP:  147.17, unrealisedPct:  11.87, costGBP: 1239.99, dailyChangeGBP:   -4.57, dailyPct:  -0.33 },
    { ticker: "VUAG",  valueGBP: 1204.59, unrealisedGBP:  142.97, unrealisedPct:  13.47, costGBP: 1061.62, dailyChangeGBP:   +2.47, dailyPct:  +0.20 },
    { ticker: "BRK.A", valueGBP:  973.07, unrealisedGBP:   41.46, unrealisedPct:   4.45, costGBP:  931.61, dailyChangeGBP:   -4.49, dailyPct:  -0.46 },
    { ticker: "NVDA",  valueGBP:  813.57, unrealisedGBP:   95.27, unrealisedPct:  13.26, costGBP:  718.30, dailyChangeGBP:  -35.96, dailyPct:  -4.42 },
    { ticker: "AAPL",  valueGBP:  585.93, unrealisedGBP:   32.81, unrealisedPct:   5.93, costGBP:  553.12, dailyChangeGBP:   +3.97, dailyPct:  +0.68 },
    { ticker: "GOOGL", valueGBP:  578.57, unrealisedGBP:   22.83, unrealisedPct:   4.11, costGBP:  555.74, dailyChangeGBP:   -6.19, dailyPct:  -1.07 },
    { ticker: "SGLN",  valueGBP:  370.15, unrealisedGBP:   -8.54, unrealisedPct:  -2.26, costGBP:  378.69, dailyChangeGBP:   -7.08, dailyPct:  -1.91 },
    { ticker: "ASML",  valueGBP:  206.03, unrealisedGBP:    3.01, unrealisedPct:   1.48, costGBP:  203.02, dailyChangeGBP:  -10.75, dailyPct:  -5.22 },
    { ticker: "PLTR",  valueGBP:  200.22, unrealisedGBP:    5.02, unrealisedPct:   2.57, costGBP:  195.20, dailyChangeGBP:   +0.39, dailyPct:  +0.19 },
    { ticker: "MSTR",  valueGBP:  198.04, unrealisedGBP:  -70.29, unrealisedPct: -26.20, costGBP:  268.33, dailyChangeGBP:  -10.12, dailyPct:  -5.11 },
  ],
  totalValueGBP: 7936.50,
  totalCostGBP: 7294.44,         // actual money invested (cost basis from T212)
  totalUnrealisedGBP: 642.06,    // +£642.06 unrealised P&L
  totalUnrealisedPct: 8.80,      // +8.80% total return
  isaAllowanceUsedGBP: 7294.44,  // cost basis = ISA subscription used
  isaYearAllowanceGBP: 20000.00,
};

export const ISA_YEAR = "2025/2026";
export const ISA_ALLOWANCE_GBP = 20000;

// Benchmark symbols
export const BENCHMARKS = {
  SP500:  "^GSPC",
  FTSE100: "^FTSE",
  NASDAQ: "^IXIC",
};
