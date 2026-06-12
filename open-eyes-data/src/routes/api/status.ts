import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { jsonResponse, cacheRegistry } from "@/lib/proxy";
import { snapshotHealth } from "@/lib/snapshot";

/**
 * Operational transparency endpoint: reports the freshness of the in-memory
 * proxy cache and the committed daily snapshots. Being open about our own data
 * pipeline is on-brand. No upstream calls, no secrets.
 */
export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => {
        const [snapshots] = await Promise.all([snapshotHealth()]);
        const cache = cacheRegistry();
        const stale = snapshots.filter((s) => s.status !== "fresh");
        return jsonResponse({
          data: {
            generatedAt: new Date().toISOString(),
            overall: stale.length === 0 ? "ok" : "degraded",
            snapshots,
            cacheEntries: cache.length,
            cache: cache.slice(0, 50),
          },
          meta: { fetchedAt: new Date().toISOString() },
        });
      },
    },
  },
});
