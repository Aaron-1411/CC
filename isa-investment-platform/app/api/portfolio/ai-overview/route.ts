import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from "@/lib/constants";
import { PORTFOLIO_META, THEME_DESCRIPTIONS } from "@/lib/portfolioMeta";
import { prisma } from "@/lib/db";
import { streamGrok, hasGrokKey, streamAnthropic, hasAnthropicKey, SSE_HEADERS, type GrokMessage } from "@/lib/grok";


async function buildContext(): Promise<string> {
  let weights: Record<string, number> = {};
  let totalValue = BASELINE_SNAPSHOT.totalValueGBP;

  try {
    const snap = await prisma.dailySnapshot.findFirst({
      orderBy: { date: "desc" },
      include: { positions: { include: { holding: true } } },
    });
    if (snap?.positions.length) {
      totalValue = snap.totalValueGBP;
      weights = Object.fromEntries(
        snap.positions.map(p => [p.holding.ticker, p.valueGBP / totalValue])
      );
    }
  } catch { /* fall through */ }

  if (!Object.keys(weights).length) {
    weights = Object.fromEntries(
      BASELINE_SNAPSHOT.positions.map(p => [p.ticker, p.valueGBP / totalValue])
    );
  }

  // Sector rollup
  const sectorTotals: Record<string, number> = {};
  for (const meta of PORTFOLIO_META) {
    const w = weights[meta.ticker] ?? 0;
    for (const [s, pct] of Object.entries(meta.sectors)) {
      sectorTotals[s] = (sectorTotals[s] ?? 0) + w * (pct as number);
    }
  }
  const topSectors = Object.entries(sectorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([n, w]) => `${n} ${(w * 100).toFixed(1)}%`)
    .join(", ");

  // Geo rollup
  const geoTotals: Record<string, number> = {};
  for (const meta of PORTFOLIO_META) {
    const w = weights[meta.ticker] ?? 0;
    for (const [r, pct] of Object.entries(meta.geography)) {
      geoTotals[r] = (geoTotals[r] ?? 0) + w * (pct as number);
    }
  }
  const topGeo = Object.entries(geoTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([n, w]) => `${n} ${(w * 100).toFixed(1)}%`)
    .join(", ");

  const holdingLines = PORTFOLIO_META
    .slice()
    .sort((a, b) => (weights[b.ticker] ?? 0) - (weights[a.ticker] ?? 0))
    .map(m => {
      const baseline = BASELINE_SNAPSHOT.positions.find(p => p.ticker === m.ticker);
      const def = HOLDINGS_DEFINITION.find(h => h.ticker === m.ticker);
      const w = (weights[m.ticker] ?? 0) * 100;
      const pnl = baseline
        ? `${baseline.unrealisedPct >= 0 ? "+" : ""}${baseline.unrealisedPct.toFixed(1)}% unrealised`
        : "";
      return `  • ${m.ticker} (${def?.name}) — ${w.toFixed(1)}% of portfolio, β=${m.beta}, ${m.riskLevel} risk. ${pnl}`;
    })
    .join("\n");

  const hhiScore = Object.values(weights).reduce((s, w) => s + w * w, 0);
  const weightedBeta = PORTFOLIO_META.reduce((s, m) => s + (weights[m.ticker] ?? 0) * m.beta, 0);
  const usWeight = (geoTotals["United States"] ?? 0) * 100;
  const techWeight = ((sectorTotals["Information Technology"] ?? 0) + (sectorTotals["Communication Services"] ?? 0)) * 100;

  return `
PORTFOLIO SNAPSHOT (as of ${BASELINE_SNAPSHOT.date.toISOString().slice(0, 10)})
Total Value: £${totalValue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
Cost Basis: £${BASELINE_SNAPSHOT.totalCostGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
Unrealised P&L: +£${BASELINE_SNAPSHOT.totalUnrealisedGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })} (+${BASELINE_SNAPSHOT.totalUnrealisedPct.toFixed(2)}%)
ISA Allowance Used: £${BASELINE_SNAPSHOT.isaAllowanceUsedGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })} of £${BASELINE_SNAPSHOT.isaYearAllowanceGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })} (2025/26)

HOLDINGS (by weight):
${holdingLines}

RISK & CONCENTRATION:
  • Weighted Portfolio Beta: ${weightedBeta.toFixed(2)} (vs global equities)
  • HHI Concentration Score: ${(hhiScore * 100).toFixed(1)} (100 = single stock, ~9 = equal-weight 11 stocks)
  • US Geographic Exposure: ${usWeight.toFixed(1)}%
  • Tech + Comms Exposure: ${techWeight.toFixed(1)}%
  • Top 3 holdings: ${PORTFOLIO_META.slice().sort((a, b) => (weights[b.ticker] ?? 0) - (weights[a.ticker] ?? 0)).slice(0, 3).map(m => `${m.ticker} ${((weights[m.ticker] ?? 0) * 100).toFixed(1)}%`).join(", ")}

SECTOR BREAKDOWN: ${topSectors}
GEOGRAPHIC EXPOSURE: ${topGeo}

KEY INVESTMENT THEMES:
${Object.entries(THEME_DESCRIPTIONS).slice(0, 6).map(([t, d]) => `  • ${t}: ${d}`).join("\n")}
`.trim();
}

const SYSTEM_PROMPT = `You are a seasoned portfolio manager and investment analyst — the kind who runs a concentrated book, thinks in decades, and writes morning notes that institutional allocators actually read.

You are writing a Portfolio Overview for the owner of this ISA. This is NOT a generic disclaimer-heavy report. It is an honest, specific, intellectually rigorous assessment written the way a top PM talks to themselves at the end of the day.

Write with the directness of Howard Marks, the specificity of a Deutsche Bank research note, and the clarity of someone who has to defend every position to a CIO.

Cover five sections with headers:

## What We Own
Explain the portfolio in plain English — not ticker lists. What is the actual economic exposure? What is the investor really betting on?

## Investment Themes & Conviction
The 3–4 dominant themes. For each: thesis, supporting evidence, what it requires to be right.

## Past Performance Context
What has driven returns. Which positions right, which disappointed. What does the unrealised P&L distribution say? Specific numbers.

## Forward Outlook
12-month view. Key catalysts, macro tailwinds/headwinds, where is the asymmetry. Be specific.

## Key Risks & What to Watch
The honest risk assessment. Specific risks tied to specific positions. What would make this portfolio wrong? Top 2–3 things to monitor.

Tone: sharp, confident, honest. No weasel words. Use markdown headers and bullets. Max 700 words.`;

export async function POST() {
  if (!hasGrokKey() && !hasAnthropicKey()) {
    return new Response(
      JSON.stringify({ error: "No AI API key configured — set XAI_API_KEY or ANTHROPIC_API_KEY in .env.local" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const context = await buildContext();

  const messages: GrokMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Write the portfolio overview now.\n\n${context}` },
  ];

  try {
    const stream = hasGrokKey()
      ? await streamGrok(messages, "grok-3", 1800)
      : await streamAnthropic(messages, 1800);
    return new Response(stream, { headers: SSE_HEADERS });
  } catch (err) {
    const encoder = new TextEncoder();
    const errStream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
        c.close();
      },
    });
    return new Response(errStream, { headers: SSE_HEADERS });
  }
}
