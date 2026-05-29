import { fetchBatchQuotes, ALL_YF_SYMBOLS } from "@/lib/data/yahoo";


const REFRESH_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? "15000"
);

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Send initial data immediately
      try {
        const quotes = await fetchBatchQuotes(ALL_YF_SYMBOLS);
        const gbpUsdQuote = quotes["GBPUSD=X"];
        const gbpUsd = gbpUsdQuote?.price ?? 1.27;
        send({ quotes, gbpUsd, lastUpdated: new Date().toISOString() });
      } catch (err) {
        send({ error: "Initial fetch failed", message: String(err) });
      }

      // Then poll on interval
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const quotes = await fetchBatchQuotes(ALL_YF_SYMBOLS);
          const gbpUsdQuote = quotes["GBPUSD=X"];
          const gbpUsd = gbpUsdQuote?.price ?? 1.27;
          send({ quotes, gbpUsd, lastUpdated: new Date().toISOString() });
        } catch (err) {
          send({ error: "Fetch failed", message: String(err) });
        }
      }, REFRESH_INTERVAL);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
