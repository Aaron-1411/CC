import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { jsonResponse, errorResponse, cached } from "@/lib/proxy";
import { partyColour } from "@/lib/uk-geo";
import type { MPData } from "@/routes/api/postcode";

/**
 * Resolve the sitting MP for a CONSTITUENCY NAME via the Parliament Members API.
 *
 * Privacy (D8): this endpoint deliberately takes only a constituency name, never
 * a postcode. The browser resolves postcode → constituency client-side against
 * postcodes.io, so the user's postcode never reaches our servers.
 */

type ParliamentMember = {
  value: {
    id: number;
    nameDisplayAs: string;
    latestParty: { name: string };
    latestHouseMembership: { membershipFrom: string; membershipFromId: number };
    thumbnailUrl: string;
  };
};

async function lookupMp(constituency: string): Promise<MPData | null> {
  const mpRes = await fetch(
    `https://members-api.parliament.uk/api/Members/Search?constituency=${encodeURIComponent(
      constituency,
    )}&House=Commons&IsCurrentMember=true&skip=0&take=1`,
    { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) },
  );
  if (!mpRes.ok) throw new Error(`members-api: HTTP ${mpRes.status}`);
  const mpData = (await mpRes.json()) as { items: ParliamentMember[] };
  const member = mpData.items[0]?.value;
  if (!member) return null;

  let email = "";
  try {
    const contactRes = await fetch(
      `https://members-api.parliament.uk/api/Members/${member.id}/Contact`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5_000) },
    );
    if (contactRes.ok) {
      const contactData = (await contactRes.json()) as {
        value?: Array<{ type: string; email?: string }>;
      };
      email =
        contactData.value?.find((c) => c.type === "Parliamentary" || c.type === "Constituency")
          ?.email ?? "";
    }
  } catch {
    /* email optional */
  }

  const partyName = member.latestParty?.name ?? "";
  return {
    id: member.id,
    name: member.nameDisplayAs,
    party: partyName,
    partyColour: partyColour(partyName),
    thumbnailUrl: member.thumbnailUrl ?? "",
    constituency,
    email,
    membershipFrom: member.latestHouseMembership?.membershipFrom ?? "",
  };
}

export const Route = createFileRoute("/api/constituency-mp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const constituency = url.searchParams.get("constituency");
        if (!constituency || constituency.trim().length < 2) {
          return errorResponse("constituency parameter required", 400);
        }
        try {
          const key = `mp:constituency:${constituency.trim().toLowerCase()}`;
          const mp = await cached(key, 24 * 60 * 60_000, () => lookupMp(constituency.trim()));
          return jsonResponse({ data: mp, meta: { fetchedAt: new Date().toISOString() } });
        } catch (e) {
          return errorResponse((e as Error).message, 502);
        }
      },
    },
  },
});
