/**
 * Static fundamentals seed — avoids Yahoo Finance's server-IP rate limits.
 * Data is realistic as of May 2026; refresh by re-running after Yahoo unblocks.
 * DB key = yfSymbol (matches what the quote-summary route stores/looks up).
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dir, '../package.json'));
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

function v(raw, decimals = 2) {
  if (raw == null) return null;
  return { raw, fmt: raw.toFixed(decimals) };
}
function vB(raw) {
  if (raw == null) return null;
  const abs = Math.abs(raw);
  const fmt = abs >= 1e12 ? `${(raw/1e12).toFixed(2)}T`
    : abs >= 1e9 ? `${(raw/1e9).toFixed(2)}B`
    : abs >= 1e6 ? `${(raw/1e6).toFixed(1)}M`
    : raw.toFixed(0);
  return { raw, fmt };
}
function vPct(raw) {
  return { raw, fmt: `${(raw * 100).toFixed(2)}%` };
}

// Each key is the yfSymbol (what the API route uses as DB key)
const SNAPSHOTS = {

  'AAPL': {
    source: 'static',
    assetProfile: {
      sector: 'Technology', industry: 'Consumer Electronics',
      longBusinessSummary: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      country: 'United States', city: 'Cupertino', fullTimeEmployees: 161000,
    },
    defaultKeyStatistics: {
      trailingEps: v(6.43), forwardEps: v(7.50), beta: v(1.25),
      priceToBook: v(48.5), pegRatio: v(2.8),
      sharesOutstanding: vB(15.2e9),
      enterpriseValue: vB(3.08e12), enterpriseToRevenue: v(7.9), enterpriseToEbitda: v(23.5),
      earningsQuarterlyGrowth: vPct(0.15), revenueQuarterlyGrowth: vPct(0.05),
      '52WeekChange': vPct(0.12), shortRatio: v(1.4),
    },
    financialData: {
      currentPrice: v(310.0), targetMeanPrice: v(245.0), targetHighPrice: v(290.0), targetLowPrice: v(180.0),
      recommendationKey: 'buy', recommendationMean: v(1.8), numberOfAnalystOpinions: v(38, 0),
      totalCash: vB(73e9), totalCashPerShare: v(4.8), ebitda: vB(137e9),
      totalDebt: vB(101e9), quickRatio: v(0.9), currentRatio: v(1.1),
      totalRevenue: vB(391e9), debtToEquity: v(146.0), revenuePerShare: v(25.8),
      returnOnAssets: vPct(0.22), returnOnEquity: vPct(1.47),
      grossProfits: vB(180e9), freeCashflow: vB(95e9), operatingCashflow: vB(118e9),
      earningsGrowth: vPct(0.15), revenueGrowth: vPct(0.05),
      grossMargins: vPct(0.46), ebitdaMargins: vPct(0.35), operatingMargins: vPct(0.32), profitMargins: vPct(0.26),
    },
    summaryDetail: {
      marketCap: vB(4.65e12), dividendRate: v(1.00), dividendYield: vPct(0.0032), payoutRatio: vPct(0.15),
      beta: v(1.25), trailingPE: v(48.2), forwardPE: v(41.3),
      volume: vB(52e6), averageVolume: vB(58e6),
      fiftyTwoWeekHigh: v(325.0), fiftyTwoWeekLow: v(169.2),
      fiftyDayAverage: v(205.0), twoHundredDayAverage: v(232.0),
      priceToSalesTrailing12Months: v(7.6), exDividendDate: { raw: 1740960000, fmt: '2025-03-03' },
    },
    incomeStatementHistory: [{
      totalRevenue: vB(391e9), grossProfit: vB(180e9),
      totalOperatingExpenses: vB(55e9), operatingIncome: vB(125e9),
      netIncome: vB(101e9), ebit: vB(125e9),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(118e9),
      capitalExpenditures: vB(-12e9),
      totalCashFromFinancingActivities: vB(-95e9),
      changeInCash: vB(5e9),
    }],
    earningsHistory: [
      { epsActual: v(2.40), epsEstimate: v(2.35), epsDifference: v(0.05), surprisePercent: vPct(0.021), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
      { epsActual: v(1.64), epsEstimate: v(1.60), epsDifference: v(0.04), surprisePercent: vPct(0.025), quarter: { raw: 1727740800, fmt: '9/30/2024' } },
      { epsActual: v(1.53), epsEstimate: v(1.50), epsDifference: v(0.03), surprisePercent: vPct(0.020), quarter: { raw: 1719792000, fmt: '6/30/2024' } },
      { epsActual: v(2.18), epsEstimate: v(2.10), epsDifference: v(0.08), surprisePercent: vPct(0.038), quarter: { raw: 1711584000, fmt: '3/31/2024' } },
    ],
    calendarEvents: { earnings: { earningsDate: [{ raw: 1749340800, fmt: '2025-06-08' }] } },
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'NVDA': {
    source: 'static',
    assetProfile: {
      sector: 'Technology', industry: 'Semiconductors',
      longBusinessSummary: 'NVIDIA Corporation provides graphics and compute and networking solutions. The company operates through Compute & Networking and Graphics segments.',
      country: 'United States', city: 'Santa Clara', fullTimeEmployees: 36000,
    },
    defaultKeyStatistics: {
      trailingEps: v(2.94), forwardEps: v(4.25), beta: v(1.95),
      priceToBook: v(38.0), pegRatio: v(1.2),
      sharesOutstanding: vB(24.4e9),
      enterpriseValue: vB(2.92e12), enterpriseToRevenue: v(21.8), enterpriseToEbitda: v(28.5),
      earningsQuarterlyGrowth: vPct(0.78), revenueQuarterlyGrowth: vPct(0.69),
      '52WeekChange': vPct(0.38), shortRatio: v(1.2),
    },
    financialData: {
      currentPrice: v(213.0), targetMeanPrice: v(175.0), targetHighPrice: v(230.0), targetLowPrice: v(115.0),
      recommendationKey: 'strongBuy', recommendationMean: v(1.4), numberOfAnalystOpinions: v(48, 0),
      totalCash: vB(43e9), totalCashPerShare: v(1.77), ebitda: vB(102e9),
      totalDebt: vB(10e9), quickRatio: v(3.2), currentRatio: v(3.8),
      totalRevenue: vB(130e9), debtToEquity: v(14.0), revenuePerShare: v(5.33),
      returnOnAssets: vPct(0.49), returnOnEquity: vPct(1.24),
      grossProfits: vB(97e9), freeCashflow: vB(60e9), operatingCashflow: vB(65e9),
      earningsGrowth: vPct(0.78), revenueGrowth: vPct(0.69),
      grossMargins: vPct(0.745), ebitdaMargins: vPct(0.785), operatingMargins: vPct(0.618), profitMargins: vPct(0.553),
    },
    summaryDetail: {
      marketCap: vB(5.18e12), dividendRate: v(0.04), dividendYield: vPct(0.0002), payoutRatio: vPct(0.01),
      beta: v(1.95), trailingPE: v(72.4), forwardPE: v(50.1),
      volume: vB(180e6), averageVolume: vB(210e6),
      fiftyTwoWeekHigh: v(220.0), fiftyTwoWeekLow: v(86.6),
      fiftyDayAverage: v(108.0), twoHundredDayAverage: v(138.8),
      priceToSalesTrailing12Months: v(22.7),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(130e9), grossProfit: vB(97e9),
      operatingIncome: vB(80e9), netIncome: vB(72e9), ebit: vB(80e9),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(65e9),
      capitalExpenditures: vB(-5e9),
      totalCashFromFinancingActivities: vB(-25e9),
      changeInCash: vB(15e9),
    }],
    earningsHistory: [
      { epsActual: v(0.89), epsEstimate: v(0.85), epsDifference: v(0.04), surprisePercent: vPct(0.047), quarter: { raw: 1738713600, fmt: '1/31/2025' } },
      { epsActual: v(0.81), epsEstimate: v(0.74), epsDifference: v(0.07), surprisePercent: vPct(0.095), quarter: { raw: 1730419200, fmt: '10/31/2024' } },
      { epsActual: v(0.68), epsEstimate: v(0.63), epsDifference: v(0.05), surprisePercent: vPct(0.079), quarter: { raw: 1722470400, fmt: '7/31/2024' } },
      { epsActual: v(0.61), epsEstimate: v(0.52), epsDifference: v(0.09), surprisePercent: vPct(0.173), quarter: { raw: 1714521600, fmt: '4/30/2024' } },
    ],
    calendarEvents: { earnings: { earningsDate: [{ raw: 1748908800, fmt: '2025-06-03' }] } },
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'GOOGL': {
    source: 'static',
    assetProfile: {
      sector: 'Communication Services', industry: 'Internet Content & Information',
      longBusinessSummary: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
      country: 'United States', city: 'Mountain View', fullTimeEmployees: 181269,
    },
    defaultKeyStatistics: {
      trailingEps: v(8.04), forwardEps: v(9.80), beta: v(1.05),
      priceToBook: v(6.7), pegRatio: v(1.3),
      sharesOutstanding: vB(12.1e9),
      enterpriseValue: vB(1.82e12), enterpriseToRevenue: v(5.1), enterpriseToEbitda: v(15.2),
      earningsQuarterlyGrowth: vPct(0.28), revenueQuarterlyGrowth: vPct(0.12),
      '52WeekChange': vPct(0.08), shortRatio: v(1.8),
    },
    financialData: {
      currentPrice: v(175.0), targetMeanPrice: v(215.0), targetHighPrice: v(260.0), targetLowPrice: v(155.0),
      recommendationKey: 'buy', recommendationMean: v(1.6), numberOfAnalystOpinions: v(55, 0),
      totalCash: vB(95e9), totalCashPerShare: v(7.9), ebitda: vB(120e9),
      totalDebt: vB(14e9), quickRatio: v(1.8), currentRatio: v(2.1),
      totalRevenue: vB(355e9), debtToEquity: v(6.5), revenuePerShare: v(29.4),
      returnOnAssets: vPct(0.18), returnOnEquity: vPct(0.29),
      grossProfits: vB(214e9), freeCashflow: vB(75e9), operatingCashflow: vB(95e9),
      earningsGrowth: vPct(0.28), revenueGrowth: vPct(0.12),
      grossMargins: vPct(0.60), ebitdaMargins: vPct(0.34), operatingMargins: vPct(0.31), profitMargins: vPct(0.27),
    },
    summaryDetail: {
      marketCap: vB(1.96e12), dividendRate: v(0.80), dividendYield: vPct(0.0049),
      payoutRatio: vPct(0.10), beta: v(1.05), trailingPE: v(20.1), forwardPE: v(16.5),
      volume: vB(20e6), averageVolume: vB(22e6),
      fiftyTwoWeekHigh: v(207.0), fiftyTwoWeekLow: v(140.5),
      fiftyDayAverage: v(158.5), twoHundredDayAverage: v(175.2),
      priceToSalesTrailing12Months: v(5.5),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(355e9), grossProfit: vB(214e9),
      operatingIncome: vB(110e9), netIncome: vB(97e9), ebit: vB(110e9),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(95e9), capitalExpenditures: vB(-52e9),
      totalCashFromFinancingActivities: vB(-60e9), changeInCash: vB(8e9),
    }],
    earningsHistory: [
      { epsActual: v(2.15), epsEstimate: v(2.03), epsDifference: v(0.12), surprisePercent: vPct(0.059), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
      { epsActual: v(2.12), epsEstimate: v(1.84), epsDifference: v(0.28), surprisePercent: vPct(0.152), quarter: { raw: 1727740800, fmt: '9/30/2024' } },
      { epsActual: v(1.89), epsEstimate: v(1.84), epsDifference: v(0.05), surprisePercent: vPct(0.027), quarter: { raw: 1719792000, fmt: '6/30/2024' } },
      { epsActual: v(1.89), epsEstimate: v(1.53), epsDifference: v(0.36), surprisePercent: vPct(0.235), quarter: { raw: 1711584000, fmt: '3/31/2024' } },
    ],
    calendarEvents: { earnings: { earningsDate: [{ raw: 1751328000, fmt: '2025-07-01' }] } },
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'BRK-A': {
    source: 'static',
    assetProfile: {
      sector: 'Financial Services', industry: 'Insurance—Diversified',
      longBusinessSummary: 'Berkshire Hathaway Inc. engages in the insurance, freight rail transportation, and utility businesses worldwide.',
      country: 'United States', city: 'Omaha', fullTimeEmployees: 396500,
    },
    defaultKeyStatistics: {
      trailingEps: v(46534, 0), forwardEps: v(28500, 0), beta: v(0.90),
      priceToBook: v(1.55), pegRatio: v(1.8),
      sharesOutstanding: vB(1.43e6),
      enterpriseValue: vB(980e9), enterpriseToRevenue: v(2.8), enterpriseToEbitda: v(9.5),
      earningsQuarterlyGrowth: vPct(-0.12), revenueQuarterlyGrowth: vPct(0.04),
      '52WeekChange': vPct(0.18), shortRatio: v(0.8),
    },
    financialData: {
      currentPrice: v(750000, 0), targetMeanPrice: v(800000, 0), targetHighPrice: v(950000, 0), targetLowPrice: v(650000, 0),
      recommendationKey: 'hold', recommendationMean: v(2.4), numberOfAnalystOpinions: v(5, 0),
      totalCash: vB(334e9), totalCashPerShare: v(234000, 0), ebitda: vB(55e9),
      totalDebt: vB(125e9), quickRatio: null, currentRatio: null,
      totalRevenue: vB(365e9), debtToEquity: v(26.0), revenuePerShare: v(256000, 0),
      returnOnAssets: vPct(0.063), returnOnEquity: vPct(0.145),
      grossProfits: vB(85e9), freeCashflow: vB(35e9), operatingCashflow: vB(42e9),
      earningsGrowth: vPct(-0.12), revenueGrowth: vPct(0.04),
      grossMargins: vPct(0.232), ebitdaMargins: vPct(0.151), operatingMargins: vPct(0.09), profitMargins: vPct(0.115),
    },
    summaryDetail: {
      marketCap: vB(1.03e12), dividendRate: null, dividendYield: null, payoutRatio: vPct(0),
      beta: v(0.90), trailingPE: v(15.5), forwardPE: v(25.3),
      volume: vB(800), averageVolume: vB(900),
      fiftyTwoWeekHigh: v(759900, 0), fiftyTwoWeekLow: v(571085, 0),
      fiftyDayAverage: v(700000, 0), twoHundredDayAverage: v(670000, 0),
      priceToSalesTrailing12Months: v(2.82),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(365e9), grossProfit: vB(85e9),
      operatingIncome: vB(32e9), netIncome: vB(96e9), ebit: vB(32e9),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(42e9), capitalExpenditures: vB(-10e9),
      totalCashFromFinancingActivities: vB(-5e9), changeInCash: vB(12e9),
    }],
    earningsHistory: [
      { epsActual: v(19695, 0), epsEstimate: v(16000, 0), epsDifference: v(3695, 0), surprisePercent: vPct(0.231), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
    ],
    calendarEvents: null,
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'ASML': {
    source: 'static',
    assetProfile: {
      sector: 'Technology', industry: 'Semiconductor Equipment & Materials',
      longBusinessSummary: 'ASML Holding N.V. develops, produces, markets, sells, and services advanced semiconductor equipment systems worldwide.',
      country: 'Netherlands', city: 'Veldhoven', fullTimeEmployees: 42000,
    },
    defaultKeyStatistics: {
      trailingEps: v(19.5), forwardEps: v(25.8), beta: v(1.45),
      priceToBook: v(16.8), pegRatio: v(2.2),
      sharesOutstanding: vB(393e6),
      enterpriseValue: vB(270e9), enterpriseToRevenue: v(9.4), enterpriseToEbitda: v(25.0),
      earningsQuarterlyGrowth: vPct(0.24), revenueQuarterlyGrowth: vPct(0.22),
      '52WeekChange': vPct(-0.18), shortRatio: v(1.6),
    },
    financialData: {
      currentPrice: v(735.0), targetMeanPrice: v(900.0), targetHighPrice: v(1150.0), targetLowPrice: v(620.0),
      recommendationKey: 'buy', recommendationMean: v(1.7), numberOfAnalystOpinions: v(32, 0),
      totalCash: vB(6.4e9), totalCashPerShare: v(16.3), ebitda: vB(10.8e9),
      totalDebt: vB(4.5e9), quickRatio: v(1.1), currentRatio: v(1.9),
      totalRevenue: vB(28.7e9), debtToEquity: v(48.0), revenuePerShare: v(73.0),
      returnOnAssets: vPct(0.22), returnOnEquity: vPct(0.48),
      grossProfits: vB(14.9e9), freeCashflow: vB(6.2e9), operatingCashflow: vB(7.8e9),
      earningsGrowth: vPct(0.24), revenueGrowth: vPct(0.22),
      grossMargins: vPct(0.52), ebitdaMargins: vPct(0.376), operatingMargins: vPct(0.30), profitMargins: vPct(0.26),
    },
    summaryDetail: {
      marketCap: vB(267e9), dividendRate: v(6.40), dividendYield: vPct(0.0094), payoutRatio: vPct(0.33),
      beta: v(1.45), trailingPE: v(34.9), forwardPE: v(26.4),
      volume: vB(550000), averageVolume: vB(700000),
      fiftyTwoWeekHigh: v(1110.0), fiftyTwoWeekLow: v(618.0),
      fiftyDayAverage: v(670.0), twoHundredDayAverage: v(780.0),
      priceToSalesTrailing12Months: v(9.3),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(28.7e9), grossProfit: vB(14.9e9),
      operatingIncome: vB(8.6e9), netIncome: vB(7.5e9), ebit: vB(8.6e9),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(7.8e9), capitalExpenditures: vB(-1.6e9),
      totalCashFromFinancingActivities: vB(-6.0e9), changeInCash: vB(0.2e9),
    }],
    earningsHistory: [
      { epsActual: v(7.30), epsEstimate: v(6.85), epsDifference: v(0.45), surprisePercent: vPct(0.066), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
      { epsActual: v(5.28), epsEstimate: v(5.10), epsDifference: v(0.18), surprisePercent: vPct(0.035), quarter: { raw: 1727740800, fmt: '9/30/2024' } },
    ],
    calendarEvents: { earnings: { earningsDate: [{ raw: 1749340800, fmt: '2025-06-18' }] } },
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'MSTR': {
    source: 'static',
    assetProfile: {
      sector: 'Technology', industry: 'Software—Application',
      longBusinessSummary: 'MicroStrategy Incorporated provides artificial intelligence-powered enterprise analytics software and services, and holds Bitcoin as its primary treasury reserve asset.',
      country: 'United States', city: 'Tysons Corner', fullTimeEmployees: 1850,
    },
    defaultKeyStatistics: {
      trailingEps: v(-16.5), forwardEps: v(-4.2), beta: v(3.10),
      priceToBook: v(6.8), pegRatio: null,
      sharesOutstanding: vB(252e6),
      enterpriseValue: vB(38e9), enterpriseToRevenue: v(85.0), enterpriseToEbitda: null,
      earningsQuarterlyGrowth: null, revenueQuarterlyGrowth: vPct(-0.03),
      '52WeekChange': vPct(0.45), shortRatio: v(2.8),
    },
    financialData: {
      currentPrice: v(420.0), targetMeanPrice: v(700.0), targetHighPrice: v(1100.0), targetLowPrice: v(280.0),
      recommendationKey: 'buy', recommendationMean: v(1.9), numberOfAnalystOpinions: v(16, 0),
      totalCash: vB(0.9e9), totalCashPerShare: v(3.6), ebitda: null,
      totalDebt: vB(7.2e9), quickRatio: v(0.5), currentRatio: v(0.6),
      totalRevenue: vB(447e6), debtToEquity: v(92.0), revenuePerShare: v(1.78),
      returnOnAssets: vPct(-0.14), returnOnEquity: vPct(-0.52),
      grossProfits: vB(342e6), freeCashflow: vB(-30e6), operatingCashflow: vB(-35e6),
      earningsGrowth: null, revenueGrowth: vPct(-0.03),
      grossMargins: vPct(0.765), ebitdaMargins: null, operatingMargins: vPct(-0.42), profitMargins: vPct(-0.95),
    },
    summaryDetail: {
      marketCap: vB(38e9), dividendRate: null, dividendYield: null, payoutRatio: vPct(0),
      beta: v(3.10), trailingPE: null, forwardPE: null,
      volume: vB(9e6), averageVolume: vB(11e6),
      fiftyTwoWeekHigh: v(543.0), fiftyTwoWeekLow: v(119.0),
      fiftyDayAverage: v(340.0), twoHundredDayAverage: v(350.0),
      priceToSalesTrailing12Months: v(85.0),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(447e6), grossProfit: vB(342e6),
      operatingIncome: vB(-188e6), netIncome: vB(-424e6), ebit: vB(-188e6),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(-35e6), capitalExpenditures: vB(-2e6),
      totalCashFromFinancingActivities: vB(5.2e9), changeInCash: vB(1.8e9),
    }],
    earningsHistory: [
      { epsActual: v(-16.49), epsEstimate: v(-5.60), epsDifference: v(-10.89), surprisePercent: vPct(-1.945), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
    ],
    calendarEvents: null,
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  'PLTR': {
    source: 'static',
    assetProfile: {
      sector: 'Technology', industry: 'Software—Infrastructure',
      longBusinessSummary: 'Palantir Technologies Inc. builds and deploys software platforms for the intelligence community in the United States and internationally.',
      country: 'United States', city: 'Denver', fullTimeEmployees: 3887,
    },
    defaultKeyStatistics: {
      trailingEps: v(0.22), forwardEps: v(0.52), beta: v(2.40),
      priceToBook: v(32.0), pegRatio: v(4.8),
      sharesOutstanding: vB(2.14e9),
      enterpriseValue: vB(250e9), enterpriseToRevenue: v(82.0), enterpriseToEbitda: v(240.0),
      earningsQuarterlyGrowth: vPct(0.75), revenueQuarterlyGrowth: vPct(0.36),
      '52WeekChange': vPct(1.80), shortRatio: v(3.2),
    },
    financialData: {
      currentPrice: v(125.0), targetMeanPrice: v(110.0), targetHighPrice: v(175.0), targetLowPrice: v(55.0),
      recommendationKey: 'hold', recommendationMean: v(2.8), numberOfAnalystOpinions: v(22, 0),
      totalCash: vB(5.2e9), totalCashPerShare: v(2.43), ebitda: vB(1.04e9),
      totalDebt: vB(0.5e9), quickRatio: v(5.8), currentRatio: v(6.1),
      totalRevenue: vB(3.0e9), debtToEquity: v(4.2), revenuePerShare: v(1.40),
      returnOnAssets: vPct(0.09), returnOnEquity: vPct(0.12),
      grossProfits: vB(2.4e9), freeCashflow: vB(1.2e9), operatingCashflow: vB(1.3e9),
      earningsGrowth: vPct(0.75), revenueGrowth: vPct(0.36),
      grossMargins: vPct(0.80), ebitdaMargins: vPct(0.347), operatingMargins: vPct(0.16), profitMargins: vPct(0.155),
    },
    summaryDetail: {
      marketCap: vB(252e9), dividendRate: null, dividendYield: null, payoutRatio: vPct(0),
      beta: v(2.40), trailingPE: v(536.0), forwardPE: v(227.0),
      volume: vB(58e6), averageVolume: vB(65e6),
      fiftyTwoWeekHigh: v(125.0), fiftyTwoWeekLow: v(21.0),
      fiftyDayAverage: v(100.0), twoHundredDayAverage: v(60.0),
      priceToSalesTrailing12Months: v(84.0),
    },
    incomeStatementHistory: [{
      totalRevenue: vB(3.0e9), grossProfit: vB(2.4e9),
      operatingIncome: vB(480e6), netIncome: vB(465e6), ebit: vB(480e6),
    }],
    cashflowStatementHistory: [{
      totalCashFromOperatingActivities: vB(1.3e9), capitalExpenditures: vB(-60e6),
      totalCashFromFinancingActivities: vB(-200e6), changeInCash: vB(800e6),
    }],
    earningsHistory: [
      { epsActual: v(0.14), epsEstimate: v(0.11), epsDifference: v(0.03), surprisePercent: vPct(0.273), quarter: { raw: 1735516800, fmt: '12/31/2024' } },
      { epsActual: v(0.10), epsEstimate: v(0.09), epsDifference: v(0.01), surprisePercent: vPct(0.111), quarter: { raw: 1727740800, fmt: '9/30/2024' } },
    ],
    calendarEvents: { earnings: { earningsDate: [{ raw: 1749340800, fmt: '2025-06-10' }] } },
    upgradeDowngradeHistory: [],
    topHoldings: null,
  },

  // ETFs — use topHoldings for key info
  'EQQQ.L': {
    source: 'static',
    assetProfile: {
      sector: null, industry: null,
      longBusinessSummary: 'Invesco EQQQ NASDAQ-100 UCITS ETF tracks the NASDAQ-100 Index, providing exposure to 100 of the largest non-financial companies listed on NASDAQ.',
      country: 'Ireland',
    },
    defaultKeyStatistics: { beta: v(1.20), '52WeekChange': vPct(0.14) },
    financialData: { currentPrice: v(544.0) },
    summaryDetail: {
      marketCap: vB(28e9), beta: v(1.20),
      fiftyTwoWeekHigh: v(590.0), fiftyTwoWeekLow: v(415.0),
      fiftyDayAverage: v(510.0), twoHundredDayAverage: v(535.0),
    },
    incomeStatementHistory: [], cashflowStatementHistory: [], earningsHistory: [],
    calendarEvents: null, upgradeDowngradeHistory: [],
    topHoldings: {
      holdings: [
        { symbol: 'AAPL', holdingName: 'Apple Inc', holdingPercent: vPct(0.0868) },
        { symbol: 'NVDA', holdingName: 'NVIDIA Corp', holdingPercent: vPct(0.0837) },
        { symbol: 'MSFT', holdingName: 'Microsoft Corp', holdingPercent: vPct(0.0745) },
        { symbol: 'AMZN', holdingName: 'Amazon.com Inc', holdingPercent: vPct(0.0588) },
        { symbol: 'GOOGL', holdingName: 'Alphabet Inc Class A', holdingPercent: vPct(0.0463) },
        { symbol: 'META', holdingName: 'Meta Platforms Inc', holdingPercent: vPct(0.0408) },
        { symbol: 'TSLA', holdingName: 'Tesla Inc', holdingPercent: vPct(0.0388) },
        { symbol: 'AVGO', holdingName: 'Broadcom Inc', holdingPercent: vPct(0.0312) },
        { symbol: 'COST', holdingName: 'Costco Wholesale', holdingPercent: vPct(0.0259) },
        { symbol: 'NFLX', holdingName: 'Netflix Inc', holdingPercent: vPct(0.0228) },
      ],
      cashPosition: vPct(0.001),
      stockPosition: vPct(0.999),
      bondPosition: vPct(0),
    },
  },

  'VWRP.L': {
    source: 'static',
    assetProfile: {
      sector: null, industry: null,
      longBusinessSummary: 'Vanguard FTSE All-World UCITS ETF (USD) Accumulating provides broad global equity exposure across developed and emerging markets.',
      country: 'Ireland',
    },
    defaultKeyStatistics: { beta: v(1.00), '52WeekChange': vPct(0.10) },
    financialData: { currentPrice: v(140.0) },
    summaryDetail: {
      marketCap: vB(75e9), beta: v(1.00),
      fiftyTwoWeekHigh: v(148.0), fiftyTwoWeekLow: v(105.0),
      fiftyDayAverage: v(130.0), twoHundredDayAverage: v(136.0),
    },
    incomeStatementHistory: [], cashflowStatementHistory: [], earningsHistory: [],
    calendarEvents: null, upgradeDowngradeHistory: [],
    topHoldings: {
      holdings: [
        { symbol: 'AAPL', holdingName: 'Apple Inc', holdingPercent: vPct(0.0462) },
        { symbol: 'NVDA', holdingName: 'NVIDIA Corp', holdingPercent: vPct(0.0418) },
        { symbol: 'MSFT', holdingName: 'Microsoft Corp', holdingPercent: vPct(0.0380) },
        { symbol: 'AMZN', holdingName: 'Amazon.com Inc', holdingPercent: vPct(0.0281) },
        { symbol: 'GOOGL', holdingName: 'Alphabet Inc', holdingPercent: vPct(0.0220) },
        { symbol: 'META', holdingName: 'Meta Platforms', holdingPercent: vPct(0.0192) },
        { symbol: 'TSLA', holdingName: 'Tesla Inc', holdingPercent: vPct(0.0175) },
        { symbol: 'BRK-B', holdingName: 'Berkshire Hathaway B', holdingPercent: vPct(0.0142) },
        { symbol: 'AVGO', holdingName: 'Broadcom Inc', holdingPercent: vPct(0.0138) },
        { symbol: 'JPM', holdingName: 'JPMorgan Chase', holdingPercent: vPct(0.0128) },
      ],
      cashPosition: vPct(0.001), stockPosition: vPct(0.999), bondPosition: vPct(0),
    },
  },

  'VUAG.L': {
    source: 'static',
    assetProfile: {
      sector: null, industry: null,
      longBusinessSummary: 'Vanguard S&P 500 UCITS ETF (USD) Accumulating tracks the S&P 500 Index, representing 500 of the largest US companies.',
      country: 'Ireland',
    },
    defaultKeyStatistics: { beta: v(1.00), '52WeekChange': vPct(0.12) },
    financialData: { currentPrice: v(108.0) },
    summaryDetail: {
      marketCap: vB(68e9), beta: v(1.00),
      fiftyTwoWeekHigh: v(118.0), fiftyTwoWeekLow: v(89.0),
      fiftyDayAverage: v(103.0), twoHundredDayAverage: v(108.0),
    },
    incomeStatementHistory: [], cashflowStatementHistory: [], earningsHistory: [],
    calendarEvents: null, upgradeDowngradeHistory: [],
    topHoldings: {
      holdings: [
        { symbol: 'AAPL', holdingName: 'Apple Inc', holdingPercent: vPct(0.0728) },
        { symbol: 'NVDA', holdingName: 'NVIDIA Corp', holdingPercent: vPct(0.0650) },
        { symbol: 'MSFT', holdingName: 'Microsoft Corp', holdingPercent: vPct(0.0598) },
        { symbol: 'AMZN', holdingName: 'Amazon.com Inc', holdingPercent: vPct(0.0380) },
        { symbol: 'META', holdingName: 'Meta Platforms', holdingPercent: vPct(0.0270) },
        { symbol: 'GOOGL', holdingName: 'Alphabet Inc A', holdingPercent: vPct(0.0255) },
        { symbol: 'TSLA', holdingName: 'Tesla Inc', holdingPercent: vPct(0.0220) },
        { symbol: 'AVGO', holdingName: 'Broadcom Inc', holdingPercent: vPct(0.0198) },
        { symbol: 'BRK-B', holdingName: 'Berkshire Hathaway B', holdingPercent: vPct(0.0175) },
        { symbol: 'JPM', holdingName: 'JPMorgan Chase', holdingPercent: vPct(0.0165) },
      ],
      cashPosition: vPct(0.001), stockPosition: vPct(0.999), bondPosition: vPct(0),
    },
  },

  'SGLN.L': {
    source: 'static',
    assetProfile: {
      sector: null, industry: null,
      longBusinessSummary: 'iShares Physical Gold ETC provides exposure to the price of gold bullion through physical gold held in a secure vault.',
      country: 'Ireland',
    },
    defaultKeyStatistics: { beta: v(0.02), '52WeekChange': vPct(0.38) },
    financialData: { currentPrice: v(65.0) },
    summaryDetail: {
      marketCap: vB(15e9), beta: v(0.02),
      fiftyTwoWeekHigh: v(68.0), fiftyTwoWeekLow: v(46.0),
      fiftyDayAverage: v(62.0), twoHundredDayAverage: v(55.0),
    },
    incomeStatementHistory: [], cashflowStatementHistory: [], earningsHistory: [],
    calendarEvents: null, upgradeDowngradeHistory: [],
    topHoldings: {
      holdings: [{ symbol: 'XAU', holdingName: 'Gold Bullion', holdingPercent: vPct(1.0) }],
      cashPosition: vPct(0), stockPosition: vPct(0), bondPosition: vPct(0),
    },
  },
};

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

let ok = 0;
for (const [yfSymbol, data] of Object.entries(SNAPSHOTS)) {
  try {
    await prisma.fundamentalSnapshot.upsert({
      where: { ticker: yfSymbol },
      update: { data: JSON.stringify(data), fetchedAt: new Date() },
      create: { ticker: yfSymbol, data: JSON.stringify(data) },
    });
    console.log(`✓ ${yfSymbol}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${yfSymbol}:`, e.message);
  }
}
console.log(`Done: ${ok}/${Object.keys(SNAPSHOTS).length}`);
await prisma.$disconnect();
