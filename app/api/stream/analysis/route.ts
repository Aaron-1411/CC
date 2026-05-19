import { prisma } from "@/lib/db";
import { HOLDINGS_DEFINITION, HOLDING_COLORS, BASELINE_SNAPSHOT } from "@/lib/constants";
import { streamGrok, hasGrokKey, streamAnthropic, hasAnthropicKey, SSE_HEADERS, type GrokMessage } from "@/lib/grok";

export const dynamic = "force-dynamic";

void HOLDING_COLORS; // used in context below

function buildSystemPrompt(portfolioContext: string): string {
  return `You are an expert institutional investment analyst specialising in UK ISA portfolios.

Deep expertise in: equity analysis (fundamental, technical, quantitative), ETF structure, portfolio construction, UK tax-efficient investing (ISA rules), risk metrics (VaR, CVaR, Sharpe, drawdown, beta, alpha).

CURRENT PORTFOLIO STATE:
${portfolioContext}

INSTRUCTIONS:
- Concise, data-driven. Specific numbers where possible.
- Flag key risks and opportunities.
- Reference specific holdings by ticker when relevant.
- For UK ETFs (EQQQ, VWRP, VUAG, SGLN), note they trade on LSE in GBX (pence).
- All portfolio values in GBP.
- Professional but accessible tone. Markdown headings and bullets.
- Frame as general analysis, not personal financial advice.`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      portfolioSnapshot?: unknown;
    };

    const { messages } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!hasGrokKey() && !hasAnthropicKey()) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured — set XAI_API_KEY or ANTHROPIC_API_KEY in .env.local" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build portfolio context
    let portfolioContext = "";
    try {
      const latestSnapshot = await prisma.dailySnapshot.findFirst({
        orderBy: { date: "desc" },
        include: { positions: { include: { holding: true } } },
      });

      if (latestSnapshot) {
        const positions = latestSnapshot.positions
          .sort((a, b) => b.valueGBP - a.valueGBP)
          .map(p => `  - ${p.holding.ticker}: £${p.valueGBP.toFixed(2)} (${(p.weight * 100).toFixed(1)}%, daily: ${p.dailyReturnPct >= 0 ? "+" : ""}${p.dailyReturnPct.toFixed(2)}%)`)
          .join("\n");
        portfolioContext = `Portfolio Date: ${latestSnapshot.date.toISOString().slice(0, 10)}
Total Value: £${latestSnapshot.totalValueGBP.toFixed(2)}
GBP/USD: ${latestSnapshot.gbpUsd.toFixed(4)}
Positions:
${positions}`;
      } else {
        const positions = BASELINE_SNAPSHOT.positions
          .map(p => `  - ${p.ticker}: £${p.valueGBP.toFixed(2)} (daily: ${p.dailyPct >= 0 ? "+" : ""}${p.dailyPct.toFixed(2)}%)`)
          .join("\n");
        portfolioContext = `Portfolio Date: ${BASELINE_SNAPSHOT.date.toISOString().slice(0, 10)}
Total Value: £${BASELINE_SNAPSHOT.totalValueGBP.toFixed(2)}
GBP/USD: ${BASELINE_SNAPSHOT.gbpUsd}
Positions (baseline snapshot):
${positions}`;
      }
    } catch {
      portfolioContext = `Holdings: ${HOLDINGS_DEFINITION.map(h => h.ticker).join(", ")}
Total Value: £${BASELINE_SNAPSHOT.totalValueGBP.toFixed(2)} (baseline)`;
    }

    const grokMessages: GrokMessage[] = [
      { role: "system", content: buildSystemPrompt(portfolioContext) },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const stream = hasGrokKey()
      ? await streamGrok(grokMessages, "grok-3-mini", 2048)
      : await streamAnthropic(grokMessages, 2048);
    return new Response(stream, { headers: SSE_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
